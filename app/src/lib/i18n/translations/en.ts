import type { TranslationKeys } from '../types';

/**
 * English translations (default locale)
 */
export const en: TranslationKeys = {
  // ─── Navigation ─────────────────────────────────────────────────────────
  'nav.episodes': 'Episodes',
  'nav.upload': 'Upload',
  'nav.vocabulary': 'Vocabulary',
  'nav.experts': 'Experts',
  'nav.search': 'Search',
  'nav.analytics': 'Analytics',
  'nav.settings': 'Settings',
  'nav.support': 'Support',

  // ─── Common Actions ─────────────────────────────────────────────────────
  'common.save': 'Save',
  'common.cancel': 'Cancel',
  'common.delete': 'Delete',
  'common.edit': 'Edit',
  'common.loading': 'Loading...',
  'common.error': 'An error occurred',
  'common.success': 'Success',
  'common.confirm': 'Confirm',
  'common.back': 'Back',
  'common.next': 'Next',
  'common.close': 'Close',
  'common.copy': 'Copy',
  'common.copied': 'Copied',
  'common.download': 'Download',
  'common.refresh': 'Refresh',
  'common.retry': 'Retry',
  'common.search': 'Search',

  // ─── Episodes ───────────────────────────────────────────────────────────
  'episodes.title': 'Episodes',
  'episodes.empty': 'No episodes yet',
  'episodes.empty.description': 'Upload your first episode to get started with AI-powered show notes.',
  'episodes.status.pending': 'Pending',
  'episodes.status.processing': 'Processing',
  'episodes.status.completed': 'Completed',
  'episodes.status.failed': 'Failed',
  'episodes.status.scheduled': 'Scheduled',
  'episodes.tabs.notes': 'Show Notes',
  'episodes.tabs.assets': 'Assets',
  'episodes.tabs.transcript': 'Transcript',
  'episodes.tabs.guest': 'Guest Package',
  'episodes.tabs.intelligence': 'Intelligence',
  'episodes.tabs.rss': 'RSS Tags',

  // ─── Upload ─────────────────────────────────────────────────────────────
  'upload.title': 'Upload Episode',
  'upload.dropzone.label': 'Drop your audio file here',
  'upload.dropzone.hint': 'MP3, M4A, WAV, or FLAC up to 500MB',
  'upload.step.file': 'Select File',
  'upload.step.details': 'Episode Details',
  'upload.step.processing': 'Processing',

  // ─── Vocabulary ─────────────────────────────────────────────────────────
  'vocabulary.title': 'Custom Vocabulary',
  'vocabulary.add': 'Add Term',
  'vocabulary.empty': 'No vocabulary terms yet. Add terms to improve transcription accuracy.',
  'vocabulary.term': 'Term',
  'vocabulary.alternatives': 'Alternatives',

  // ─── Settings ───────────────────────────────────────────────────────────
  'settings.title': 'Settings',
  'settings.theme': 'Theme',
  'settings.theme.light': 'Light',
  'settings.theme.dark': 'Dark',
  'settings.theme.system': 'System',
  'settings.language': 'Language',
  'settings.subscription': 'Subscription',

  // ─── SEO ────────────────────────────────────────────────────────────────
  'seo.score': 'SEO Score',
  'seo.suggestions': 'Suggestions',
  'seo.optimize': 'Optimize',

  // ─── Errors ─────────────────────────────────────────────────────────────
  'error.notFound': 'Page not found',
  'error.unauthorized': 'You need to sign in to access this page',
  'error.serverError': 'Something went wrong. Please try again.',
  'error.networkError': 'Unable to connect. Check your internet connection.',
};
