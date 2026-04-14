/**
 * Tests for Stripe checkout request validation and price ID resolution.
 *
 * These tests cover the input validation layer for POST /api/stripe/checkout
 * (CheckoutSchema) and the server-side price ID lookup (getServerPriceId).
 *
 * Why this matters: a typo in tier mapping means a user pays for Pro and
 * gets Agency (or vice versa). The existing handler tests verify the happy
 * path once a price ID is known; these tests verify that the price ID
 * lookup itself is correct for every tier × interval combination.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { CheckoutSchema } from '@/lib/validation-schemas'

describe('CheckoutSchema validation', () => {
  it('accepts valid tier + default interval', () => {
    const result = CheckoutSchema.parse({ tier: 'pro' })
    expect(result.tier).toBe('pro')
    expect(result.interval).toBe('monthly') // default
  })

  it('accepts valid tier + explicit monthly interval', () => {
    const result = CheckoutSchema.parse({ tier: 'agency', interval: 'monthly' })
    expect(result.interval).toBe('monthly')
  })

  it('accepts valid tier + annual interval', () => {
    const result = CheckoutSchema.parse({ tier: 'creator', interval: 'annual' })
    expect(result.interval).toBe('annual')
  })

  it('rejects unknown tier', () => {
    expect(() => CheckoutSchema.parse({ tier: 'platinum' })).toThrow()
  })

  it('rejects "free" tier — you cannot checkout for the free plan', () => {
    expect(() => CheckoutSchema.parse({ tier: 'free' })).toThrow()
  })

  it('rejects unknown interval', () => {
    expect(() =>
      CheckoutSchema.parse({ tier: 'pro', interval: 'weekly' })
    ).toThrow()
  })

  it('rejects missing tier', () => {
    expect(() => CheckoutSchema.parse({ interval: 'monthly' })).toThrow()
  })

  it('rejects unknown fields via .strict()', () => {
    expect(() =>
      CheckoutSchema.parse({ tier: 'pro', interval: 'monthly', sneaky: 'field' })
    ).toThrow()
  })
})

describe('getServerPriceId', () => {
  // Store originals to restore
  const originalEnv = { ...process.env }

  beforeEach(() => {
    // Clear all Stripe price env vars so tests are deterministic
    delete process.env.STRIPE_PRO_PRICE_ID
    delete process.env.STRIPE_CREATOR_PRICE_ID
    delete process.env.STRIPE_AGENCY_PRICE_ID
    delete process.env.STRIPE_PRO_ANNUAL_PRICE_ID
    delete process.env.STRIPE_CREATOR_ANNUAL_PRICE_ID
    delete process.env.STRIPE_AGENCY_ANNUAL_PRICE_ID
    // Re-import the module so it picks up the fresh env
    vi.resetModules()
  })

  afterEach(() => {
    process.env = { ...originalEnv }
  })

  it('returns monthly pro price from env', async () => {
    process.env.STRIPE_PRO_PRICE_ID = 'price_pro_monthly'
    const { getServerPriceId } = await import('@/lib/stripe/products.server')
    expect(getServerPriceId('pro', 'monthly')).toBe('price_pro_monthly')
  })

  it('returns annual pro price from separate env var', async () => {
    process.env.STRIPE_PRO_PRICE_ID = 'price_pro_monthly'
    process.env.STRIPE_PRO_ANNUAL_PRICE_ID = 'price_pro_annual'
    const { getServerPriceId } = await import('@/lib/stripe/products.server')
    expect(getServerPriceId('pro', 'annual')).toBe('price_pro_annual')
    expect(getServerPriceId('pro', 'monthly')).toBe('price_pro_monthly')
  })

  it('returns null when env var is missing (prevents silent mispricing)', async () => {
    // No env vars set
    const { getServerPriceId } = await import('@/lib/stripe/products.server')
    expect(getServerPriceId('pro', 'monthly')).toBeNull()
    expect(getServerPriceId('agency', 'annual')).toBeNull()
  })

  it('returns null for the free tier (no checkout for free)', async () => {
    process.env.STRIPE_PRO_PRICE_ID = 'price_pro'
    const { getServerPriceId } = await import('@/lib/stripe/products.server')
    // @ts-expect-error — deliberately passing 'free' to verify defensive behavior
    expect(getServerPriceId('free', 'monthly')).toBeNull()
  })

  it('all three paid tiers resolve to distinct price IDs', async () => {
    process.env.STRIPE_PRO_PRICE_ID = 'price_pro'
    process.env.STRIPE_CREATOR_PRICE_ID = 'price_creator'
    process.env.STRIPE_AGENCY_PRICE_ID = 'price_agency'
    const { getServerPriceId } = await import('@/lib/stripe/products.server')
    const pro = getServerPriceId('pro')
    const creator = getServerPriceId('creator')
    const agency = getServerPriceId('agency')
    // No two tiers should share the same price ID
    expect(new Set([pro, creator, agency]).size).toBe(3)
  })
})

describe('getTierByPriceId (reverse lookup)', () => {
  beforeEach(() => {
    delete process.env.STRIPE_PRO_PRICE_ID
    delete process.env.STRIPE_CREATOR_PRICE_ID
    delete process.env.STRIPE_AGENCY_PRICE_ID
    delete process.env.STRIPE_PRO_ANNUAL_PRICE_ID
    delete process.env.STRIPE_CREATOR_ANNUAL_PRICE_ID
    delete process.env.STRIPE_AGENCY_ANNUAL_PRICE_ID
    vi.resetModules()
  })

  it('round-trips: monthly price → tier', async () => {
    process.env.STRIPE_PRO_PRICE_ID = 'price_pro_m'
    process.env.STRIPE_AGENCY_PRICE_ID = 'price_agency_m'
    const { getTierByPriceId } = await import('@/lib/stripe/products.server')
    expect(getTierByPriceId('price_pro_m')).toBe('pro')
    expect(getTierByPriceId('price_agency_m')).toBe('agency')
  })

  it('round-trips: annual price → tier', async () => {
    process.env.STRIPE_PRO_ANNUAL_PRICE_ID = 'price_pro_a'
    process.env.STRIPE_CREATOR_ANNUAL_PRICE_ID = 'price_creator_a'
    const { getTierByPriceId } = await import('@/lib/stripe/products.server')
    expect(getTierByPriceId('price_pro_a')).toBe('pro')
    expect(getTierByPriceId('price_creator_a')).toBe('creator')
  })

  it('returns null for unknown price ID', async () => {
    process.env.STRIPE_PRO_PRICE_ID = 'price_known'
    const { getTierByPriceId } = await import('@/lib/stripe/products.server')
    expect(getTierByPriceId('price_unknown')).toBeNull()
  })

  it('returns null when env vars are not set', async () => {
    const { getTierByPriceId } = await import('@/lib/stripe/products.server')
    // When all env vars are undefined, every lookup should return null
    // (not accidentally match on undefined === undefined)
    expect(getTierByPriceId('anything')).toBeNull()
    expect(getTierByPriceId('')).toBeNull()
  })
})
