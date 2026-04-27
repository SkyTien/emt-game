import type { Action, BagId, LocalizedString, Scenario, Technique } from '$lib/types/content';
import { BAG_IDS } from '$lib/types/content';
import { ActionRegistry } from './registry';

export type ValidationError = {
	field: string;
	code: string;
	message: string;
	value?: unknown;
};

export type ValidationWarning = {
	field: string;
	code: string;
	message: string;
};

export type ValidationResult = {
	ok: boolean;
	errors: ValidationError[];
	warnings: ValidationWarning[];
};

const FALLBACK_LOCALE = 'zh-Hant';

function pushError(
	out: ValidationError[],
	field: string,
	code: string,
	message: string,
	value?: unknown
): void {
	out.push({ field, code, message, value });
}

function ensureLocalized(
	value: unknown,
	field: string,
	errors: ValidationError[],
	warnings: ValidationWarning[]
): LocalizedString | undefined {
	if (value === undefined || value === null) {
		pushError(errors, field, 'missing', `${field}: 缺少必填欄位`);
		return undefined;
	}
	if (typeof value === 'string') {
		warnings.push({
			field,
			code: 'string_to_locale_map',
			message: `${field}: 純字串將自動轉為 { ${FALLBACK_LOCALE}: ... };請手動改為 locale map(deprecated)`
		});
		return { [FALLBACK_LOCALE]: value };
	}
	if (typeof value !== 'object' || Array.isArray(value)) {
		pushError(errors, field, 'invalid_type', `${field}: 必須為 locale map 物件或字串`, value);
		return undefined;
	}
	const obj = value as Record<string, unknown>;
	const zh = obj[FALLBACK_LOCALE];
	if (typeof zh !== 'string' || zh.length === 0) {
		pushError(
			errors,
			field,
			'locale_map_missing_zh_hant',
			`${field}: 可翻譯欄位必須含非空 ${FALLBACK_LOCALE} 鍵`
		);
		return undefined;
	}
	for (const [k, v] of Object.entries(obj)) {
		if (typeof v !== 'string') {
			pushError(errors, `${field}.${k}`, 'invalid_locale_value', `${field}.${k}: 值必須為字串`);
		}
	}
	return obj as LocalizedString;
}

function ensureNonEmptyString(
	value: unknown,
	field: string,
	errors: ValidationError[]
): string | undefined {
	if (typeof value !== 'string' || value.length === 0) {
		pushError(errors, field, 'empty_id', `${field}: 必須為非空字串`);
		return undefined;
	}
	return value;
}

function ensureBag(value: unknown, field: string, errors: ValidationError[]): BagId | undefined {
	if (!BAG_IDS.includes(value as BagId)) {
		pushError(
			errors,
			field,
			'invalid_bag',
			`${field}: 袋子值「${String(value)}」不合法,合法值為 ${BAG_IDS.join(' / ')}`,
			value
		);
		return undefined;
	}
	return value as BagId;
}

export function validateActions(input: unknown): ValidationResult {
	const errors: ValidationError[] = [];
	const warnings: ValidationWarning[] = [];

	if (!Array.isArray(input)) {
		pushError(errors, 'actions', 'invalid_type', 'actions: 必須為陣列');
		return { ok: false, errors, warnings };
	}

	const seenIds = new Set<string>();
	const seenLabels = new Set<string>();

	input.forEach((rawAction, idx) => {
		const path = `actions[${idx}]`;
		if (typeof rawAction !== 'object' || rawAction === null) {
			pushError(errors, path, 'invalid_type', `${path}: 必須為物件`);
			return;
		}
		const a = rawAction as Partial<Action>;
		const id = ensureNonEmptyString(a.id, `${path}.id`, errors);
		if (id) {
			if (seenIds.has(id)) {
				pushError(errors, `${path}.id`, 'duplicate_id', `${path}.id: id「${id}」重複`, id);
			}
			seenIds.add(id);
		}
		const label = ensureLocalized(a.label, `${path}.label`, errors, warnings);
		if (label) {
			const zh = label[FALLBACK_LOCALE];
			if (seenLabels.has(zh)) {
				pushError(
					errors,
					`${path}.label`,
					'duplicate_label',
					`${path}.label: label「${zh}」重複`,
					zh
				);
			}
			seenLabels.add(zh);
		}
		ensureBag(a.bag, `${path}.bag`, errors);
		if (a.icon !== undefined && typeof a.icon !== 'string') {
			pushError(errors, `${path}.icon`, 'invalid_type', `${path}.icon: 必須為字串路徑`);
		}
		if (a.explain !== undefined) {
			ensureLocalized(a.explain, `${path}.explain`, errors, warnings);
		}
	});

	return { ok: errors.length === 0, errors, warnings };
}

function validateRequiredEntries(
	requiredRaw: unknown,
	field: string,
	registry: ActionRegistry,
	errors: ValidationError[]
): void {
	if (!Array.isArray(requiredRaw)) {
		pushError(errors, field, 'invalid_type', `${field}: required 必須為陣列`);
		return;
	}
	requiredRaw.forEach((entry, i) => {
		const subField = `${field}[${i}]`;
		let label: string | undefined;
		if (typeof entry === 'string') label = entry;
		else if (entry && typeof entry === 'object') {
			const obj = entry as { action?: unknown };
			if (typeof obj.action === 'string') label = obj.action;
		}
		if (!label) {
			pushError(
				errors,
				subField,
				'invalid_type',
				`${subField}: 必須為動作中文 label 或 { action }`
			);
			return;
		}
		if (!registry.tryResolve(label)) {
			pushError(
				errors,
				subField,
				'unknown_action',
				`${subField}: 找不到動作「${label}」,請檢查 actions.yml`,
				label
			);
		}
	});
}

export function validateScenario(input: unknown, registry: ActionRegistry): ValidationResult {
	const errors: ValidationError[] = [];
	const warnings: ValidationWarning[] = [];

	if (typeof input !== 'object' || input === null) {
		pushError(errors, 'scenario', 'invalid_type', 'scenario: 必須為物件');
		return { ok: false, errors, warnings };
	}
	const s = input as Partial<Scenario>;

	ensureNonEmptyString(s.id, 'scenario.id', errors);
	ensureLocalized(s.title, 'scenario.title', errors, warnings);

	if (s.crew && typeof s.crew === 'object') {
		for (const role of ['lead', 'assist'] as const) {
			const member = s.crew[role];
			if (!member) {
				pushError(errors, `scenario.crew.${role}`, 'missing', `scenario.crew.${role}: 缺少`);
				continue;
			}
			if (Array.isArray(member.carries)) {
				member.carries.forEach((bag, idx) => {
					ensureBag(bag, `scenario.crew.${role}.carries[${idx}]`, errors);
				});
			} else {
				pushError(
					errors,
					`scenario.crew.${role}.carries`,
					'invalid_type',
					`scenario.crew.${role}.carries: 必須為袋子陣列`
				);
			}
		}
	} else {
		pushError(errors, 'scenario.crew', 'missing', 'scenario.crew: 缺少 lead/assist');
	}

	if (!Array.isArray(s.phases) || s.phases.length === 0) {
		pushError(errors, 'scenario.phases', 'empty_phases', 'scenario.phases: 必須至少一個 phase');
	} else {
		const phaseIds = new Set<string>();
		s.phases.forEach((p, i) => {
			const path = `scenario.phases[${i}]`;
			const id = ensureNonEmptyString(p.id, `${path}.id`, errors);
			if (id) {
				if (phaseIds.has(id)) {
					pushError(errors, `${path}.id`, 'duplicate_id', `${path}.id: id「${id}」重複`, id);
				}
				phaseIds.add(id);
			}
			ensureLocalized(p.narrative, `${path}.narrative`, errors, warnings);
			validateRequiredEntries(p.required, `${path}.required`, registry, errors);
			if (p.timeout !== undefined) {
				if (typeof p.timeout !== 'number' || p.timeout < 5) {
					pushError(
						errors,
						`${path}.timeout`,
						'timeout_too_short',
						`${path}.timeout: 逾時秒數過短(目前 ${String(p.timeout)},最小 5)`,
						p.timeout
					);
				}
			}
			if (p.on_skip !== undefined) {
				const note = p.on_skip?.note;
				const noteLoc = ensureLocalized(note, `${path}.on_skip.note`, errors, warnings);
				if (!noteLoc || !noteLoc[FALLBACK_LOCALE]) {
					pushError(
						errors,
						`${path}.on_skip.note`,
						'missing_skip_note',
						`${path}.on_skip.note: on_skip 必須填寫 note(說明惡化原因)`
					);
				}
			}
		});
	}

	if (!Array.isArray(s.outcomes) || s.outcomes.length === 0) {
		pushError(
			errors,
			'scenario.outcomes',
			'empty_outcomes',
			'scenario.outcomes: 必須至少一個 outcome'
		);
	} else {
		const outcomeIds = new Set<string>();
		let hasDefault = false;
		s.outcomes.forEach((o, i) => {
			const path = `scenario.outcomes[${i}]`;
			const id = ensureNonEmptyString(o.id, `${path}.id`, errors);
			if (id) {
				if (outcomeIds.has(id)) {
					pushError(errors, `${path}.id`, 'duplicate_id', `${path}.id: id「${id}」重複`, id);
				}
				outcomeIds.add(id);
			}
			if (typeof o.when !== 'string' || o.when.length === 0) {
				pushError(errors, `${path}.when`, 'empty_when', `${path}.when: 必須為非空字串`);
			} else if (o.when.trim() === '預設') {
				hasDefault = true;
			}
			ensureLocalized(o.title, `${path}.title`, errors, warnings);
			ensureLocalized(o.text, `${path}.text`, errors, warnings);
		});
		if (!hasDefault) {
			pushError(
				errors,
				'scenario.outcomes',
				'missing_default_outcome',
				'scenario.outcomes: 必須有一個 when="預設" 的兜底結局'
			);
		}
	}

	return { ok: errors.length === 0, errors, warnings };
}

export function validateTechnique(input: unknown, registry: ActionRegistry): ValidationResult {
	const errors: ValidationError[] = [];
	const warnings: ValidationWarning[] = [];

	if (typeof input !== 'object' || input === null) {
		pushError(errors, 'technique', 'invalid_type', 'technique: 必須為物件');
		return { ok: false, errors, warnings };
	}
	const t = input as Partial<Technique>;

	ensureNonEmptyString(t.id, 'technique.id', errors);
	ensureLocalized(t.title, 'technique.title', errors, warnings);
	ensureLocalized(t.description, 'technique.description', errors, warnings);

	if (!Array.isArray(t.steps) || t.steps.length === 0) {
		pushError(errors, 'technique.steps', 'empty_steps', 'technique.steps: 不可為空陣列');
	} else {
		const stepIds = new Set<string>();
		t.steps.forEach((step, i) => {
			const path = `technique.steps[${i}]`;
			const id = ensureNonEmptyString(step.id, `${path}.id`, errors);
			if (id) {
				if (stepIds.has(id)) {
					pushError(errors, `${path}.id`, 'duplicate_id', `${path}.id: id「${id}」重複`, id);
				}
				stepIds.add(id);
			}
			if (typeof step.action !== 'string' || step.action.length === 0) {
				pushError(errors, `${path}.action`, 'empty', `${path}.action: 必須為非空動作 label`);
			} else if (!registry.tryResolve(step.action)) {
				pushError(
					errors,
					`${path}.action`,
					'unknown_action',
					`${path}.action: 找不到動作「${step.action}」,請檢查 actions.yml`,
					step.action
				);
			}
			if (step.tip !== undefined) {
				ensureLocalized(step.tip, `${path}.tip`, errors, warnings);
			}
		});
	}

	return { ok: errors.length === 0, errors, warnings };
}
