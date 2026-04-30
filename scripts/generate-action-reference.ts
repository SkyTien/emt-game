#!/usr/bin/env tsx
/**
 * 從 data/actions/actions.yml 自動生成 docs/ACTIONS.md
 * 列出所有 action ID、標籤、器材袋、身體部位、預設角色、解釋
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { parse as parseYaml } from 'yaml';
import type { Action } from '../src/lib/types/content';

const DATA_DIR = new URL('../data/', import.meta.url).pathname;
const DOCS_DIR = new URL('../docs/', import.meta.url).pathname;

function loadYaml<T>(file: string): T {
	const text = readFileSync(file, 'utf8');
	return parseYaml(text) as T;
}

function localizeString(value: unknown): string {
	if (!value) return '—';
	if (typeof value === 'string') return value;
	if (typeof value === 'object' && value !== null) {
		const map = value as Record<string, unknown>;
		return (map['zh-Hant'] as string) || (map['en'] as string) || '—';
	}
	return '—';
}

interface ParsedActionData {
	actions?: unknown;
}

// 讀取所有 actions
const actionFile = `${DATA_DIR}actions/actions.yml`;
const parsed = loadYaml<ParsedActionData>(actionFile);
const actions = Array.isArray(parsed) ? parsed : (parsed?.actions ?? []);

if (!Array.isArray(actions)) {
	console.error('❌ actions.yml 根層不是 actions 陣列');
	process.exit(1);
}

// 排序：按 bag 分組，再按 id 排序
const bags = ['hand', 'o2kit', 'jumpkit', 'aed', 'vehicle'];
const byBag = new Map<string, Action[]>();
for (const bag of bags) {
	byBag.set(bag, []);
}
byBag.set('general', []);

for (const action of actions) {
	if (!action || typeof action !== 'object') continue;
	const a = action as Partial<Action>;
	const bag = (a.bag as string) || 'general';
	if (!byBag.has(bag)) {
		byBag.set(bag, []);
	}
	byBag.get(bag)!.push(a as Action);
}

// 排序每個 bag 內的 actions
for (const list of byBag.values()) {
	list.sort((a, b) => (a.id || '').localeCompare(b.id || ''));
}

// 生成 Markdown
const lines: string[] = [
	'# Action 參考表',
	'',
	'本表自動從 `data/actions/actions.yml` 生成，列出所有可用的 action ID 及其對應的中文標籤。',
	'',
	'**使用方式**：在 scenario 或 technique YAML 中，使用 `action_id` 欄位引用下表的 `ID` 欄。',
	''
];

const bagNames: Record<string, string> = {
	hand: '手邊物品',
	o2kit: '氧氣套組',
	jumpkit: '進階套組',
	aed: 'AED',
	vehicle: '車輛',
	general: '通用'
};

for (const bag of bags) {
	const list = byBag.get(bag) || [];
	if (list.length === 0) continue;

	const title = bagNames[bag] || bag;
	lines.push(`## ${title} (\`${bag}\`)`);
	lines.push('');
	lines.push('| ID | 標籤 (zh-Hant) | 身體部位 | 預設角色 | 說明 |');
	lines.push('|---|---|---|---|---|');

	for (const action of list) {
		const id = action.id || '';
		const label = localizeString(action.label);
		const region = action.body_region || '—';
		const role = action.default_role || '—';
		const explain = localizeString(action.explain);

		// Markdown 表格：轉義特殊字元
		const escaped = (s: string) => s.replace(/\|/g, '\\|').replace(/\n/g, ' ').slice(0, 100);
		lines.push(
			`| \`${escaped(id)}\` | ${escaped(label)} | ${escaped(region)} | ${escaped(role)} | ${escaped(explain)} |`
		);
	}

	lines.push('');
}

const markdown = lines.join('\n');

// 寫檔
const outFile = `${DOCS_DIR}ACTIONS.md`;
writeFileSync(outFile, markdown, 'utf8');

console.log(`✓ 生成 ${outFile} (${actions.length} 個 actions)`);
