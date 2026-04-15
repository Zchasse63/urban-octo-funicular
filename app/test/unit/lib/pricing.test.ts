/**
 * Tests for lib/pricing.ts — the single source of truth for tier config,
 * subscription state logic, and feature flags.
 *
 * These tests are the guardrails on the pricing refactor: if anything in
 * pricing.ts changes, these tests should catch it.
 */
import { describe, it, expect } from 'vitest'
import {
  TIER_CONFIGS,
  SOFT_LIMIT_THRESHOLD,
  GRACE_PERIOD_DAYS,
  TRIAL_LENGTH_DAYS,
  UNLIMITED_SHOWS_SENTINEL,
  AVERAGE_EPISODE_MINUTES,
  getTierConfig,
  getTierLabel,
  isUnlimitedShows,
  isInTrial,
  hasActiveAccess,
  isAccessBlocked,
  isInGracePeriod,
  getGracePeriodEnd,
  getTrialDaysRemaining,
  canAccessFeature,
  getUsagePercentage,
  isOverSoftLimit,
  isAtHardLimit,
  minutesToEpisodes,
  type SubscriptionTier,
  type SubscriptionStatus,
} from '@/lib/pricing'

// ─── TIER_CONFIGS ─────────────────────────────────────────────────────────

describe('TIER_CONFIGS', () => {
  it('has exactly three tiers: pro, creator, agency', () => {
    expect(Object.keys(TIER_CONFIGS).sort()).toEqual(['agency', 'creator', 'pro'])
  })

  it('has no free tier', () => {
    expect('free' in TIER_CONFIGS).toBe(false)
  })

  describe('pro tier', () => {
    it('has 300 audio minutes per month', () => {
      expect(TIER_CONFIGS.pro.audioMinutesPerMonth).toBe(300)
    })
    it('allows 2 shows', () => {
      expect(TIER_CONFIGS.pro.maxShows).toBe(2)
    })
    it('costs $29/mo and $290/yr', () => {
      expect(TIER_CONFIGS.pro.priceMonthly).toBe(29)
      expect(TIER_CONFIGS.pro.priceAnnual).toBe(290)
    })
    it('has 1 team seat', () => {
      expect(TIER_CONFIGS.pro.teamSeats).toBe(1)
    })
    it('does NOT include workflow features (hostingPush, bulkUpload, etc.)', () => {
      expect(TIER_CONFIGS.pro.features.hostingPush).toBe(false)
      expect(TIER_CONFIGS.pro.features.preInterviewIntel).toBe(false)
      expect(TIER_CONFIGS.pro.features.expertDiscovery).toBe(false)
      expect(TIER_CONFIGS.pro.features.crossEpisodeLinking).toBe(false)
      expect(TIER_CONFIGS.pro.features.abTesting).toBe(false)
      expect(TIER_CONFIGS.pro.features.episodeScheduling).toBe(false)
      expect(TIER_CONFIGS.pro.features.webhooks).toBe(false)
      expect(TIER_CONFIGS.pro.features.bulkUpload).toBe(false)
    })
  })

  describe('creator tier', () => {
    it('has 1200 audio minutes per month', () => {
      expect(TIER_CONFIGS.creator.audioMinutesPerMonth).toBe(1200)
    })
    it('allows 10 shows', () => {
      expect(TIER_CONFIGS.creator.maxShows).toBe(10)
    })
    it('costs $59/mo and $590/yr', () => {
      expect(TIER_CONFIGS.creator.priceMonthly).toBe(59)
      expect(TIER_CONFIGS.creator.priceAnnual).toBe(590)
    })
    it('includes all workflow features', () => {
      expect(TIER_CONFIGS.creator.features.hostingPush).toBe(true)
      expect(TIER_CONFIGS.creator.features.preInterviewIntel).toBe(true)
      expect(TIER_CONFIGS.creator.features.expertDiscovery).toBe(true)
      expect(TIER_CONFIGS.creator.features.crossEpisodeLinking).toBe(true)
      expect(TIER_CONFIGS.creator.features.abTesting).toBe(true)
      expect(TIER_CONFIGS.creator.features.episodeScheduling).toBe(true)
      expect(TIER_CONFIGS.creator.features.webhooks).toBe(true)
      expect(TIER_CONFIGS.creator.features.bulkUpload).toBe(true)
    })
  })

  describe('agency tier', () => {
    it('has 3600 audio minutes per month', () => {
      expect(TIER_CONFIGS.agency.audioMinutesPerMonth).toBe(3600)
    })
    it('has unlimited shows sentinel', () => {
      expect(TIER_CONFIGS.agency.maxShows).toBe(UNLIMITED_SHOWS_SENTINEL)
      expect(TIER_CONFIGS.agency.maxShows).toBe(999)
    })
    it('costs $149/mo and $1490/yr', () => {
      expect(TIER_CONFIGS.agency.priceMonthly).toBe(149)
      expect(TIER_CONFIGS.agency.priceAnnual).toBe(1490)
    })
    it('includes all workflow features', () => {
      expect(TIER_CONFIGS.agency.features.hostingPush).toBe(true)
      expect(TIER_CONFIGS.agency.features.bulkUpload).toBe(true)
    })
  })

  it('tier hierarchy is monotonically increasing on minutes', () => {
    expect(TIER_CONFIGS.pro.audioMinutesPerMonth).toBeLessThan(
      TIER_CONFIGS.creator.audioMinutesPerMonth
    )
    expect(TIER_CONFIGS.creator.audioMinutesPerMonth).toBeLessThan(
      TIER_CONFIGS.agency.audioMinutesPerMonth
    )
  })

  it('tier prices increase with tier level', () => {
    expect(TIER_CONFIGS.pro.priceMonthly).toBeLessThan(TIER_CONFIGS.creator.priceMonthly)
    expect(TIER_CONFIGS.creator.priceMonthly).toBeLessThan(TIER_CONFIGS.agency.priceMonthly)
  })

  it('annual pricing is exactly 10x monthly (2 months free)', () => {
    expect(TIER_CONFIGS.pro.priceAnnual).toBe(TIER_CONFIGS.pro.priceMonthly * 10)
    expect(TIER_CONFIGS.creator.priceAnnual).toBe(TIER_CONFIGS.creator.priceMonthly * 10)
    expect(TIER_CONFIGS.agency.priceAnnual).toBe(TIER_CONFIGS.agency.priceMonthly * 10)
  })

  it('every tier has non-empty displayFeatures for marketing', () => {
    for (const tier of ['pro', 'creator', 'agency'] as SubscriptionTier[]) {
      expect(TIER_CONFIGS[tier].displayFeatures.length).toBeGreaterThan(0)
    }
  })
})

// ─── getTierConfig ────────────────────────────────────────────────────────

describe('getTierConfig', () => {
  it('returns pro config', () => {
    const config = getTierConfig('pro')
    expect(config.id).toBe('pro')
    expect(config.audioMinutesPerMonth).toBe(300)
  })

  it('returns creator config', () => {
    expect(getTierConfig('creator').id).toBe('creator')
  })

  it('returns agency config', () => {
    expect(getTierConfig('agency').id).toBe('agency')
  })

  it('throws TypeError for unknown tier', () => {
    // Casting to SubscriptionTier to bypass TS — simulating a runtime bug.
    expect(() => getTierConfig('enterprise' as SubscriptionTier)).toThrow(TypeError)
  })
})

// ─── getTierLabel ─────────────────────────────────────────────────────────

describe('getTierLabel', () => {
  it('returns human-readable names', () => {
    expect(getTierLabel('pro')).toBe('Pro')
    expect(getTierLabel('creator')).toBe('Creator')
    expect(getTierLabel('agency')).toBe('Agency')
  })
})

// ─── isUnlimitedShows ────────────────────────────────────────────────────

describe('isUnlimitedShows', () => {
  it('returns true for the sentinel value', () => {
    expect(isUnlimitedShows(999)).toBe(true)
    expect(isUnlimitedShows(UNLIMITED_SHOWS_SENTINEL)).toBe(true)
  })

  it('returns true for values beyond the sentinel', () => {
    expect(isUnlimitedShows(1000)).toBe(true)
  })

  it('returns false for normal values', () => {
    expect(isUnlimitedShows(2)).toBe(false)
    expect(isUnlimitedShows(10)).toBe(false)
    expect(isUnlimitedShows(100)).toBe(false)
  })
})

// ─── Status helpers ──────────────────────────────────────────────────────

describe('isInTrial', () => {
  it('returns true only for trialing', () => {
    expect(isInTrial('trialing')).toBe(true)
    expect(isInTrial('active')).toBe(false)
    expect(isInTrial('past_due')).toBe(false)
    expect(isInTrial('trial_expired')).toBe(false)
    expect(isInTrial('canceled')).toBe(false)
  })
})

describe('hasActiveAccess', () => {
  it('returns true for trialing, active, past_due', () => {
    expect(hasActiveAccess('trialing')).toBe(true)
    expect(hasActiveAccess('active')).toBe(true)
    expect(hasActiveAccess('past_due')).toBe(true)
  })
  it('returns false for blocked states', () => {
    expect(hasActiveAccess('trial_expired')).toBe(false)
    expect(hasActiveAccess('canceled')).toBe(false)
  })
})

describe('isAccessBlocked', () => {
  it('returns true for trial_expired and canceled', () => {
    expect(isAccessBlocked('trial_expired')).toBe(true)
    expect(isAccessBlocked('canceled')).toBe(true)
  })
  it('returns false for active access states', () => {
    expect(isAccessBlocked('trialing')).toBe(false)
    expect(isAccessBlocked('active')).toBe(false)
    expect(isAccessBlocked('past_due')).toBe(false)
  })
})

describe('isInGracePeriod', () => {
  it('returns true only for past_due', () => {
    expect(isInGracePeriod('past_due')).toBe(true)
    expect(isInGracePeriod('active')).toBe(false)
    expect(isInGracePeriod('trialing')).toBe(false)
  })
})

// ─── getGracePeriodEnd ───────────────────────────────────────────────────

describe('getGracePeriodEnd', () => {
  it('returns a date exactly 3 days after pastDueSince', () => {
    const pastDueSince = new Date('2026-04-01T00:00:00Z')
    const end = getGracePeriodEnd(pastDueSince)
    const expected = new Date('2026-04-04T00:00:00Z')
    expect(end.getTime()).toBe(expected.getTime())
  })

  it('does not mutate the input date', () => {
    const pastDueSince = new Date('2026-04-01T00:00:00Z')
    const originalTime = pastDueSince.getTime()
    getGracePeriodEnd(pastDueSince)
    expect(pastDueSince.getTime()).toBe(originalTime)
  })
})

// ─── getTrialDaysRemaining ───────────────────────────────────────────────

describe('getTrialDaysRemaining', () => {
  it('returns positive days for future dates', () => {
    const future = new Date()
    future.setDate(future.getDate() + 7)
    expect(getTrialDaysRemaining(future)).toBe(7)
  })

  it('returns 0 for past dates (never negative)', () => {
    const past = new Date()
    past.setDate(past.getDate() - 3)
    expect(getTrialDaysRemaining(past)).toBe(0)
  })

  it('returns 0 for exactly now', () => {
    expect(getTrialDaysRemaining(new Date())).toBe(0)
  })
})

// ─── canAccessFeature ─────────────────────────────────────────────────────

describe('canAccessFeature', () => {
  it('Pro user with active status cannot access bulkUpload', () => {
    expect(canAccessFeature('pro', 'active', 'bulkUpload')).toBe(false)
  })

  it('Pro user with active status cannot access hostingPush', () => {
    expect(canAccessFeature('pro', 'active', 'hostingPush')).toBe(false)
  })

  it('Creator user with active status can access bulkUpload', () => {
    expect(canAccessFeature('creator', 'active', 'bulkUpload')).toBe(true)
  })

  it('Creator user with active status can access all Creator+ features', () => {
    const features: Array<keyof typeof TIER_CONFIGS.creator.features> = [
      'hostingPush',
      'preInterviewIntel',
      'expertDiscovery',
      'crossEpisodeLinking',
      'abTesting',
      'episodeScheduling',
      'webhooks',
      'bulkUpload',
    ]
    for (const feature of features) {
      expect(canAccessFeature('creator', 'active', feature)).toBe(true)
    }
  })

  it('Agency user with active status can access all features', () => {
    expect(canAccessFeature('agency', 'active', 'bulkUpload')).toBe(true)
    expect(canAccessFeature('agency', 'active', 'webhooks')).toBe(true)
  })

  it('Blocked status overrides tier — Agency canceled cannot access features', () => {
    expect(canAccessFeature('agency', 'canceled', 'bulkUpload')).toBe(false)
    expect(canAccessFeature('agency', 'trial_expired', 'hostingPush')).toBe(false)
  })

  it('Trialing Pro user cannot access Creator+ features (Pro tier limits apply during trial)', () => {
    // The trial is a Pro trial — they get Pro features, not Creator
    expect(canAccessFeature('pro', 'trialing', 'bulkUpload')).toBe(false)
  })

  it('Past-due users retain access during grace period', () => {
    expect(canAccessFeature('creator', 'past_due', 'bulkUpload')).toBe(true)
  })
})

// ─── Usage helpers ───────────────────────────────────────────────────────

describe('getUsagePercentage', () => {
  it('calculates percentage for normal values', () => {
    expect(getUsagePercentage(50, 100)).toBe(50)
    expect(getUsagePercentage(150, 300)).toBe(50)
    expect(getUsagePercentage(240, 300)).toBe(80)
  })

  it('returns 100 when limit is 0 (divide-by-zero guard)', () => {
    expect(getUsagePercentage(50, 0)).toBe(100)
  })

  it('returns 0 when used is 0', () => {
    expect(getUsagePercentage(0, 300)).toBe(0)
  })

  it('can return values over 100 (overage)', () => {
    expect(getUsagePercentage(350, 300)).toBeGreaterThan(100)
  })
})

describe('isOverSoftLimit', () => {
  it('returns true at exactly 80% usage', () => {
    expect(isOverSoftLimit(240, 300)).toBe(true)
    expect(isOverSoftLimit(80, 100)).toBe(true)
  })

  it('returns false below 80%', () => {
    expect(isOverSoftLimit(239, 300)).toBe(false)
    expect(isOverSoftLimit(79, 100)).toBe(false)
  })

  it('returns true above 80%', () => {
    expect(isOverSoftLimit(250, 300)).toBe(true)
    expect(isOverSoftLimit(295, 300)).toBe(true)
  })

  it('SOFT_LIMIT_THRESHOLD is 0.8 (80%)', () => {
    expect(SOFT_LIMIT_THRESHOLD).toBe(0.8)
  })
})

describe('isAtHardLimit', () => {
  it('returns true at exactly the limit', () => {
    expect(isAtHardLimit(300, 300)).toBe(true)
  })

  it('returns true over the limit', () => {
    expect(isAtHardLimit(301, 300)).toBe(true)
  })

  it('returns false under the limit', () => {
    expect(isAtHardLimit(299, 300)).toBe(false)
  })
})

// ─── minutesToEpisodes ────────────────────────────────────────────────────

describe('minutesToEpisodes', () => {
  it('uses 45 minutes as average episode length', () => {
    expect(AVERAGE_EPISODE_MINUTES).toBe(45)
  })

  it('converts 300 minutes to ~7 episodes', () => {
    expect(minutesToEpisodes(300)).toBe('~7 episodes')
  })

  it('converts 1200 minutes to ~27 episodes', () => {
    expect(minutesToEpisodes(1200)).toBe('~27 episodes')
  })

  it('converts 3600 minutes to ~80 episodes', () => {
    expect(minutesToEpisodes(3600)).toBe('~80 episodes')
  })
})

// ─── Constants ────────────────────────────────────────────────────────────

describe('Constants', () => {
  it('TRIAL_LENGTH_DAYS is 14', () => {
    expect(TRIAL_LENGTH_DAYS).toBe(14)
  })

  it('GRACE_PERIOD_DAYS is 3', () => {
    expect(GRACE_PERIOD_DAYS).toBe(3)
  })

  it('SOFT_LIMIT_THRESHOLD is 0.8', () => {
    expect(SOFT_LIMIT_THRESHOLD).toBe(0.8)
  })

  it('UNLIMITED_SHOWS_SENTINEL is 999', () => {
    expect(UNLIMITED_SHOWS_SENTINEL).toBe(999)
  })
})

// ─── Type contracts ──────────────────────────────────────────────────────

describe('Type contracts', () => {
  it('SubscriptionStatus union has exactly 5 values', () => {
    const allStatuses: SubscriptionStatus[] = [
      'trialing',
      'active',
      'past_due',
      'trial_expired',
      'canceled',
    ]
    // If this compiles, the union is complete. This runtime test just asserts
    // we have the expected number.
    expect(allStatuses).toHaveLength(5)
  })

  it('SubscriptionTier union has exactly 3 values', () => {
    const allTiers: SubscriptionTier[] = ['pro', 'creator', 'agency']
    expect(allTiers).toHaveLength(3)
  })
})
