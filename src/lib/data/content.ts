import { parse as parseYaml } from 'yaml';
import type { Action, ActionPhase, Scenario, Technique } from '$lib/types/content';
import { ActionRegistry } from './registry';

const actionFiles = import.meta.glob('../../../data/actions/actions.yml', {
	query: '?raw',
	import: 'default',
	eager: true
}) as Record<string, string>;

const categoryFile = import.meta.glob('../../../data/actions/categories.yml', {
	query: '?raw',
	import: 'default',
	eager: true
}) as Record<string, string>;

const scenarioFiles = import.meta.glob('../../../data/scenarios/**/*.yml', {
	query: '?raw',
	import: 'default',
	eager: true
}) as Record<string, string>;

const techniqueFiles = import.meta.glob('../../../data/techniques/*.yml', {
	query: '?raw',
	import: 'default',
	eager: true
}) as Record<string, string>;

let registryCache: ActionRegistry | null = null;
let phasesCache: ActionPhase[] | null = null;
let scenariosCache: Scenario[] | null = null;
let allScenariosCache: Scenario[] | null = null;
let techniquesCache: Technique[] | null = null;

export function loadActions(): Action[] {
	const all: Action[] = [];
	for (const text of Object.values(actionFiles)) {
		const parsed = parseYaml(text);
		const list = Array.isArray(parsed) ? parsed : (parsed?.actions ?? []);
		for (const a of list) all.push(a as Action);
	}
	return all;
}

export function getRegistry(): ActionRegistry {
	if (!registryCache) registryCache = new ActionRegistry(loadActions());
	return registryCache;
}

export function loadPhases(): ActionPhase[] {
	if (phasesCache) return phasesCache;
	const text = Object.values(categoryFile)[0];
	if (!text) return [];
	const parsed = parseYaml(text);
	phasesCache = (parsed?.phases ?? []) as ActionPhase[];
	return phasesCache;
}

export function loadScenarios(): Scenario[] {
	if (scenariosCache) return scenariosCache;
	scenariosCache = loadAllScenarios().filter((scenario) => !scenario.hidden);
	return scenariosCache;
}

/** Loads every resolved scenario, including hidden quick-play variants. */
export function loadAllScenarios(): Scenario[] {
	if (allScenariosCache) return allScenariosCache;

	// 第一輪：解析所有 YAML，建立 id → raw 的 map
	const rawMap = new Map<string, Scenario>();
	for (const text of Object.values(scenarioFiles)) {
		const parsed = parseYaml(text) as Scenario;
		if (parsed?.id) rawMap.set(parsed.id, parsed);
	}

	// 第二輪：展開繼承，組裝最終情境
	const list: Scenario[] = [];
	for (const raw of rawMap.values()) {
		const resolved = resolveScenario(raw, rawMap);
		list.push(resolved);
	}

	allScenariosCache = list;
	return allScenariosCache;
}

export function resolveScenario(raw: Scenario, map: Map<string, Scenario>): Scenario {
	if (!raw.extends) return raw;

	const parent = map.get(raw.extends);
	if (!parent) return raw;

	const resolvedParent = resolveScenario(parent, map);
	return {
		...resolvedParent,
		...raw,
		catalog: { ...resolvedParent.catalog, ...raw.catalog },
		phases: [...resolvedParent.phases, ...(raw.phases ?? [])],
		extends: undefined
	};
}

/** Quick-play scenarios are explicit, resolved content rather than route-level ID lists. */
export function loadQuickPlayScenarios(): Scenario[] {
	return loadAllScenarios().filter(
		(scenario) => scenario.catalog?.quick_play === true && Boolean(scenario.catalog.variant_group)
	);
}

export function getScenarioById(id: string): Scenario | null {
	const rawMap = new Map<string, Scenario>();
	for (const text of Object.values(scenarioFiles)) {
		const parsed = parseYaml(text) as Scenario;
		if (parsed?.id) rawMap.set(parsed.id, parsed);
	}
	const raw = rawMap.get(id);
	if (!raw) return null;
	return resolveScenario(raw, rawMap);
}

export function loadTechniques(): Technique[] {
	if (techniquesCache) return techniquesCache;
	const list: Technique[] = [];
	for (const text of Object.values(techniqueFiles)) {
		const parsed = parseYaml(text) as Technique;
		if (parsed?.hidden) continue;
		list.push(parsed);
	}
	techniquesCache = list;
	return list;
}

export function getTechniqueById(id: string): Technique | null {
	return loadTechniques().find((t) => t.id === id) ?? null;
}
