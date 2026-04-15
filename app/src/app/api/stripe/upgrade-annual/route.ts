import { stripe } from '@/lib/stripe/client';
import { createClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/auth';
import { errorResponse, successResponse, handleApiError } from '@/lib/api/helpers';
import { getServerPriceId, getTierByPriceId } from '@/lib/stripe/products.server';
import { PRICING_TIERS } from '@/lib/stripe/products';

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

/**
 * POST /api/stripe/upgrade-annual
 *
 * Upgrades a monthly subscription to annual billing.
 * If within 30 days of subscription creation, applies full monthly payment as credit.
 * After 30 days, uses standard Stripe proration.
 */
export async function POST() {
  try {
    const { userId } = await requireAuth();

    const supabase = await createClient();

    // Get user's current subscription
    const { data: sub, error: subError } = await supabase
      .from('subscriptions')
      .select('stripe_subscription_id, price_id, status')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single();

    if (subError || !sub?.stripe_subscription_id) {
      return errorResponse('No active subscription found', 404);
    }

    // Get current tier from price ID
    const currentTier = sub.price_id ? getTierByPriceId(sub.price_id) : null;
    if (!currentTier) {
      return errorResponse('Unable to determine current subscription tier', 400);
    }

    // Get annual price ID for the current tier
    const annualPriceId = getServerPriceId(currentTier, 'annual');
    if (!annualPriceId) {
      return errorResponse('Annual pricing not configured for this tier', 500);
    }

    // Check if already on annual billing
    const subscription = await stripe.subscriptions.retrieve(sub.stripe_subscription_id);
    const currentPriceInterval = subscription.items.data[0]?.price?.recurring?.interval;
    if (currentPriceInterval === 'year') {
      return errorResponse('Already on annual billing', 400);
    }

    // Check subscription age for the 30-day full-credit window
    const subscriptionCreated = subscription.created * 1000; // Convert to ms
    const isWithin30Days = Date.now() - subscriptionCreated < THIRTY_DAYS_MS;
    const monthlyPrice = PRICING_TIERS[currentTier].price;

    const subscriptionItemId = subscription.items.data[0].id;

    if (isWithin30Days) {
      // Within 30 days: apply full monthly payment as credit toward annual
      // 1. No proration (don't charge for partial month or credit back)
      // 2. Add a negative invoice item for the full monthly amount as credit
      await stripe.invoiceItems.create({
        customer: subscription.customer as string,
        amount: -monthlyPrice * 100, // Stripe uses cents
        currency: 'usd',
        description: `Credit for monthly ${currentTier} payment toward annual plan`,
      });

      // Update the subscription to annual pricing
      const updated = await stripe.subscriptions.update(sub.stripe_subscription_id, {
        items: [{
          id: subscriptionItemId,
          price: annualPriceId,
        }],
        proration_behavior: 'none',
      });

      return successResponse({
        subscriptionId: updated.id,
        credited: monthlyPrice,
      });
    } else {
      // After 30 days: standard Stripe proration
      const updated = await stripe.subscriptions.update(sub.stripe_subscription_id, {
        items: [{
          id: subscriptionItemId,
          price: annualPriceId,
        }],
        proration_behavior: 'always_invoice',
      });

      return successResponse({
        subscriptionId: updated.id,
        credited: 0,
      });
    }
  } catch (error) {
    return handleApiError(error, 'Annual upgrade');
  }
}
