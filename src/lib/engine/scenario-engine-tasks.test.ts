import { describe, expect, it } from 'vitest';
import {
	ScenarioEngine,
	type ActorRole,
	type Feedback,
	type ScenarioState
} from './scenario-engine';
import type { Scenario } from '$lib/types/content';

type TestTask = {
	taskId: string;
	actionId: string;
	status: 'queued' | 'busy';
	readyAtMs: number;
	startedAtMs: number | null;
	completesAtMs: number | null;
};

type TestLane = {
	status: 'idle' | 'queued' | 'busy';
	task: TestTask | null;
};

type TimedState = ScenarioState & {
	actorLanes: Record<ActorRole, TestLane>;
};

type TransitionResult = { state: ScenarioState; feedback: Feedback };

const timedEngine = ScenarioEngine as unknown as typeof ScenarioEngine & {
	requestAction(
		state: ScenarioState,
		actionId: string,
		by: ActorRole,
		nowMs: number
	): TransitionResult;
	interruptTask(
		state: ScenarioState,
		actor: ActorRole,
		reason: 'actor_cancelled',
		nowMs: number
	): TransitionResult;
};

const timedScenario = {
	id: 'timed_ohca',
	schema_version: 1,
	title: { 'zh-Hant': '計時 OHCA' },
	player_role: 'either',
	patient_initial: {
		consciousness: { 'zh-Hant': '無反應' },
		breath: { 'zh-Hant': '無呼吸' },
		pulse: { 'zh-Hant': '無脈搏' }
	},
	crew: {
		lead: { role: 'lead', carries: ['hand', 'aed'] },
		assist: { role: 'assist', carries: ['hand', 'o2kit', 'jumpkit'] }
	},
	phases: [
		{
			id: 'cpr',
			narrative: { 'zh-Hant': '開始雙人急救' },
			required: [
				{
					action_id: 'cpr_compress_adult',
					by: 'lead',
					timing: { duration_seconds: 30, interruptible: true }
				},
				{
					action_id: 'bvm_ventilate',
					by: 'assist',
					timing: { duration_seconds: 20, interruptible: true }
				}
			],
			timeout: 30,
			on_skip: { worsen: 1, note: { 'zh-Hant': '未在時間內完成急救' } }
		}
	],
	outcomes: [
		{
			id: 'done',
			when: '預設',
			title: { 'zh-Hant': '完成' },
			text: { 'zh-Hant': '完成計時急救' }
		}
	]
} as Scenario;

function lane(state: ScenarioState, actor: ActorRole): TestLane {
	return (state as TimedState).actorLanes[actor];
}

describe('ScenarioEngine actor task lanes', () => {
	it('initializes one idle lane for each actor', () => {
		const state = ScenarioEngine.init(timedScenario, 'lead', 0);

		expect(lane(state, 'lead')).toMatchObject({ status: 'idle', task: null });
		expect(lane(state, 'assist')).toMatchObject({ status: 'idle', task: null });
	});

	it('starts timed work without applying completion effects', () => {
		let state = ScenarioEngine.init(timedScenario, 'lead', 0);
		state = ScenarioEngine.startPhase(state, 0);
		const result = timedEngine.requestAction(state, 'cpr_compress_adult', 'lead', 1_000);

		expect(result.feedback.message).toBe('task_started');
		expect(lane(result.state, 'lead')).toMatchObject({
			status: 'busy',
			task: {
				actionId: 'cpr_compress_adult',
				startedAtMs: 1_000,
				completesAtMs: 31_000
			}
		});
		expect(result.state.completedRequiredIds.has('cpr_compress_adult')).toBe(false);
		expect(result.state.correctActions).toBe(0);
	});

	it('allows lead and assist to work concurrently and rejects extra busy work', () => {
		let state = ScenarioEngine.init(timedScenario, 'lead', 0);
		state = ScenarioEngine.startPhase(state, 0);
		state = timedEngine.requestAction(state, 'cpr_compress_adult', 'lead', 1_000).state;
		const directed = ScenarioEngine.directivePartner(state, 'bvm_ventilate', 1_500);
		state = directed.state;

		expect(lane(state, 'lead').status).toBe('busy');
		expect(lane(state, 'assist').status).toBe('busy');

		const busy = timedEngine.requestAction(state, 'check_pulse_carotid', 'lead', 2_000);
		expect(busy.feedback.message).toBe('actor_busy');
		expect(busy.state).toBe(state);
		expect(busy.state.wrongActions).toBe(0);
	});

	it('keeps one task identity when a directive accelerates queued partner work', () => {
		let state = ScenarioEngine.init(timedScenario, 'lead', 0);
		state = ScenarioEngine.startPhase(state, 1_000);
		const queued = lane(state, 'assist').task;

		expect(queued).toMatchObject({
			actionId: 'bvm_ventilate',
			status: 'queued',
			readyAtMs: 3_000
		});

		const directed = ScenarioEngine.directivePartner(state, 'bvm_ventilate', 1_500);
		expect(lane(directed.state, 'assist')).toMatchObject({
			status: 'busy',
			task: {
				taskId: queued?.taskId,
				actionId: 'bvm_ventilate',
				startedAtMs: 1_500,
				completesAtMs: 21_500
			}
		});
	});

	it('completes due work exactly once and lets completion win at the deadline', () => {
		let state = ScenarioEngine.init(timedScenario, 'lead', 0);
		state = ScenarioEngine.startPhase(state, 0);
		state = timedEngine.requestAction(state, 'cpr_compress_adult', 'lead', 0).state;
		state = ScenarioEngine.directivePartner(state, 'bvm_ventilate', 0).state;

		state = ScenarioEngine.tick(state, 20_000);
		expect(state.completedRequiredIds.has('bvm_ventilate')).toBe(true);
		expect(state.completedRequiredIds.has('cpr_compress_adult')).toBe(false);
		expect(lane(state, 'assist').status).toBe('idle');

		state = ScenarioEngine.tick(state, 30_000);
		expect(state.finalOutcomeId).toBe('done');
		expect(state.correctActions).toBe(2);
		expect(state.worsenLevel).toBe(0);
		expect(state.log.filter((entry) => entry.kind === 'action')).toHaveLength(2);

		const finalized = state;
		expect(ScenarioEngine.tick(state, 60_000)).toBe(finalized);
	});

	it('interrupts eligible work without counting a medical mistake', () => {
		let state = ScenarioEngine.init(timedScenario, 'lead', 0);
		state = ScenarioEngine.startPhase(state, 0);
		state = timedEngine.requestAction(state, 'cpr_compress_adult', 'lead', 1_000).state;

		const interrupted = timedEngine.interruptTask(state, 'lead', 'actor_cancelled', 2_000);
		expect(interrupted.feedback.message).toBe('task_interrupted');
		expect(lane(interrupted.state, 'lead')).toMatchObject({ status: 'idle', task: null });
		expect(interrupted.state.correctActions).toBe(0);
		expect(interrupted.state.wrongActions).toBe(0);
	});

	it('does not cancel non-interruptible work on actor request', () => {
		const committedScenario = structuredClone(timedScenario);
		committedScenario.phases[0].required[0].timing = {
			duration_seconds: 30,
			interruptible: false
		};
		let state = ScenarioEngine.init(committedScenario, 'lead', 0);
		state = ScenarioEngine.startPhase(state, 0);
		state = timedEngine.requestAction(state, 'cpr_compress_adult', 'lead', 1_000).state;

		const interrupted = timedEngine.interruptTask(state, 'lead', 'actor_cancelled', 2_000);
		expect(interrupted.feedback.message).toBe('not_interruptible');
		expect(interrupted.state).toBe(state);
		expect(lane(interrupted.state, 'lead').status).toBe('busy');
	});

	it('orders simultaneous completions by lead before assist', () => {
		const simultaneousScenario = structuredClone(timedScenario);
		simultaneousScenario.phases[0].required[1].timing = {
			duration_seconds: 30,
			interruptible: true
		};
		let state = ScenarioEngine.init(simultaneousScenario, 'lead', 0);
		state = ScenarioEngine.startPhase(state, 0);
		state = timedEngine.requestAction(state, 'cpr_compress_adult', 'lead', 0).state;
		state = ScenarioEngine.directivePartner(state, 'bvm_ventilate', 0).state;
		state = ScenarioEngine.tick(state, 30_000);

		const completions = state.log.filter((entry) => entry.kind === 'action');
		expect(completions.map((entry) => entry.actionId)).toEqual([
			'cpr_compress_adult',
			'bvm_ventilate'
		]);
	});

	it('cancels active work when timeout occurs before completion', () => {
		const slowScenario = structuredClone(timedScenario);
		slowScenario.phases[0].required[0].timing = {
			duration_seconds: 31,
			interruptible: false
		};
		let state = ScenarioEngine.init(slowScenario, 'lead', 0);
		state = ScenarioEngine.startPhase(state, 0);
		state = timedEngine.requestAction(state, 'cpr_compress_adult', 'lead', 0).state;

		state = ScenarioEngine.tick(state, 30_000);
		expect(state.phaseIndex).toBe(1);
		expect(state.worsenLevel).toBe(1);
		expect(lane(state, 'lead')).toMatchObject({ status: 'idle', task: null });
		expect(
			state.log.some(
				(entry) =>
					entry.kind === 'task_interrupted' &&
					entry.actionId === 'cpr_compress_adult' &&
					entry.reason === 'phase_timeout'
			)
		).toBe(true);
	});
});
