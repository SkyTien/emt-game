import { describe, expect, it } from 'vitest';
import { ActionRegistry } from './registry';
import { validateActions, validateScenario, validateTechnique } from './validators';
import type { Action, Scenario, Technique } from '$lib/types/content';

const goodActions: Action[] = [
	{
		id: 'check_scene_safe',
		label: { 'zh-Hant': '評估現場安全' },
		bag: 'hand'
	},
	{
		id: 'cpr_compress',
		label: { 'zh-Hant': '心臟按壓' },
		bag: 'hand',
		body_region: 'chest'
	},
	{
		id: 'apply_aed',
		label: { 'zh-Hant': '貼 AED 電擊片' },
		bag: 'aed',
		body_region: 'chest'
	},
	{
		id: 'cervical_collar_pick',
		label: { 'zh-Hant': '挑選頸圈尺寸' },
		bag: 'jumpkit',
		body_region: 'neck'
	},
	{
		id: 'cervical_collar_apply',
		label: { 'zh-Hant': '套上頸圈' },
		bag: 'jumpkit',
		body_region: 'neck'
	}
];

function makeRegistry(): ActionRegistry {
	return new ActionRegistry(goodActions);
}

const goodScenario: Scenario = {
	id: 'demo',
	schema_version: 1,
	title: { 'zh-Hant': '測試情境' },
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
			narrative: { 'zh-Hant': '抵達現場' },
			required: [{ action_id: 'check_scene_safe' }],
			timeout: 30,
			on_skip: { worsen: 1, note: { 'zh-Hant': '忘了觀察交通' } }
		},
		{
			id: 'cpr',
			narrative: { 'zh-Hant': '開始 CPR' },
			required: [{ action_id: 'cpr_compress' }],
			timeout: 60
		}
	],
	outcomes: [
		{
			id: 'rosc',
			when: '正確率>=0.9',
			title: { 'zh-Hant': 'ROSC' },
			text: { 'zh-Hant': '病人恢復自主循環' }
		},
		{
			id: 'doa',
			when: '預設',
			title: { 'zh-Hant': '送醫前 DOA' },
			text: { 'zh-Hant': '送醫前未恢復生命徵象' }
		}
	]
};

const goodTechnique: Technique = {
	id: 'cervical_collar',
	schema_version: 1,
	title: { 'zh-Hant': '上頸圈' },
	description: { 'zh-Hant': '為疑似頸椎傷患套上頸圈' },
	steps: [
		{
			id: 'pick_size',
			action_id: 'cervical_collar_pick',
			tip: { 'zh-Hant': '量下顎到肩膀指距' }
		},
		{
			id: 'apply',
			action_id: 'cervical_collar_apply'
		}
	]
};

describe('validateActions', () => {
	it('passes for valid actions', () => {
		const r = validateActions(goodActions);
		expect(r.ok).toBe(true);
		expect(r.errors).toHaveLength(0);
	});

	it('rejects duplicate id', () => {
		const r = validateActions([
			...goodActions,
			{ id: 'cpr_compress', label: { 'zh-Hant': '心臟按壓 2' }, bag: 'hand' }
		]);
		expect(r.ok).toBe(false);
		expect(r.errors.some((e) => e.code === 'duplicate_id')).toBe(true);
	});

	it('rejects duplicate label', () => {
		const r = validateActions([
			...goodActions,
			{ id: 'unique_id_x', label: { 'zh-Hant': '心臟按壓' }, bag: 'hand' }
		]);
		expect(r.ok).toBe(false);
		expect(r.errors.some((e) => e.code === 'duplicate_label')).toBe(true);
	});

	it('rejects invalid bag', () => {
		const r = validateActions([{ id: 'x', label: { 'zh-Hant': 'X' }, bag: 'badbag' as never }]);
		expect(r.ok).toBe(false);
		expect(r.errors.some((e) => e.code === 'invalid_bag')).toBe(true);
	});

	it('rejects label missing zh-Hant', () => {
		const r = validateActions([{ id: 'x', label: { en: 'X' } as never, bag: 'hand' }]);
		expect(r.ok).toBe(false);
		expect(r.errors.some((e) => e.code === 'locale_map_missing_zh_hant')).toBe(true);
	});

	it('warns when label is plain string (back-compat)', () => {
		const r = validateActions([{ id: 'x', label: 'X' as never, bag: 'hand' }]);
		expect(r.ok).toBe(true);
		expect(r.warnings.some((w) => w.code === 'string_to_locale_map')).toBe(true);
	});
});

describe('validateScenario', () => {
	const reg = makeRegistry();

	it('passes for valid scenario', () => {
		const r = validateScenario(goodScenario, reg);
		expect(r.errors).toHaveLength(0);
		expect(r.ok).toBe(true);
	});

	it('rejects timeout < 5', () => {
		const bad = structuredClone(goodScenario);
		bad.phases[0].timeout = 3;
		const r = validateScenario(bad, reg);
		expect(r.ok).toBe(false);
		expect(r.errors.some((e) => e.code === 'timeout_too_short')).toBe(true);
	});

	it('rejects on_skip without note', () => {
		const bad = structuredClone(goodScenario);
		bad.phases[0].on_skip = { worsen: 1, note: undefined as never };
		const r = validateScenario(bad, reg);
		expect(r.ok).toBe(false);
		expect(r.errors.some((e) => e.code === 'missing_skip_note' || e.code === 'missing')).toBe(true);
	});

	it('rejects missing default outcome', () => {
		const bad = structuredClone(goodScenario);
		bad.outcomes = [bad.outcomes[0]];
		const r = validateScenario(bad, reg);
		expect(r.ok).toBe(false);
		expect(r.errors.some((e) => e.code === 'missing_default_outcome')).toBe(true);
	});

	it('rejects required action that registry cannot resolve', () => {
		const bad = structuredClone(goodScenario);
		bad.phases[0].required = [{ action_id: 'nonexistent_action' }];
		const r = validateScenario(bad, reg);
		expect(r.ok).toBe(false);
		expect(r.errors.some((e) => e.code === 'unknown_action')).toBe(true);
	});

	it('rejects illegal crew bag', () => {
		const bad = structuredClone(goodScenario);
		bad.crew.lead.carries = ['hand', 'pocket' as never];
		const r = validateScenario(bad, reg);
		expect(r.ok).toBe(false);
		expect(r.errors.some((e) => e.code === 'invalid_bag')).toBe(true);
	});

	it('rejects empty phase id', () => {
		const bad = structuredClone(goodScenario);
		bad.phases[0].id = '';
		const r = validateScenario(bad, reg);
		expect(r.ok).toBe(false);
		expect(r.errors.some((e) => e.code === 'empty_id')).toBe(true);
	});

	it('rejects duplicate required actions and prerequisite cycles', () => {
		const duplicate = structuredClone(goodScenario);
		duplicate.phases[0].required = [
			{ action_id: 'check_scene_safe' },
			{ action_id: 'check_scene_safe' }
		];
		expect(
			validateScenario(duplicate, reg).errors.some((e) => e.code === 'duplicate_required_action')
		).toBe(true);

		const cycle = structuredClone(goodScenario);
		cycle.phases[1].required = [
			{ action_id: 'cpr_compress', after: 'apply_aed' },
			{ action_id: 'apply_aed', after: 'cpr_compress' }
		];
		expect(validateScenario(cycle, reg).errors.some((e) => e.code === 'after_cycle')).toBe(true);
	});

	it('rejects malformed conditions and a default outcome that is not last', () => {
		const malformed = structuredClone(goodScenario);
		malformed.outcomes[0].when = '正確率>=0.9 trailing';
		expect(
			validateScenario(malformed, reg).errors.some((e) => e.code === 'invalid_condition')
		).toBe(true);

		const shadowed = structuredClone(goodScenario);
		shadowed.outcomes.reverse();
		expect(
			validateScenario(shadowed, reg).errors.some((e) => e.code === 'default_outcome_not_last')
		).toBe(true);
	});
});

describe('validateTechnique', () => {
	const reg = makeRegistry();

	it('passes for valid technique', () => {
		const r = validateTechnique(goodTechnique, reg);
		expect(r.errors).toHaveLength(0);
		expect(r.ok).toBe(true);
	});

	it('rejects empty steps', () => {
		const bad = { ...goodTechnique, steps: [] };
		const r = validateTechnique(bad, reg);
		expect(r.ok).toBe(false);
		expect(r.errors.some((e) => e.code === 'empty_steps')).toBe(true);
	});

	it('rejects step.action_id not in registry', () => {
		const bad = structuredClone(goodTechnique);
		bad.steps[0].action_id = '不存在的動作';
		const r = validateTechnique(bad, reg);
		expect(r.ok).toBe(false);
		expect(r.errors.some((e) => e.code === 'unknown_action')).toBe(true);
	});

	it('rejects title missing zh-Hant', () => {
		const bad = structuredClone(goodTechnique);
		bad.title = { en: 'Cervical Collar' } as never;
		const r = validateTechnique(bad, reg);
		expect(r.ok).toBe(false);
		expect(r.errors.some((e) => e.code === 'locale_map_missing_zh_hant')).toBe(true);
	});
});

describe('validateScenario - action_id format', () => {
	const reg = makeRegistry();

	it('accepts scenario with action_id', () => {
		const scenario = structuredClone(goodScenario);
		scenario.phases[0].required = [{ action_id: 'check_scene_safe' }];
		scenario.phases[1].required = [{ action_id: 'cpr_compress' }];
		const r = validateScenario(scenario, reg);
		expect(r.ok).toBe(true);
		expect(r.errors).toHaveLength(0);
	});

	it('rejects required entry without action_id', () => {
		const scenario = structuredClone(goodScenario);
		scenario.phases[0].required = [{ by: 'player' } as never];
		const r = validateScenario(scenario, reg);
		expect(r.ok).toBe(false);
		expect(r.errors.some((e) => e.code === 'invalid_type')).toBe(true);
	});

	it('rejects required entry with empty action_id', () => {
		const scenario = structuredClone(goodScenario);
		scenario.phases[0].required = [{ action_id: '' }];
		const r = validateScenario(scenario, reg);
		expect(r.ok).toBe(false);
		expect(r.errors.some((e) => e.code === 'invalid_type')).toBe(true);
	});
});

describe('validateTechnique - action_id format', () => {
	const reg = makeRegistry();

	it('accepts technique with action_id', () => {
		const technique = structuredClone(goodTechnique);
		technique.steps[0] = { id: 'step1', action_id: 'cervical_collar_pick' };
		technique.steps[1] = { id: 'step2', action_id: 'cervical_collar_apply' };
		const r = validateTechnique(technique, reg);
		expect(r.ok).toBe(true);
		expect(r.errors).toHaveLength(0);
	});

	it('rejects step without action_id', () => {
		const technique = structuredClone(goodTechnique);
		technique.steps[0] = { id: 'step1', tip: { 'zh-Hant': 'test' } } as never;
		const r = validateTechnique(technique, reg);
		expect(r.ok).toBe(false);
		expect(r.errors.some((e) => e.code === 'missing_action')).toBe(true);
	});

	it('rejects step with empty action_id', () => {
		const technique = structuredClone(goodTechnique);
		technique.steps[0] = { id: 'step1', action_id: '' };
		const r = validateTechnique(technique, reg);
		expect(r.ok).toBe(false);
		expect(r.errors.some((e) => e.code === 'missing_action')).toBe(true);
	});
});
