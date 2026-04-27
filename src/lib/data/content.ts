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

const scenarioFiles = import.meta.glob('../../../data/scenarios/*.yml', {
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
	const list: Scenario[] = [];
	for (const text of Object.values(scenarioFiles)) {
		const parsed = parseYaml(text) as Scenario;
		if (parsed?.hidden) continue;
		list.push(parsed);
	}
	scenariosCache = list;
	return list;
}

export function getScenarioById(id: string): Scenario | null {
	return loadScenarios().find((s) => s.id === id) ?? null;
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
