import { describe, expect, it, beforeEach, vi } from 'vitest';
import { ActionRegistry } from './registry';
import type { Action } from '$lib/types/content';

const testActions: Action[] = [
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
	}
];

describe('ActionRegistry.byId', () => {
	let registry: ActionRegistry;

	beforeEach(() => {
		registry = new ActionRegistry(testActions);
		vi.clearAllMocks();
	});

	describe('ID-first resolution', () => {
		it('resolves action by ID without warning', () => {
			const warnSpy = vi.spyOn(console, 'warn');
			const action = registry.byId('check_scene_safe');
			expect(action.id).toBe('check_scene_safe');
			expect(action.label['zh-Hant']).toBe('評估現場安全');
			// ID resolution should not emit a warning
			expect(warnSpy).not.toHaveBeenCalled();
			warnSpy.mockRestore();
		});

		it('returns correct action object for valid ID', () => {
			const action = registry.byId('cpr_compress');
			expect(action.id).toBe('cpr_compress');
			expect(action.bag).toBe('hand');
			expect(action.body_region).toBe('chest');
		});
	});

	describe('error cases', () => {
		it('throws error for unknown ID and label', () => {
			expect(() => {
				registry.byId('unknown_action_xyz');
			}).toThrow('unknown action');
		});

		it('throws error for invalid Chinese string', () => {
			expect(() => {
				registry.byId('不存在的動作');
			}).toThrow('unknown action');
		});

		it('error message includes the reference attempted', () => {
			expect(() => {
				registry.byId('bad_id_or_label');
			}).toThrow('bad_id_or_label');
		});
	});

	describe('ID takes precedence over label', () => {
		it('uses ID path if valid ID is provided', () => {
			const warnSpy = vi.spyOn(console, 'warn');
			// If both an ID and label happen to match (unlikely), ID should win
			const action = registry.byId('cpr_compress');
			expect(action.id).toBe('cpr_compress');
			// Should not emit deprecation warning for valid ID
			const deprecationWarnings = warnSpy.mock.calls.filter((call) =>
				call[0]?.includes('deprecated')
			);
			expect(deprecationWarnings).toHaveLength(0);
			warnSpy.mockRestore();
		});
	});
});

describe('ActionRegistry.byId', () => {
	let registry: ActionRegistry;

	beforeEach(() => {
		registry = new ActionRegistry(testActions);
	});

	it('resolves action by ID', () => {
		const action = registry.byId('check_scene_safe');
		expect(action.id).toBe('check_scene_safe');
	});

	it('throws error for unknown ID', () => {
		expect(() => {
			registry.byId('unknown_id');
		}).toThrow('unknown action id');
	});

	it('returns correct action object', () => {
		const action = registry.byId('cervical_collar_pick');
		expect(action.bag).toBe('jumpkit');
		expect(action.body_region).toBe('neck');
	});
});

describe('ActionRegistry.byBag', () => {
	let registry: ActionRegistry;

	beforeEach(() => {
		registry = new ActionRegistry(testActions);
	});

	it('returns all actions in hand bag', () => {
		const actions = registry.byBag('hand');
		expect(actions).toHaveLength(2);
		expect(actions.map((a) => a.id)).toContain('check_scene_safe');
		expect(actions.map((a) => a.id)).toContain('cpr_compress');
	});

	it('returns all actions in aed bag', () => {
		const actions = registry.byBag('aed');
		expect(actions).toHaveLength(1);
		expect(actions[0].id).toBe('apply_aed');
	});

	it('returns empty array for bag with no actions', () => {
		const actions = registry.byBag('vehicle');
		expect(actions).toHaveLength(0);
	});

	it('returns actions with correct metadata', () => {
		const actions = registry.byBag('jumpkit');
		expect(actions).toHaveLength(1);
		expect(actions[0].body_region).toBe('neck');
	});
});

describe('ActionRegistry - backward compatibility', () => {
	let registry: ActionRegistry;

	beforeEach(() => {
		registry = new ActionRegistry(testActions);
	});

	it('existing byId() tests still pass', () => {
		const action = registry.byId('check_scene_safe');
		expect(action).toBeDefined();
		expect(action.id).toBe('check_scene_safe');
	});

	it('existing byBag() tests still pass', () => {
		const actions = registry.byBag('hand');
		expect(actions.length).toBeGreaterThan(0);
		expect(actions[0].bag).toBe('hand');
	});

	it('tryById returns action when exists', () => {
		const action = registry.tryById('cpr_compress');
		expect(action).toBeDefined();
		expect(action?.id).toBe('cpr_compress');
	});

	it('tryById returns undefined when not found', () => {
		const action = registry.tryById('unknown_id');
		expect(action).toBeUndefined();
	});

	it('all() returns all actions', () => {
		const actions = registry.all();
		expect(actions).toHaveLength(4);
	});

	it('size() returns number of actions', () => {
		expect(registry.size()).toBe(4);
	});
});
