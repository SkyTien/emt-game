import type { LocalizedString } from '$lib/types/content';

const FALLBACK = 'zh-Hant' as const;

export function localize(value: LocalizedString | string | undefined, locale: string): string {
	if (value === undefined || value === null) return '';
	if (typeof value === 'string') return value;
	const direct = value[locale];
	if (typeof direct === 'string' && direct.length > 0) return direct;
	const fallback = value[FALLBACK];
	if (typeof fallback === 'string') return fallback;
	const first = Object.values(value).find((v) => typeof v === 'string') as string | undefined;
	return first ?? '';
}
