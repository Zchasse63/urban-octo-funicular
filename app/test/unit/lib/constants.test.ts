/**
 * Constants Unit Tests
 */

import { describe, it, expect } from 'vitest'
import {
  DEFAULT_USER_ID,
  RATE_LIMITS,
  TIMEOUTS,
  PROCESSING,
  PAGINATION,
  SUBSCRIPTION_TIERS,
  SUPPORTED_AUDIO_FORMATS,
  ASSET_TYPES,
} from '@/lib/constants'

describe('DEFAULT_USER_ID', () => {
  it('is a valid UUID format', () => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    expect(uuidRegex.test(DEFAULT_USER_ID)).toBe(true)
  })

  it('is the expected placeholder value', () => {
    expect(DEFAULT_USER_ID).toBe('00000000-0000-0000-0000-000000000001')
  })
})

describe('RATE_LIMITS', () => {
  it('has default rate limit', () => {
    expect(RATE_LIMITS.default).toBe(60)
  })

  it('has processing rate limit', () => {
    expect(RATE_LIMITS.processing).toBe(10)
  })

  it('has asset generation rate limit', () => {
    expect(RATE_LIMITS.assetGeneration).toBe(30)
  })

  it('processing limit is stricter than default', () => {
    expect(RATE_LIMITS.processing).toBeLessThan(RATE_LIMITS.default)
  })
})

describe('TIMEOUTS', () => {
  it('has transcription timeout of 8 hours', () => {
    expect(TIMEOUTS.transcription).toBe(8 * 60 * 60 * 1000)
  })

  it('has show notes generation timeout of 60 seconds', () => {
    expect(TIMEOUTS.showNotesGeneration).toBe(60 * 1000)
  })

  it('has asset generation timeout of 30 seconds', () => {
    expect(TIMEOUTS.assetGeneration).toBe(30 * 1000)
  })

  it('has full processing timeout of 30 minutes', () => {
    expect(TIMEOUTS.fullProcessing).toBe(30 * 60 * 1000)
  })

  it('has API request timeout of 30 seconds', () => {
    expect(TIMEOUTS.apiRequest).toBe(30 * 1000)
  })

  it('transcription timeout is greater than full processing', () => {
    expect(TIMEOUTS.transcription).toBeGreaterThan(TIMEOUTS.fullProcessing)
  })
})

describe('PROCESSING', () => {
  it('has max audio duration of 4 hours in seconds', () => {
    expect(PROCESSING.maxAudioDuration).toBe(4 * 60 * 60)
  })

  it('has max file size of 500MB', () => {
    expect(PROCESSING.maxFileSize).toBe(500 * 1024 * 1024)
  })

  it('has target cost per episode of $0.15', () => {
    expect(PROCESSING.targetCostPerEpisode).toBe(0.15)
  })
})

describe('PAGINATION', () => {
  it('has default page size of 20', () => {
    expect(PAGINATION.defaultPageSize).toBe(20)
  })

  it('has max page size of 100', () => {
    expect(PAGINATION.maxPageSize).toBe(100)
  })

  it('default is less than or equal to max', () => {
    expect(PAGINATION.defaultPageSize).toBeLessThanOrEqual(PAGINATION.maxPageSize)
  })
})

describe('SUBSCRIPTION_TIERS', () => {
  describe('free tier', () => {
    it('has correct name', () => {
      expect(SUBSCRIPTION_TIERS.free.name).toBe('Free')
    })

    it('allows 3 episodes per month', () => {
      expect(SUBSCRIPTION_TIERS.free.episodesPerMonth).toBe(3)
    })

    it('allows 1 show', () => {
      expect(SUBSCRIPTION_TIERS.free.maxShows).toBe(1)
    })

    it('allows 1 team seat', () => {
      expect(SUBSCRIPTION_TIERS.free.teamSeats).toBe(1)
    })

    it('costs $0', () => {
      expect(SUBSCRIPTION_TIERS.free.priceMonthly).toBe(0)
    })
  })

  describe('pro tier', () => {
    it('has correct name', () => {
      expect(SUBSCRIPTION_TIERS.pro.name).toBe('Pro')
    })

    it('allows 50 episodes per month', () => {
      expect(SUBSCRIPTION_TIERS.pro.episodesPerMonth).toBe(50)
    })

    it('allows 5 shows', () => {
      expect(SUBSCRIPTION_TIERS.pro.maxShows).toBe(5)
    })

    it('allows 1 team seat', () => {
      expect(SUBSCRIPTION_TIERS.pro.teamSeats).toBe(1)
    })

    it('costs $19', () => {
      expect(SUBSCRIPTION_TIERS.pro.priceMonthly).toBe(19)
    })
  })

  describe('agency tier', () => {
    it('has correct name', () => {
      expect(SUBSCRIPTION_TIERS.agency.name).toBe('Agency')
    })

    it('allows 200 episodes per month', () => {
      expect(SUBSCRIPTION_TIERS.agency.episodesPerMonth).toBe(200)
    })

    it('allows 999 shows', () => {
      expect(SUBSCRIPTION_TIERS.agency.maxShows).toBe(999)
    })

    it('allows 5 team seats', () => {
      expect(SUBSCRIPTION_TIERS.agency.teamSeats).toBe(5)
    })

    it('costs $49', () => {
      expect(SUBSCRIPTION_TIERS.agency.priceMonthly).toBe(49)
    })
  })

  it('tier prices increase with features', () => {
    expect(SUBSCRIPTION_TIERS.free.priceMonthly).toBeLessThan(SUBSCRIPTION_TIERS.pro.priceMonthly)
    expect(SUBSCRIPTION_TIERS.pro.priceMonthly).toBeLessThan(SUBSCRIPTION_TIERS.agency.priceMonthly)
  })
})

describe('SUPPORTED_AUDIO_FORMATS', () => {
  it('includes MP3 formats', () => {
    expect(SUPPORTED_AUDIO_FORMATS).toContain('audio/mpeg')
    expect(SUPPORTED_AUDIO_FORMATS).toContain('audio/mp3')
  })

  it('includes MP4/M4A formats', () => {
    expect(SUPPORTED_AUDIO_FORMATS).toContain('audio/mp4')
    expect(SUPPORTED_AUDIO_FORMATS).toContain('audio/m4a')
  })

  it('includes WAV formats', () => {
    expect(SUPPORTED_AUDIO_FORMATS).toContain('audio/wav')
    expect(SUPPORTED_AUDIO_FORMATS).toContain('audio/x-wav')
  })

  it('includes AAC format', () => {
    expect(SUPPORTED_AUDIO_FORMATS).toContain('audio/aac')
  })

  it('includes OGG format', () => {
    expect(SUPPORTED_AUDIO_FORMATS).toContain('audio/ogg')
  })

  it('includes WebM format', () => {
    expect(SUPPORTED_AUDIO_FORMATS).toContain('audio/webm')
  })

  it('is a non-empty array', () => {
    expect(SUPPORTED_AUDIO_FORMATS.length).toBeGreaterThan(0)
  })
})

describe('ASSET_TYPES', () => {
  it('includes show_notes', () => {
    expect(ASSET_TYPES).toContain('show_notes')
  })

  it('includes social media types', () => {
    expect(ASSET_TYPES).toContain('linkedin_post')
    expect(ASSET_TYPES).toContain('twitter_thread')
    expect(ASSET_TYPES).toContain('instagram_carousel')
    expect(ASSET_TYPES).toContain('tiktok_hook')
  })

  it('includes content types', () => {
    expect(ASSET_TYPES).toContain('newsletter')
    expect(ASSET_TYPES).toContain('blog_post')
    expect(ASSET_TYPES).toContain('youtube_description')
  })

  it('includes visual types', () => {
    expect(ASSET_TYPES).toContain('quote_card')
    expect(ASSET_TYPES).toContain('audiogram')
  })

  it('has at least 10 asset types', () => {
    expect(ASSET_TYPES.length).toBeGreaterThanOrEqual(10)
  })
})
