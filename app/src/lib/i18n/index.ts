/**
 * PodBrain Internationalization (i18n) Module
 *
 * Provides a simple translation function for UI strings.
 * Currently supports English as the default locale.
 *
 * TODO: Add Spanish (es.ts) and Portuguese (pt.ts) translation files.
 * TODO: Integrate locale detection from user preferences or browser.
 * TODO: Consider using next-intl or a similar library for advanced features
 *       like pluralization, date formatting, and SSR locale routing.
 */

import type { Locale, TranslationKeys } from './types';
import { en } from './translations/en';

// ─── Translation Registry ───────────────────────────────────────────────────

const translations: Record<Locale, TranslationKeys> = {
  en,
  // TODO: Replace with actual translations
  es: en, // Falls back to English until es.ts is created
  pt: en, // Falls back to English until pt.ts is created
};

// ─── Public API ─────────────────────────────────────────────────────────────

/**
 * Get a translated string for the given key and locale.
 *
 * @param key - The translation key (e.g. 'nav.episodes')
 * @param locale - The target locale (defaults to 'en')
 * @returns The translated string, or the key itself as a fallback
 *
 * @example
 * ```ts
 * t('nav.episodes')          // "Episodes"
 * t('nav.episodes', 'es')    // "Episodes" (until Spanish translations are added)
 * ```
 */
export function t(key: keyof TranslationKeys, locale: Locale = 'en'): string {
  return translations[locale]?.[key] || translations.en[key] || key;
}

/**
 * Get all available locales.
 */
export function getAvailableLocales(): Locale[] {
  return Object.keys(translations) as Locale[];
}

/**
 * Check if a locale is supported.
 */
export function isValidLocale(locale: string): locale is Locale {
  return locale in translations;
}

/**
 * Get locale display names for a language picker.
 */
export function getLocaleDisplayNames(): Record<Locale, string> {
  return {
    en: 'English',
    es: 'Espanol',
    pt: 'Portugues',
  };
}

// ─── Re-exports ─────────────────────────────────────────────────────────────

export type { Locale, TranslationKeys } from './types';
