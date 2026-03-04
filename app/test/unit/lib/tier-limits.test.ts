/**
 * Tests for tier-limits.ts
 *
 * The tier system IS the business model. Bugs here mean either:
 * - Free users get unlimited access (revenue loss)
 * - Paying users get locked out (churn)
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Supabase before importing
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

import { getTierLimits, canGenerateAssetType, CORE_ASSET_TYPES } from '@/lib/tier-limits';
import type { TierLimits } from '@/lib/tier-limits';

describe('getTierLimits', () => {
  it('returns correct limits for free tier', () => {
    const limits = getTierLimits('free');
    expect(limits.audioHoursPerMonth).toBe(1);
    expect(limits.maxShows).toBe(1);
    expect(limits.teamSeats).toBe(1);
    expect(limits.features.advancedAssets).toBe(false);
  });

  it('returns correct limits for pro tier', () => {
    const limits = getTierLimits('pro');
    expect(limits.audioHoursPerMonth).toBe(10);
    expect(limits.maxShows).toBe(3);
    expect(limits.teamSeats).toBe(1);
    expect(limits.features.advancedAssets).toBe(true);
  });

  it('returns correct limits for creator tier', () => {
    const limits = getTierLimits('creator');
    expect(limits.audioHoursPerMonth).toBe(25);
    expect(limits.maxShows).toBe(10);
    expect(limits.teamSeats).toBe(3);
    expect(limits.features.advancedAssets).toBe(true);
  });

  it('returns correct limits for agency tier', () => {
    const limits = getTierLimits('agency');
    expect(limits.audioHoursPerMonth).toBe(100);
    expect(limits.maxShows).toBe(999);
    expect(limits.teamSeats).toBe(10);
    expect(limits.features.advancedAssets).toBe(true);
  });

  it('defaults to free tier for unknown tier names', () => {
    const limits = getTierLimits('enterprise');
    expect(limits.audioHoursPerMonth).toBe(1);
    expect(limits.maxShows).toBe(1);
  });

  it('defaults to free tier for empty string', () => {
    const limits = getTierLimits('');
    expect(limits.audioHoursPerMonth).toBe(1);
  });

  it('free tier has strictly fewer resources than pro', () => {
    const free = getTierLimits('free');
    const pro = getTierLimits('pro');

    expect(pro.audioHoursPerMonth).toBeGreaterThan(free.audioHoursPerMonth);
    expect(pro.maxShows).toBeGreaterThan(free.maxShows);
    expect(pro.features.advancedAssets).toBe(true);
    expect(free.features.advancedAssets).toBe(false);
  });

  it('pro tier has strictly fewer resources than creator', () => {
    const pro = getTierLimits('pro');
    const creator = getTierLimits('creator');

    expect(creator.audioHoursPerMonth).toBeGreaterThan(pro.audioHoursPerMonth);
    expect(creator.maxShows).toBeGreaterThan(pro.maxShows);
    expect(creator.teamSeats).toBeGreaterThan(pro.teamSeats);
  });

  it('creator tier has strictly fewer resources than agency', () => {
    const creator = getTierLimits('creator');
    const agency = getTierLimits('agency');

    expect(agency.audioHoursPerMonth).toBeGreaterThan(creator.audioHoursPerMonth);
    expect(agency.maxShows).toBeGreaterThan(creator.maxShows);
    expect(agency.teamSeats).toBeGreaterThan(creator.teamSeats);
  });

  it('tier hierarchy is monotonically increasing', () => {
    const free = getTierLimits('free');
    const pro = getTierLimits('pro');
    const creator = getTierLimits('creator');
    const agency = getTierLimits('agency');

    // Audio hours: free < pro < creator < agency
    expect(free.audioHoursPerMonth).toBeLessThan(pro.audioHoursPerMonth);
    expect(pro.audioHoursPerMonth).toBeLessThan(creator.audioHoursPerMonth);
    expect(creator.audioHoursPerMonth).toBeLessThan(agency.audioHoursPerMonth);

    // Shows: free < pro < creator < agency
    expect(free.maxShows).toBeLessThan(pro.maxShows);
    expect(pro.maxShows).toBeLessThan(creator.maxShows);
    expect(creator.maxShows).toBeLessThan(agency.maxShows);

    // Team seats: free <= pro < creator < agency
    expect(free.teamSeats).toBeLessThanOrEqual(pro.teamSeats);
    expect(pro.teamSeats).toBeLessThan(creator.teamSeats);
    expect(creator.teamSeats).toBeLessThan(agency.teamSeats);
  });

  it('only advancedAssets feature flag exists', () => {
    for (const tierName of ['free', 'pro', 'creator', 'agency']) {
      const limits = getTierLimits(tierName);
      const featureKeys = Object.keys(limits.features);
      expect(featureKeys).toEqual(['advancedAssets']);
      expect(typeof limits.features.advancedAssets).toBe('boolean');
    }
  });

  it('advancedAssets is false only for free tier', () => {
    expect(getTierLimits('free').features.advancedAssets).toBe(false);
    expect(getTierLimits('pro').features.advancedAssets).toBe(true);
    expect(getTierLimits('creator').features.advancedAssets).toBe(true);
    expect(getTierLimits('agency').features.advancedAssets).toBe(true);
  });
});

describe('canGenerateAssetType', () => {
  it('allows core assets for free tier', () => {
    for (const assetType of CORE_ASSET_TYPES) {
      expect(canGenerateAssetType('free', assetType)).toBe(true);
    }
  });

  it('blocks advanced assets for free tier', () => {
    expect(canGenerateAssetType('free', 'twitter_thread')).toBe(false);
    expect(canGenerateAssetType('free', 'linkedin_post')).toBe(false);
    expect(canGenerateAssetType('free', 'blog_post')).toBe(false);
  });

  it('allows advanced assets for paid tiers', () => {
    for (const tier of ['pro', 'creator', 'agency']) {
      expect(canGenerateAssetType(tier, 'twitter_thread')).toBe(true);
      expect(canGenerateAssetType(tier, 'linkedin_post')).toBe(true);
      expect(canGenerateAssetType(tier, 'blog_post')).toBe(true);
    }
  });

  it('allows core assets for all tiers', () => {
    for (const tier of ['free', 'pro', 'creator', 'agency']) {
      expect(canGenerateAssetType(tier, 'show_notes')).toBe(true);
      expect(canGenerateAssetType(tier, 'transcript_summary')).toBe(true);
    }
  });
});
