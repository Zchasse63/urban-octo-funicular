/**
 * LIB MODULE VERIFICATION TESTS
 *
 * Tests that core library modules are importable and
 * have the expected exports.
 */

import { describe, it, expect, vi } from 'vitest'

// Mock env vars for modules that need them
vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://test.supabase.co')
vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'test-anon-key')
vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'test-service-key')
vi.stubEnv('UPSTASH_REDIS_REST_URL', '')
vi.stubEnv('UPSTASH_REDIS_REST_TOKEN', '')

describe('Stripe products module', () => {
  it('exports PRICING_TIERS', async () => {
    const mod = await import('@/lib/stripe/products')
    expect(mod.PRICING_TIERS).toBeDefined()
    expect(typeof mod.PRICING_TIERS).toBe('object')
    // It's a Record<PricingTier, TierFeatures> with free, pro, agency keys
    expect(Object.keys(mod.PRICING_TIERS).length).toBeGreaterThanOrEqual(3)
  })

  it('PRICING_TIERS has correct structure', async () => {
    const mod = await import('@/lib/stripe/products')
    for (const [key, tier] of Object.entries(mod.PRICING_TIERS)) {
      expect(tier).toHaveProperty('name')
      expect(tier).toHaveProperty('price')
      expect(tier).toHaveProperty('features')
      expect(Array.isArray((tier as any).features)).toBe(true)
    }
  })

  it('pro tier has expected price (replaces legacy free-tier test)', async () => {
    // Free tier was removed in favor of a 14-day Pro trial. This test
    // now verifies that the Pro tier price is set correctly.
    const mod = await import('@/lib/stripe/products')
    const proTier = mod.PRICING_TIERS.pro
    expect(proTier).toBeDefined()
    expect(proTier.price).toBe(29)
  })

  it('does NOT export getServerPriceId (moved to server module)', async () => {
    const mod = await import('@/lib/stripe/products')
    expect((mod as any).getServerPriceId).toBeUndefined()
  })

  it('does NOT export getServerPriceId in client module (server-only)', async () => {
    const mod = await import('@/lib/stripe/products')
    expect(Object.keys(mod)).not.toContain('getServerPriceId')
  })

  it('does NOT export getTierByPriceId (moved to server module)', async () => {
    const mod = await import('@/lib/stripe/products')
    expect((mod as any).getTierByPriceId).toBeUndefined()
  })
})

describe('Constants module', () => {
  it('exports DEFAULT_USER_ID', async () => {
    const mod = await import('@/lib/constants')
    expect(mod.DEFAULT_USER_ID).toBeDefined()
    expect(mod.DEFAULT_USER_ID).toBe('00000000-0000-0000-0000-000000000001')
  })
})

describe('Asset types module', () => {
  it('exports getAssetDefinition', async () => {
    const mod = await import('@/lib/assets/asset-types')
    expect(mod.getAssetDefinition).toBeDefined()
    expect(typeof mod.getAssetDefinition).toBe('function')
  })

  it('exports getAssetsByCategory', async () => {
    const mod = await import('@/lib/assets/asset-types')
    expect(mod.getAssetsByCategory).toBeDefined()
  })

  it('exports ASSET_CATEGORIES', async () => {
    const mod = await import('@/lib/assets/asset-types')
    expect(mod.ASSET_CATEGORIES).toBeDefined()
    // ASSET_CATEGORIES is a Record<AssetCategory, {...}>, not an array
    expect(typeof mod.ASSET_CATEGORIES).toBe('object')
    expect(Object.keys(mod.ASSET_CATEGORIES).length).toBeGreaterThan(0)
  })

  it('getAssetDefinition returns valid definition for show_notes', async () => {
    const mod = await import('@/lib/assets/asset-types')
    const def = mod.getAssetDefinition('show_notes')
    expect(def).toBeDefined()
    expect(def).toHaveProperty('name')
    expect(def).toHaveProperty('category')
  })
})

describe('Redis cache module', () => {
  it('exports get, set, del, invalidatePattern', async () => {
    const mod = await import('@/lib/redis/cache')
    expect(mod.get).toBeDefined()
    expect(mod.set).toBeDefined()
    expect(mod.del).toBeDefined()
    expect(mod.invalidatePattern).toBeDefined()
  })

  it('gracefully returns null when Redis unavailable', async () => {
    const mod = await import('@/lib/redis/cache')
    const result = await mod.get('nonexistent-key')
    expect(result).toBeNull()
  })

  it('set() resolves without error when Redis unavailable', async () => {
    const mod = await import('@/lib/redis/cache')
    await expect(mod.set('test-key', 'test-value')).resolves.toBeUndefined()
  })
})

describe('Redis client module', () => {
  it('exports isRedisAvailable function', async () => {
    const mod = await import('@/lib/redis/client')
    expect(mod.isRedisAvailable).toBeDefined()
    expect(typeof mod.isRedisAvailable).toBe('function')
  })

  it('isRedisAvailable returns false when env vars empty', async () => {
    const mod = await import('@/lib/redis/client')
    // We stubbed empty strings above
    expect(mod.isRedisAvailable()).toBe(false)
  })
})

describe('Dev guard module', () => {
  it('exports devGuard function', async () => {
    const mod = await import('@/lib/api/dev-guard')
    expect(mod.devGuard).toBeDefined()
    expect(typeof mod.devGuard).toBe('function')
  })

  it('returns null in non-production (allows access)', async () => {
    // NODE_ENV is 'test' in vitest
    const mod = await import('@/lib/api/dev-guard')
    const result = mod.devGuard()
    expect(result).toBeNull()
  })
})
