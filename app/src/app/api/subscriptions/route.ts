import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/auth';
import { handleApiError } from '@/lib/api/helpers';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { userId } = await requireAuth();
    const supabase = await createClient();

    const { data: subscription, error } = await supabase
      .from('subscriptions')
      .select('*, users!inner(subscription_tier, subscription_status, trial_ends_at, past_due_since)')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Subscription fetch error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch subscription' },
        { status: 500 }
      );
    }

    // No subscription row yet — user is on trial or hasn't paid yet.
    // Return their subscription state from the users table directly.
    if (!subscription) {
      const { data: user } = await supabase
        .from('users')
        .select('subscription_tier, subscription_status, trial_ends_at, past_due_since')
        .eq('id', userId)
        .single();

      return NextResponse.json({
        tier: user?.subscription_tier ?? 'pro',
        status: user?.subscription_status ?? 'trialing',
        trialEndsAt: user?.trial_ends_at ?? null,
        pastDueSince: user?.past_due_since ?? null,
      });
    }

    // Subscription row exists — merge users table access state with
    // Stripe-side billing details.
    return NextResponse.json({
      id: subscription.id,
      // subscription_status on users is the source of truth for access decisions
      status: subscription.users?.subscription_status ?? 'active',
      tier: subscription.users?.subscription_tier ?? 'pro',
      trialEndsAt: subscription.users?.trial_ends_at ?? null,
      pastDueSince: subscription.users?.past_due_since ?? null,
      stripe_subscription_id: subscription.stripe_subscription_id,
      price_id: subscription.price_id,
      current_period_start: subscription.current_period_start,
      current_period_end: subscription.current_period_end,
    });
  } catch (error) {
    return handleApiError(error, 'Subscription');
  }
}
