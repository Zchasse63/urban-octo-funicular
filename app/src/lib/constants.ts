/**
 * PodBrain Application Constants
 */

// DEPRECATED: No longer used. Auth now uses real user IDs from Supabase Auth.
// Kept for backwards compatibility only - do not import this in new code.
export const DEFAULT_USER_ID = '00000000-0000-0000-0000-000000000001'

// Application URL
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

// API Rate Limits (requests per minute)
export const RATE_LIMITS = {
  // General API endpoints
  default: 60,
  // Episode processing (expensive operation)
  processing: 10,
  // Asset generation
  assetGeneration: 30,
} as const

// Processing Timeouts (in milliseconds)
export const TIMEOUTS = {
  // Transcription: 2x audio duration, max 8 hours
  transcription: 8 * 60 * 60 * 1000,
  // Show notes generation
  showNotesGeneration: 60 * 1000,
  // Individual asset generation
  assetGeneration: 30 * 1000,
  // Full episode processing pipeline
  fullProcessing: 30 * 60 * 1000,
  // API request timeout
  apiRequest: 30 * 1000,
} as const

// Processing Constraints
export const PROCESSING = {
  // Maximum audio duration in seconds (4 hours)
  maxAudioDuration: 4 * 60 * 60,
  // Maximum file size in bytes (500MB)
  maxFileSize: 500 * 1024 * 1024,
  // Target cost per episode in dollars (actual avg is $0.25 for 45-min episode)
  targetCostPerEpisode: 0.25,
} as const

// Pagination Defaults
export const PAGINATION = {
  defaultPageSize: 20,
  maxPageSize: 100,
} as const

// Subscription Tiers — hours-based pricing aligned with stripe/products.ts
export const SUBSCRIPTION_TIERS = {
  free: {
    name: 'Free',
    audioHoursPerMonth: 1,
    maxShows: 1,
    teamSeats: 1,
    priceMonthly: 0,
    priceAnnual: 0,
  },
  pro: {
    name: 'Pro',
    audioHoursPerMonth: 10,
    maxShows: 3,
    teamSeats: 1,
    priceMonthly: 29,
    priceAnnual: 232,
  },
  creator: {
    name: 'Creator',
    audioHoursPerMonth: 25,
    maxShows: 10,
    teamSeats: 3,
    priceMonthly: 59,
    priceAnnual: 472,
  },
  agency: {
    name: 'Agency',
    audioHoursPerMonth: 100,
    maxShows: 999,
    teamSeats: 10,
    priceMonthly: 149,
    priceAnnual: 1192,
  },
} as const

// Supported Audio Formats
export const SUPPORTED_AUDIO_FORMATS = [
  'audio/mpeg',
  'audio/mp3',
  'audio/mp4',
  'audio/m4a',
  'audio/wav',
  'audio/x-wav',
  'audio/aac',
  'audio/ogg',
  'audio/webm',
] as const

// Asset Types for Content Multiplication — synced with DB asset_type enum
export const ASSET_TYPES = [
  // Core content
  'show_notes',
  'episode_titles',
  'key_takeaways',
  'chapter_markers',
  // Long-form
  'blog_post',
  'newsletter',
  'newsletter_email',
  'press_release',
  'transcript_summary',
  'seo_description',
  // LinkedIn
  'linkedin_post',
  'linkedin_post_host',
  'linkedin_post_guest',
  'linkedin_article',
  // Twitter/X
  'twitter_thread',
  'twitter_single',
  // Instagram
  'instagram_carousel',
  'instagram_caption',
  'instagram_reel_script',
  // TikTok
  'tiktok_hook',
  'tiktok_hooks',
  'tiktok_script',
  // YouTube
  'youtube_description',
  'youtube_shorts_script',
  'youtube_title_tags',
  // Visual content
  'quote_card',
  'quote_cards',
  'audiogram',
  'audiogram_clips',
  'infographic_outline',
  // Engagement
  'discussion_questions',
  'poll_ideas',
  'call_to_action',
  // Guest content
  'guest_bio_short',
  'guest_promo_kit',
  // Distribution
  'podcast_teaser',
  'cross_promo_script',
  // Repurposing
  'medium_article',
  'substack_post',
  // AI summaries
  'ai_summary_short',
  'ai_summary_detailed',
  'highlight_reel',
] as const

// Taddy API — Podcast search and discovery
export const TADDY_API_URL = 'https://api.taddy.org'
export const TADDY_CACHE_TTL_HOURS = 24 * 7 // 7 days
export const TADDY_MONTHLY_REQUEST_LIMIT = 100_000 // Pro plan
export const TADDY_DEFAULT_PAGE_SIZE = 25
