/**
 * Stripe Payment API Integration Tests
 *
 * Tests the /api/stripe/* endpoints.
 * Note: These tests verify API structure and validation.
 * Actual Stripe operations require valid API keys.
 */

import { describe, it, expect, afterAll } from 'vitest'
import { api } from '../../utils/api-client'
import { cleanupAllTestData } from '../../setup/database'

const BASE_URL = process.env.TEST_API_URL || 'http://localhost:3000'

describe('POST /api/stripe/checkout', () => {
  afterAll(async () => {
    await cleanupAllTestData()
  })

  it('endpoint exists and responds', async () => {
    const response = await api.post<{ error?: string }>('/api/stripe/checkout', {})

    // Should respond with something (error is fine, 404 would be bad)
    expect(response.status).not.toBe(404)
  })

  it('rejects request without price ID', async () => {
    const response = await api.post<{ error?: string }>('/api/stripe/checkout', {})

    // Should be 400 or 500 depending on validation
    expect(response.ok).toBe(false)
    expect([400, 500]).toContain(response.status)
  })

  // Note: Actually creating a checkout session requires Stripe API key
  it('returns error response structure', async () => {
    const response = await api.post<{ error?: string; url?: string }>('/api/stripe/checkout', {
      priceId: 'price_invalid_123',
    })

    // Should fail but return proper structure
    expect(response.data).toBeDefined()
    if (!response.ok) {
      expect(response.data.error).toBeDefined()
    }
  })
})

describe('POST /api/stripe/portal', () => {
  afterAll(async () => {
    await cleanupAllTestData()
  })

  it('endpoint responds to POST request', async () => {
    const response = await api.post<{ error?: string }>('/api/stripe/portal', {})

    // Should respond (404 is valid when no subscription exists)
    expect([200, 404, 500]).toContain(response.status)
  })

  // Note: Portal requires a Stripe customer ID to exist
  it('returns 404 when no subscription exists', async () => {
    const response = await api.post<{ error?: string; url?: string }>('/api/stripe/portal', {})

    // Default user has no subscription, so 404 is expected
    expect(response.status).toBe(404)
    expect(response.data.error).toContain('No active subscription')
  })
})

describe('POST /api/stripe/webhooks', () => {
  afterAll(async () => {
    await cleanupAllTestData()
  })

  it('rejects request without stripe-signature header', async () => {
    const response = await fetch(`${BASE_URL}/api/stripe/webhooks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'test.event',
        data: {},
      }),
    })

    // Should reject without signature
    expect(response.ok).toBe(false)
    expect([400, 401, 500]).toContain(response.status)
  })

  it('rejects request with invalid signature', async () => {
    const response = await fetch(`${BASE_URL}/api/stripe/webhooks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'stripe-signature': 'invalid-signature',
      },
      body: JSON.stringify({
        type: 'test.event',
        data: {},
      }),
    })

    expect(response.ok).toBe(false)
  })

  it('returns JSON response', async () => {
    const response = await fetch(`${BASE_URL}/api/stripe/webhooks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    })

    const data = await response.json()
    expect(data).toBeDefined()
  })
})

describe('Stripe API Response Formats', () => {
  it('checkout returns error structure on failure', async () => {
    const response = await api.post<{ error?: string }>('/api/stripe/checkout', {})

    if (!response.ok) {
      expect(typeof response.data.error).toBe('string')
    }
  })

  it('portal returns error structure on failure', async () => {
    const response = await api.post<{ error?: string }>('/api/stripe/portal', {})

    if (!response.ok) {
      expect(response.data.error).toBeDefined()
    }
  })
})
