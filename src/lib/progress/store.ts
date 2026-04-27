export type ProgressRole = 'lead' | 'assist';

export type ScenarioRoleProgress = { bestStars: number; runs: number };

export type ScenarioProgress = {
	playedAs: Partial<Record<ProgressRole, ScenarioRoleProgress>>;
};

export type TechniqueProgress = { bestStars: number; runs: number };

export type Progress = {
	scenarios: Record<string, ScenarioProgress>;
	techniques: Record<string, TechniqueProgress>;
};

export const STORAGE_KEY = 'emt1game:progress';

const EMPTY: Progress = { scenarios: {}, techniques: {} };

export type Storage = Pick<globalThis.Storage, 'getItem' | 'setItem' | 'removeItem'>;

function getStorage(): Storage | null {
	if (typeof globalThis === 'undefined') return null;
	const ls = (globalThis as { localStorage?: Storage }).localStorage;
	return ls ?? null;
}

function migrate(raw: unknown): Progress {
	if (!raw || typeof raw !== 'object') return structuredClone(EMPTY);
	const r = raw as Record<string, unknown>;
	const scenarios: Record<string, ScenarioProgress> = {};
	const inputScenarios = (r.scenarios ?? {}) as Record<string, unknown>;
	for (const [id, val] of Object.entries(inputScenarios)) {
		if (!val || typeof val !== 'object') continue;
		const v = val as Record<string, unknown>;
		if (v.playedAs && typeof v.playedAs === 'object') {
			scenarios[id] = { playedAs: v.playedAs as ScenarioProgress['playedAs'] };
		} else if (typeof v.bestStars === 'number') {
			scenarios[id] = {
				playedAs: {
					lead: {
						bestStars: v.bestStars as number,
						runs: typeof v.runs === 'number' ? (v.runs as number) : 1
					}
				}
			};
		}
	}
	const techniques: Record<string, TechniqueProgress> = {};
	const inputTech = (r.techniques ?? {}) as Record<string, unknown>;
	for (const [id, val] of Object.entries(inputTech)) {
		if (!val || typeof val !== 'object') continue;
		const v = val as Record<string, unknown>;
		const bestStars = typeof v.bestStars === 'number' ? (v.bestStars as number) : 0;
		const runs = typeof v.runs === 'number' ? (v.runs as number) : 0;
		techniques[id] = { bestStars, runs };
	}
	return { scenarios, techniques };
}

export function load(storage: Storage | null = getStorage()): Progress {
	if (!storage) return structuredClone(EMPTY);
	try {
		const raw = storage.getItem(STORAGE_KEY);
		if (!raw) return structuredClone(EMPTY);
		return migrate(JSON.parse(raw));
	} catch {
		return structuredClone(EMPTY);
	}
}

function persist(progress: Progress, storage: Storage | null = getStorage()): void {
	if (!storage) return;
	storage.setItem(STORAGE_KEY, JSON.stringify(progress));
}

export function saveScenarioRun(
	scenarioId: string,
	role: ProgressRole,
	stars: number,
	storage: Storage | null = getStorage()
): Progress {
	const current = load(storage);
	const existing = current.scenarios[scenarioId] ?? { playedAs: {} };
	const prevRole = existing.playedAs[role] ?? { bestStars: 0, runs: 0 };
	existing.playedAs[role] = {
		bestStars: Math.max(prevRole.bestStars, stars),
		runs: prevRole.runs + 1
	};
	current.scenarios[scenarioId] = existing;
	persist(current, storage);
	return current;
}

export function saveTechniqueRun(
	techniqueId: string,
	stars: number,
	storage: Storage | null = getStorage()
): Progress {
	const current = load(storage);
	const prev = current.techniques[techniqueId] ?? { bestStars: 0, runs: 0 };
	current.techniques[techniqueId] = {
		bestStars: Math.max(prev.bestStars, stars),
		runs: prev.runs + 1
	};
	persist(current, storage);
	return current;
}

export function clear(storage: Storage | null = getStorage()): void {
	if (!storage) return;
	storage.removeItem(STORAGE_KEY);
}

export function bestStarsForScenario(
	progress: Progress,
	scenarioId: string,
	role: ProgressRole
): number {
	return progress.scenarios[scenarioId]?.playedAs[role]?.bestStars ?? 0;
}

export function bestStarsForTechnique(progress: Progress, techniqueId: string): number {
	return progress.techniques[techniqueId]?.bestStars ?? 0;
}
