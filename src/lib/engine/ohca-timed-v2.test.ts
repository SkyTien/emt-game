import { describe, expect, it } from 'vitest';
import { getScenarioById } from '$lib/data/content';
import { ScenarioEngine, type ScenarioState } from './scenario-engine';

const SCENARIO_ID = 'ohca_adult_timed_v2';
const EXPECTED_MARGINS_MS = {
	lead: {
		arrival: 23_000,
		assess: 30_000,
		cpr_airway: 37_000,
		aed_prep: 26_000,
		aed_delivery: 16_000,
		post_shock_cpr: 28_000,
		reassess_handoff: 30_000
	},
	assist: {
		arrival: 21_000,
		assess: 24_000,
		cpr_airway: 43_000,
		aed_prep: 28_000,
		aed_delivery: 20_000,
		post_shock_cpr: 28_000,
		reassess_handoff: 24_000
	}
} as const;

type PhaseResult = {
	state: ScenarioState;
	nowMs: number;
	marginMs: number;
};

function requiredScenario() {
	const scenario = getScenarioById(SCENARIO_ID);
	if (!scenario) throw new Error(`${SCENARIO_ID} was not loaded`);
	return scenario;
}

function runPhase(state: ScenarioState, nowMs: number): PhaseResult {
	const phaseIndex = state.phaseIndex;
	const phase = state.scenario.phases[phaseIndex];
	if (!phase) throw new Error(`phase ${phaseIndex} does not exist`);

	const startedAtMs = nowMs;
	const deadlineMs = startedAtMs + (phase.timeout ?? 0) * 1_000;
	let next = ScenarioEngine.startPhase(state, nowMs);

	for (let guard = 0; guard < 100 && next.phaseIndex === phaseIndex; guard += 1) {
		const playerLane = next.actorLanes[next.playerRole];
		const eligiblePlayerAction = phase.required.find(
			(required) =>
				required.by === next.playerRole &&
				!next.completedRequiredIds.has(required.action_id) &&
				(!required.after || next.completedRequiredIds.has(required.after)) &&
				!playerLane.task
		);

		if (eligiblePlayerAction) {
			const result = ScenarioEngine.requestAction(
				next,
				eligiblePlayerAction.action_id,
				next.playerRole,
				nowMs
			);
			expect(result.feedback.correct).toBe(true);
			next = result.state;
			if (next.phaseIndex === phaseIndex && next.actorLanes[next.playerRole].status === 'idle') {
				continue;
			}
		}

		if (next.phaseIndex !== phaseIndex) break;

		const eventTimes = Object.values(next.actorLanes)
			.map((lane) => {
				if (lane.task?.status === 'queued') return lane.task.readyAtMs;
				if (lane.task?.status === 'busy') return lane.task.completesAtMs;
				return null;
			})
			.filter((time): time is number => time !== null);

		if (eventTimes.length === 0) {
			throw new Error(`phase ${phase.id} has no eligible player action or scheduled engine event`);
		}

		nowMs = Math.min(...eventTimes, deadlineMs);
		next = ScenarioEngine.tick(next, nowMs);
	}

	if (next.phaseIndex === phaseIndex) throw new Error(`phase ${phase.id} did not settle`);
	return {
		state: next,
		nowMs,
		marginMs: deadlineMs - nowMs
	};
}

describe('OHCA v2 collaboration vertical slice', () => {
	it('keeps solo actions immediate and uses the partner lane for collaboration pacing', () => {
		const scenario = requiredScenario();

		expect(scenario.player_role).toBe('either');
		expect(scenario.phases).toHaveLength(7);
		expect(
			scenario.phases
				.flatMap((phase) => phase.required)
				.every((required) => required.timing === undefined)
		).toBe(true);
	});

	it.each(['lead', 'assist'] as const)(
		'completes the deterministic %s flow with deadline margin',
		(playerRole) => {
			const scenario = requiredScenario();
			let state = ScenarioEngine.init(scenario, playerRole, 0);
			let nowMs = 0;
			const margins = new Map<string, number>();

			while (!state.finalOutcomeId) {
				const phaseId = scenario.phases[state.phaseIndex]?.id;
				if (!phaseId) throw new Error('scenario ended without an outcome');
				const result = runPhase(state, nowMs);
				margins.set(phaseId, result.marginMs);
				state = result.state;
				nowMs = result.nowMs;
			}

			expect(state.finalOutcomeId).toBe('timed_rosc');
			expect(state.flags.has('已電擊')).toBe(true);
			expect(state.worsenLevel).toBe(0);
			expect(state.correctActions).toBe(21);
			expect([...margins.values()].every((margin) => margin >= 5_000)).toBe(true);
			expect(Object.fromEntries(margins)).toEqual(EXPECTED_MARGINS_MS[playerRole]);

			const replay = (() => {
				let replayState = ScenarioEngine.init(scenario, playerRole, 0);
				let replayNowMs = 0;
				while (!replayState.finalOutcomeId) {
					const result = runPhase(replayState, replayNowMs);
					replayState = result.state;
					replayNowMs = result.nowMs;
				}
				return replayState;
			})();
			expect(replay.log).toEqual(state.log);
		}
	);

	it('completes player actions immediately without occupying the player lane', () => {
		const scenario = requiredScenario();
		const state = ScenarioEngine.startPhase(ScenarioEngine.init(scenario, 'lead', 0), 0);
		const result = ScenarioEngine.requestAction(state, 'check_scene_safe', 'lead', 0);

		expect(result.feedback.message).toBe('ok');
		expect(result.state.completedRequiredIds.has('check_scene_safe')).toBe(true);
		expect(result.state.actorLanes.lead.status).toBe('idle');
	});

	it('retains a short reaction wait for actions performed by the partner', () => {
		const scenario = requiredScenario();
		const state = ScenarioEngine.startPhase(ScenarioEngine.init(scenario, 'lead', 0), 0);

		expect(state.actorLanes.assist.task).toMatchObject({
			actionId: 'call_119_dispatch',
			status: 'queued',
			readyAtMs: 2_000
		});
		expect(ScenarioEngine.tick(state, 1_999).completedRequiredIds.has('call_119_dispatch')).toBe(
			false
		);
		expect(ScenarioEngine.tick(state, 2_000).completedRequiredIds.has('call_119_dispatch')).toBe(
			true
		);
	});

	it('advances on timeout when patient state is wrapped in a reactive proxy', () => {
		const scenario = requiredScenario();
		const started = ScenarioEngine.startPhase(ScenarioEngine.init(scenario, 'lead', 0), 0);
		const state = {
			...started,
			patient: new Proxy(started.patient, {})
		};

		const timedOut = ScenarioEngine.tick(state, 25_000);

		expect(timedOut.scenario.phases[timedOut.phaseIndex]?.id).toBe('assess');
		expect(timedOut.phaseStarted).toBe(false);
		expect(timedOut.worsenLevel).toBe(1);
	});
});
