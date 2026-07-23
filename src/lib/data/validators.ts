import type {
	Action,
	ActionTiming,
	BagId,
	CatalogMetadata,
	LocalizedString,
	Scenario,
	Technique
} from '$lib/types/content';
import { BAG_IDS } from '$lib/types/content';
import { ActionRegistry } from './registry';
import { validateConditionExpression } from '$lib/engine/condition';

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
const ROLES = ['lead', 'assist', 'either'] as const;
const BODY_REGIONS = [
	'head',
	'neck',
	'chest',
	'wrist',
	'abdomen',
	'leg',
	'arm',
	'general'
] as const;
const VITAL_KEYS = ['consciousness', 'breath', 'pulse', 'skin', 'glucose', 'spO2', 'bp'] as const;
const CATALOG_DIFFICULTIES = ['beginner', 'intermediate', 'advanced'] as const;

function ensureEnum(
	value: unknown,
	values: readonly string[],
	field: string,
	code: string,
	errors: ValidationError[]
): void {
	if (!values.includes(value as string)) {
		pushError(
			errors,
			field,
			code,
			`${field}: 值「${String(value)}」不合法，合法值為 ${values.join(' / ')}`,
			value
		);
	}
}

function ensureSchemaVersion(value: unknown, field: string, errors: ValidationError[]): void {
	if (value !== 1)
		pushError(
			errors,
			field,
			'invalid_schema_version',
			`${field}: 目前只支援 schema_version: 1`,
			value
		);
}

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

const TIMING_FIELDS = new Set(['duration_seconds', 'interruptible']);

function validateTiming(
	value: unknown,
	field: string,
	errors: ValidationError[],
	inherited?: ActionTiming
): ActionTiming | undefined {
	if (value === undefined) return inherited;
	if (typeof value !== 'object' || value === null || Array.isArray(value)) {
		pushError(errors, field, 'invalid_timing', `${field}: 必須為物件`, value);
		return inherited;
	}

	const raw = value as Record<string, unknown>;
	for (const key of Object.keys(raw)) {
		if (!TIMING_FIELDS.has(key)) {
			pushError(
				errors,
				`${field}.${key}`,
				'unknown_timing_field',
				`${field}.${key}: timing 不支援此欄位`,
				raw[key]
			);
		}
	}

	const timing: ActionTiming = { ...inherited };
	if (raw.duration_seconds !== undefined) {
		if (
			typeof raw.duration_seconds !== 'number' ||
			!Number.isFinite(raw.duration_seconds) ||
			!Number.isInteger(raw.duration_seconds) ||
			raw.duration_seconds < 0 ||
			raw.duration_seconds > 600
		) {
			pushError(
				errors,
				`${field}.duration_seconds`,
				'invalid_action_duration',
				`${field}.duration_seconds: 必須為 0–600 的整數秒`,
				raw.duration_seconds
			);
		} else {
			timing.duration_seconds = raw.duration_seconds;
		}
	}
	if (raw.interruptible !== undefined) {
		if (typeof raw.interruptible !== 'boolean') {
			pushError(
				errors,
				`${field}.interruptible`,
				'invalid_interruptible',
				`${field}.interruptible: 必須為 boolean`,
				raw.interruptible
			);
		} else {
			timing.interruptible = raw.interruptible;
		}
	}

	if ((timing.duration_seconds ?? 0) > 0 && timing.interruptible === undefined) {
		pushError(
			errors,
			`${field}.interruptible`,
			'missing_interruptible',
			`${field}.interruptible: duration_seconds 大於 0 時必須明確設定`
		);
	}
	return timing;
}

function validateCatalogMetadata(
	value: unknown,
	field: string,
	errors: ValidationError[],
	warnings: ValidationWarning[]
): void {
	if (value === undefined) return;
	if (typeof value !== 'object' || value === null || Array.isArray(value)) {
		pushError(errors, field, 'invalid_catalog', `${field}: 必須為物件`, value);
		return;
	}

	const catalog = value as CatalogMetadata;
	if (catalog.summary !== undefined)
		ensureLocalized(catalog.summary, `${field}.summary`, errors, warnings);
	if (catalog.section !== undefined)
		ensureLocalized(catalog.section, `${field}.section`, errors, warnings);
	if (catalog.tags !== undefined) {
		if (!Array.isArray(catalog.tags)) {
			pushError(errors, `${field}.tags`, 'invalid_catalog_tags', `${field}.tags: 必須為陣列`);
		} else {
			catalog.tags.forEach((tag, index) =>
				ensureLocalized(tag, `${field}.tags[${index}]`, errors, warnings)
			);
		}
	}
	if (catalog.difficulty !== undefined) {
		ensureEnum(
			catalog.difficulty,
			CATALOG_DIFFICULTIES,
			`${field}.difficulty`,
			'invalid_catalog_difficulty',
			errors
		);
	}
	if (
		catalog.estimated_minutes !== undefined &&
		(!Number.isInteger(catalog.estimated_minutes) ||
			catalog.estimated_minutes < 1 ||
			catalog.estimated_minutes > 60)
	) {
		pushError(
			errors,
			`${field}.estimated_minutes`,
			'invalid_estimated_minutes',
			`${field}.estimated_minutes: 必須為 1 到 60 的整數`,
			catalog.estimated_minutes
		);
	}
	if (catalog.sort !== undefined && !Number.isFinite(catalog.sort)) {
		pushError(
			errors,
			`${field}.sort`,
			'invalid_catalog_sort',
			`${field}.sort: 必須為有限數字`,
			catalog.sort
		);
	}
	for (const key of ['featured', 'quick_play'] as const) {
		if (catalog[key] !== undefined && typeof catalog[key] !== 'boolean') {
			pushError(
				errors,
				`${field}.${key}`,
				'invalid_catalog_boolean',
				`${field}.${key}: 必須為 boolean`,
				catalog[key]
			);
		}
	}
	if (
		catalog.variant_group !== undefined &&
		(typeof catalog.variant_group !== 'string' || catalog.variant_group.trim().length === 0)
	) {
		pushError(
			errors,
			`${field}.variant_group`,
			'invalid_variant_group',
			`${field}.variant_group: 必須為非空字串`,
			catalog.variant_group
		);
	}
	if (catalog.quick_play === true && !catalog.variant_group?.trim()) {
		pushError(
			errors,
			`${field}.variant_group`,
			'missing_variant_group',
			`${field}.variant_group: quick_play 為 true 時必填`
		);
	}
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
		if (a.default_role !== undefined)
			ensureEnum(a.default_role, ROLES, `${path}.default_role`, 'invalid_role', errors);
		if (a.body_region !== undefined)
			ensureEnum(a.body_region, BODY_REGIONS, `${path}.body_region`, 'invalid_body_region', errors);
		if (a.reveals !== undefined) {
			if (!Array.isArray(a.reveals))
				pushError(
					errors,
					`${path}.reveals`,
					'invalid_type',
					`${path}.reveals: 必須為生命徵象欄位陣列`
				);
			else
				a.reveals.forEach((key, i) =>
					ensureEnum(key, VITAL_KEYS, `${path}.reveals[${i}]`, 'invalid_vital_key', errors)
				);
		}
		if (a.icon !== undefined && typeof a.icon !== 'string') {
			pushError(errors, `${path}.icon`, 'invalid_type', `${path}.icon: 必須為字串路徑`);
		}
		if (a.explain !== undefined) {
			ensureLocalized(a.explain, `${path}.explain`, errors, warnings);
		}
		validateTiming(a.timing, `${path}.timing`, errors);
	});

	return { ok: errors.length === 0, errors, warnings };
}

function validateRequiredEntries(
	requiredRaw: unknown,
	field: string,
	registry: ActionRegistry,
	errors: ValidationError[],
	_warnings: ValidationWarning[]
): void {
	if (!Array.isArray(requiredRaw)) {
		pushError(errors, field, 'invalid_type', `${field}: required 必須為陣列`);
		return;
	}
	const allActionIds = new Set(
		requiredRaw
			.filter(
				(e) =>
					typeof e === 'object' && e && typeof (e as { action_id?: unknown }).action_id === 'string'
			)
			.map((e) => (e as { action_id: string }).action_id)
	);
	const seenActionIds = new Set<string>();
	const afterByAction = new Map<string, string>();
	requiredRaw.forEach((entry, i) => {
		const subField = `${field}[${i}]`;

		if (typeof entry !== 'object' || !entry) {
			pushError(errors, subField, 'invalid_type', `${subField}: 必須為物件`);
			return;
		}

		const obj = entry as {
			action_id?: unknown;
			after?: unknown;
			by?: unknown;
			timing?: unknown;
		};
		if (typeof obj.action_id !== 'string' || obj.action_id.length === 0) {
			pushError(errors, subField, 'invalid_type', `${subField}: 必須含非空 action_id`);
			return;
		}
		if (seenActionIds.has(obj.action_id))
			pushError(
				errors,
				`${subField}.action_id`,
				'duplicate_required_action',
				`${subField}.action_id: required 動作「${obj.action_id}」重複`,
				obj.action_id
			);
		seenActionIds.add(obj.action_id);
		if (obj.by !== undefined)
			ensureEnum(obj.by, ['lead', 'assist'], `${subField}.by`, 'invalid_role', errors);

		// Verify action exists
		let action: Action | undefined;
		try {
			action = registry.byId(obj.action_id);
		} catch {
			pushError(
				errors,
				subField,
				'unknown_action',
				`${subField}: 找不到動作「${obj.action_id}」`,
				obj.action_id
			);
		}
		validateTiming(obj.timing, `${subField}.timing`, errors, action?.timing);

		// Verify after references an action in the same phase
		if (obj.after !== undefined) {
			if (typeof obj.after !== 'string' || obj.after.length === 0) {
				pushError(errors, `${subField}.after`, 'invalid_type', `${subField}.after: 必須為非空字串`);
			} else if (!allActionIds.has(obj.after)) {
				pushError(
					errors,
					`${subField}.after`,
					'unknown_after',
					`${subField}.after: 找不到同 phase 的動作「${obj.after}」`,
					obj.after
				);
			} else if (obj.after === obj.action_id) {
				pushError(
					errors,
					`${subField}.after`,
					'self_after',
					`${subField}.after: 不能指向自己`,
					obj.after
				);
			} else afterByAction.set(obj.action_id, obj.after);
		}
	});
	for (const start of afterByAction.keys()) {
		const visited = new Set<string>();
		let current: string | undefined = start;
		while (current) {
			if (visited.has(current)) {
				pushError(errors, field, 'after_cycle', `${field}: 動作前置條件形成循環`, start);
				break;
			}
			visited.add(current);
			current = afterByAction.get(current);
		}
	}
}

export function validateScenario(input: unknown, registry: ActionRegistry): ValidationResult {
	const errors: ValidationError[] = [];
	const warnings: ValidationWarning[] = [];

	if (typeof input !== 'object' || input === null) {
		pushError(errors, 'scenario', 'invalid_type', 'scenario: 必須為物件');
		return { ok: false, errors, warnings };
	}
	const s = input as Partial<Scenario>;

	ensureSchemaVersion(s.schema_version, 'scenario.schema_version', errors);
	ensureNonEmptyString(s.id, 'scenario.id', errors);
	ensureLocalized(s.title, 'scenario.title', errors, warnings);
	validateCatalogMetadata(s.catalog, 'scenario.catalog', errors, warnings);
	ensureEnum(s.player_role, ROLES, 'scenario.player_role', 'invalid_role', errors);
	if (s.patient_initial && typeof s.patient_initial === 'object') {
		for (const key of VITAL_KEYS) {
			const value = s.patient_initial[key];
			if (value !== undefined || key === 'consciousness' || key === 'breath' || key === 'pulse') {
				ensureLocalized(value, `scenario.patient_initial.${key}`, errors, warnings);
			}
		}
	} else pushError(errors, 'scenario.patient_initial', 'missing', 'scenario.patient_initial: 缺少');

	if (s.crew && typeof s.crew === 'object') {
		for (const role of ['lead', 'assist'] as const) {
			const member = s.crew[role];
			if (!member) {
				pushError(errors, `scenario.crew.${role}`, 'missing', `scenario.crew.${role}: 缺少`);
				continue;
			}
			ensureEnum(member.role, ROLES, `scenario.crew.${role}.role`, 'invalid_role', errors);
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

	if (!s.hidden && (!Array.isArray(s.phases) || s.phases.length === 0)) {
		pushError(errors, 'scenario.phases', 'empty_phases', 'scenario.phases: 必須至少一個 phase');
	} else if (Array.isArray(s.phases)) {
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
			validateRequiredEntries(p.required, `${path}.required`, registry, errors, warnings);
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

	const declaredFlags = collectDeclaredFlags(s.phases);

	if (!s.hidden && (!Array.isArray(s.outcomes) || s.outcomes.length === 0)) {
		pushError(
			errors,
			'scenario.outcomes',
			'empty_outcomes',
			'scenario.outcomes: 必須至少一個 outcome'
		);
	} else if (Array.isArray(s.outcomes)) {
		const outcomeIds = new Set<string>();
		let defaultCount = 0;
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
			} else {
				if (o.when.trim() === '預設') defaultCount += 1;
				else if (!validateConditionExpression(o.when))
					pushError(
						errors,
						`${path}.when`,
						'invalid_condition',
						`${path}.when: 條件語法無效`,
						o.when
					);
				for (const flag of extractFlagTokens(o.when)) {
					if (!declaredFlags.has(flag)) {
						pushError(
							errors,
							`${path}.when`,
							'undeclared_flag',
							`${path}.when: 旗標「${flag}」未被任何 phase.required[*].set_flag 設定`,
							flag
						);
					}
				}
			}
			ensureLocalized(o.title, `${path}.title`, errors, warnings);
			ensureLocalized(o.text, `${path}.text`, errors, warnings);
		});
		if (defaultCount === 0) {
			pushError(
				errors,
				'scenario.outcomes',
				'missing_default_outcome',
				'scenario.outcomes: 必須有一個 when="預設" 的兜底結局'
			);
		}
		if (defaultCount > 1)
			pushError(
				errors,
				'scenario.outcomes',
				'duplicate_default_outcome',
				'scenario.outcomes: 只能有一個 when="預設" 的兜底結局'
			);
		if (defaultCount === 1 && s.outcomes.at(-1)?.when.trim() !== '預設')
			pushError(
				errors,
				'scenario.outcomes',
				'default_outcome_not_last',
				'scenario.outcomes: when="預設" 的兜底結局必須放在最後'
			);
	}

	return { ok: errors.length === 0, errors, warnings };
}

const FLAG_RESERVED = new Set(['預設', '且', '或']);
const FLAG_METRIC_PREFIXES = ['正確率', '惡化等級'];

function isMetricOrReserved(token: string): boolean {
	if (FLAG_RESERVED.has(token)) return true;
	for (const prefix of FLAG_METRIC_PREFIXES) {
		if (token.startsWith(prefix)) return true;
	}
	return false;
}

export function extractFlagTokens(expr: string): string[] {
	const tokens: string[] = [];
	let i = 0;
	const input = expr;
	while (i < input.length) {
		const ch = input[i];
		if (ch === ' ' || ch === '\t' || ch === '(' || ch === ')' || ch === '(' || ch === ')') {
			i += 1;
			continue;
		}
		if (ch === '或' || ch === '且') {
			i += 1;
			continue;
		}
		let end = i;
		while (
			end < input.length &&
			input[end] !== ' ' &&
			input[end] !== '\t' &&
			input[end] !== '或' &&
			input[end] !== '且' &&
			input[end] !== '(' &&
			input[end] !== '(' &&
			input[end] !== ')' &&
			input[end] !== ')'
		) {
			end += 1;
		}
		const token = input.slice(i, end);
		if (token && !isMetricOrReserved(token)) {
			tokens.push(token);
		}
		i = end;
	}
	return tokens;
}

function collectDeclaredFlags(phases: Scenario['phases'] | undefined): Set<string> {
	const out = new Set<string>();
	if (!Array.isArray(phases)) return out;
	for (const p of phases) {
		if (!p || !Array.isArray(p.required)) continue;
		for (const req of p.required) {
			if (req && typeof req === 'object') {
				const flag = (req as { set_flag?: unknown }).set_flag;
				if (typeof flag === 'string' && flag.length > 0) out.add(flag);
			}
		}
	}
	return out;
}

export function validateTechnique(input: unknown, registry: ActionRegistry): ValidationResult {
	const errors: ValidationError[] = [];
	const warnings: ValidationWarning[] = [];

	if (typeof input !== 'object' || input === null) {
		pushError(errors, 'technique', 'invalid_type', 'technique: 必須為物件');
		return { ok: false, errors, warnings };
	}
	const t = input as Partial<Technique>;

	ensureSchemaVersion(t.schema_version, 'technique.schema_version', errors);
	ensureNonEmptyString(t.id, 'technique.id', errors);
	ensureLocalized(t.title, 'technique.title', errors, warnings);
	ensureLocalized(t.description, 'technique.description', errors, warnings);
	validateCatalogMetadata(t.catalog, 'technique.catalog', errors, warnings);
	if (t.body_region !== undefined)
		ensureEnum(t.body_region, BODY_REGIONS, 'technique.body_region', 'invalid_body_region', errors);

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
			// Check for action_id field
			const s = step as { action_id?: unknown };
			if (typeof s.action_id !== 'string' || s.action_id.length === 0) {
				pushError(errors, `${path}`, 'missing_action', `${path}: 必須含非空 action_id`);
				return;
			}

			// Verify action exists
			try {
				registry.byId(s.action_id);
			} catch {
				pushError(
					errors,
					`${path}`,
					'unknown_action',
					`${path}: 找不到動作「${s.action_id}」,請檢查 actions.yml`,
					s.action_id
				);
			}
			if (step.tip !== undefined) {
				ensureLocalized(step.tip, `${path}.tip`, errors, warnings);
			}
		});
	}

	return { ok: errors.length === 0, errors, warnings };
}
