import Stripe from 'stripe';

let _stripe: Stripe | null = null;

/**
 * Lazy-initialized Stripe client. Throws on first use if env var is missing,
 * not at module import time (which would crash the entire app).
 */
export function getStripe(): Stripe {
  if (!_stripe) {
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeSecretKey) {
      throw new Error('STRIPE_SECRET_KEY environment variable is required');
    }
    _stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2026-01-28.clover',
      typescript: true,
    });
  }
  return _stripe;
}

/**
 * @deprecated Use getStripe() instead for lazy initialization.
 * Kept for backwards compatibility — will throw at import time if env var missing.
 */
export const stripe = new Proxy({} as Stripe, {
  get(_target, prop) {
    return getStripe()[prop as keyof Stripe];
  },
});
