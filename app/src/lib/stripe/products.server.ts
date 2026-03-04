/**
 * Server-only Stripe price functions.
 * These access process.env secrets and must NEVER be imported from client components.
 */

import type { PricingTier, BillingInterval } from './products';

/**
 * Get the Stripe price ID for a tier and billing interval. Must be called server-side only.
 */
export function getServerPriceId(
  tier: PricingTier,
  interval: BillingInterval = 'monthly'
): string | null {
  if (interval === 'annual') {
    if (tier === 'pro') return process.env.STRIPE_PRO_ANNUAL_PRICE_ID || null;
    if (tier === 'creator') return process.env.STRIPE_CREATOR_ANNUAL_PRICE_ID || null;
    if (tier === 'agency') return process.env.STRIPE_AGENCY_ANNUAL_PRICE_ID || null;
    return null;
  }

  // Monthly (default)
  if (tier === 'pro') return process.env.STRIPE_PRO_PRICE_ID || null;
  if (tier === 'creator') return process.env.STRIPE_CREATOR_PRICE_ID || null;
  if (tier === 'agency') return process.env.STRIPE_AGENCY_PRICE_ID || null;
  return null;
}

/**
 * Get the pricing tier for a given Stripe price ID. Must be called server-side only.
 * Checks both monthly and annual price IDs.
 */
export function getTierByPriceId(priceId: string): PricingTier | null {
  // Monthly price IDs
  if (priceId === process.env.STRIPE_PRO_PRICE_ID) return 'pro';
  if (priceId === process.env.STRIPE_CREATOR_PRICE_ID) return 'creator';
  if (priceId === process.env.STRIPE_AGENCY_PRICE_ID) return 'agency';

  // Annual price IDs — same tier, just annual billing
  if (priceId === process.env.STRIPE_PRO_ANNUAL_PRICE_ID) return 'pro';
  if (priceId === process.env.STRIPE_CREATOR_ANNUAL_PRICE_ID) return 'creator';
  if (priceId === process.env.STRIPE_AGENCY_ANNUAL_PRICE_ID) return 'agency';

  return null;
}
