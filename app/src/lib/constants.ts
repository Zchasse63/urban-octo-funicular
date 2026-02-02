/**
 * PodBrain Application Constants
 */

// Single-user mode placeholder - will be replaced with auth pre-launch
// Must match the default user inserted in 0001_initial_schema.sql
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
  // Target cost per episode in dollars
  targetCostPerEpisode: 0.15,
} as const

// Pagination Defaults
export const PAGINATION = {
  defaultPageSize: 20,
  maxPageSize: 100,
} as const

// Subscription Tiers
export const SUBSCRIPTION_TIERS = {
  free: {
    name: 'Free',
    episodesPerMonth: 3,
    maxShows: 1,
    teamSeats: 1,
    priceMonthly: 0,
  },
  pro: {
    name: 'Pro',
    episodesPerMonth: Infinity,
    maxShows: 3,
    teamSeats: 1,
    priceMonthly: 19,
  },
  agency: {
    name: 'Agency',
    episodesPerMonth: Infinity,
    maxShows: 20,
    teamSeats: 5,
    priceMonthly: 49,
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

// Asset Types for Content Multiplication
export const ASSET_TYPES = [
  'show_notes',
  'linkedin_post',
  'twitter_thread',
  'instagram_carousel',
  'newsletter',
  'blog_post',
  'youtube_description',
  'tiktok_hook',
  'quote_card',
  'audiogram',
] as const
