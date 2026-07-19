import { describe, expect, it } from 'vitest';
import type { Scenario } from '$lib/types/content';
import { loadQuickPlayScenarios, resolveScenario } from './content';

function scenario(id: string, overrides: Partial<Scenario> = {}): Scenario {
	return {
		id,
		schema_version: 1,
		title: { 'zh-Hant': id },
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
		phases: [],
		outcomes: [],
		...overrides
	};
}

describe('authorable scenario catalog', () => {
	it('shallow-merges inherited catalog while replacing arrays', () => {
		const parent = scenario('base', {
			catalog: {
				summary: { 'zh-Hant': '基底摘要' },
				difficulty: 'intermediate',
				tags: [{ 'zh-Hant': '基底標籤' }],
				variant_group: 'demo'
			}
		});
		const child = scenario('variant', {
			extends: 'base',
			catalog: { tags: [{ 'zh-Hant': '子層標籤' }], quick_play: true }
		});
		const resolved = resolveScenario(
			child,
			new Map([
				[parent.id, parent],
				[child.id, child]
			])
		);

		expect(resolved.catalog).toMatchObject({
			summary: { 'zh-Hant': '基底摘要' },
			difficulty: 'intermediate',
			variant_group: 'demo',
			quick_play: true,
			tags: [{ 'zh-Hant': '子層標籤' }]
		});
	});

	it('discovers checked-in quick-play variants from YAML metadata', () => {
		const quickPlay = loadQuickPlayScenarios();
		expect(quickPlay.length).toBeGreaterThan(0);
		expect(quickPlay.every((item) => item.catalog?.variant_group)).toBe(true);
	});
});
