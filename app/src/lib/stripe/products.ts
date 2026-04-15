/**
 * Stripe Pricing Products — UI display layer
 *
 * This file provides the *display* shape of pricing data used by the settings
 * page and landing page. The *source of truth* is `src/lib/pricing.ts` —
 * TIER_CONFIGS. This file mirrors that data in a shape optimized for UI
 * rendering (marketing bullets, highlighted flag for "Most Popular" tag, etc.).
 *
 * If you're changing prices, shows, or minute allocations, edit `pricing.ts`
 * and update this file to match.
 */

import { TIER_CONFIGS, type SubscriptionTier } from '@/lib/pricing';

// Re-export the canonical tier type so existing imports continue to work.
export type PricingTier = SubscriptionTier;

export type BillingInterval = 'monthly' | 'annual';

export interface TierFeatures {
  tier: PricingTier;
  name: string;
  price: number;
  priceAnnual: number;
  priceId: string | null;
  features: string[];
  audioMinutesPerMonth: number;
  shows: number;
  teamSeats: number;
  highlighted?: boolean;
}

// Client-safe pricing data — priceIds are resolved server-side only.
// Values mirror TIER_CONFIGS from pricing.ts — keep in sync.
export const PRICING_TIERS: Record<PricingTier, TierFeatures> = {
  pro: {
    tier: 'pro',
    name: TIER_CONFIGS.pro.name,
    price: TIER_CONFIGS.pro.priceMonthly,
    priceAnnual: TIER_CONFIGS.pro.priceAnnual,
    priceId: null, // Resolved server-side via getServerPriceId()
    audioMinutesPerMonth: TIER_CONFIGS.pro.audioMinutesPerMonth,
    shows: TIER_CONFIGS.pro.maxShows,
    teamSeats: TIER_CONFIGS.pro.teamSeats,
    highlighted: true,
    features: TIER_CONFIGS.pro.displayFeatures,
  },
  creator: {
    tier: 'creator',
    name: TIER_CONFIGS.creator.name,
    price: TIER_CONFIGS.creator.priceMonthly,
    priceAnnual: TIER_CONFIGS.creator.priceAnnual,
    priceId: null, // Resolved server-side via getServerPriceId()
    audioMinutesPerMonth: TIER_CONFIGS.creator.audioMinutesPerMonth,
    shows: TIER_CONFIGS.creator.maxShows,
    teamSeats: TIER_CONFIGS.creator.teamSeats,
    features: TIER_CONFIGS.creator.displayFeatures,
  },
  agency: {
    tier: 'agency',
    name: TIER_CONFIGS.agency.name,
    price: TIER_CONFIGS.agency.priceMonthly,
    priceAnnual: TIER_CONFIGS.agency.priceAnnual,
    priceId: null, // Resolved server-side via getServerPriceId()
    audioMinutesPerMonth: TIER_CONFIGS.agency.audioMinutesPerMonth,
    shows: TIER_CONFIGS.agency.maxShows,
    teamSeats: TIER_CONFIGS.agency.teamSeats,
    features: TIER_CONFIGS.agency.displayFeatures,
  },
};

// Server-only price functions have been moved to ./products.server.ts
// to prevent accidental client-side usage of process.env secrets.
