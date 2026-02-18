import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe/client';
import { createClient } from '@/lib/supabase/server';
import { DEFAULT_USER_ID, APP_URL } from '@/lib/constants';
import { getServerPriceId, type PricingTier } from '@/lib/stripe/products';

const VALID_TIERS: PricingTier[] = ['pro', 'agency'];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Accept either tier name or price_id for backwards compatibility
    let priceId: string | null = null;

    if (body.tier && VALID_TIERS.includes(body.tier)) {
      priceId = getServerPriceId(body.tier);
    } else if (body.price_id && typeof body.price_id === 'string') {
      priceId = body.price_id;
    }

    if (!priceId) {
      return NextResponse.json(
        { error: 'Invalid tier or price_id. Valid tiers: pro, agency' },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('email')
      .eq('id', DEFAULT_USER_ID)
      .single();

    if (userError || !user) {
      console.error('User not found:', { userError, userId: DEFAULT_USER_ID });
      return NextResponse.json(
        { error: 'User not found' },
        { status: 500 }
      );
    }

    if (!user.email) {
      console.error('User email not configured:', { userId: DEFAULT_USER_ID });
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
      .eq('user_id', DEFAULT_USER_ID)
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
            user_id: DEFAULT_USER_ID,
          },
        });
        customerId = customer.id;
      }
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      client_reference_id: DEFAULT_USER_ID,
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
        user_id: DEFAULT_USER_ID,
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('Checkout error:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
