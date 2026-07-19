#!/usr/bin/env tsx
/**
 * 掃描 data/**\/*.yml,跑驗證,失敗時 exit code 1。
 */
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { parse as parseYaml } from 'yaml';
import { ActionRegistry } from '../src/lib/data/registry';
import {
	validateActions,
	validateScenario,
	validateTechnique,
	type ValidationResult
} from '../src/lib/data/validators';
import type { Action, Scenario } from '../src/lib/types/content';

const DATA_DIR = new URL('../data/', import.meta.url).pathname;
const STATIC_DIR = new URL('../static/', import.meta.url).pathname;

type FoundFile = { path: string; rel: string };

function findYamlFiles(dir: string, base: string, out: FoundFile[] = []): FoundFile[] {
	let entries: string[];
	try {
		entries = readdirSync(dir);
	} catch {
		return out;
	}
	for (const name of entries) {
		if (name.startsWith('.')) continue;
		const full = join(dir, name);
		const st = statSync(full);
		if (st.isDirectory()) findYamlFiles(full, base, out);
		else if (/\.ya?ml$/.test(name)) out.push({ path: full, rel: full.slice(base.length) });
	}
	return out;
}

function loadYaml<T>(file: string): T {
	const text = readFileSync(file, 'utf8');
	return parseYaml(text) as T;
}

function reportResult(label: string, result: ValidationResult): boolean {
	if (result.warnings.length > 0) {
		for (const w of result.warnings) {
			console.warn(`  warn  ${label}  ${w.field}  ${w.message}`);
		}
	}
	if (!result.ok) {
		for (const e of result.errors) {
			console.error(`  fail  ${label}  ${e.field}  ${e.message}`);
		}
		return false;
	}
	console.log(`  ok    ${label}`);
	return true;
}

const found = findYamlFiles(DATA_DIR, DATA_DIR);
if (found.length === 0) {
	console.warn('validate-content: no data/*.yml files found, nothing to validate.');
	process.exit(0);
}

const actionFiles = found.filter((f) => f.rel.startsWith('actions'));
const scenarioFiles = found.filter((f) => f.rel.startsWith('scenarios'));
const techniqueFiles = found.filter((f) => f.rel.startsWith('techniques'));

let allOk = true;

const allActions: Action[] = [];
console.log('# Actions');
for (const f of actionFiles) {
	const parsed = loadYaml<{ actions?: unknown }>(f.path);
	const actions = Array.isArray(parsed) ? parsed : (parsed?.actions ?? []);
	const result = validateActions(actions);
	if (!reportResult(f.rel, result)) allOk = false;
	if (Array.isArray(actions)) {
		for (const a of actions) {
			if (a && typeof a === 'object') allActions.push(a as Action);
		}
	}
}

let registry: ActionRegistry | null = null;
try {
	registry = new ActionRegistry(allActions);
} catch (err) {
	console.error('  fail  registry build  ', (err as Error).message);
	allOk = false;
}

// 建立情境 id → raw 的 map，供繼承展開使用
const scenarioRawMap = new Map<string, Scenario>();
for (const f of scenarioFiles) {
	const parsed = loadYaml<Scenario>(f.path);
	if (parsed?.id) scenarioRawMap.set(parsed.id, parsed);
}

function resolveScenarioForValidation(
	raw: Scenario,
	map: Map<string, Scenario>,
	chain = new Set<string>()
): Scenario {
	if (!raw.extends) return raw;
	if (chain.has(raw.id)) throw new Error(`inheritance cycle: ${[...chain, raw.id].join(' -> ')}`);
	const parent = map.get(raw.extends);
	if (!parent) throw new Error(`missing parent scenario: ${raw.extends}`);
	const nextChain = new Set(chain).add(raw.id);
	const resolvedParent = resolveScenarioForValidation(parent, map, nextChain);
	return {
		...resolvedParent,
		...raw,
		catalog: { ...resolvedParent.catalog, ...raw.catalog },
		phases: [...resolvedParent.phases, ...(raw.phases ?? [])],
		extends: undefined
	};
}

function validateLocalAsset(label: string, field: string, value: unknown): boolean {
	if (typeof value !== 'string' || value.length === 0 || /^https?:\/\//.test(value)) return true;
	const relative = value.replace(/^\//, '');
	const full = resolve(STATIC_DIR, relative);
	if (!full.startsWith(resolve(STATIC_DIR) + '/') || !existsSync(full)) {
		console.error(`  fail  ${label}  ${field}  local asset not found: ${value}`);
		return false;
	}
	return true;
}

console.log('\n# Scenarios');
for (const f of scenarioFiles) {
	const raw = loadYaml<Scenario>(f.path);
	if (!registry) {
		console.error(`  skip  ${f.rel}  (registry not built)`);
		allOk = false;
		continue;
	}
	let resolved: Scenario;
	try {
		resolved = resolveScenarioForValidation(raw, scenarioRawMap);
	} catch (error) {
		console.error(`  fail  ${f.rel}  scenario.extends  ${(error as Error).message}`);
		allOk = false;
		continue;
	}
	const result = validateScenario(resolved, registry);
	if (!reportResult(f.rel, result)) allOk = false;
	if (!validateLocalAsset(f.rel, 'scenario.illustration', resolved.illustration)) allOk = false;
	(resolved.phases ?? []).forEach((phase, i) => {
		if (!validateLocalAsset(f.rel, `scenario.phases[${i}].illustration`, phase.illustration))
			allOk = false;
	});
	(resolved.outcomes ?? []).forEach((outcome, i) => {
		if (!validateLocalAsset(f.rel, `scenario.outcomes[${i}].illustration`, outcome.illustration))
			allOk = false;
	});
}

console.log('\n# Techniques');
for (const f of techniqueFiles) {
	const parsed = loadYaml<unknown>(f.path);
	if (!registry) {
		console.error(`  skip  ${f.rel}  (registry not built)`);
		allOk = false;
		continue;
	}
	const result = validateTechnique(parsed, registry);
	if (!reportResult(f.rel, result)) allOk = false;
	if (
		parsed &&
		typeof parsed === 'object' &&
		!validateLocalAsset(
			f.rel,
			'technique.illustration',
			(parsed as { illustration?: unknown }).illustration
		)
	)
		allOk = false;
}

if (allOk) {
	console.log(`\n✓ All ${found.length} file(s) validated successfully.`);
	process.exit(0);
}
console.error('\n✗ Validation failed.');
process.exit(1);
