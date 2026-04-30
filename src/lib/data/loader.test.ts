import { describe, expect, it } from 'vitest';
import { parseYamlText } from './loader';
import type { Phase, TechniqueStep } from '$lib/types/content';

describe('parseYamlText — ID-based format (Task 6.4)', () => {
	it('parses phase with action_id field', () => {
		const yaml = `
id: test_phase
required:
  - action_id: check_scene_safe
    action: 評估現場安全
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
action: 徒手固定頭部
tip:
  zh-Hant: 雙手扶住頭兩側
`;
		const result = parseYamlText<TechniqueStep>(yaml);
		expect(result.id).toBe('s1');
		expect(result.action_id).toBe('stabilize_head_manual');
		expect(result.action_id).toBe('徒手固定頭部');
	});

	it('handles multiple required entries with mixed action_id', () => {
		const yaml = `
id: test_phase
required:
  - action_id: check_scene_safe
    action: 評估現場安全
  - action_id: wear_ppe
    action: 戴手套口罩
`;
		const result = parseYamlText<Phase>(yaml);
		expect(result.required).toHaveLength(2);
		expect(result.required[0].action_id).toBe('check_scene_safe');
		expect(result.required[1].action_id).toBe('wear_ppe');
	});
});

describe('parseYamlText — label-based format (Task 6.5)', () => {
	it('parses phase with only action field (backward compat)', () => {
		const yaml = `
id: test_phase
required:
  - action: 評估現場安全
`;
		const result = parseYamlText<Phase>(yaml);
		expect(result.required).toHaveLength(1);
		expect(result.required[0].action_id).toBe('評估現場安全');
		expect(result.required[0].action_id).toBeUndefined();
	});

	it('parses technique step with only action field', () => {
		const yaml = `
id: s1
action: 徒手固定頭部
tip:
  zh-Hant: 雙手扶住頭兩側
`;
		const result = parseYamlText<TechniqueStep>(yaml);
		expect(result.id).toBe('s1');
		expect(result.action_id).toBe('徒手固定頭部');
		expect(result.action_id).toBeUndefined();
	});

	it('handles multiple required entries with only action labels', () => {
		const yaml = `
id: test_phase
required:
  - action: 評估現場安全
  - action: 戴手套口罩
`;
		const result = parseYamlText<Phase>(yaml);
		expect(result.required).toHaveLength(2);
		expect(result.required[0].action_id).toBe('評估現場安全');
		expect(result.required[1].action_id).toBe('戴手套口罩');
		expect(result.required[0].action_id).toBeUndefined();
	});
});

describe('parseYamlText — both fields present (Task 6.6)', () => {
	it('preserves both action and action_id when both present', () => {
		const yaml = `
id: test_phase
required:
  - action_id: check_scene_safe
    action: 評估現場安全
`;
		const result = parseYamlText<Phase>(yaml);
		expect(result.required[0].action_id).toBe('check_scene_safe');
		expect(result.required[0].action_id).toBe('評估現場安全');
	});

	it('handles step with both fields', () => {
		const yaml = `
id: s1
action_id: stabilize_head_manual
action: 徒手固定頭部
tip:
  zh-Hant: 雙手扶住頭兩側
`;
		const result = parseYamlText<TechniqueStep>(yaml);
		expect(result.action_id).toBe('stabilize_head_manual');
		expect(result.action_id).toBe('徒手固定頭部');
	});

	it('prefers action_id in code logic (engine will use action_id if present)', () => {
		const yaml = `
id: test_phase
required:
  - action_id: check_scene_safe
    action: 評估現場安全
`;
		const result = parseYamlText<Phase>(yaml);
		const req = result.required[0];
		// Logic prefers action_id over action
		const preferred = req.action_id ?? req.action_id;
		expect(preferred).toBe('check_scene_safe');
	});
});
