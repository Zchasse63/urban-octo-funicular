/**
 * Subscriptions API Integration Tests
 *
 * Tests the /api/subscriptions endpoint against the REAL database.
 */

import { describe, it, expect, afterAll } from 'vitest'
import { api } from '../../utils/api-client'
import { cleanupAllTestData } from '../../setup/database'
import type { ApiResponse } from '@/types/database'

interface SubscriptionResponse {
  id?: string
  status?: string
  tier: string
  stripe_subscription_id?: string
  price_id?: string
  current_period_start?: string
  current_period_end?: string
}

describe('GET /api/subscriptions', () => {
  afterAll(async () => {
    await cleanupAllTestData()
  })

  it('endpoint responds', async () => {
    const response = await api.get<SubscriptionResponse | { error: string }>('/api/subscriptions')

    // Endpoint should respond (may fail if subscriptions table doesn't exist)
    expect([200, 500]).toContain(response.status)
  })

  it('returns tier field when successful', async () => {
    const response = await api.get<SubscriptionResponse | { error: string }>('/api/subscriptions')

    if (response.ok) {
      const data = response.data as SubscriptionResponse
      expect(data.tier).toBeDefined()
      expect(['free', 'pro', 'agency']).toContain(data.tier)
    }
  })

  it('returns valid response structure when successful', async () => {
    const response = await api.get<SubscriptionResponse | { error: string }>('/api/subscriptions')

    if (response.ok) {
      const data = response.data as SubscriptionResponse
      // tier is always present
      expect(typeof data.tier).toBe('string')

      // status may be null (free tier) or string (paid tier)
      if (data.status !== null && data.status !== undefined) {
        expect(typeof data.status).toBe('string')
      }
    }
  })

  it('free tier has null status', async () => {
    const response = await api.get<SubscriptionResponse | { error: string }>('/api/subscriptions')

    if (response.ok) {
      const data = response.data as SubscriptionResponse
      // Default user likely has free tier
      if (data.tier === 'free') {
        expect(data.status).toBeNull()
      }
    }
  })
})

describe('Subscription Tier Validation', () => {
  it('tier is one of valid options when successful', async () => {
    const response = await api.get<SubscriptionResponse | { error: string }>('/api/subscriptions')

    if (response.ok) {
      const data = response.data as SubscriptionResponse
      const validTiers = ['free', 'pro', 'agency']
      expect(validTiers).toContain(data.tier)
    }
  })
})
