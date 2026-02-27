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

import { getTierLimits } from '@/lib/tier-limits';
import type { TierLimits } from '@/lib/tier-limits';

describe('getTierLimits', () => {
  it('returns correct limits for free tier', () => {
    const limits = getTierLimits('free');
    expect(limits.episodesPerMonth).toBe(3);
    expect(limits.maxShows).toBe(1);
    expect(limits.teamSeats).toBe(1);
    expect(limits.features.advancedAssets).toBe(false);
    expect(limits.features.buzzsproutIntegration).toBe(false);
    expect(limits.features.whiteLabel).toBe(false);
    expect(limits.features.apiAccess).toBe(false);
  });

  it('returns correct limits for pro tier', () => {
    const limits = getTierLimits('pro');
    expect(limits.episodesPerMonth).toBe(50);
    expect(limits.maxShows).toBe(5);
    expect(limits.teamSeats).toBe(1);
    expect(limits.features.advancedAssets).toBe(true);
    expect(limits.features.buzzsproutIntegration).toBe(true);
    expect(limits.features.customTemplates).toBe(true);
    expect(limits.features.whiteLabel).toBe(false);
    expect(limits.features.apiAccess).toBe(false);
  });

  it('returns correct limits for agency tier', () => {
    const limits = getTierLimits('agency');
    expect(limits.episodesPerMonth).toBe(200);
    expect(limits.maxShows).toBe(999);
    expect(limits.teamSeats).toBe(5);
    expect(limits.features.advancedAssets).toBe(true);
    expect(limits.features.buzzsproutIntegration).toBe(true);
    expect(limits.features.customTemplates).toBe(true);
    expect(limits.features.whiteLabel).toBe(true);
    expect(limits.features.apiAccess).toBe(true);
  });

  it('defaults to free tier for unknown tier names', () => {
    const limits = getTierLimits('enterprise');
    expect(limits.episodesPerMonth).toBe(3);
    expect(limits.maxShows).toBe(1);
  });

  it('defaults to free tier for empty string', () => {
    const limits = getTierLimits('');
    expect(limits.episodesPerMonth).toBe(3);
  });

  it('free tier has strictly fewer features than pro', () => {
    const free = getTierLimits('free');
    const pro = getTierLimits('pro');

    expect(pro.episodesPerMonth).toBeGreaterThan(free.episodesPerMonth);
    expect(pro.maxShows).toBeGreaterThan(free.maxShows);
    expect(pro.features.advancedAssets).toBe(true);
    expect(free.features.advancedAssets).toBe(false);
  });

  it('pro tier has strictly fewer features than agency', () => {
    const pro = getTierLimits('pro');
    const agency = getTierLimits('agency');

    expect(agency.episodesPerMonth).toBeGreaterThan(pro.episodesPerMonth);
    expect(agency.maxShows).toBeGreaterThan(pro.maxShows);
    expect(agency.teamSeats).toBeGreaterThan(pro.teamSeats);
    expect(agency.features.whiteLabel).toBe(true);
    expect(pro.features.whiteLabel).toBe(false);
  });

  it('tier hierarchy is monotonically increasing', () => {
    const free = getTierLimits('free');
    const pro = getTierLimits('pro');
    const agency = getTierLimits('agency');

    // Episodes: free < pro < agency
    expect(free.episodesPerMonth).toBeLessThan(pro.episodesPerMonth);
    expect(pro.episodesPerMonth).toBeLessThan(agency.episodesPerMonth);

    // Shows: free < pro < agency
    expect(free.maxShows).toBeLessThan(pro.maxShows);
    expect(pro.maxShows).toBeLessThan(agency.maxShows);

    // Team seats: free <= pro < agency
    expect(free.teamSeats).toBeLessThanOrEqual(pro.teamSeats);
    expect(pro.teamSeats).toBeLessThan(agency.teamSeats);
  });

  it('every tier has all required feature flags defined', () => {
    const requiredFeatures = [
      'advancedAssets',
      'buzzsproutIntegration',
      'customTemplates',
      'whiteLabel',
      'apiAccess',
    ];

    for (const tierName of ['free', 'pro', 'agency']) {
      const limits = getTierLimits(tierName);
      for (const feature of requiredFeatures) {
        expect(
          typeof limits.features[feature as keyof typeof limits.features]
        ).toBe('boolean');
      }
    }
  });
});
