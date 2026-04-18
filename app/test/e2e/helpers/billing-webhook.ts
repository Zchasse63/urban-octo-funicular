/**
 * Stripe webhook test helper.
 *
 * Builds signed Stripe-like payloads and posts them to the local
 * `/api/stripe/webhooks` endpoint so tests can exercise the signature
 * verification branches AND the individual event handlers without
 * contacting Stripe's servers.
 *
 * Signature construction uses the real `stripe.webhooks.generateTestHeaderString`
 * — it runs local HMAC-SHA256 against `STRIPE_WEBHOOK_SECRET`, no network I/O.
 *
 * For handlers that internally call `stripe.subscriptions.retrieve(...)`
 * (notably `handleCheckoutCompleted`), DO NOT use these helpers — they
 * will hit the real Stripe API. Those paths are covered by Vitest unit
 * tests with module-level mocks at `test/unit/lib/stripe-webhooks.test.ts`.
 *
 * Safe to use with these event types (no Stripe API round-trip):
 *   - invoice.payment_succeeded
 *   - invoice.payment_failed
 *   - customer.subscription.deleted
 */
import type { APIRequestContext } from '@playwright/test'
import Stripe from 'stripe'

const stripe = new Stripe('sk_test_placeholder', {
  apiVersion: '2026-01-28.clover',
  typescript: true,
})

export type WebhookEventType =
  | 'invoice.payment_failed'
  | 'invoice.payment_succeeded'
  | 'customer.subscription.deleted'

/**
 * Build a minimal Stripe event object suitable for POSTing to the webhook
 * endpoint. The `data.object` fields match the shape the handlers read.
 */
export function buildEvent(
  type: WebhookEventType,
  data: {
    subscriptionId: string
    customerId?: string
    priceId?: string
  }
): Record<string, unknown> {
  const id = `evt_test_${Math.random().toString(36).slice(2, 14)}`
  const ts = Math.floor(Date.now() / 1000)

  if (type === 'customer.subscription.deleted') {
    return {
      id,
      object: 'event',
      api_version: '2026-01-28.clover',
      created: ts,
      type,
      livemode: false,
      pending_webhooks: 1,
      request: { id: null, idempotency_key: null },
      data: {
        object: {
          id: data.subscriptionId,
          object: 'subscription',
          customer: data.customerId ?? 'cus_test',
          status: 'canceled',
          items: {
            object: 'list',
            data: [
              {
                id: 'si_test',
                price: {
                  id: data.priceId ?? 'price_unknown',
                  recurring: { interval: 'month' },
                },
              },
            ],
          },
          current_period_start: ts - 86400,
          current_period_end: ts,
        },
      },
    }
  }

  // invoice.payment_{failed,succeeded}
  return {
    id,
    object: 'event',
    api_version: '2026-01-28.clover',
    created: ts,
    type,
    livemode: false,
    pending_webhooks: 1,
    request: { id: null, idempotency_key: null },
    data: {
      object: {
        id: `in_test_${Math.random().toString(36).slice(2, 10)}`,
        object: 'invoice',
        customer: data.customerId ?? 'cus_test',
        subscription: data.subscriptionId,
        status: type === 'invoice.payment_failed' ? 'open' : 'paid',
        amount_paid: type === 'invoice.payment_succeeded' ? 2900 : 0,
        currency: 'usd',
        created: ts,
      },
    },
  }
}

export interface SignedWebhook {
  body: string
  signature: string
}

/**
 * Build a signed webhook payload. The signature is constructed with
 * Stripe's `generateTestHeaderString` helper using HMAC-SHA256 — this
 * is pure local crypto, no network I/O.
 */
export function sign(payload: Record<string, unknown>, secret: string, timestamp?: number): SignedWebhook {
  const body = JSON.stringify(payload)
  const signature = stripe.webhooks.generateTestHeaderString({
    payload: body,
    secret,
    timestamp: timestamp ?? Math.floor(Date.now() / 1000),
  })
  return { body, signature }
}

export interface PostWebhookOptions {
  /**
   * Signature variant:
   *   - 'valid': use the given secret (default)
   *   - 'missing': no stripe-signature header at all
   *   - 'bad': constant bogus signature
   *   - 'wrong-secret': signed with a different secret
   */
  signatureMode?: 'valid' | 'missing' | 'bad' | 'wrong-secret'
  /** The secret used to sign (only honored when signatureMode='valid'). */
  secret?: string
}

/**
 * POST a Stripe webhook event to the local /api/stripe/webhooks endpoint.
 *
 * Uses `request.post` with a raw string body so the server reads the
 * exact bytes that were signed. The Playwright APIRequestContext does
 * not re-encode string bodies.
 */
export async function postWebhook(
  request: APIRequestContext,
  payload: Record<string, unknown>,
  opts: PostWebhookOptions = {}
): Promise<{ status: number; body: { error?: string; received?: boolean } }> {
  const mode = opts.signatureMode ?? 'valid'
  const secret = opts.secret ?? process.env.STRIPE_WEBHOOK_SECRET ?? ''

  const serialized = JSON.stringify(payload)

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }

  if (mode === 'valid') {
    if (!secret) {
      throw new Error(
        'postWebhook: STRIPE_WEBHOOK_SECRET is not set. ' +
          'Add it to .env.local or pass opts.secret.'
      )
    }
    const { signature } = sign(payload, secret)
    headers['stripe-signature'] = signature
  } else if (mode === 'bad') {
    headers['stripe-signature'] = 't=1,v1=deadbeef00000000000000000000000000000000000000000000000000000000'
  } else if (mode === 'wrong-secret') {
    const { signature } = sign(payload, 'whsec_wrong_' + Math.random().toString(36).slice(2, 10))
    headers['stripe-signature'] = signature
  }
  // mode === 'missing' → no header set

  const response = await request.post('/api/stripe/webhooks', {
    headers,
    data: serialized,
  })

  const body = await response.json().catch(() => ({}))
  return { status: response.status(), body }
}
