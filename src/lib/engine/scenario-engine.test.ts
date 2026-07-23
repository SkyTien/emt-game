import { describe, expect, it } from 'vitest';
import { ScenarioEngine } from './scenario-engine';
import { evaluateCondition } from './condition';
import { findPartnerActions } from './partner-ai';
import type { Scenario } from '$lib/types/content';

const baseScenario: Scenario = {
	id: 'test_ohca',
	schema_version: 1,
	title: { 'zh-Hant': '測試 OHCA' },
	player_role: 'lead',
	patient_initial: {
		consciousness: { 'zh-Hant': '無反應' },
		breath: { 'zh-Hant': '無' },
		pulse: { 'zh-Hant': '無' }
	},
	crew: {
		lead: { role: 'lead', carries: ['hand', 'aed'] },
		assist: { role: 'assist', carries: ['o2kit', 'jumpkit'] }
	},
	phases: [
		{
			id: 'arrival',
			narrative: { 'zh-Hant': '抵達' },
			required: [{ action_id: 'check_scene_safe' }],
			timeout: 30,
			on_skip: { worsen: 1, note: { 'zh-Hant': '忘了觀察交通' } }
		},
		{
			id: 'cpr',
			narrative: { 'zh-Hant': 'CPR' },
			required: [
				{ action_id: 'cpr_compress_adult', by: 'lead' },
				{ action_id: 'bvm_ventilate', by: 'assist' }
			],
			timeout: 60
		},
		{
			id: 'aed',
			narrative: { 'zh-Hant': 'AED' },
			required: [{ action_id: 'check_pulse_carotid', set_flag: '已電擊' }],
			timeout: 60
		}
	],
	outcomes: [
		{
			id: 'rosc',
			when: '正確率>=0.9 且 已電擊',
			title: { 'zh-Hant': 'ROSC' },
			text: { 'zh-Hant': '恢復循環' }
		},
		{
			id: 'doa',
			when: '預設',
			title: { 'zh-Hant': 'DOA' },
			text: { 'zh-Hant': '送醫前未恢復' }
		}
	]
};

const orderedScenario: Scenario = {
	...baseScenario,
	patient_initial: {
		...baseScenario.patient_initial,
		skin: { 'zh-Hant': '濕冷' },
		glucose: { 'zh-Hant': '42 mg/dL' },
		spO2: { 'zh-Hant': '91%' },
		bp: { 'zh-Hant': '88/54 mmHg' }
	},
	phases: [
		{
			id: 'ordered',
			narrative: { 'zh-Hant': '依序處置' },
			required: [{ action_id: 'aed_analyze' }, { action_id: 'aed_shock', after: 'aed_analyze' }],
			timeout: 30
		}
	]
};

describe('ScenarioEngine.init', () => {
	it('initializes phaseIndex 0 with empty completed set', () => {
		const s = ScenarioEngine.init(baseScenario, 'lead', 0);
		expect(s.phaseIndex).toBe(0);
		expect(s.completedRequiredIds.size).toBe(0);
		expect(s.bagLocations.aed).toBe('on_scene');
		expect(s.bagLocations.o2kit).toBe('on_partner');
	});

	it('flips bag locations when player is assist', () => {
		const s = ScenarioEngine.init(baseScenario, 'assist', 0);
		expect(s.bagLocations.aed).toBe('on_partner');
		expect(s.bagLocations.o2kit).toBe('on_scene');
	});

	it('preserves every authored optional vital', () => {
		const s = ScenarioEngine.init(orderedScenario, 'lead', 0);
		expect(s.patient).toEqual(orderedScenario.patient_initial);
		expect(s.patient).not.toBe(orderedScenario.patient_initial);
	});
});

describe('ScenarioEngine.performAction', () => {
	it('marks correct action and advances phase when all required met', () => {
		const s0 = ScenarioEngine.init(baseScenario, 'lead', 0);
		const r = ScenarioEngine.performAction(s0, 'check_scene_safe', 'lead', 1000);
		expect(r.feedback.correct).toBe(true);
		expect(r.state.phaseIndex).toBe(1);
		expect(r.state.correctActions).toBe(1);
	});

	it('marks wrong action when not in required', () => {
		const s0 = ScenarioEngine.init(baseScenario, 'lead', 0);
		const r = ScenarioEngine.performAction(s0, '亂按', 'lead', 1000);
		expect(r.feedback.correct).toBe(false);
		expect(r.state.wrongActions).toBe(1);
		expect(r.state.phaseIndex).toBe(0);
	});

	it('rejects partner-only action when player tries it', () => {
		let s = ScenarioEngine.init(baseScenario, 'lead', 0);
		s = ScenarioEngine.performAction(s, 'check_scene_safe', 'lead', 1000).state;
		const r = ScenarioEngine.performAction(s, 'bvm_ventilate', 'lead', 2000);
		expect(r.feedback.correct).toBe(false);
		expect(r.state.completedRequiredIds.has('bvm_ventilate')).toBe(false);
	});

	it('accepts partner-only action when partner does it', () => {
		let s = ScenarioEngine.init(baseScenario, 'lead', 0);
		s = ScenarioEngine.performAction(s, 'check_scene_safe', 'lead', 1000).state;
		const r = ScenarioEngine.performAction(s, 'bvm_ventilate', 'assist', 2000);
		expect(r.feedback.correct).toBe(true);
		expect(r.state.completedRequiredIds.has('bvm_ventilate')).toBe(true);
	});

	it('rejects player use of equipment carried by the partner without changing state', () => {
		let s = ScenarioEngine.init(baseScenario, 'lead', 0);
		s = ScenarioEngine.performAction(s, 'check_scene_safe', 'lead', 1000).state;
		const before = s;
		const r = ScenarioEngine.performAction(s, 'bvm_ventilate', 'lead', 2000);

		expect(r.feedback.message).toBe('equipment_unavailable');
		expect(r.state).toBe(before);
	});

	it('allows the partner to use equipment they carry', () => {
		let s = ScenarioEngine.init(baseScenario, 'lead', 0);
		s = ScenarioEngine.performAction(s, 'check_scene_safe', 'lead', 1000).state;
		const r = ScenarioEngine.performAction(s, 'bvm_ventilate', 'assist', 2000);

		expect(r.feedback.correct).toBe(true);
		expect(r.state.completedRequiredIds.has('bvm_ventilate')).toBe(true);
	});

	it('uses action IDs as the completion identity', () => {
		const s0 = ScenarioEngine.init(baseScenario, 'lead', 0);
		const r = ScenarioEngine.performAction(s0, 'check_scene_safe', 'lead', 1000);
		expect(r.state.correctActions).toBe(1);
		expect(r.state.log[0]).toMatchObject({ actionId: 'check_scene_safe' });
	});

	it('returns already_completed without changing state for a repeated action', () => {
		let s = ScenarioEngine.init(baseScenario, 'lead', 0);
		s = ScenarioEngine.performAction(s, 'check_scene_safe', 'lead', 1000).state;
		s = ScenarioEngine.performAction(s, 'cpr_compress_adult', 'lead', 2000).state;
		const before = s;
		const r = ScenarioEngine.performAction(s, 'cpr_compress_adult', 'lead', 2500);

		expect(r.feedback.message).toBe('already_completed');
		expect(r.state).toBe(before);
	});

	it('counts and logs a wrong-order required action without advancing progress', () => {
		const s = ScenarioEngine.init(orderedScenario, 'lead', 0);
		const r = ScenarioEngine.performAction(s, 'aed_shock', 'lead', 1000);

		expect(r.feedback.message).toBe('wrong_order');
		expect(r.state.wrongActions).toBe(1);
		expect(r.state.consecutiveMistakes).toBe(1);
		expect(r.state.completedRequiredIds).toEqual(new Set());
		expect(r.state.log.at(-1)).toMatchObject({
			kind: 'action',
			actionId: 'aed_shock',
			correct: false
		});
	});
});

describe('ScenarioEngine.tick', () => {
	it('does not consume phase time before interaction starts', () => {
		const s0 = ScenarioEngine.init(baseScenario, 'lead', 0);
		const startPhase = (
			ScenarioEngine as unknown as {
				startPhase: (state: typeof s0, nowMs: number) => typeof s0;
			}
		).startPhase;

		expect(ScenarioEngine.tick(s0, 60_000)).toBe(s0);
		const started = startPhase(s0, 60_000);
		expect(ScenarioEngine.tick(started, 89_999).phaseIndex).toBe(0);
		expect(ScenarioEngine.tick(started, 90_000).phaseIndex).toBe(1);
	});

	it('triggers on_skip when phase timeout exceeded', () => {
		const s0 = ScenarioEngine.startPhase(ScenarioEngine.init(baseScenario, 'lead', 0), 0);
		const s1 = ScenarioEngine.tick(s0, 31_000);
		expect(s1.phaseIndex).toBe(1);
		expect(s1.worsenLevel).toBe(1);
		expect(s1.log.find((e) => e.kind === 'on_skip')).toBeTruthy();
	});

	it('does nothing before timeout', () => {
		const s0 = ScenarioEngine.startPhase(ScenarioEngine.init(baseScenario, 'lead', 0), 0);
		const s1 = ScenarioEngine.tick(s0, 10_000);
		expect(s1.phaseIndex).toBe(0);
		expect(s1.worsenLevel).toBe(0);
	});
});

describe('ScenarioEngine outcome resolution', () => {
	it.each([
		['rosc', 3],
		['doa', 1]
	] as const)('derives %s outcome priority as %i stars', (outcomeId, stars) => {
		const getStars = (
			ScenarioEngine as unknown as {
				getStars: (scenario: Scenario, outcomeId: string) => number;
			}
		).getStars;
		expect(getStars(baseScenario, outcomeId)).toBe(stars);
	});

	it('awards three stars to a single-outcome scenario', () => {
		const getStars = (
			ScenarioEngine as unknown as {
				getStars: (scenario: Scenario, outcomeId: string) => number;
			}
		).getStars;
		const scenario = { ...baseScenario, outcomes: [baseScenario.outcomes[0]] };
		expect(getStars(scenario, 'rosc')).toBe(3);
	});

	it('returns ROSC when player completes everything correctly with 已電擊 flag', () => {
		let s = ScenarioEngine.init(baseScenario, 'lead', 0);
		s = ScenarioEngine.performAction(s, 'check_scene_safe', 'lead', 1000).state;
		s = ScenarioEngine.performAction(s, 'cpr_compress_adult', 'lead', 2000).state;
		s = ScenarioEngine.performAction(s, 'bvm_ventilate', 'assist', 3000).state;
		s = ScenarioEngine.performAction(s, 'check_pulse_carotid', 'lead', 4000).state;
		const outcome = ScenarioEngine.getOutcome(s);
		expect(s.flags.has('已電擊')).toBe(true);
		expect(outcome?.id).toBe('rosc');
	});

	it('returns DOA when default', () => {
		let s = ScenarioEngine.init(baseScenario, 'lead', 0);
		s = ScenarioEngine.startPhase(s, 0);
		s = ScenarioEngine.tick(s, 31_000);
		s = ScenarioEngine.startPhase(s, 31_000);
		s = ScenarioEngine.tick(s, 91_000);
		s = ScenarioEngine.startPhase(s, 91_000);
		s = ScenarioEngine.tick(s, 151_000);
		const outcome = ScenarioEngine.getOutcome(s);
		expect(outcome?.id).toBe('doa');
	});

	it('does not finalize before all phases done', () => {
		const s = ScenarioEngine.init(baseScenario, 'lead', 0);
		expect(ScenarioEngine.getOutcome(s)).toBeNull();
	});

	it('does not append another outcome when finalized state is processed again', () => {
		let s = ScenarioEngine.init(baseScenario, 'lead', 0);
		s = ScenarioEngine.performAction(s, 'check_scene_safe', 'lead', 1000).state;
		s = ScenarioEngine.performAction(s, 'cpr_compress_adult', 'lead', 2000).state;
		s = ScenarioEngine.performAction(s, 'bvm_ventilate', 'assist', 3000).state;
		s = ScenarioEngine.performAction(s, 'check_pulse_carotid', 'lead', 4000).state;
		const finalized = s;

		expect(ScenarioEngine.tick(finalized, 5000)).toBe(finalized);
		expect(ScenarioEngine.performAction(finalized, 'check_pulse_carotid', 'lead', 5000).state).toBe(
			finalized
		);
		expect(finalized.log.filter((entry) => entry.kind === 'outcome')).toHaveLength(1);
	});
});

describe('ScenarioEngine log', () => {
	it('records action, phase_advance, and outcome events in time order', () => {
		let s = ScenarioEngine.init(baseScenario, 'lead', 0);
		s = ScenarioEngine.performAction(s, 'check_scene_safe', 'lead', 1000).state;
		s = ScenarioEngine.performAction(s, 'cpr_compress_adult', 'lead', 2000).state;
		s = ScenarioEngine.performAction(s, 'bvm_ventilate', 'assist', 3000).state;
		s = ScenarioEngine.performAction(s, 'check_pulse_carotid', 'lead', 4000).state;

		const kinds = s.log.map((e) => e.kind);
		expect(kinds).toContain('action');
		expect(kinds).toContain('phase_advance');
		expect(kinds).toContain('outcome');
		const tMs = s.log.map((e) => e.tMs);
		const sorted = [...tMs].sort((a, b) => a - b);
		expect(tMs).toEqual(sorted);
	});
});

describe('evaluateCondition', () => {
	const ctx = {
		correctRate: 0.95,
		worsenLevel: 1,
		flags: new Set(['已電擊'])
	};

	it('handles 預設 → true', () => {
		expect(evaluateCondition('預設', ctx)).toBe(true);
	});

	it('handles single comparison', () => {
		expect(evaluateCondition('正確率>=0.9', ctx)).toBe(true);
		expect(evaluateCondition('正確率>=1.0', ctx)).toBe(false);
	});

	it('handles flag presence', () => {
		expect(evaluateCondition('已電擊', ctx)).toBe(true);
		expect(evaluateCondition('未電擊', ctx)).toBe(false);
	});

	it('handles 且 / 或 with precedence (且 binds tighter)', () => {
		expect(evaluateCondition('正確率>=0.9 且 已電擊', ctx)).toBe(true);
		expect(evaluateCondition('正確率>=0.99 且 已電擊', ctx)).toBe(false);
		expect(evaluateCondition('正確率>=0.99 或 已電擊', ctx)).toBe(true);
		expect(evaluateCondition('正確率>=0.99 或 未電擊 且 已電擊', ctx)).toBe(false);
	});
});

describe('findPartnerActions', () => {
	it('returns partner-only required actions not yet completed', () => {
		let s = ScenarioEngine.init(baseScenario, 'lead', 0);
		s = ScenarioEngine.performAction(s, 'check_scene_safe', 'lead', 1000).state;
		const partner = findPartnerActions(s);
		expect(partner).toEqual(['bvm_ventilate']);
	});

	it('finds lead actions when the player is assist', () => {
		let s = ScenarioEngine.init(baseScenario, 'assist', 0);
		s = ScenarioEngine.performAction(s, 'check_scene_safe', 'assist', 1000).state;
		expect(findPartnerActions(s)).toEqual(['cpr_compress_adult']);
	});

	it('manual direction completes once and makes a stale callback inert', () => {
		let s = ScenarioEngine.init(baseScenario, 'lead', 0);
		s = ScenarioEngine.performAction(s, 'check_scene_safe', 'lead', 1000).state;
		const directed = ScenarioEngine.directivePartner(s, 'bvm_ventilate', 2000);
		const stale = ScenarioEngine.performAction(directed.state, 'bvm_ventilate', 'assist', 3000);

		expect(directed.feedback.correct).toBe(true);
		expect(stale.feedback.message).toBe('already_completed');
		expect(stale.state).toBe(directed.state);
	});
});
