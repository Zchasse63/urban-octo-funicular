import Stripe from 'stripe';
import { stripe } from './client';
import { createAdminClient } from '@/lib/supabase/server';
import { getTierByPriceId } from './products.server';

export async function constructEvent(
  payload: string | Buffer,
  signature: string,
  secret: string
): Promise<Stripe.Event> {
  return stripe.webhooks.constructEvent(payload, signature, secret);
}

// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * Updates a user row with retry-on-transient-failure logic.
 * Throws if all retries fail.
 */
async function updateUserWithRetry(
  supabase: ReturnType<typeof createAdminClient>,
  userId: string,
  update: Record<string, unknown>,
  operationName: string
): Promise<void> {
  let retries = 3;
  let lastError: Error | null = null;

  while (retries > 0) {
    const { error } = await supabase
      .from('users')
      .update(update)
      .eq('id', userId);

    if (!error) return;

    lastError = new Error(error.message);
    retries--;

    if (retries > 0) {
      await new Promise(resolve => setTimeout(resolve, 100 * Math.pow(2, 3 - retries)));
    }
  }

  if (lastError) {
    throw new Error(
      `Failed to ${operationName} for user ${userId} after 3 retries: ${lastError.message}`
    );
  }
}

// ─── checkout.session.completed ────────────────────────────────────────────

export async function handleCheckoutCompleted(
  session: Stripe.Checkout.Session
): Promise<void> {
  // Use the admin client: Stripe webhook deliveries are unauthenticated
  // (no session cookie), so the user-scoped client would be blocked by RLS
  // policies on `subscriptions` / `users`. The webhook route already verifies
  // the HMAC signature against STRIPE_WEBHOOK_SECRET, which is the trust
  // boundary — bypassing RLS is correct here.
  const supabase = createAdminClient();

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
  const tier = priceId ? getTierByPriceId(priceId) : null;

  if (!tier) {
    throw new Error(
      `Checkout completed with unrecognized price ID "${priceId}" for subscription ${subscriptionId}. Verify Stripe price IDs match env vars.`
    );
  }

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

  // Transition user from trialing → active at their new tier
  await updateUserWithRetry(
    supabase,
    userId,
    {
      subscription_tier: tier,
      subscription_status: 'active',
      past_due_since: null,
    },
    'update subscription on checkout'
  );
}

// ─── customer.subscription.updated ─────────────────────────────────────────

export async function handleSubscriptionUpdated(
  subscription: Stripe.Subscription
): Promise<void> {
  // Use the admin client: Stripe webhook deliveries are unauthenticated
  // (no session cookie), so the user-scoped client would be blocked by RLS
  // policies on `subscriptions` / `users`. The webhook route already verifies
  // the HMAC signature against STRIPE_WEBHOOK_SECRET, which is the trust
  // boundary — bypassing RLS is correct here.
  const supabase = createAdminClient();

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

  // Idempotency: skip if our record was updated very recently (likely duplicate delivery)
  if (existingSub.updated_at) {
    const dbUpdatedAt = new Date(existingSub.updated_at).getTime();
    const now = Date.now();
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

  // Build the users table update based on Stripe's status and new tier.
  // We care about these states from Stripe: active, past_due, canceled, unpaid
  const userUpdate: Record<string, unknown> = {};

  if (tier) {
    userUpdate.subscription_tier = tier;
  }

  if (subscription.status === 'active') {
    userUpdate.subscription_status = 'active';
    userUpdate.past_due_since = null;
  } else if (subscription.status === 'past_due' || subscription.status === 'unpaid') {
    userUpdate.subscription_status = 'past_due';
    // Only set past_due_since if it isn't already set — preserve the original failure time
    const { data: currentUser, error: userFetchError } = await supabase
      .from('users')
      .select('past_due_since')
      .eq('id', existingSub.user_id)
      .single();
    if (userFetchError) {
      // Log but don't throw — if we can't read the current state, prefer to
      // leave past_due_since unset and let the webhook be retried rather than
      // reset the grace-period clock.
      console.error(
        `Failed to read past_due_since for user ${existingSub.user_id}:`,
        userFetchError.message
      );
    } else if (!currentUser?.past_due_since) {
      userUpdate.past_due_since = new Date().toISOString();
    }
  } else if (subscription.status === 'canceled' || subscription.status === 'incomplete_expired') {
    userUpdate.subscription_status = 'canceled';
  }

  if (Object.keys(userUpdate).length > 0) {
    await updateUserWithRetry(
      supabase,
      existingSub.user_id,
      userUpdate,
      'update subscription status'
    );
  }
}

// ─── customer.subscription.deleted ─────────────────────────────────────────

export async function handleSubscriptionDeleted(
  subscription: Stripe.Subscription
): Promise<void> {
  // Use the admin client: Stripe webhook deliveries are unauthenticated
  // (no session cookie), so the user-scoped client would be blocked by RLS
  // policies on `subscriptions` / `users`. The webhook route already verifies
  // the HMAC signature against STRIPE_WEBHOOK_SECRET, which is the trust
  // boundary — bypassing RLS is correct here.
  const supabase = createAdminClient();

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

  // Mark the user as canceled but preserve their tier — this gives them read-only
  // access to historical content without ambiguity about what they used to have.
  await updateUserWithRetry(
    supabase,
    existingSub.user_id,
    { subscription_status: 'canceled' },
    'mark user canceled'
  );
}

// ─── invoice.payment_succeeded ─────────────────────────────────────────────

export async function handleInvoicePaymentSucceeded(
  invoice: Stripe.Invoice
): Promise<void> {
  // Use the admin client: Stripe webhook deliveries are unauthenticated
  // (no session cookie), so the user-scoped client would be blocked by RLS
  // policies on `subscriptions` / `users`. The webhook route already verifies
  // the HMAC signature against STRIPE_WEBHOOK_SECRET, which is the trust
  // boundary — bypassing RLS is correct here.
  const supabase = createAdminClient();

  // Extract subscription ID from the invoice.
  // Stripe.Invoice historically had `subscription` as `string | Stripe.Subscription | null`
  // but the type was removed in newer SDK versions. Access it via `unknown` cast
  // to stay compatible across SDK versions.
  const subscriptionField = (invoice as unknown as { subscription?: string | { id: string } | null }).subscription;
  const subscriptionId =
    typeof subscriptionField === 'string'
      ? subscriptionField
      : subscriptionField?.id;

  if (!subscriptionId) {
    // Not a subscription invoice (one-off charge); nothing to do
    return;
  }

  const { data: existingSub, error: fetchError } = await supabase
    .from('subscriptions')
    .select('user_id')
    .eq('stripe_subscription_id', subscriptionId)
    .single();

  if (fetchError || !existingSub) {
    throw new Error(`Subscription not found for payment_succeeded: ${subscriptionId}, error: ${fetchError?.message}`);
  }

  // Mark the subscription as active in our subscriptions table
  const { error: subUpdateError } = await supabase
    .from('subscriptions')
    .update({
      status: 'active',
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_subscription_id', subscriptionId);

  if (subUpdateError) {
    throw new Error(`Failed to mark subscription ${subscriptionId} active: ${subUpdateError.message}`);
  }

  // Clear past_due on the user — payment recovered
  await updateUserWithRetry(
    supabase,
    existingSub.user_id,
    {
      subscription_status: 'active',
      past_due_since: null,
    },
    'mark user active after payment'
  );
}

// ─── invoice.payment_failed ────────────────────────────────────────────────

export async function handleInvoicePaymentFailed(
  invoice: Stripe.Invoice
): Promise<void> {
  // Use the admin client: Stripe webhook deliveries are unauthenticated
  // (no session cookie), so the user-scoped client would be blocked by RLS
  // policies on `subscriptions` / `users`. The webhook route already verifies
  // the HMAC signature against STRIPE_WEBHOOK_SECRET, which is the trust
  // boundary — bypassing RLS is correct here.
  const supabase = createAdminClient();

  // See handleInvoicePaymentSucceeded for explanation of this cast pattern.
  const subscriptionField = (invoice as unknown as { subscription?: string | { id: string } | null }).subscription;
  const subscriptionId =
    typeof subscriptionField === 'string'
      ? subscriptionField
      : subscriptionField?.id;

  if (!subscriptionId) {
    return;
  }

  const { data: existingSub, error: fetchError } = await supabase
    .from('subscriptions')
    .select('user_id')
    .eq('stripe_subscription_id', subscriptionId)
    .single();

  if (fetchError || !existingSub) {
    throw new Error(`Subscription not found for payment_failed: ${subscriptionId}, error: ${fetchError?.message}`);
  }

  // Flip the subscription to past_due in our subscriptions table
  const { error: subUpdateError } = await supabase
    .from('subscriptions')
    .update({
      status: 'past_due',
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_subscription_id', subscriptionId);

  if (subUpdateError) {
    throw new Error(`Failed to mark subscription ${subscriptionId} past_due: ${subUpdateError.message}`);
  }

  // Preserve original past_due_since timestamp if already set (from earlier event).
  // If the read fails, prefer NOT to reset the grace period clock — only set
  // past_due_since when we've confirmed it's actually empty.
  const { data: currentUser, error: userFetchError } = await supabase
    .from('users')
    .select('past_due_since')
    .eq('id', existingSub.user_id)
    .single();

  if (userFetchError) {
    console.error(
      `Failed to read past_due_since for user ${existingSub.user_id}:`,
      userFetchError.message
    );
  }

  const pastDueSinceUpdate: { subscription_status: string; past_due_since?: string } = {
    subscription_status: 'past_due',
  };
  // Only write past_due_since when we successfully confirmed it's currently null.
  // On read error OR when a value already exists, leave it alone.
  if (!userFetchError && !currentUser?.past_due_since) {
    pastDueSinceUpdate.past_due_since = new Date().toISOString();
  }

  await updateUserWithRetry(
    supabase,
    existingSub.user_id,
    pastDueSinceUpdate,
    'mark user past_due after payment failure'
  );
}
