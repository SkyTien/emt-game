import { describe, expect, it } from 'vitest';
import { TechniqueEngine } from './technique-engine';
import type { Technique } from '$lib/types/content';

const tech: Technique = {
	id: 'cervical_collar',
	schema_version: 1,
	title: { 'zh-Hant': '上頸圈' },
	description: { 'zh-Hant': '為疑似頸椎傷患套上頸圈' },
	steps: [
		{
			id: 's1',
			action_id: 'stabilize_head_manual',
			tip: { 'zh-Hant': '雙手扶住頭兩側' }
		},
		{
			id: 's2',
			action_id: 'select_collar_size',
			tip: { 'zh-Hant': '量下顎到肩膀的指距' }
		},
		{ id: 's3', action_id: 'apply_collar' }
	]
};

describe('TechniqueEngine.init', () => {
	it('starts at step 0 with zero wrong tries', () => {
		const s = TechniqueEngine.init(tech);
		expect(s.stepIndex).toBe(0);
		expect(s.wrongTriesPerStep).toEqual([0, 0, 0]);
		expect(s.finished).toBe(false);
		expect(s.totalWrong).toBe(0);
	});
});

describe('TechniqueEngine.performAction', () => {
	it('advances stepIndex on correct action', () => {
		const s0 = TechniqueEngine.init(tech);
		const r = TechniqueEngine.performAction(s0, 'stabilize_head_manual');
		expect(r.feedback.correct).toBe(true);
		expect(r.state.stepIndex).toBe(1);
	});

	it('increments wrongTries on wrong action', () => {
		const s0 = TechniqueEngine.init(tech);
		const r = TechniqueEngine.performAction(s0, 'wrong_action_id');
		expect(r.feedback.correct).toBe(false);
		expect(r.state.totalWrong).toBe(1);
		expect(r.state.wrongTriesPerStep[0]).toBe(1);
	});

	it('reveals tip only when wrongTries >= 2', () => {
		let s = TechniqueEngine.init(tech);
		const r1 = TechniqueEngine.performAction(s, '亂動作');
		expect(r1.feedback.tip).toBeUndefined();
		s = r1.state;
		const r2 = TechniqueEngine.performAction(s, '亂動作');
		expect(r2.feedback.tip).toBeDefined();
		expect(r2.feedback.tip?.['zh-Hant']).toBe('雙手扶住頭兩側');
	});

	it('does not reveal tip when current step has no tip', () => {
		let s = TechniqueEngine.init(tech);
		s = TechniqueEngine.performAction(s, 'stabilize_head_manual').state;
		s = TechniqueEngine.performAction(s, 'select_collar_size').state;
		const r1 = TechniqueEngine.performAction(s, '亂動作');
		s = r1.state;
		const r2 = TechniqueEngine.performAction(s, '亂動作');
		expect(r2.feedback.tip).toBeUndefined();
	});

	it('marks finished after last correct action', () => {
		let s = TechniqueEngine.init(tech);
		s = TechniqueEngine.performAction(s, 'stabilize_head_manual').state;
		s = TechniqueEngine.performAction(s, 'select_collar_size').state;
		const r = TechniqueEngine.performAction(s, 'apply_collar');
		expect(r.state.finished).toBe(true);
		expect(r.feedback.finished).toBe(true);
	});

	it('rejects further actions after finished', () => {
		let s = TechniqueEngine.init(tech);
		for (const step of tech.steps) {
			const id = step.action_id;
			s = TechniqueEngine.performAction(s, id!).state;
		}
		const after = TechniqueEngine.performAction(s, 'apply_collar');
		expect(after.feedback.correct).toBe(false);
	});
});

describe('TechniqueEngine.performAction — ID-based step matching (Task 5.5)', () => {
	const techIdBased: Technique = {
		id: 'id_based_technique',
		schema_version: 1,
		title: { 'zh-Hant': 'ID 專用技術' },
		description: { 'zh-Hant': '測試 ID 基礎步驟' },
		steps: [
			{ id: 's1', action_id: 'stabilize_head_manual', tip: { 'zh-Hant': 'Tip 1' } },
			{ id: 's2', action_id: 'select_collar_size', tip: { 'zh-Hant': 'Tip 2' } }
		]
	};

	it('advances on correct action_id', () => {
		const s0 = TechniqueEngine.init(techIdBased);
		const r = TechniqueEngine.performAction(s0, 'stabilize_head_manual');
		expect(r.feedback.correct).toBe(true);
		expect(r.state.stepIndex).toBe(1);
	});

	it('counts wrong tries when action_id does not match', () => {
		const s0 = TechniqueEngine.init(techIdBased);
		const r = TechniqueEngine.performAction(s0, 'select_collar_size');
		expect(r.feedback.correct).toBe(false);
		expect(r.state.totalWrong).toBe(1);
	});

	it('reveals tip after 2 wrong tries with ID-based steps', () => {
		let s = TechniqueEngine.init(techIdBased);
		const r1 = TechniqueEngine.performAction(s, 'wrong_id_1');
		expect(r1.feedback.tip).toBeUndefined();
		s = r1.state;
		const r2 = TechniqueEngine.performAction(s, 'wrong_id_2');
		expect(r2.feedback.tip).toBeDefined();
		expect(r2.feedback.tip?.['zh-Hant']).toBe('Tip 1');
	});
});

describe('TechniqueEngine.performAction — label-based step matching (Task 5.6)', () => {
	const techLabelBased: Technique = {
		id: 'label_based_technique',
		schema_version: 1,
		title: { 'zh-Hant': '標籤專用技術' },
		description: { 'zh-Hant': '測試標籤基礎步驟' },
		steps: [
			{ id: 's1', action_id: 'manual_inline_stabilization', tip: { 'zh-Hant': 'Label Tip 1' } },
			{ id: 's2', action_id: 'cervical_collar_pick_size', tip: { 'zh-Hant': 'Label Tip 2' } }
		]
	};

	it('advances on correct action_id', () => {
		const s0 = TechniqueEngine.init(techLabelBased);
		const r = TechniqueEngine.performAction(s0, 'manual_inline_stabilization');
		expect(r.feedback.correct).toBe(true);
		expect(r.state.stepIndex).toBe(1);
	});

	it('counts wrong when passing non-matching label', () => {
		const s0 = TechniqueEngine.init(techLabelBased);
		const r = TechniqueEngine.performAction(s0, '套上頸圈');
		expect(r.feedback.correct).toBe(false);
		expect(r.state.totalWrong).toBe(1);
	});

	it('counts wrong tries with incorrect label', () => {
		const s0 = TechniqueEngine.init(techLabelBased);
		const r = TechniqueEngine.performAction(s0, '挑選頸圈尺寸');
		expect(r.feedback.correct).toBe(false);
		expect(r.state.totalWrong).toBe(1);
	});

	it('reveals tip after 2 wrong tries with label-based steps', () => {
		let s = TechniqueEngine.init(techLabelBased);
		const r1 = TechniqueEngine.performAction(s, 'wrong_label_1');
		expect(r1.feedback.tip).toBeUndefined();
		s = r1.state;
		const r2 = TechniqueEngine.performAction(s, 'wrong_label_2');
		expect(r2.feedback.tip).toBeDefined();
		expect(r2.feedback.tip?.['zh-Hant']).toBe('Label Tip 1');
	});
});

describe('TechniqueEngine.getStars', () => {
	function playPerfect() {
		let s = TechniqueEngine.init(tech);
		for (const step of tech.steps) {
			const id = step.action_id;
			s = TechniqueEngine.performAction(s, id!).state;
		}
		return s;
	}

	it('returns null before finished', () => {
		const s = TechniqueEngine.init(tech);
		expect(TechniqueEngine.getStars(s)).toBeNull();
	});

	it('returns 3 stars on zero mistakes', () => {
		expect(TechniqueEngine.getStars(playPerfect())).toBe(3);
	});

	it('returns 2 stars when wrong <= 2', () => {
		let s = TechniqueEngine.init(tech);
		s = TechniqueEngine.performAction(s, '亂動作').state;
		s = TechniqueEngine.performAction(s, 'stabilize_head_manual').state;
		s = TechniqueEngine.performAction(s, 'select_collar_size').state;
		s = TechniqueEngine.performAction(s, 'apply_collar').state;
		expect(TechniqueEngine.getStars(s)).toBe(2);
	});

	it('returns 1 star when wrong > 2', () => {
		let s = TechniqueEngine.init(tech);
		for (let i = 0; i < 3; i++) s = TechniqueEngine.performAction(s, '亂動作').state;
		s = TechniqueEngine.performAction(s, 'stabilize_head_manual').state;
		s = TechniqueEngine.performAction(s, 'select_collar_size').state;
		s = TechniqueEngine.performAction(s, 'apply_collar').state;
		expect(TechniqueEngine.getStars(s)).toBe(1);
	});
});
