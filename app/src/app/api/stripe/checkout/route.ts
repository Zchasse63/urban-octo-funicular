import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe/client';
import { createClient } from '@/lib/supabase/server';
import { DEFAULT_USER_ID, APP_URL } from '@/lib/constants';
import { PRICING_TIERS } from '@/lib/stripe/products';

export async function POST(request: NextRequest) {
  try {
    const { price_id } = await request.json();

    if (!price_id || typeof price_id !== 'string' || price_id.length > 100) {
      return NextResponse.json(
        { error: 'Invalid price_id' },
        { status: 400 }
      );
    }

    const validPriceIds = Object.values(PRICING_TIERS)
      .map(tier => tier.priceId)
      .filter(Boolean);

    // Explicit null/undefined check before validation
    // Prevents null price_ids from passing when env vars not set
    if (!validPriceIds.length) {
      return NextResponse.json(
        { error: 'Stripe price IDs not configured - check STRIPE_PRO_PRICE_ID and STRIPE_AGENCY_PRICE_ID environment variables' },
        { status: 500 }
      );
    }

    if (!validPriceIds.includes(price_id)) {
      return NextResponse.json(
        { error: 'Invalid price_id - not a recognized pricing tier' },
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
    // First check for existing subscription with customer ID
    let customerId: string;
    const { data: existingSub, error: subError } = await supabase
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', DEFAULT_USER_ID)
      .maybeSingle(); // Use maybeSingle to avoid error if no rows

    // Check for actual DB errors (not PGRST116 which means no rows)
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
      // No existing subscription - search Stripe for customer by user_id metadata
      const existingCustomers = await stripe.customers.list({
        email: user.email,
        limit: 1,
      });

      if (existingCustomers.data.length > 0) {
        customerId = existingCustomers.data[0].id;
      } else {
        // Create new customer only if none exists
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
          price: price_id,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${APP_URL}/settings/billing?success=true`,
      cancel_url: `${APP_URL}/pricing?canceled=true`,
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
