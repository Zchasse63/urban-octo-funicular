import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe/client';
import { createClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/auth';
import { handleApiError } from '@/lib/api/helpers';
import { APP_URL } from '@/lib/constants';

export async function POST() {
  try {
    const { userId } = await requireAuth();
    const supabase = await createClient();

    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', userId)
      .single();

    if (!subscription?.stripe_customer_id) {
      return NextResponse.json(
        { error: 'No active subscription found' },
        { status: 404 }
      );
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: subscription.stripe_customer_id,
      return_url: `${APP_URL}/settings?tab=billing`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    return handleApiError(error, 'Portal');
  }
}
