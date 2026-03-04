import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe/client';
import { createClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/auth';
import { APP_URL } from '@/lib/constants';
import { getServerPriceId } from '@/lib/stripe/products.server';
import type { PricingTier, BillingInterval } from '@/lib/stripe/products';

const VALID_TIERS: PricingTier[] = ['pro', 'creator', 'agency'];

export async function POST(request: NextRequest) {
  try {
    const { userId } = await requireAuth();
    const body = await request.json();

    // Accept either tier name or price_id for backwards compatibility
    let priceId: string | null = null;
    const interval: BillingInterval = body.interval === 'annual' ? 'annual' : 'monthly';

    if (body.tier && VALID_TIERS.includes(body.tier)) {
      priceId = getServerPriceId(body.tier, interval);
    } else if (body.price_id && typeof body.price_id === 'string') {
      priceId = body.price_id;
    }

    if (!priceId) {
      return NextResponse.json(
        { error: 'Invalid tier or price_id. Valid tiers: pro, creator, agency' },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('email')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      console.error('User not found:', { userError, userId });
      return NextResponse.json(
        { error: 'User not found' },
        { status: 500 }
      );
    }

    if (!user.email) {
      console.error('User email not configured:', { userId });
      return NextResponse.json(
        { error: 'User email not configured' },
        { status: 500 }
      );
    }

    // Atomic customer retrieval/creation to prevent race conditions
    let customerId: string;
    const { data: existingSub, error: subError } = await supabase
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', userId)
      .maybeSingle();

    if (subError && subError.code !== 'PGRST116') {
      console.error('Subscription lookup failed:', subError);
      return NextResponse.json(
        { error: 'Database error checking existing subscription' },
        { status: 500 }
      );
    }

    if (existingSub?.stripe_customer_id) {
      customerId = existingSub.stripe_customer_id;
    } else {
      const existingCustomers = await stripe.customers.list({
        email: user.email,
        limit: 1,
      });

      if (existingCustomers.data.length > 0) {
        customerId = existingCustomers.data[0].id;
      } else {
        const customer = await stripe.customers.create({
          email: user.email,
          metadata: {
            user_id: userId,
          },
        });
        customerId = customer.id;
      }
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      client_reference_id: userId,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${APP_URL}/settings?tab=billing&success=true`,
      cancel_url: `${APP_URL}/settings?tab=billing&canceled=true`,
      metadata: {
        user_id: userId,
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    console.error('Checkout error:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
