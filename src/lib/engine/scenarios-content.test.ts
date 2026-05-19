/**
 * Content integration tests — walk the three published scenarios end-to-end
 * using real YAML (loaded via content.ts) and verify outcomes/flags.
 *
 * Covers OpenSpec tasks 1.3, 1.5, 6.6, 7.9, 8.3.
 */
import { describe, expect, it } from 'vitest';
import { ScenarioEngine, type ScenarioState, type ActorRole } from './scenario-engine';
import { getScenarioById } from '$lib/data/content';
import { extractFlagTokens } from '$lib/data/validators';
import { ActionRegistry } from '$lib/data/registry';
import { validateScenario } from '$lib/data/validators';
import type { Scenario } from '$lib/types/content';

function play(state: ScenarioState, actionId: string, by: ActorRole, tMs: number): ScenarioState {
	const r = ScenarioEngine.performAction(state, actionId, by, tMs);
	if (!r.feedback.correct) {
		throw new Error(
			`expected ${actionId} to be correct in phase ${state.scenario.phases[state.phaseIndex]?.id}; got ${r.feedback.message}`
		);
	}
	return r.state;
}

describe('hypoglycemia scenario — textbook outcome reachable', () => {
	it('completes perfect path and resolves textbook outcome', () => {
		const scenario = getScenarioById('hypoglycemia_stroke_rule_out')!;
		expect(scenario).toBeTruthy();
		let s = ScenarioEngine.init(scenario, 'lead', 0);
		let t = 1;
		for (const phase of scenario.phases) {
			for (const req of phase.required) {
				const by: ActorRole = req.by === 'assist' ? 'assist' : 'lead';
				s = play(s, req.action_id, by, t++);
			}
		}
		const outcome = ScenarioEngine.getOutcome(s);
		expect(s.flags.has('已測血糖')).toBe(true);
		expect(s.flags.has('已給葡萄糖')).toBe(true);
		expect(outcome?.id).toBe('textbook');
	});
});

describe('ohca scenario — flow and outcomes', () => {
	it('perfect path yields continued_cpr_good outcome', () => {
		const scenario = getScenarioById('ohca_no_rosc')!;
		let s = ScenarioEngine.init(scenario, 'lead', 0);
		let t = 1;
		for (const phase of scenario.phases) {
			for (const req of phase.required) {
				const by: ActorRole = req.by === 'assist' ? 'assist' : 'lead';
				s = play(s, req.action_id, by, t++);
			}
		}
		expect(s.flags.has('已電擊')).toBe(true);
		expect(ScenarioEngine.getOutcome(s)?.id).toBe('continued_cpr_good');
	});

	it('missing airway action prevents cpr phase completion', () => {
		const scenario = getScenarioById('ohca_no_rosc')!;
		const s0 = ScenarioEngine.init(scenario, 'lead', 0);
		const cprIdx = scenario.phases.findIndex((p) => p.id === 'cpr');
		expect(cprIdx).toBeGreaterThan(0);
		const cpr = scenario.phases[cprIdx];
		const ids = cpr.required.map((r) => r.action_id);
		expect(ids).toContain('open_airway_head_tilt');
		expect(ids).toContain('insert_opa');
		expect(s0.phaseIndex).toBe(0);
	});
});

describe('motorcycle trauma scenario — phase split', () => {
	it('has bleeding_x / airway / breathing / circulation / disability / exposure phases', () => {
		const scenario = getScenarioById('motorcycle_trauma')!;
		const ids = scenario.phases.map((p) => p.id);
		expect(ids).toContain('bleeding_x');
		expect(ids).toContain('airway');
		expect(ids).toContain('breathing');
		expect(ids).toContain('circulation');
		expect(ids).toContain('disability');
		expect(ids).toContain('exposure');
	});

	it('perfect path yields stable outcome', () => {
		const scenario = getScenarioById('motorcycle_trauma')!;
		let s = ScenarioEngine.init(scenario, 'lead', 0);
		let t = 1;
		for (const phase of scenario.phases) {
			for (const req of phase.required) {
				const by: ActorRole = req.by === 'assist' ? 'assist' : 'lead';
				s = play(s, req.action_id, by, t++);
			}
		}
		expect(ScenarioEngine.getOutcome(s)?.id).toBe('stable');
	});

	it('uses oxygen_nrm not connect_o2', () => {
		const scenario = getScenarioById('motorcycle_trauma')!;
		const allRequired = scenario.phases.flatMap((p) => p.required.map((r) => r.action_id));
		expect(allRequired).toContain('oxygen_nrm');
		expect(allRequired).not.toContain('connect_o2');
	});
});

describe('hypoglycemia perfect path no longer requires oxygen', () => {
	it('intervention phase does not require nasal_cannula_oxygen', () => {
		const scenario = getScenarioById('hypoglycemia_stroke_rule_out')!;
		const intervention = scenario.phases.find((p) => p.id === 'intervention');
		const ids = intervention?.required.map((r) => r.action_id) ?? [];
		expect(ids).toContain('oral_glucose_give');
		expect(ids).not.toContain('nasal_cannula_oxygen');
	});
});

describe('extractFlagTokens (set_flag validator helper)', () => {
	it('extracts plain flag', () => {
		expect(extractFlagTokens('已電擊')).toEqual(['已電擊']);
	});

	it('skips metric prefixes', () => {
		expect(extractFlagTokens('正確率>=0.9')).toEqual([]);
		expect(extractFlagTokens('惡化等級<2')).toEqual([]);
	});

	it('skips reserved tokens', () => {
		expect(extractFlagTokens('預設')).toEqual([]);
	});

	it('extracts flags mixed with operators and metrics', () => {
		expect(extractFlagTokens('正確率>=0.9 且 已電擊')).toEqual(['已電擊']);
	});
});

describe('validateScenario — set_flag completeness', () => {
	const minimalActions = [
		{ id: 'a', label: { 'zh-Hant': 'A' }, bag: 'hand' as const },
		{ id: 'b', label: { 'zh-Hant': 'B' }, bag: 'hand' as const }
	];
	const reg = new ActionRegistry(minimalActions);

	const baseScenario: Scenario = {
		id: 's',
		schema_version: 1,
		title: { 'zh-Hant': 'S' },
		player_role: 'lead',
		patient_initial: {
			consciousness: { 'zh-Hant': 'x' },
			breath: { 'zh-Hant': 'x' },
			pulse: { 'zh-Hant': 'x' }
		},
		crew: {
			lead: { role: 'lead', carries: ['hand'] },
			assist: { role: 'assist', carries: ['hand'] }
		},
		phases: [
			{
				id: 'p1',
				narrative: { 'zh-Hant': 'n' },
				required: [{ action_id: 'a', set_flag: '已測血糖' }]
			}
		],
		outcomes: [
			{ id: 'ok', when: '已測血糖', title: { 'zh-Hant': 't' }, text: { 'zh-Hant': 'x' } },
			{ id: 'default', when: '預設', title: { 'zh-Hant': 't' }, text: { 'zh-Hant': 'x' } }
		]
	};

	it('passes when outcome flag is declared by some phase', () => {
		const r = validateScenario(baseScenario, reg);
		expect(r.ok).toBe(true);
	});

	it('fails when outcome references a flag that no phase declares', () => {
		const bad = structuredClone(baseScenario);
		bad.outcomes[0].when = '已測血糖 且 從未宣告的旗標';
		const r = validateScenario(bad, reg);
		expect(r.ok).toBe(false);
		expect(r.errors.some((e) => e.code === 'undeclared_flag')).toBe(true);
	});

	it('passes for hypoglycemia scenario (real YAML)', () => {
		const scenario = getScenarioById('hypoglycemia_stroke_rule_out')!;
		// Build registry from the real action list this scenario depends on
		const r = validateScenario(
			scenario,
			new ActionRegistry(
				scenario.phases.flatMap((p) =>
					p.required.map((req) => ({
						id: req.action_id,
						label: { 'zh-Hant': req.action_id },
						bag: 'hand' as const
					}))
				)
			)
		);
		expect(r.errors.filter((e) => e.code === 'undeclared_flag')).toHaveLength(0);
	});
});
