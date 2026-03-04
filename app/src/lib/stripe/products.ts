export type PricingTier = 'free' | 'pro' | 'creator' | 'agency';

export type BillingInterval = 'monthly' | 'annual';

export interface TierFeatures {
  tier: PricingTier;
  name: string;
  price: number;
  priceAnnual: number;
  priceId: string | null;
  features: string[];
  audioHoursPerMonth: number;
  shows: number;
  teamSeats: number;
  highlighted?: boolean;
}

// Client-safe pricing data — priceIds are resolved server-side only
export const PRICING_TIERS: Record<PricingTier, TierFeatures> = {
  free: {
    tier: 'free',
    name: 'Free',
    price: 0,
    priceAnnual: 0,
    priceId: null,
    audioHoursPerMonth: 1,
    shows: 1,
    teamSeats: 1,
    features: [
      '1 hour of audio/month',
      '1 podcast show',
      '6 core content assets',
      'Guest packages',
      'Hosting integrations',
      'Podcasting 2.0 tags',
    ],
  },
  pro: {
    tier: 'pro',
    name: 'Pro',
    price: 29,
    priceAnnual: 232,
    priceId: null, // Resolved server-side via getServerPriceId()
    audioHoursPerMonth: 10,
    shows: 3,
    teamSeats: 1,
    highlighted: true,
    features: [
      '10 hours of audio/month',
      '3 podcast shows',
      'All 45 content assets',
      'Vocabulary learning',
      'SEO analysis',
      'Expert discovery',
    ],
  },
  creator: {
    tier: 'creator',
    name: 'Creator',
    price: 59,
    priceAnnual: 472,
    priceId: null, // Resolved server-side via getServerPriceId()
    audioHoursPerMonth: 25,
    shows: 10,
    teamSeats: 3,
    features: [
      '25 hours of audio/month',
      '10 podcast shows',
      '3 team seats',
      'All 45 content assets',
      'Everything in Pro',
    ],
  },
  agency: {
    tier: 'agency',
    name: 'Agency',
    price: 149,
    priceAnnual: 1192,
    priceId: null, // Resolved server-side via getServerPriceId()
    audioHoursPerMonth: 100,
    shows: 999,
    teamSeats: 10,
    features: [
      '100 hours of audio/month',
      'Unlimited podcast shows',
      '10 team seats',
      'All 45 content assets',
      'Everything in Creator',
    ],
  },
};

// Server-only price functions have been moved to ./products.server.ts
// to prevent accidental client-side usage of process.env secrets.
