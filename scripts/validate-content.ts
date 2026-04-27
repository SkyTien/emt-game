#!/usr/bin/env tsx
/**
 * 掃描 data/**\/*.yml,跑驗證,失敗時 exit code 1。
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { parse as parseYaml } from 'yaml';
import { ActionRegistry } from '../src/lib/data/registry';
import {
	validateActions,
	validateScenario,
	validateTechnique,
	type ValidationResult
} from '../src/lib/data/validators';
import type { Action } from '../src/lib/types/content';

const DATA_DIR = new URL('../data/', import.meta.url).pathname;

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

console.log('\n# Scenarios');
for (const f of scenarioFiles) {
	const parsed = loadYaml<unknown>(f.path);
	if (!registry) {
		console.error(`  skip  ${f.rel}  (registry not built)`);
		allOk = false;
		continue;
	}
	const result = validateScenario(parsed, registry);
	if (!reportResult(f.rel, result)) allOk = false;
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
}

if (allOk) {
	console.log(`\n✓ All ${found.length} file(s) validated successfully.`);
	process.exit(0);
}
console.error('\n✗ Validation failed.');
process.exit(1);
