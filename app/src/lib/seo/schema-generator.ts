// Schema.org JSON-LD Generator for PodBrain
// Generates PodcastEpisode schema markup for SEO

import type { Episode } from '@/types/database'

export interface PodcastEpisodeSchemaInput {
  episode: Episode
  showName: string
  showUrl?: string
  showArtworkUrl?: string
  publisherName?: string
  chapters?: EpisodeChapter[]
}

export interface EpisodeChapter {
  name: string
  startOffset: number // in seconds
  endOffset?: number // in seconds
}

export interface PodcastEpisodeSchema {
  '@context': 'https://schema.org'
  '@type': 'PodcastEpisode'
  name: string
  description?: string
  datePublished?: string
  duration?: string
  url?: string
  audio?: {
    '@type': 'AudioObject'
    contentUrl: string
    duration?: string
    encodingFormat?: string
  }
  partOfSeries?: {
    '@type': 'PodcastSeries'
    name: string
    url?: string
    image?: string
  }
  contributor?: Array<{
    '@type': 'Person'
    name: string
    description?: string
  }>
  hasPart?: Array<{
    '@type': 'Clip'
    name: string
    startOffset: number
    endOffset?: number
  }>
  transcript?: string
}

/**
 * Convert seconds to ISO 8601 duration format (PT#H#M#S)
 */
export function secondsToIsoDuration(seconds: number): string {
  if (!seconds || seconds <= 0) return 'PT0S'

  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)

  let duration = 'PT'
  if (hours > 0) duration += `${hours}H`
  if (minutes > 0) duration += `${minutes}M`
  if (secs > 0 || duration === 'PT') duration += `${secs}S`

  return duration
}

/**
 * Format duration for display (HH:MM:SS or MM:SS)
 */
export function formatDurationDisplay(seconds: number): string {
  if (!seconds || seconds <= 0) return '0:00'

  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`
}

/**
 * Generate PodcastEpisode schema markup (JSON-LD)
 */
export function generatePodcastEpisodeSchema(
  input: PodcastEpisodeSchemaInput
): PodcastEpisodeSchema {
  const { episode, showName, showUrl, showArtworkUrl, publisherName, chapters } = input

  const duration = episode.audio_duration_seconds
    ? secondsToIsoDuration(episode.audio_duration_seconds)
    : undefined

  const schema: PodcastEpisodeSchema = {
    '@context': 'https://schema.org',
    '@type': 'PodcastEpisode',
    name: episode.title || 'Untitled Episode',
  }

  // Add description
  if (episode.description) {
    schema.description = episode.description
  }

  // Add publish date
  if (episode.published_at) {
    schema.datePublished = new Date(episode.published_at).toISOString().split('T')[0]
  }

  // Add duration
  if (duration) {
    schema.duration = duration
  }

  // Add audio object
  if (episode.audio_url) {
    schema.audio = {
      '@type': 'AudioObject',
      contentUrl: episode.audio_url,
    }
    if (duration) {
      schema.audio.duration = duration
    }
    // Infer encoding format from URL
    const audioExtension = episode.audio_url.split('.').pop()?.toLowerCase()
    if (audioExtension) {
      const formatMap: Record<string, string> = {
        mp3: 'audio/mpeg',
        m4a: 'audio/mp4',
        wav: 'audio/wav',
        ogg: 'audio/ogg',
        aac: 'audio/aac',
      }
      if (formatMap[audioExtension]) {
        schema.audio.encodingFormat = formatMap[audioExtension]
      }
    }
  }

  // Add podcast series info
  if (showName) {
    schema.partOfSeries = {
      '@type': 'PodcastSeries',
      name: showName,
    }
    if (showUrl) {
      schema.partOfSeries.url = showUrl
    }
    if (showArtworkUrl) {
      schema.partOfSeries.image = showArtworkUrl
    }
  }

  // Add guest/contributor
  if (episode.guest_name) {
    schema.contributor = [{
      '@type': 'Person',
      name: episode.guest_name,
    }]
    if (episode.guest_bio) {
      schema.contributor[0].description = episode.guest_bio
    }
  }

  // Add chapters as clips
  if (chapters && chapters.length > 0) {
    schema.hasPart = chapters.map(chapter => ({
      '@type': 'Clip',
      name: chapter.name,
      startOffset: chapter.startOffset,
      ...(chapter.endOffset && { endOffset: chapter.endOffset }),
    }))
  }

  // Add transcript reference if available
  if (episode.transcript) {
    // We don't include the full transcript, just indicate it exists
    schema.transcript = 'Transcript available'
  }

  return schema
}

/**
 * Convert schema to JSON-LD script tag content
 */
export function schemaToJsonLd(schema: PodcastEpisodeSchema): string {
  return JSON.stringify(schema, null, 2)
}

/**
 * Generate complete HTML script tag for schema
 */
export function generateSchemaScriptTag(schema: PodcastEpisodeSchema): string {
  return `<script type="application/ld+json">
${schemaToJsonLd(schema)}
</script>`
}

/**
 * Validate schema for required fields
 */
export function validateSchema(schema: PodcastEpisodeSchema): {
  valid: boolean
  errors: string[]
  warnings: string[]
} {
  const errors: string[] = []
  const warnings: string[] = []

  // Required fields
  if (!schema.name || schema.name === 'Untitled Episode') {
    errors.push('Episode name is required')
  }

  // Recommended fields
  if (!schema.description) {
    warnings.push('Description is recommended for better search visibility')
  }

  if (!schema.datePublished) {
    warnings.push('Publish date helps with search result freshness')
  }

  if (!schema.duration) {
    warnings.push('Duration helps users decide to listen')
  }

  if (!schema.audio) {
    warnings.push('Audio URL is recommended for podcast discovery')
  }

  if (!schema.partOfSeries) {
    warnings.push('Link to podcast series improves navigation')
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  }
}

/**
 * Generate a sample schema for preview/testing
 */
export function generateSampleSchema(): PodcastEpisodeSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'PodcastEpisode',
    name: 'How to Build a Successful Podcast',
    description: 'In this episode, we discuss the key strategies for launching and growing a successful podcast...',
    datePublished: '2024-01-15',
    duration: 'PT45M30S',
    audio: {
      '@type': 'AudioObject',
      contentUrl: 'https://example.com/episodes/001.mp3',
      duration: 'PT45M30S',
      encodingFormat: 'audio/mpeg',
    },
    partOfSeries: {
      '@type': 'PodcastSeries',
      name: 'The Podcaster Show',
      url: 'https://example.com/podcast',
      image: 'https://example.com/artwork.jpg',
    },
    contributor: [{
      '@type': 'Person',
      name: 'Jane Smith',
      description: 'Podcast consultant and founder of PodGrowth',
    }],
    hasPart: [
      { '@type': 'Clip', name: 'Introduction', startOffset: 0 },
      { '@type': 'Clip', name: 'Finding Your Niche', startOffset: 180 },
      { '@type': 'Clip', name: 'Equipment Setup', startOffset: 720 },
      { '@type': 'Clip', name: 'Growing Your Audience', startOffset: 1500 },
      { '@type': 'Clip', name: 'Monetization Strategies', startOffset: 2100 },
    ],
  }
}
