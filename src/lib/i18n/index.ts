import { addMessages, init, getLocaleFromNavigator, locale, waitLocale } from 'svelte-i18n';
import zhHant from './locales/zh-Hant.json';

const FALLBACK_LOCALE = 'zh-Hant';

let initialized = false;

export function setupI18n(): Promise<void> {
	if (!initialized) {
		addMessages('zh-Hant', zhHant);
		init({
			fallbackLocale: FALLBACK_LOCALE,
			initialLocale: detectLocale()
		});
		initialized = true;
	}
	return waitLocale();
}

function detectLocale(): string {
	if (typeof window === 'undefined') return FALLBACK_LOCALE;
	const navLocale = getLocaleFromNavigator();
	if (navLocale && navLocale.toLowerCase().startsWith('zh')) {
		return 'zh-Hant';
	}
	return FALLBACK_LOCALE;
}

export { locale, waitLocale };
export const SUPPORTED_LOCALES = ['zh-Hant'] as const;
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];
