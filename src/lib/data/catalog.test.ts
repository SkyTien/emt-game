import { describe, expect, it } from 'vitest';
import type { Scenario, Technique } from '$lib/types/content';
import {
	catalogDifficulty,
	catalogEstimatedMinutes,
	catalogSummary,
	groupQuickPlayScenarios,
	representativeForGroup
} from './catalog';

const baseScenario: Scenario = {
	id: 'demo',
	schema_version: 1,
	title: { 'zh-Hant': '示範' },
	player_role: 'lead',
	patient_initial: {
		consciousness: { 'zh-Hant': '清醒' },
		breath: { 'zh-Hant': '正常' },
		pulse: { 'zh-Hant': '正常' }
	},
	crew: {
		lead: { role: 'lead', carries: ['hand'] },
		assist: { role: 'assist', carries: ['hand'] }
	},
	phases: [
		{ id: 'one', narrative: { 'zh-Hant': '第一段旁白' }, required: [], timeout: 60 },
		{ id: 'two', narrative: { 'zh-Hant': '第二段旁白' }, required: [], timeout: 60 }
	],
	outcomes: []
};

describe('catalog fallbacks', () => {
	it('derives stable defaults for legacy scenarios', () => {
		expect(catalogDifficulty(baseScenario)).toBe('intermediate');
		expect(catalogEstimatedMinutes(baseScenario)).toBe(2);
		expect(catalogSummary(baseScenario)['zh-Hant']).toBe('第一段旁白');
	});

	it('derives technique time from step count', () => {
		const technique: Technique = {
			id: 'demo-technique',
			schema_version: 1,
			title: { 'zh-Hant': '單項' },
			description: { 'zh-Hant': '說明' },
			steps: Array.from({ length: 5 }, (_, index) => ({
				id: `step-${index}`,
				action_id: `action-${index}`
			}))
		};
		expect(catalogEstimatedMinutes(technique)).toBe(3);
		expect(catalogSummary(technique)['zh-Hant']).toBe('說明');
	});
});

describe('quick-play groups', () => {
	it('groups scenarios by authored variant group', () => {
		const a = structuredClone(baseScenario);
		a.id = 'a';
		a.catalog = { variant_group: 'ohca', quick_play: true, sort: 20 };
		const b = structuredClone(baseScenario);
		b.id = 'b';
		b.catalog = { variant_group: 'ohca', quick_play: true, featured: true, sort: 30 };
		const groups = groupQuickPlayScenarios([a, b]);
		expect(groups.get('ohca')).toHaveLength(2);
		expect(representativeForGroup(groups.get('ohca') ?? [])?.id).toBe('b');
	});
});
