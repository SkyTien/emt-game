import type {
	CatalogDifficulty,
	CatalogMetadata,
	LocalizedString,
	Scenario,
	Technique
} from '$lib/types/content';

export type CatalogContent = Scenario | Technique;

export const DEFAULT_CATALOG_DIFFICULTY: CatalogDifficulty = 'intermediate';

export function catalogSort(item: CatalogContent): number {
	return item.catalog?.sort ?? 1000;
}

export function catalogDifficulty(item: CatalogContent): CatalogDifficulty {
	return item.catalog?.difficulty ?? DEFAULT_CATALOG_DIFFICULTY;
}

export function catalogEstimatedMinutes(item: CatalogContent): number {
	if (item.catalog?.estimated_minutes) return item.catalog.estimated_minutes;
	if ('phases' in item) {
		const authoredSeconds = item.phases.reduce((sum, phase) => sum + (phase.timeout ?? 30), 0);
		return Math.max(1, Math.round(authoredSeconds / 60));
	}
	return Math.max(1, Math.ceil(item.steps.length * 0.6));
}

export function catalogSummary(item: CatalogContent): LocalizedString {
	if (item.catalog?.summary) return item.catalog.summary;
	if ('phases' in item) return item.phases[0]?.narrative ?? item.title;
	return item.description;
}

export function catalogSection(item: CatalogContent): LocalizedString | undefined {
	return item.catalog?.section;
}

export function catalogTags(item: CatalogContent): LocalizedString[] {
	return item.catalog?.tags ?? [];
}

export function groupQuickPlayScenarios(scenarios: Scenario[]): Map<string, Scenario[]> {
	const groups = new Map<string, Scenario[]>();
	for (const scenario of scenarios) {
		const group = scenario.catalog?.variant_group;
		if (!group) continue;
		groups.set(group, [...(groups.get(group) ?? []), scenario]);
	}
	return groups;
}

export function representativeForGroup(scenarios: Scenario[]): Scenario | null {
	return (
		[...scenarios].sort(
			(a, b) =>
				Number(Boolean(b.catalog?.featured)) - Number(Boolean(a.catalog?.featured)) ||
				catalogSort(a) - catalogSort(b)
		)[0] ?? null
	);
}

export function resolveCatalogImage(src: string | undefined, base: string): string | undefined {
	if (!src || /^https?:\/\//.test(src)) return src;
	return src.startsWith('/') ? `${base}${src}` : `${base}/${src}`;
}

export function scenarioRunCount(
	progress: { playedAs?: Record<string, { runs?: number } | undefined> } | undefined
): number {
	return Object.values(progress?.playedAs ?? {}).reduce((sum, role) => sum + (role?.runs ?? 0), 0);
}

export function catalogMetadata(item: CatalogContent): CatalogMetadata | undefined {
	return item.catalog;
}
