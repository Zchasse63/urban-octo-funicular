import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { DEFAULT_USER_ID } from '@/lib/constants';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = await createClient();

    const { data: subscription, error } = await supabase
      .from('subscriptions')
      .select('*, users!inner(subscription_tier)')
      .eq('user_id', DEFAULT_USER_ID)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Subscription fetch error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch subscription' },
        { status: 500 }
      );
    }

    if (!subscription) {
      const { data: user } = await supabase
        .from('users')
        .select('subscription_tier')
        .eq('id', DEFAULT_USER_ID)
        .single();

      return NextResponse.json({
        tier: user?.subscription_tier || 'free',
        status: null,
      });
    }

    return NextResponse.json({
      id: subscription.id,
      status: subscription.status,
      tier: subscription.users?.subscription_tier || 'free',
      stripe_subscription_id: subscription.stripe_subscription_id,
      price_id: subscription.price_id,
      current_period_start: subscription.current_period_start,
      current_period_end: subscription.current_period_end,
    });
  } catch (error) {
    console.error('Subscription error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
