#!/usr/bin/env tsx
/**
 * 禁止 .svelte 與 src/**\/*.ts(UI 層)裡出現 bare 中文字串。
 * 白名單:註解、JSON import、$_ / localize() 呼叫的 key 字串本身。
 * 違規時 exit code 1,CI 會擋下。
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const SCAN_DIRS = ['src/routes', 'src/lib/ui'];
const ALLOW_FILE_PREFIXES = ['src/lib/i18n/locales/', 'src/lib/types/'];

const CJK_RE = /[\u4e00-\u9fff\u3400-\u4dbf]/;

type Violation = { file: string; line: number; snippet: string };

function walk(dir: string, out: string[] = []): string[] {
	let entries: string[];
	try {
		entries = readdirSync(dir);
	} catch {
		return out;
	}
	for (const name of entries) {
		const full = join(dir, name);
		const st = statSync(full);
		if (st.isDirectory()) walk(full, out);
		else if (/\.(svelte|ts|js)$/.test(name)) out.push(full);
	}
	return out;
}

function scan(file: string): Violation[] {
	const rel = relative(ROOT, file);
	if (ALLOW_FILE_PREFIXES.some((p) => rel.startsWith(p))) return [];
	const text = readFileSync(file, 'utf8');
	const lines = text.split('\n');
	const violations: Violation[] = [];

	let inBlockComment = false;
	for (let i = 0; i < lines.length; i++) {
		let line = lines[i];

		if (inBlockComment) {
			const end = line.indexOf('*/');
			if (end >= 0) {
				line = line.slice(end + 2);
				inBlockComment = false;
			} else {
				continue;
			}
		}
		const blockStart = line.indexOf('/*');
		if (blockStart >= 0) {
			const blockEnd = line.indexOf('*/', blockStart + 2);
			if (blockEnd >= 0) {
				line = line.slice(0, blockStart) + line.slice(blockEnd + 2);
			} else {
				line = line.slice(0, blockStart);
				inBlockComment = true;
			}
		}
		const lineCommentIdx = line.indexOf('//');
		if (lineCommentIdx >= 0) line = line.slice(0, lineCommentIdx);
		const htmlCommentIdx = line.indexOf('<!--');
		if (htmlCommentIdx >= 0) line = line.slice(0, htmlCommentIdx);

		if (!CJK_RE.test(line)) continue;
		violations.push({ file: rel, line: i + 1, snippet: lines[i].trim() });
	}
	return violations;
}

const files: string[] = [];
for (const d of SCAN_DIRS) walk(join(ROOT, d), files);

const all: Violation[] = [];
for (const f of files) all.push(...scan(f));

if (all.length === 0) {
	console.log(`i18n-lint: ${files.length} files scanned, no bare CJK strings found.`);
	process.exit(0);
}

console.error(`i18n-lint: found ${all.length} bare CJK string(s):\n`);
for (const v of all) {
	console.error(`  ${v.file}:${v.line}  ${v.snippet}`);
}
console.error("\n→ UI 字串請走 $_('key'),教材內容請走 localize(value, $locale)。");
process.exit(1);
