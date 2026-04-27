import { describe, expect, it } from 'vitest';
import { TechniqueEngine } from './technique-engine';
import type { Technique } from '$lib/types/content';

const tech: Technique = {
	id: 'cervical_collar',
	schema_version: 1,
	title: { 'zh-Hant': '上頸圈' },
	description: { 'zh-Hant': '為疑似頸椎傷患套上頸圈' },
	steps: [
		{ id: 's1', action: '徒手固定頭部', tip: { 'zh-Hant': '雙手扶住頭兩側' } },
		{ id: 's2', action: '挑選頸圈尺寸', tip: { 'zh-Hant': '量下顎到肩膀的指距' } },
		{ id: 's3', action: '套上頸圈' }
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
		const r = TechniqueEngine.performAction(s0, '徒手固定頭部');
		expect(r.feedback.correct).toBe(true);
		expect(r.state.stepIndex).toBe(1);
	});

	it('increments wrongTries on wrong action', () => {
		const s0 = TechniqueEngine.init(tech);
		const r = TechniqueEngine.performAction(s0, '亂動作');
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
		s = TechniqueEngine.performAction(s, '徒手固定頭部').state;
		s = TechniqueEngine.performAction(s, '挑選頸圈尺寸').state;
		const r1 = TechniqueEngine.performAction(s, '亂動作');
		s = r1.state;
		const r2 = TechniqueEngine.performAction(s, '亂動作');
		expect(r2.feedback.tip).toBeUndefined();
	});

	it('marks finished after last correct action', () => {
		let s = TechniqueEngine.init(tech);
		s = TechniqueEngine.performAction(s, '徒手固定頭部').state;
		s = TechniqueEngine.performAction(s, '挑選頸圈尺寸').state;
		const r = TechniqueEngine.performAction(s, '套上頸圈');
		expect(r.state.finished).toBe(true);
		expect(r.feedback.finished).toBe(true);
	});

	it('rejects further actions after finished', () => {
		let s = TechniqueEngine.init(tech);
		for (const step of tech.steps) {
			s = TechniqueEngine.performAction(s, step.action).state;
		}
		const after = TechniqueEngine.performAction(s, '套上頸圈');
		expect(after.feedback.correct).toBe(false);
	});
});

describe('TechniqueEngine.getStars', () => {
	function playPerfect() {
		let s = TechniqueEngine.init(tech);
		for (const step of tech.steps) {
			s = TechniqueEngine.performAction(s, step.action).state;
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
		s = TechniqueEngine.performAction(s, '徒手固定頭部').state;
		s = TechniqueEngine.performAction(s, '挑選頸圈尺寸').state;
		s = TechniqueEngine.performAction(s, '套上頸圈').state;
		expect(TechniqueEngine.getStars(s)).toBe(2);
	});

	it('returns 1 star when wrong > 2', () => {
		let s = TechniqueEngine.init(tech);
		for (let i = 0; i < 3; i++) s = TechniqueEngine.performAction(s, '亂動作').state;
		s = TechniqueEngine.performAction(s, '徒手固定頭部').state;
		s = TechniqueEngine.performAction(s, '挑選頸圈尺寸').state;
		s = TechniqueEngine.performAction(s, '套上頸圈').state;
		expect(TechniqueEngine.getStars(s)).toBe(1);
	});
});
