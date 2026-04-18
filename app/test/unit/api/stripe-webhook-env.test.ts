/**
 * Unit test: Stripe webhook route returns 500 when STRIPE_WEBHOOK_SECRET is unset.
 *
 * This covers a scenario that is too risky to test in E2E (would require
 * mutating production env or the dev server's env at runtime). The handler
 * must NOT crash the app at boot when the secret is missing — it must
 * return a clean 500 per-request so the rest of the app remains usable.
 *
 * Corresponds to test plan B-33.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { NextRequest } from 'next/server'

describe('POST /api/stripe/webhooks — missing STRIPE_WEBHOOK_SECRET', () => {
  const originalSecret = process.env.STRIPE_WEBHOOK_SECRET

  beforeEach(() => {
    vi.resetModules()
    delete process.env.STRIPE_WEBHOOK_SECRET
  })

  afterEach(() => {
    if (originalSecret !== undefined) {
      process.env.STRIPE_WEBHOOK_SECRET = originalSecret
    } else {
      delete process.env.STRIPE_WEBHOOK_SECRET
    }
  })

  it('returns 500 with clear error when STRIPE_WEBHOOK_SECRET is not configured', async () => {
    // Import the route handler AFTER deleting the env var so the module
    // reads the current state via process.env at request time.
    const { POST } = await import('@/app/api/stripe/webhooks/route')

    const request = new NextRequest('http://localhost:3000/api/stripe/webhooks', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Provide a signature header so we get past the 401 check and into
        // the secret-configuration check.
        'stripe-signature': 't=1,v1=deadbeef',
      },
      body: JSON.stringify({ id: 'evt_test', type: 'invoice.payment_failed', data: {} }),
    })

    const response = await POST(request)
    expect(response.status).toBe(500)

    const body = await response.json()
    expect(body.error).toBe('Webhook configuration error')
  })

  it('returns 401 when signature header is missing even without secret', async () => {
    const { POST } = await import('@/app/api/stripe/webhooks/route')

    const request = new NextRequest('http://localhost:3000/api/stripe/webhooks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: 'evt_test' }),
    })

    const response = await POST(request)
    // The 401 check comes before the secret-config check, so this path
    // should still return 401 regardless of secret status.
    expect(response.status).toBe(401)
  })
})
