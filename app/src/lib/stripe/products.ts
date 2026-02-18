export type PricingTier = 'free' | 'pro' | 'agency';

export interface TierFeatures {
  tier: PricingTier;
  name: string;
  price: number;
  priceId: string | null;
  features: string[];
  episodesPerMonth: number;
  shows: number;
}

// Client-safe pricing data — priceIds are resolved server-side only
export const PRICING_TIERS: Record<PricingTier, TierFeatures> = {
  free: {
    tier: 'free',
    name: 'Free',
    price: 0,
    priceId: null,
    episodesPerMonth: 3,
    shows: 1,
    features: [
      '3 episodes per month',
      '1 podcast show',
      'Basic AI show notes',
      'Community support',
    ],
  },
  pro: {
    tier: 'pro',
    name: 'Pro',
    price: 19,
    priceId: null, // Resolved server-side via getServerPriceId()
    episodesPerMonth: 50,
    shows: 5,
    features: [
      '50 episodes per month',
      'Up to 5 podcast shows',
      'Advanced AI content',
      'Priority support',
      'Buzzsprout integration',
      'Custom templates',
    ],
  },
  agency: {
    tier: 'agency',
    name: 'Agency',
    price: 49,
    priceId: null, // Resolved server-side via getServerPriceId()
    episodesPerMonth: 200,
    shows: 999,
    features: [
      '200 episodes per month',
      'Unlimited podcast shows',
      'Premium AI features',
      'Dedicated support',
      'All integrations',
      'White-label options',
      'Team collaboration',
      'API access',
    ],
  },
};

/**
 * Get the Stripe price ID for a tier. Must be called server-side only.
 */
export function getServerPriceId(tier: PricingTier): string | null {
  if (tier === 'pro') return process.env.STRIPE_PRO_PRICE_ID || null;
  if (tier === 'agency') return process.env.STRIPE_AGENCY_PRICE_ID || null;
  return null;
}

export function getTierByPriceId(priceId: string): PricingTier | null {
  // Must check against server env vars
  if (priceId === process.env.STRIPE_PRO_PRICE_ID) return 'pro';
  if (priceId === process.env.STRIPE_AGENCY_PRICE_ID) return 'agency';
  return null;
}
