import { describe, expect, it } from 'vitest';
import { getScenarioById } from '$lib/data/content';
import { ScenarioEngine, type ScenarioState } from './scenario-engine';

const SCENARIO_ID = 'ohca_adult_timed_v2';
const CONCURRENT_PHASES = new Set(['arrival', 'cpr_airway', 'aed_prep', 'post_shock_cpr']);
const EXPECTED_MARGINS_MS = {
	lead: {
		arrival: 17_000,
		assess: 17_000,
		cpr_airway: 15_000,
		aed_prep: 10_000,
		aed_delivery: 9_000,
		post_shock_cpr: 10_000,
		reassess_handoff: 12_000
	},
	assist: {
		arrival: 17_000,
		assess: 11_000,
		cpr_airway: 13_000,
		aed_prep: 8_000,
		aed_delivery: 13_000,
		post_shock_cpr: 8_000,
		reassess_handoff: 6_000
	}
} as const;

type PhaseResult = {
	state: ScenarioState;
	nowMs: number;
	marginMs: number;
	sawConcurrency: boolean;
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
	let sawConcurrency = false;

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
		}

		sawConcurrency ||= Object.values(next.actorLanes).every((lane) => lane.status === 'busy');
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
		sawConcurrency ||= Object.values(next.actorLanes).every((lane) => lane.status === 'busy');
	}

	if (next.phaseIndex === phaseIndex) throw new Error(`phase ${phase.id} did not settle`);
	return {
		state: next,
		nowMs,
		marginMs: deadlineMs - nowMs,
		sawConcurrency
	};
}

function runUntilPhase(
	state: ScenarioState,
	targetPhaseId: string,
	nowMs = 0
): { state: ScenarioState; nowMs: number } {
	while (state.scenario.phases[state.phaseIndex]?.id !== targetPhaseId) {
		const result = runPhase(state, nowMs);
		state = result.state;
		nowMs = result.nowMs;
	}
	return { state, nowMs };
}

describe('OHCA v2 timed vertical slice', () => {
	it('loads only scenario-local timing with the approved clinical review metadata', () => {
		const scenario = requiredScenario();

		expect(scenario.player_role).toBe('either');
		expect(scenario.phases).toHaveLength(7);
		expect(
			scenario.phases
				.flatMap((phase) => phase.required)
				.every(
					(required) =>
						required.timing !== undefined &&
						required.timing.duration_seconds !== undefined &&
						required.timing.interruptible !== undefined
				)
		).toBe(true);
		expect(scenario.phases.find((phase) => phase.id === 'aed_delivery')?.required).toMatchObject([
			{ action_id: 'aed_analyze', timing: { interruptible: false } },
			{ action_id: 'aed_shock', timing: { interruptible: false } }
		]);
	});

	it.each(['lead', 'assist'] as const)(
		'completes the deterministic %s flow with deadline margin and concurrent lanes',
		(playerRole) => {
			const scenario = requiredScenario();
			let state = ScenarioEngine.init(scenario, playerRole, 0);
			let nowMs = 0;
			const margins = new Map<string, number>();
			const concurrent = new Set<string>();

			while (!state.finalOutcomeId) {
				const phaseId = scenario.phases[state.phaseIndex]?.id;
				if (!phaseId) throw new Error('scenario ended without an outcome');
				const result = runPhase(state, nowMs);
				margins.set(phaseId, result.marginMs);
				if (result.sawConcurrency) concurrent.add(phaseId);
				state = result.state;
				nowMs = result.nowMs;
			}

			expect(state.finalOutcomeId).toBe('timed_rosc');
			expect(state.flags.has('已電擊')).toBe(true);
			expect(state.worsenLevel).toBe(0);
			expect(state.correctActions).toBe(21);
			expect([...margins.values()].every((margin) => margin >= 5_000)).toBe(true);
			expect(Object.fromEntries(margins)).toEqual(EXPECTED_MARGINS_MS[playerRole]);
			expect(concurrent).toEqual(CONCURRENT_PHASES);

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

	it('allows an interruptible compression task to be cancelled without a medical mistake', () => {
		const scenario = requiredScenario();
		let state = ScenarioEngine.init(scenario, 'lead', 0);
		const reached = runUntilPhase(state, 'cpr_airway');
		state = ScenarioEngine.startPhase(reached.state, reached.nowMs);
		state = ScenarioEngine.requestAction(state, 'cpr_compress_adult', 'lead', reached.nowMs).state;

		const interrupted = ScenarioEngine.interruptTask(
			state,
			'lead',
			'actor_cancelled',
			reached.nowMs + 1_000
		);

		expect(interrupted.feedback.message).toBe('task_interrupted');
		expect(interrupted.state.actorLanes.lead.status).toBe('idle');
		expect(interrupted.state.correctActions).toBe(state.correctActions);
		expect(interrupted.state.wrongActions).toBe(0);
	});

	it('keeps AED analysis busy when the player requests cancellation', () => {
		const scenario = requiredScenario();
		let state = ScenarioEngine.init(scenario, 'assist', 0);
		const reached = runUntilPhase(state, 'aed_delivery');
		state = ScenarioEngine.startPhase(reached.state, reached.nowMs);
		state = ScenarioEngine.requestAction(state, 'aed_analyze', 'assist', reached.nowMs).state;

		const interrupted = ScenarioEngine.interruptTask(
			state,
			'assist',
			'actor_cancelled',
			reached.nowMs + 1_000
		);

		expect(interrupted.feedback.message).toBe('not_interruptible');
		expect(interrupted.state).toBe(state);
		expect(interrupted.state.actorLanes.assist.status).toBe('busy');
	});
});
