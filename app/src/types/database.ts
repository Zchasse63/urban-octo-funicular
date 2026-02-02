// PodBrain Database Types
// Based on PRD Data Model

export type EpisodeStatus = 'pending' | 'processing' | 'completed' | 'failed'

export type AssetType =
  // Core Content
  | 'show_notes'
  | 'episode_titles'
  | 'key_takeaways'
  | 'chapter_markers'
  // Long-form Content
  | 'blog_post'
  | 'newsletter_email'
  | 'press_release'
  | 'transcript_summary'
  | 'seo_description'
  // LinkedIn
  | 'linkedin_post'
  | 'linkedin_post_host'
  | 'linkedin_post_guest'
  | 'linkedin_article'
  // Twitter/X
  | 'twitter_thread'
  | 'twitter_single'
  // Instagram
  | 'instagram_carousel'
  | 'instagram_caption'
  | 'instagram_reel_script'
  // TikTok
  | 'tiktok_hooks'
  | 'tiktok_script'
  // YouTube
  | 'youtube_description'
  | 'youtube_shorts_script'
  | 'youtube_title_tags'
  // Visual Content
  | 'quote_cards'
  | 'audiogram_clips'
  | 'infographic_outline'
  // Engagement
  | 'discussion_questions'
  | 'poll_ideas'
  | 'call_to_action'
  // Guest Content
  | 'guest_bio_short'
  | 'guest_promo_kit'
  // Distribution
  | 'podcast_teaser'
  | 'cross_promo_script'
  // Repurposing
  | 'medium_article'
  | 'substack_post'
  // AI Summaries
  | 'ai_summary_short'
  | 'ai_summary_detailed'
  | 'highlight_reel'
  // Legacy types for backwards compatibility
  | 'newsletter'
  | 'tiktok_hook'
  | 'quote_card'
  | 'audiogram'

export type HostingPlatform = 'buzzsprout' | 'transistor' | 'podbean'

export interface User {
  id: string
  email: string
  name: string | null
  google_id: string | null
  avatar_url: string | null
  preferences: Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface Show {
  id: string
  user_id: string
  name: string
  description: string | null
  default_language: string
  style_preferences: {
    tone?: string
    format_preferences?: Record<string, unknown>
  }
  artwork_url: string | null
  created_at: string
  updated_at: string
}

export interface VocabularyTerm {
  id: string
  show_id: string
  term: string
  alternatives: string[]
  embedding: number[] | null // vector(1536)
  occurrence_count: number
  created_at: string
  updated_at: string
}

export interface Episode {
  id: string
  show_id: string
  title: string | null
  description: string | null
  audio_url: string
  audio_duration_seconds: number | null
  language: string | null
  status: EpisodeStatus
  transcript: string | null
  transcript_segments: TranscriptSegment[] | null
  show_notes: string | null
  show_notes_html: string | null
  schema_markup: Record<string, unknown> | null
  seo_score: number | null
  seo_analysis: SEOAnalysis | null
  guest_name: string | null
  guest_bio: string | null
  guest_email: string | null
  viral_moments: ViralMoment[] | null
  metadata: Record<string, unknown>
  published_at: string | null
  created_at: string
  updated_at: string
}

export interface TranscriptSegment {
  text: string
  start: number
  end: number
  speaker: string | null
  confidence: number
}

export interface SEOAnalysis {
  keyword_density: Record<string, number>
  readability_score: number
  header_structure: boolean
  suggestions: string[]
  estimated_position: number | null
}

export interface ViralMoment {
  start_time: number
  end_time: number
  text: string
  score: number
  reason: string
  type: 'controversial' | 'emotional' | 'quotable' | 'revelation' | 'counter_intuitive'
}

export interface EpisodeSection {
  id: string
  episode_id: string
  content: string
  start_time: number | null
  end_time: number | null
  speaker: string | null
  embedding: number[] | null // vector(1536)
  metadata: Record<string, unknown>
  created_at: string
}

export interface GeneratedAsset {
  id: string
  episode_id: string
  asset_type: AssetType
  content: string
  metadata: Record<string, unknown>
  file_url: string | null
  created_at: string
  updated_at: string
}

export interface Correction {
  id: string
  episode_id: string
  original_text: string
  corrected_text: string
  applied_to_vocabulary: boolean
  created_at: string
}

export interface HostingConnection {
  id: string
  user_id: string
  platform: HostingPlatform
  access_token: string
  refresh_token: string | null
  metadata: Record<string, unknown>
  created_at: string
  updated_at: string
}

// Episode List Item (subset of Episode for list views)
export interface EpisodeListItem {
  id: string
  show_id: string
  title: string | null
  description: string | null
  audio_url: string
  audio_duration_seconds: number | null
  language: string | null
  status: EpisodeStatus
  seo_score: number | null
  guest_name: string | null
  published_at: string | null
  created_at: string
  updated_at: string
  shows: {
    user_id: string
    name: string
  }[]
}

// API Response Types
export interface ApiResponse<T> {
  data: T | null
  error: string | null
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  per_page: number
}

// Processing Status Types
export interface ProcessingStatus {
  episode_id: string
  current_step: ProcessingStep
  progress: number
  started_at: string
  estimated_completion: string | null
  error: string | null
}

export type ProcessingStep =
  | 'uploading'
  | 'transcribing'
  | 'vocabulary_processing'
  | 'generating_show_notes'
  | 'seo_analysis'
  | 'generating_assets'
  | 'completed'
  | 'failed'
