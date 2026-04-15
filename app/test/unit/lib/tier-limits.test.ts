/**
 * Tests for tier-limits.ts
 *
 * The tier system IS the business model. Bugs here mean either:
 * - Users get unlimited access (revenue loss)
 * - Paying users get locked out (churn)
 *
 * This file covers the enforcement layer — the thin wrapper over pricing.ts
 * that handles database queries and access-state decisions.
 */
import { describe, it, expect, vi } from 'vitest'

// Mock Supabase before importing
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

import {
  getTierLimits,
  canGenerateAssetType,
  CORE_ASSET_TYPES,
  type TierLimits,
  type SubscriptionTier,
} from '@/lib/tier-limits'

// ─── getTierLimits ────────────────────────────────────────────────────────

describe('getTierLimits', () => {
  it('returns correct limits for pro tier', () => {
    const limits = getTierLimits('pro')
    expect(limits.audioMinutesPerMonth).toBe(300)
    expect(limits.maxShows).toBe(2)
    expect(limits.teamSeats).toBe(1)
  })

  it('returns correct limits for creator tier', () => {
    const limits = getTierLimits('creator')
    expect(limits.audioMinutesPerMonth).toBe(1200)
    expect(limits.maxShows).toBe(10)
    expect(limits.teamSeats).toBe(1)
  })

  it('returns correct limits for agency tier', () => {
    const limits = getTierLimits('agency')
    expect(limits.audioMinutesPerMonth).toBe(3600)
    expect(limits.maxShows).toBe(999)
    expect(limits.teamSeats).toBe(1)
  })

  it('throws TypeError for unknown tier names', () => {
    expect(() => getTierLimits('enterprise' as SubscriptionTier)).toThrow(TypeError)
  })

  it('throws TypeError for empty string', () => {
    expect(() => getTierLimits('' as SubscriptionTier)).toThrow(TypeError)
  })

  it('throws TypeError for free tier (no longer exists)', () => {
    expect(() => getTierLimits('free' as SubscriptionTier)).toThrow(TypeError)
  })

  it('pro tier has strictly fewer minutes than creator', () => {
    const pro = getTierLimits('pro')
    const creator = getTierLimits('creator')
    expect(pro.audioMinutesPerMonth).toBeLessThan(creator.audioMinutesPerMonth)
    expect(pro.maxShows).toBeLessThan(creator.maxShows)
  })

  it('creator tier has strictly fewer minutes than agency', () => {
    const creator = getTierLimits('creator')
    const agency = getTierLimits('agency')
    expect(creator.audioMinutesPerMonth).toBeLessThan(agency.audioMinutesPerMonth)
    expect(creator.maxShows).toBeLessThan(agency.maxShows)
  })

  it('tier hierarchy is monotonically increasing on minutes and shows', () => {
    const pro = getTierLimits('pro')
    const creator = getTierLimits('creator')
    const agency = getTierLimits('agency')

    expect(pro.audioMinutesPerMonth).toBeLessThan(creator.audioMinutesPerMonth)
    expect(creator.audioMinutesPerMonth).toBeLessThan(agency.audioMinutesPerMonth)

    expect(pro.maxShows).toBeLessThan(creator.maxShows)
    expect(creator.maxShows).toBeLessThan(agency.maxShows)
  })

  it('all tiers have teamSeats: 1 (team collab deferred to Phase 2)', () => {
    const tiers: SubscriptionTier[] = ['pro', 'creator', 'agency']
    for (const tier of tiers) {
      expect(getTierLimits(tier).teamSeats).toBe(1)
    }
  })

  it('returned shape includes features object', () => {
    const limits: TierLimits = getTierLimits('creator')
    expect(limits.features).toBeDefined()
    expect(typeof limits.features.bulkUpload).toBe('boolean')
    expect(typeof limits.features.hostingPush).toBe('boolean')
  })

  it('pro tier has bulkUpload: false', () => {
    expect(getTierLimits('pro').features.bulkUpload).toBe(false)
  })

  it('creator tier has bulkUpload: true', () => {
    expect(getTierLimits('creator').features.bulkUpload).toBe(true)
  })

  it('agency tier has bulkUpload: true', () => {
    expect(getTierLimits('agency').features.bulkUpload).toBe(true)
  })
})

// ─── canGenerateAssetType ────────────────────────────────────────────────

describe('canGenerateAssetType', () => {
  it('allows core assets for all paid tiers', () => {
    for (const tier of ['pro', 'creator', 'agency'] as SubscriptionTier[]) {
      for (const assetType of CORE_ASSET_TYPES) {
        expect(canGenerateAssetType(tier, assetType)).toBe(true)
      }
    }
  })

  it('allows advanced assets for all paid tiers (no free tier)', () => {
    for (const tier of ['pro', 'creator', 'agency'] as SubscriptionTier[]) {
      expect(canGenerateAssetType(tier, 'twitter_thread')).toBe(true)
      expect(canGenerateAssetType(tier, 'linkedin_post')).toBe(true)
      expect(canGenerateAssetType(tier, 'blog_post')).toBe(true)
    }
  })

  it('CORE_ASSET_TYPES is retained as documentary even though all assets pass', () => {
    // Post-refactor, CORE_ASSET_TYPES is kept for semantic clarity in the
    // codebase but no longer affects gating. Verify the set is intact.
    expect(CORE_ASSET_TYPES.has('show_notes')).toBe(true)
    expect(CORE_ASSET_TYPES.has('episode_titles')).toBe(true)
    expect(CORE_ASSET_TYPES.has('key_takeaways')).toBe(true)
    expect(CORE_ASSET_TYPES.has('chapter_markers')).toBe(true)
    expect(CORE_ASSET_TYPES.has('transcript_summary')).toBe(true)
    expect(CORE_ASSET_TYPES.has('seo_description')).toBe(true)
  })
})
