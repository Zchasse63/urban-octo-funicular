/**
 * PodBrain Content Multiplication Engine - Asset Types
 * Defines all 30+ asset types with metadata for the content generation system
 */

import type { LucideIcon } from 'lucide-react'
import {
  FileText,
  Mail,
  BookOpen,
  Linkedin,
  Twitter,
  Instagram,
  Youtube,
  Video,
  Quote,
  Lightbulb,
  ListChecks,
  MessageSquare,
  Megaphone,
  Sparkles,
  Newspaper,
  PenLine,
  Hash,
  Image,
  Film,
  Mic,
  Layout,
  AlignLeft,
  Clock,
  Target,
  Users,
  Share2,
  Bookmark,
  Rss,
  FileCheck,
  Zap,
} from 'lucide-react'

// Asset Categories
export type AssetCategory = 'social' | 'long_form' | 'video' | 'visual'

export const ASSET_CATEGORIES: Record<AssetCategory, { label: string; description: string }> = {
  social: {
    label: 'Social Posts',
    description: 'Content optimized for social media platforms',
  },
  long_form: {
    label: 'Long-form Content',
    description: 'In-depth written content for blogs, newsletters, and SEO',
  },
  video: {
    label: 'Video Scripts',
    description: 'Scripts and content for video platforms',
  },
  visual: {
    label: 'Visuals',
    description: 'Quote cards, carousels, and visual content',
  },
}

// Generation Status
export type AssetGenerationStatus = 'pending' | 'generating' | 'completed' | 'failed'

// Asset Type Definition
export interface AssetTypeDefinition {
  id: string
  name: string
  description: string
  category: AssetCategory
  icon: LucideIcon
  typicalLength: string
  wordCount?: { min: number; max: number }
  format: 'text' | 'html' | 'markdown' | 'json'
  aiPromptHint: string
  priority: number // 1-10, higher = more important
}

// Complete Asset Types Catalog (30+ types)
export const ASSET_TYPE_DEFINITIONS: Record<string, AssetTypeDefinition> = {
  // === SHOW NOTES & CORE CONTENT ===
  show_notes: {
    id: 'show_notes',
    name: 'Show Notes',
    description: 'Comprehensive episode summary with timestamps, key points, and resources mentioned',
    category: 'long_form',
    icon: FileText,
    typicalLength: '500-1000 words',
    wordCount: { min: 500, max: 1000 },
    format: 'html',
    aiPromptHint: 'Create structured show notes with timestamps, bullet points, and resource links',
    priority: 10,
  },
  episode_titles: {
    id: 'episode_titles',
    name: 'Episode Titles (A/B)',
    description: '3-5 alternative episode title options optimized for different platforms',
    category: 'long_form',
    icon: PenLine,
    typicalLength: '5-15 words each',
    format: 'json',
    aiPromptHint: 'Generate attention-grabbing titles with SEO keywords, curiosity hooks, and platform-specific variants',
    priority: 9,
  },
  key_takeaways: {
    id: 'key_takeaways',
    name: 'Key Takeaways',
    description: '5-7 main insights and action items from the episode',
    category: 'long_form',
    icon: Lightbulb,
    typicalLength: '200-400 words',
    wordCount: { min: 200, max: 400 },
    format: 'markdown',
    aiPromptHint: 'Extract the most valuable and actionable insights for listeners',
    priority: 9,
  },
  chapter_markers: {
    id: 'chapter_markers',
    name: 'Chapter Markers',
    description: 'Timestamped chapters for podcast players that support chapters',
    category: 'long_form',
    icon: Bookmark,
    typicalLength: '10-20 chapters',
    format: 'json',
    aiPromptHint: 'Create meaningful chapter breaks with descriptive titles at key topic transitions',
    priority: 8,
  },

  // === LONG-FORM CONTENT ===
  blog_post: {
    id: 'blog_post',
    name: 'Blog Post',
    description: 'SEO-optimized blog article based on episode content',
    category: 'long_form',
    icon: BookOpen,
    typicalLength: '1500-2000 words',
    wordCount: { min: 1500, max: 2000 },
    format: 'html',
    aiPromptHint: 'Write an engaging blog post with headers, quotes, and SEO-friendly structure',
    priority: 8,
  },
  newsletter_email: {
    id: 'newsletter_email',
    name: 'Newsletter Email',
    description: 'Email newsletter promoting the episode with personal tone',
    category: 'long_form',
    icon: Mail,
    typicalLength: '300-500 words',
    wordCount: { min: 300, max: 500 },
    format: 'html',
    aiPromptHint: 'Write a conversational email with a hook, key highlights, and clear CTA',
    priority: 7,
  },
  press_release: {
    id: 'press_release',
    name: 'Press Release',
    description: 'Formal announcement for newsworthy episodes or guests',
    category: 'long_form',
    icon: Newspaper,
    typicalLength: '400-600 words',
    wordCount: { min: 400, max: 600 },
    format: 'text',
    aiPromptHint: 'Write in AP style with who/what/when/where/why structure',
    priority: 4,
  },
  transcript_summary: {
    id: 'transcript_summary',
    name: 'Transcript Summary',
    description: 'Condensed version of the full transcript highlighting key moments',
    category: 'long_form',
    icon: AlignLeft,
    typicalLength: '800-1200 words',
    wordCount: { min: 800, max: 1200 },
    format: 'markdown',
    aiPromptHint: 'Summarize the conversation while preserving speaker personality and key quotes',
    priority: 6,
  },
  seo_description: {
    id: 'seo_description',
    name: 'SEO Meta Description',
    description: 'Optimized meta description for search engines',
    category: 'long_form',
    icon: Target,
    typicalLength: '150-160 characters',
    format: 'text',
    aiPromptHint: 'Write a compelling meta description with target keywords and value proposition',
    priority: 7,
  },

  // === SOCIAL MEDIA - LINKEDIN ===
  linkedin_post_host: {
    id: 'linkedin_post_host',
    name: 'LinkedIn Post (Host)',
    description: 'Professional LinkedIn post from the host\'s perspective',
    category: 'social',
    icon: Linkedin,
    typicalLength: '150-300 words',
    wordCount: { min: 150, max: 300 },
    format: 'text',
    aiPromptHint: 'Write thought leadership content with personal insights and professional hooks',
    priority: 8,
  },
  linkedin_post_guest: {
    id: 'linkedin_post_guest',
    name: 'LinkedIn Post (Guest)',
    description: 'LinkedIn post template for guest to share their appearance',
    category: 'social',
    icon: Linkedin,
    typicalLength: '150-300 words',
    wordCount: { min: 150, max: 300 },
    format: 'text',
    aiPromptHint: 'Write from guest perspective highlighting their expertise and the conversation',
    priority: 7,
  },
  linkedin_article: {
    id: 'linkedin_article',
    name: 'LinkedIn Article',
    description: 'Long-form LinkedIn article expanding on episode themes',
    category: 'social',
    icon: Linkedin,
    typicalLength: '800-1200 words',
    wordCount: { min: 800, max: 1200 },
    format: 'markdown',
    aiPromptHint: 'Write an authoritative article with insights, data points, and professional takeaways',
    priority: 5,
  },

  // === SOCIAL MEDIA - TWITTER/X ===
  twitter_thread: {
    id: 'twitter_thread',
    name: 'Twitter/X Thread',
    description: '5-8 tweet thread summarizing key insights',
    category: 'social',
    icon: Twitter,
    typicalLength: '5-8 tweets',
    format: 'json',
    aiPromptHint: 'Create a compelling thread with hooks, insights, and engagement-driving content',
    priority: 8,
  },
  twitter_single: {
    id: 'twitter_single',
    name: 'Twitter/X Single Post',
    description: 'Standalone tweet to promote the episode',
    category: 'social',
    icon: Twitter,
    typicalLength: '280 characters',
    format: 'text',
    aiPromptHint: 'Write a punchy, curiosity-inducing tweet with relevant hashtags',
    priority: 7,
  },

  // === SOCIAL MEDIA - INSTAGRAM ===
  instagram_carousel: {
    id: 'instagram_carousel',
    name: 'Instagram Carousel',
    description: '5-7 slide carousel with key takeaways',
    category: 'visual',
    icon: Instagram,
    typicalLength: '5-7 slides',
    format: 'json',
    aiPromptHint: 'Create slide-by-slide content with hook, insights, and CTA structure',
    priority: 7,
  },
  instagram_caption: {
    id: 'instagram_caption',
    name: 'Instagram Caption',
    description: 'Engaging caption for Instagram posts',
    category: 'social',
    icon: Instagram,
    typicalLength: '150-300 words',
    wordCount: { min: 150, max: 300 },
    format: 'text',
    aiPromptHint: 'Write a conversational caption with emojis, line breaks, and relevant hashtags',
    priority: 6,
  },
  instagram_reel_script: {
    id: 'instagram_reel_script',
    name: 'Instagram Reel Script',
    description: 'Short-form video script for Instagram Reels',
    category: 'video',
    icon: Film,
    typicalLength: '30-60 seconds',
    format: 'text',
    aiPromptHint: 'Write a hook-first script with fast pacing and visual cues',
    priority: 6,
  },

  // === SOCIAL MEDIA - TIKTOK ===
  tiktok_hooks: {
    id: 'tiktok_hooks',
    name: 'TikTok Hooks',
    description: '3 viral opening hooks for TikTok videos',
    category: 'video',
    icon: Video,
    typicalLength: '3 hooks, 5-10 seconds each',
    format: 'json',
    aiPromptHint: 'Create pattern-interrupting hooks that stop the scroll and create curiosity',
    priority: 7,
  },
  tiktok_script: {
    id: 'tiktok_script',
    name: 'TikTok Script',
    description: 'Full TikTok video script with trending format',
    category: 'video',
    icon: Video,
    typicalLength: '30-60 seconds',
    format: 'text',
    aiPromptHint: 'Write for vertical video with fast cuts, text overlays, and trending audio cues',
    priority: 6,
  },

  // === VIDEO PLATFORM CONTENT ===
  youtube_description: {
    id: 'youtube_description',
    name: 'YouTube Description',
    description: 'SEO-optimized description for YouTube uploads',
    category: 'video',
    icon: Youtube,
    typicalLength: '300-500 words',
    wordCount: { min: 300, max: 500 },
    format: 'text',
    aiPromptHint: 'Write with timestamps, keywords, links, and engagement prompts above the fold',
    priority: 7,
  },
  youtube_shorts_script: {
    id: 'youtube_shorts_script',
    name: 'YouTube Shorts Script',
    description: 'Script for YouTube Shorts (under 60 seconds)',
    category: 'video',
    icon: Youtube,
    typicalLength: '60 seconds',
    format: 'text',
    aiPromptHint: 'Create a hook-driven script optimized for vertical video engagement',
    priority: 6,
  },
  youtube_title_tags: {
    id: 'youtube_title_tags',
    name: 'YouTube Title & Tags',
    description: 'Optimized title and keyword tags for YouTube SEO',
    category: 'video',
    icon: Hash,
    typicalLength: '1 title + 15-20 tags',
    format: 'json',
    aiPromptHint: 'Research-driven title with search volume keywords and related tags',
    priority: 6,
  },

  // === VISUAL CONTENT ===
  quote_cards: {
    id: 'quote_cards',
    name: 'Quote Cards',
    description: '3-5 shareable quotes from the episode',
    category: 'visual',
    icon: Quote,
    typicalLength: '3-5 quotes',
    format: 'json',
    aiPromptHint: 'Extract powerful, standalone quotes that resonate and are highly shareable',
    priority: 8,
  },
  audiogram_clips: {
    id: 'audiogram_clips',
    name: 'Audiogram Clips',
    description: 'Timestamps for 30-60 second viral moments',
    category: 'visual',
    icon: Mic,
    typicalLength: '3-5 clips',
    format: 'json',
    aiPromptHint: 'Identify high-energy, quotable, or controversial moments with exact timestamps',
    priority: 7,
  },
  infographic_outline: {
    id: 'infographic_outline',
    name: 'Infographic Outline',
    description: 'Content structure for visual infographic',
    category: 'visual',
    icon: Layout,
    typicalLength: '5-8 data points',
    format: 'json',
    aiPromptHint: 'Structure key stats, steps, or insights in a visually digestible format',
    priority: 4,
  },

  // === ENGAGEMENT & COMMUNITY ===
  discussion_questions: {
    id: 'discussion_questions',
    name: 'Discussion Questions',
    description: 'Questions to spark community engagement',
    category: 'social',
    icon: MessageSquare,
    typicalLength: '5-7 questions',
    format: 'json',
    aiPromptHint: 'Create thought-provoking questions that encourage sharing and debate',
    priority: 5,
  },
  poll_ideas: {
    id: 'poll_ideas',
    name: 'Poll Ideas',
    description: 'Engaging poll questions for social platforms',
    category: 'social',
    icon: ListChecks,
    typicalLength: '3-5 polls',
    format: 'json',
    aiPromptHint: 'Create polarizing or interesting poll questions with clear answer options',
    priority: 4,
  },
  call_to_action: {
    id: 'call_to_action',
    name: 'Call to Action Script',
    description: 'Episode-specific CTA for listeners',
    category: 'long_form',
    icon: Megaphone,
    typicalLength: '50-100 words',
    wordCount: { min: 50, max: 100 },
    format: 'text',
    aiPromptHint: 'Write a compelling, specific ask that ties into episode content',
    priority: 5,
  },

  // === GUEST PROMOTION ===
  guest_bio_short: {
    id: 'guest_bio_short',
    name: 'Guest Bio (Short)',
    description: 'Concise guest introduction for show notes',
    category: 'long_form',
    icon: Users,
    typicalLength: '50-75 words',
    wordCount: { min: 50, max: 75 },
    format: 'text',
    aiPromptHint: 'Write a professional, third-person bio highlighting credentials and expertise',
    priority: 6,
  },
  guest_promo_kit: {
    id: 'guest_promo_kit',
    name: 'Guest Promo Kit',
    description: 'Package of social posts for guest to share',
    category: 'social',
    icon: Share2,
    typicalLength: 'Multiple assets',
    format: 'json',
    aiPromptHint: 'Create a variety of ready-to-post content the guest can share across platforms',
    priority: 6,
  },

  // === DISTRIBUTION & SYNDICATION ===
  podcast_teaser: {
    id: 'podcast_teaser',
    name: 'Podcast Teaser',
    description: 'Short promotional copy for podcast directories',
    category: 'long_form',
    icon: Rss,
    typicalLength: '100-150 words',
    wordCount: { min: 100, max: 150 },
    format: 'text',
    aiPromptHint: 'Write a compelling preview that hooks listeners and encourages subscription',
    priority: 5,
  },
  cross_promo_script: {
    id: 'cross_promo_script',
    name: 'Cross-Promo Script',
    description: 'Script for promoting on other podcasts',
    category: 'long_form',
    icon: Mic,
    typicalLength: '30-60 seconds',
    format: 'text',
    aiPromptHint: 'Write a conversational ad read highlighting episode value proposition',
    priority: 4,
  },

  // === REPURPOSING ===
  medium_article: {
    id: 'medium_article',
    name: 'Medium Article',
    description: 'Long-form article formatted for Medium',
    category: 'long_form',
    icon: BookOpen,
    typicalLength: '1200-1800 words',
    wordCount: { min: 1200, max: 1800 },
    format: 'markdown',
    aiPromptHint: 'Write an engaging article with Medium-friendly formatting and pull quotes',
    priority: 4,
  },
  substack_post: {
    id: 'substack_post',
    name: 'Substack Post',
    description: 'Newsletter-style post for Substack',
    category: 'long_form',
    icon: Mail,
    typicalLength: '800-1200 words',
    wordCount: { min: 800, max: 1200 },
    format: 'markdown',
    aiPromptHint: 'Write in a personal, newsletter voice with subscriber engagement hooks',
    priority: 4,
  },

  // === AI SUMMARIES ===
  ai_summary_short: {
    id: 'ai_summary_short',
    name: 'AI Summary (Short)',
    description: 'TL;DR summary in 2-3 sentences',
    category: 'long_form',
    icon: Zap,
    typicalLength: '2-3 sentences',
    format: 'text',
    aiPromptHint: 'Capture the essence of the episode in a brief, compelling summary',
    priority: 8,
  },
  ai_summary_detailed: {
    id: 'ai_summary_detailed',
    name: 'AI Summary (Detailed)',
    description: 'Comprehensive episode summary with all key points',
    category: 'long_form',
    icon: FileCheck,
    typicalLength: '400-600 words',
    wordCount: { min: 400, max: 600 },
    format: 'markdown',
    aiPromptHint: 'Write a thorough summary covering all main topics and insights',
    priority: 7,
  },
  highlight_reel: {
    id: 'highlight_reel',
    name: 'Highlight Reel',
    description: 'Top 5 moments with timestamps for video clips',
    category: 'visual',
    icon: Sparkles,
    typicalLength: '5 highlights',
    format: 'json',
    aiPromptHint: 'Identify the most engaging, shareable, or valuable moments with exact timestamps',
    priority: 7,
  },
}

// Helper to get assets by category
export function getAssetsByCategory(category: AssetCategory): AssetTypeDefinition[] {
  return Object.values(ASSET_TYPE_DEFINITIONS)
    .filter((asset) => asset.category === category)
    .sort((a, b) => b.priority - a.priority)
}

// Helper to get all asset type IDs
export function getAllAssetTypeIds(): string[] {
  return Object.keys(ASSET_TYPE_DEFINITIONS)
}

// Helper to get asset definition by ID
export function getAssetDefinition(id: string): AssetTypeDefinition | undefined {
  return ASSET_TYPE_DEFINITIONS[id]
}

// Helper to get high-priority assets (for default generation)
export function getHighPriorityAssets(minPriority: number = 7): AssetTypeDefinition[] {
  return Object.values(ASSET_TYPE_DEFINITIONS)
    .filter((asset) => asset.priority >= minPriority)
    .sort((a, b) => b.priority - a.priority)
}

// Total count of asset types
export const TOTAL_ASSET_TYPES = Object.keys(ASSET_TYPE_DEFINITIONS).length
