import Stripe from 'stripe';
import { stripe } from './client';
import { createClient } from '@/lib/supabase/server';
import { getTierByPriceId } from './products.server';

export async function constructEvent(
  payload: string | Buffer,
  signature: string,
  secret: string
): Promise<Stripe.Event> {
  return stripe.webhooks.constructEvent(payload, signature, secret);
}

export async function handleCheckoutCompleted(
  session: Stripe.Checkout.Session
): Promise<void> {
  const supabase = await createClient();

  const subscriptionId = session.subscription as string;
  const customerId = session.customer as string;
  const userId = session.client_reference_id ?? session.metadata?.user_id;

  if (!userId || !subscriptionId) {
    throw new Error(`Missing userId or subscriptionId in checkout session: ${JSON.stringify({ userId, subscriptionId })}`);
  }

  // Idempotency: skip if this subscription has already been created
  const { data: existingSubscription } = await supabase
    .from('subscriptions')
    .select('id, updated_at')
    .eq('stripe_subscription_id', subscriptionId)
    .maybeSingle();

  if (existingSubscription) {
    console.log(`Subscription ${subscriptionId} already exists (id: ${existingSubscription.id}), skipping checkout handler`);
    return;
  }

  const subscriptionData = await stripe.subscriptions.retrieve(subscriptionId);
  const priceId = subscriptionData.items.data[0]?.price.id;
  const tier = priceId ? getTierByPriceId(priceId) : 'free';

  // Access period timestamps (in seconds) from the subscription
  const periodStart = (subscriptionData as { current_period_start?: number }).current_period_start || Math.floor(Date.now() / 1000);
  const periodEnd = (subscriptionData as { current_period_end?: number }).current_period_end || Math.floor(Date.now() / 1000);

  const { error: upsertError } = await supabase.from('subscriptions').upsert({
    user_id: userId,
    stripe_customer_id: customerId,
    stripe_subscription_id: subscriptionId,
    status: subscriptionData.status,
    price_id: priceId || '',
    current_period_start: new Date(periodStart * 1000).toISOString(),
    current_period_end: new Date(periodEnd * 1000).toISOString(),
    updated_at: new Date().toISOString(),
  }, {
    onConflict: 'stripe_subscription_id',
  });

  if (upsertError) {
    throw new Error(`Failed to upsert subscription for user ${userId}, subscription ${subscriptionId}: ${upsertError.message}`);
  }

  // Update user tier with retry for transient failures
  // If this fails, webhook will return 500 and Stripe will retry
  if (tier) {
    let retries = 3;
    let lastError: Error | null = null;

    while (retries > 0) {
      const { error: updateError } = await supabase
        .from('users')
        .update({ subscription_tier: tier })
        .eq('id', userId);

      if (!updateError) {
        break; // Success
      }

      lastError = new Error(updateError.message);
      retries--;

      if (retries > 0) {
        // Exponential backoff: 100ms, 200ms, 400ms
        await new Promise(resolve => setTimeout(resolve, 100 * Math.pow(2, 3 - retries)));
      }
    }

    if (lastError && retries === 0) {
      throw new Error(`Failed to update subscription tier for user ${userId} after 3 retries: ${lastError.message}`);
    }
  }
}

export async function handleSubscriptionUpdated(
  subscription: Stripe.Subscription
): Promise<void> {
  const supabase = await createClient();

  const priceId = subscription.items.data[0]?.price.id;
  const tier = priceId ? getTierByPriceId(priceId) : null;

  const { data: existingSub, error: fetchError } = await supabase
    .from('subscriptions')
    .select('user_id, updated_at')
    .eq('stripe_subscription_id', subscription.id)
    .single();

  if (fetchError || !existingSub) {
    throw new Error(`Subscription not found for update: ${subscription.id}, error: ${fetchError?.message}`);
  }

  // Idempotency: skip if our record was updated after this Stripe event was created
  // Stripe subscription objects have a `created` timestamp (seconds) that stays constant,
  // but we use the event delivery time as a guard. If our DB was already updated more
  // recently than 5 seconds ago (accounting for clock skew), this is likely a duplicate.
  if (existingSub.updated_at) {
    const dbUpdatedAt = new Date(existingSub.updated_at).getTime();
    const now = Date.now();
    // If the record was updated less than 2 seconds ago, this is likely a duplicate delivery
    if (now - dbUpdatedAt < 2000) {
      console.log(`Subscription ${subscription.id} was just updated ${now - dbUpdatedAt}ms ago, likely duplicate — skipping`);
      return;
    }
  }

  // Access period timestamps (in seconds) from the subscription
  const periodStart = (subscription as { current_period_start?: number }).current_period_start || Math.floor(Date.now() / 1000);
  const periodEnd = (subscription as { current_period_end?: number }).current_period_end || Math.floor(Date.now() / 1000);

  const { error: updateError } = await supabase
    .from('subscriptions')
    .update({
      status: subscription.status,
      price_id: priceId || '',
      current_period_start: new Date(periodStart * 1000).toISOString(),
      current_period_end: new Date(periodEnd * 1000).toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_subscription_id', subscription.id);

  if (updateError) {
    throw new Error(`Failed to update subscription ${subscription.id}: ${updateError.message}`);
  }

  // Update user tier with retry for transient failures
  if (tier) {
    let retries = 3;
    let lastError: Error | null = null;

    while (retries > 0) {
      const { error: tierError } = await supabase
        .from('users')
        .update({ subscription_tier: tier })
        .eq('id', existingSub.user_id);

      if (!tierError) {
        break; // Success
      }

      lastError = new Error(tierError.message);
      retries--;

      if (retries > 0) {
        await new Promise(resolve => setTimeout(resolve, 100 * Math.pow(2, 3 - retries)));
      }
    }

    if (lastError && retries === 0) {
      throw new Error(`Failed to update tier for user ${existingSub.user_id} after 3 retries: ${lastError.message}`);
    }
  }
}

export async function handleSubscriptionDeleted(
  subscription: Stripe.Subscription
): Promise<void> {
  const supabase = await createClient();

  const { data: existingSub, error: fetchError } = await supabase
    .from('subscriptions')
    .select('user_id')
    .eq('stripe_subscription_id', subscription.id)
    .single();

  if (fetchError || !existingSub) {
    throw new Error(`Subscription not found for deletion: ${subscription.id}, error: ${fetchError?.message}`);
  }

  const { error: updateError } = await supabase
    .from('subscriptions')
    .update({
      status: 'canceled',
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_subscription_id', subscription.id);

  if (updateError) {
    throw new Error(`Failed to cancel subscription ${subscription.id}: ${updateError.message}`);
  }

  // Reset user tier with retry for transient failures
  let retries = 3;
  let lastError: Error | null = null;

  while (retries > 0) {
    const { error: tierError } = await supabase
      .from('users')
      .update({ subscription_tier: 'free' })
      .eq('id', existingSub.user_id);

    if (!tierError) {
      break; // Success
    }

    lastError = new Error(tierError.message);
    retries--;

    if (retries > 0) {
      await new Promise(resolve => setTimeout(resolve, 100 * Math.pow(2, 3 - retries)));
    }
  }

  if (lastError && retries === 0) {
    throw new Error(`Failed to reset tier to free for user ${existingSub.user_id} after 3 retries: ${lastError.message}`);
  }
}
