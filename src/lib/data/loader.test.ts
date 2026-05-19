import { describe, expect, it } from 'vitest';
import { parseYamlText } from './loader';
import type { Phase, TechniqueStep } from '$lib/types/content';

describe('parseYamlText — ID-based format', () => {
	it('parses phase with action_id field', () => {
		const yaml = `
id: test_phase
required:
  - action_id: check_scene_safe
`;
		const result = parseYamlText<Phase>(yaml);
		expect(result.id).toBe('test_phase');
		expect(result.required).toHaveLength(1);
		expect(result.required[0].action_id).toBe('check_scene_safe');
	});

	it('parses technique step with action_id field', () => {
		const yaml = `
id: s1
action_id: stabilize_head_manual
tip:
  zh-Hant: 雙手扶住頭兩側
`;
		const result = parseYamlText<TechniqueStep>(yaml);
		expect(result.id).toBe('s1');
		expect(result.action_id).toBe('stabilize_head_manual');
	});

	it('handles multiple required entries', () => {
		const yaml = `
id: test_phase
required:
  - action_id: check_scene_safe
  - action_id: wear_ppe
`;
		const result = parseYamlText<Phase>(yaml);
		expect(result.required).toHaveLength(2);
		expect(result.required[0].action_id).toBe('check_scene_safe');
		expect(result.required[1].action_id).toBe('wear_ppe');
	});

	it('parses required with by and set_flag', () => {
		const yaml = `
id: test_phase
required:
  - action_id: aed_shock
    by: partner
    set_flag: 已電擊
`;
		const result = parseYamlText<Phase>(yaml);
		expect(result.required[0].action_id).toBe('aed_shock');
		expect(result.required[0].by).toBe('partner');
		expect(result.required[0].set_flag).toBe('已電擊');
	});
});
