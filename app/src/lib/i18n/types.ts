/**
 * Internationalization (i18n) Types
 *
 * Defines supported locales and the translation key structure for PodBrain.
 * Currently scaffolded with English as the default; Spanish and Portuguese
 * translations can be added incrementally.
 */

export type Locale = 'en' | 'es' | 'pt';

export interface TranslationKeys {
  // ─── Navigation ─────────────────────────────────────────────────────────
  'nav.episodes': string;
  'nav.upload': string;
  'nav.vocabulary': string;
  'nav.experts': string;
  'nav.search': string;
  'nav.analytics': string;
  'nav.settings': string;
  'nav.support': string;

  // ─── Common Actions ─────────────────────────────────────────────────────
  'common.save': string;
  'common.cancel': string;
  'common.delete': string;
  'common.edit': string;
  'common.loading': string;
  'common.error': string;
  'common.success': string;
  'common.confirm': string;
  'common.back': string;
  'common.next': string;
  'common.close': string;
  'common.copy': string;
  'common.copied': string;
  'common.download': string;
  'common.refresh': string;
  'common.retry': string;
  'common.search': string;

  // ─── Episodes ───────────────────────────────────────────────────────────
  'episodes.title': string;
  'episodes.empty': string;
  'episodes.empty.description': string;
  'episodes.status.pending': string;
  'episodes.status.processing': string;
  'episodes.status.completed': string;
  'episodes.status.failed': string;
  'episodes.status.scheduled': string;
  'episodes.tabs.notes': string;
  'episodes.tabs.assets': string;
  'episodes.tabs.transcript': string;
  'episodes.tabs.guest': string;
  'episodes.tabs.intelligence': string;
  'episodes.tabs.rss': string;

  // ─── Upload ─────────────────────────────────────────────────────────────
  'upload.title': string;
  'upload.dropzone.label': string;
  'upload.dropzone.hint': string;
  'upload.step.file': string;
  'upload.step.details': string;
  'upload.step.processing': string;

  // ─── Vocabulary ─────────────────────────────────────────────────────────
  'vocabulary.title': string;
  'vocabulary.add': string;
  'vocabulary.empty': string;
  'vocabulary.term': string;
  'vocabulary.alternatives': string;

  // ─── Settings ───────────────────────────────────────────────────────────
  'settings.title': string;
  'settings.theme': string;
  'settings.theme.light': string;
  'settings.theme.dark': string;
  'settings.theme.system': string;
  'settings.language': string;
  'settings.subscription': string;

  // ─── SEO ────────────────────────────────────────────────────────────────
  'seo.score': string;
  'seo.suggestions': string;
  'seo.optimize': string;

  // ─── Errors ─────────────────────────────────────────────────────────────
  'error.notFound': string;
  'error.unauthorized': string;
  'error.serverError': string;
  'error.networkError': string;
}
