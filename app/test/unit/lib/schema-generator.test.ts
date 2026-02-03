/**
 * SEO Schema Generator Unit Tests
 */

import { describe, it, expect } from 'vitest'
import {
  secondsToIsoDuration,
  formatDurationDisplay,
  generatePodcastEpisodeSchema,
  schemaToJsonLd,
  generateSchemaScriptTag,
  validateSchema,
  generateSampleSchema,
} from '@/lib/seo/schema-generator'
import type { Episode } from '@/types/database'

// Helper to create a mock episode
function createMockEpisode(overrides: Partial<Episode> = {}): Episode {
  return {
    id: '123e4567-e89b-12d3-a456-426614174000',
    show_id: '123e4567-e89b-12d3-a456-426614174001',
    title: 'Test Episode',
    description: 'A test episode description',
    audio_url: 'https://example.com/audio.mp3',
    audio_duration_seconds: 3600,
    language: 'en',
    status: 'completed',
    transcript: 'This is the transcript',
    transcript_segments: [],
    show_notes: 'Show notes content',
    show_notes_html: '<p>Show notes content</p>',
    schema_markup: null,
    seo_score: 85,
    seo_analysis: null,
    guest_name: 'John Doe',
    guest_bio: 'A guest bio',
    guest_email: 'john@example.com',
    viral_moments: [],
    metadata: {},
    published_at: '2024-01-15T10:00:00Z',
    created_at: '2024-01-10T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z',
    ...overrides,
  } as Episode
}

describe('secondsToIsoDuration', () => {
  it('converts 0 seconds to PT0S', () => {
    expect(secondsToIsoDuration(0)).toBe('PT0S')
  })

  it('converts negative seconds to PT0S', () => {
    expect(secondsToIsoDuration(-100)).toBe('PT0S')
  })

  it('converts seconds only', () => {
    expect(secondsToIsoDuration(45)).toBe('PT45S')
  })

  it('converts minutes only', () => {
    expect(secondsToIsoDuration(120)).toBe('PT2M')
  })

  it('converts minutes and seconds', () => {
    expect(secondsToIsoDuration(150)).toBe('PT2M30S')
  })

  it('converts hours only', () => {
    expect(secondsToIsoDuration(3600)).toBe('PT1H')
  })

  it('converts hours and minutes', () => {
    expect(secondsToIsoDuration(5400)).toBe('PT1H30M')
  })

  it('converts hours, minutes, and seconds', () => {
    expect(secondsToIsoDuration(3661)).toBe('PT1H1M1S')
  })

  it('handles large durations (4 hours)', () => {
    expect(secondsToIsoDuration(14400)).toBe('PT4H')
  })

  it('handles null/undefined gracefully', () => {
    expect(secondsToIsoDuration(null as unknown as number)).toBe('PT0S')
    expect(secondsToIsoDuration(undefined as unknown as number)).toBe('PT0S')
  })
})

describe('formatDurationDisplay', () => {
  it('formats 0 seconds as 0:00', () => {
    expect(formatDurationDisplay(0)).toBe('0:00')
  })

  it('formats seconds under a minute', () => {
    expect(formatDurationDisplay(45)).toBe('0:45')
  })

  it('formats one minute', () => {
    expect(formatDurationDisplay(60)).toBe('1:00')
  })

  it('formats minutes and seconds', () => {
    expect(formatDurationDisplay(125)).toBe('2:05')
  })

  it('pads seconds with leading zero', () => {
    expect(formatDurationDisplay(65)).toBe('1:05')
  })

  it('formats one hour', () => {
    expect(formatDurationDisplay(3600)).toBe('1:00:00')
  })

  it('formats hours with minutes and seconds', () => {
    expect(formatDurationDisplay(3725)).toBe('1:02:05')
  })

  it('pads minutes and seconds with leading zeros for hours format', () => {
    expect(formatDurationDisplay(3661)).toBe('1:01:01')
  })

  it('handles null/undefined gracefully', () => {
    expect(formatDurationDisplay(null as unknown as number)).toBe('0:00')
    expect(formatDurationDisplay(undefined as unknown as number)).toBe('0:00')
  })
})

describe('generatePodcastEpisodeSchema', () => {
  it('generates schema with required fields', () => {
    const episode = createMockEpisode()
    const schema = generatePodcastEpisodeSchema({
      episode,
      showName: 'Test Podcast',
    })

    expect(schema['@context']).toBe('https://schema.org')
    expect(schema['@type']).toBe('PodcastEpisode')
    expect(schema.name).toBe('Test Episode')
  })

  it('includes description when present', () => {
    const episode = createMockEpisode({ description: 'Episode description' })
    const schema = generatePodcastEpisodeSchema({
      episode,
      showName: 'Test Podcast',
    })

    expect(schema.description).toBe('Episode description')
  })

  it('formats publish date correctly', () => {
    const episode = createMockEpisode({ published_at: '2024-03-15T14:30:00Z' })
    const schema = generatePodcastEpisodeSchema({
      episode,
      showName: 'Test Podcast',
    })

    expect(schema.datePublished).toBe('2024-03-15')
  })

  it('includes duration in ISO format', () => {
    const episode = createMockEpisode({ audio_duration_seconds: 2730 })
    const schema = generatePodcastEpisodeSchema({
      episode,
      showName: 'Test Podcast',
    })

    expect(schema.duration).toBe('PT45M30S')
  })

  it('includes audio object with URL', () => {
    const episode = createMockEpisode({ audio_url: 'https://example.com/ep.mp3' })
    const schema = generatePodcastEpisodeSchema({
      episode,
      showName: 'Test Podcast',
    })

    expect(schema.audio).toBeDefined()
    expect(schema.audio?.['@type']).toBe('AudioObject')
    expect(schema.audio?.contentUrl).toBe('https://example.com/ep.mp3')
  })

  it('infers audio encoding format from URL extension', () => {
    const episode = createMockEpisode({ audio_url: 'https://example.com/ep.mp3' })
    const schema = generatePodcastEpisodeSchema({
      episode,
      showName: 'Test Podcast',
    })

    expect(schema.audio?.encodingFormat).toBe('audio/mpeg')
  })

  it('handles m4a audio format', () => {
    const episode = createMockEpisode({ audio_url: 'https://example.com/ep.m4a' })
    const schema = generatePodcastEpisodeSchema({
      episode,
      showName: 'Test Podcast',
    })

    expect(schema.audio?.encodingFormat).toBe('audio/mp4')
  })

  it('includes podcast series information', () => {
    const episode = createMockEpisode()
    const schema = generatePodcastEpisodeSchema({
      episode,
      showName: 'My Podcast',
      showUrl: 'https://mypodcast.com',
      showArtworkUrl: 'https://mypodcast.com/art.jpg',
    })

    expect(schema.partOfSeries).toBeDefined()
    expect(schema.partOfSeries?.['@type']).toBe('PodcastSeries')
    expect(schema.partOfSeries?.name).toBe('My Podcast')
    expect(schema.partOfSeries?.url).toBe('https://mypodcast.com')
    expect(schema.partOfSeries?.image).toBe('https://mypodcast.com/art.jpg')
  })

  it('includes guest as contributor', () => {
    const episode = createMockEpisode({
      guest_name: 'Jane Smith',
      guest_bio: 'Expert in podcasting',
    })
    const schema = generatePodcastEpisodeSchema({
      episode,
      showName: 'Test Podcast',
    })

    expect(schema.contributor).toBeDefined()
    expect(schema.contributor?.length).toBe(1)
    expect(schema.contributor?.[0]['@type']).toBe('Person')
    expect(schema.contributor?.[0].name).toBe('Jane Smith')
    expect(schema.contributor?.[0].description).toBe('Expert in podcasting')
  })

  it('includes chapters as clips', () => {
    const episode = createMockEpisode()
    const schema = generatePodcastEpisodeSchema({
      episode,
      showName: 'Test Podcast',
      chapters: [
        { name: 'Intro', startOffset: 0, endOffset: 60 },
        { name: 'Main Topic', startOffset: 60, endOffset: 1800 },
        { name: 'Outro', startOffset: 1800 },
      ],
    })

    expect(schema.hasPart).toBeDefined()
    expect(schema.hasPart?.length).toBe(3)
    expect(schema.hasPart?.[0]['@type']).toBe('Clip')
    expect(schema.hasPart?.[0].name).toBe('Intro')
    expect(schema.hasPart?.[0].startOffset).toBe(0)
    expect(schema.hasPart?.[0].endOffset).toBe(60)
  })

  it('indicates transcript availability', () => {
    const episode = createMockEpisode({ transcript: 'Full transcript here...' })
    const schema = generatePodcastEpisodeSchema({
      episode,
      showName: 'Test Podcast',
    })

    expect(schema.transcript).toBe('Transcript available')
  })

  it('handles episode without optional fields', () => {
    const episode = createMockEpisode({
      description: null,
      published_at: null,
      audio_url: null,
      guest_name: null,
      transcript: null,
    })
    const schema = generatePodcastEpisodeSchema({
      episode,
      showName: 'Test Podcast',
    })

    expect(schema.description).toBeUndefined()
    expect(schema.datePublished).toBeUndefined()
    expect(schema.audio).toBeUndefined()
    expect(schema.contributor).toBeUndefined()
    expect(schema.transcript).toBeUndefined()
  })

  it('uses "Untitled Episode" for missing title', () => {
    const episode = createMockEpisode({ title: null })
    const schema = generatePodcastEpisodeSchema({
      episode,
      showName: 'Test Podcast',
    })

    expect(schema.name).toBe('Untitled Episode')
  })
})

describe('schemaToJsonLd', () => {
  it('converts schema to formatted JSON string', () => {
    const schema = generateSampleSchema()
    const jsonLd = schemaToJsonLd(schema)

    expect(typeof jsonLd).toBe('string')
    expect(() => JSON.parse(jsonLd)).not.toThrow()
  })

  it('includes proper indentation', () => {
    const schema = generateSampleSchema()
    const jsonLd = schemaToJsonLd(schema)

    expect(jsonLd).toContain('\n')
    expect(jsonLd).toContain('  ')
  })

  it('preserves all schema properties', () => {
    const schema = generateSampleSchema()
    const jsonLd = schemaToJsonLd(schema)
    const parsed = JSON.parse(jsonLd)

    expect(parsed['@context']).toBe(schema['@context'])
    expect(parsed['@type']).toBe(schema['@type'])
    expect(parsed.name).toBe(schema.name)
  })
})

describe('generateSchemaScriptTag', () => {
  it('wraps schema in script tag', () => {
    const schema = generateSampleSchema()
    const scriptTag = generateSchemaScriptTag(schema)

    expect(scriptTag).toContain('<script type="application/ld+json">')
    expect(scriptTag).toContain('</script>')
  })

  it('includes the schema content', () => {
    const schema = generateSampleSchema()
    const scriptTag = generateSchemaScriptTag(schema)

    expect(scriptTag).toContain('"@context": "https://schema.org"')
    expect(scriptTag).toContain('"@type": "PodcastEpisode"')
  })
})

describe('validateSchema', () => {
  it('validates a complete schema', () => {
    const schema = generateSampleSchema()
    const result = validateSchema(schema)

    expect(result.valid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it('returns error for missing name', () => {
    const schema = { ...generateSampleSchema(), name: '' }
    const result = validateSchema(schema)

    expect(result.valid).toBe(false)
    expect(result.errors).toContain('Episode name is required')
  })

  it('returns error for untitled episode', () => {
    const schema = { ...generateSampleSchema(), name: 'Untitled Episode' }
    const result = validateSchema(schema)

    expect(result.valid).toBe(false)
    expect(result.errors).toContain('Episode name is required')
  })

  it('returns warning for missing description', () => {
    const schema = { ...generateSampleSchema() }
    delete schema.description
    const result = validateSchema(schema)

    expect(result.warnings).toContain('Description is recommended for better search visibility')
  })

  it('returns warning for missing publish date', () => {
    const schema = { ...generateSampleSchema() }
    delete schema.datePublished
    const result = validateSchema(schema)

    expect(result.warnings).toContain('Publish date helps with search result freshness')
  })

  it('returns warning for missing duration', () => {
    const schema = { ...generateSampleSchema() }
    delete schema.duration
    const result = validateSchema(schema)

    expect(result.warnings).toContain('Duration helps users decide to listen')
  })

  it('returns warning for missing audio', () => {
    const schema = { ...generateSampleSchema() }
    delete schema.audio
    const result = validateSchema(schema)

    expect(result.warnings).toContain('Audio URL is recommended for podcast discovery')
  })

  it('returns warning for missing series', () => {
    const schema = { ...generateSampleSchema() }
    delete schema.partOfSeries
    const result = validateSchema(schema)

    expect(result.warnings).toContain('Link to podcast series improves navigation')
  })

  it('collects multiple warnings', () => {
    const schema = {
      '@context': 'https://schema.org' as const,
      '@type': 'PodcastEpisode' as const,
      name: 'Test Episode',
    }
    const result = validateSchema(schema)

    expect(result.valid).toBe(true)
    expect(result.warnings.length).toBeGreaterThan(3)
  })
})

describe('generateSampleSchema', () => {
  it('returns a valid schema object', () => {
    const sample = generateSampleSchema()

    expect(sample['@context']).toBe('https://schema.org')
    expect(sample['@type']).toBe('PodcastEpisode')
    expect(sample.name).toBeDefined()
  })

  it('includes all recommended fields', () => {
    const sample = generateSampleSchema()

    expect(sample.description).toBeDefined()
    expect(sample.datePublished).toBeDefined()
    expect(sample.duration).toBeDefined()
    expect(sample.audio).toBeDefined()
    expect(sample.partOfSeries).toBeDefined()
  })

  it('includes sample chapters', () => {
    const sample = generateSampleSchema()

    expect(sample.hasPart).toBeDefined()
    expect(sample.hasPart?.length).toBeGreaterThan(0)
  })

  it('includes sample contributor', () => {
    const sample = generateSampleSchema()

    expect(sample.contributor).toBeDefined()
    expect(sample.contributor?.length).toBe(1)
  })

  it('passes validation', () => {
    const sample = generateSampleSchema()
    const result = validateSchema(sample)

    expect(result.valid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })
})
