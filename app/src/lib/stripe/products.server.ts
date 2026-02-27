/**
 * Server-only Stripe price functions.
 * These access process.env secrets and must NEVER be imported from client components.
 */

import type { PricingTier } from './products';

/**
 * Get the Stripe price ID for a tier. Must be called server-side only.
 */
export function getServerPriceId(tier: PricingTier): string | null {
  if (tier === 'pro') return process.env.STRIPE_PRO_PRICE_ID || null;
  if (tier === 'agency') return process.env.STRIPE_AGENCY_PRICE_ID || null;
  return null;
}

/**
 * Get the pricing tier for a given Stripe price ID. Must be called server-side only.
 */
export function getTierByPriceId(priceId: string): PricingTier | null {
  if (priceId === process.env.STRIPE_PRO_PRICE_ID) return 'pro';
  if (priceId === process.env.STRIPE_AGENCY_PRICE_ID) return 'agency';
  return null;
}
