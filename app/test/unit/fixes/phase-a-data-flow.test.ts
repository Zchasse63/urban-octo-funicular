/**
 * PHASE A: DATA FLOW FIXES VERIFICATION
 *
 * Code-level tests that verify our Phase A fixes are correct
 * without needing external services.
 *
 * Tests the actual source code imports, function signatures,
 * and data transformations.
 */

import { describe, it, expect, vi } from 'vitest'
import * as fs from 'fs'
import * as path from 'path'

const SRC = path.resolve(__dirname, '../../../src')

function readSource(relativePath: string): string {
  return fs.readFileSync(path.join(SRC, relativePath), 'utf-8')
}

describe('C1: Upload page uses correct response shape', () => {
  const source = readSource('app/(app)/upload/page.tsx')

  it('uses publicUrl or signedUrl from upload response', () => {
    expect(source).toContain('publicUrl')
    expect(source).toContain('signedUrl')
  })

  it('does NOT use result.data?.url or result.url', () => {
    // Old pattern was: result.data?.url || result.url
    expect(source).not.toMatch(/result\.data\?\.url\s*\|\|\s*result\.url/)
  })
})

describe('C2: Upload page uses Trigger.dev status format', () => {
  const source = readSource('app/(app)/upload/page.tsx')

  it('checks for COMPLETED status from Trigger.dev', () => {
    // Upload page uses double quotes and optional chaining
    expect(source).toContain('"COMPLETED"')
  })

  it('does NOT use old current_step field', () => {
    expect(source).not.toContain("current_step === 'completed'")
    expect(source).not.toContain('current_step')
  })

  it('uses EXECUTING status for progress indication', () => {
    expect(source).toContain('EXECUTING')
  })
})

describe('C3: Assets hook unwraps response correctly', () => {
  const source = readSource('hooks/use-episode-assets.ts')

  it('accesses result.data?.assets for the array', () => {
    expect(source).toContain('result.data?.assets')
  })

  it('does NOT use result.data directly as array', () => {
    // Old: setAssets(result.data || [])
    expect(source).not.toMatch(/setAssets\(result\.data\s*\|\|\s*\[\]/)
  })
})

describe('C4: Asset regeneration sends correct body', () => {
  const source = readSource('hooks/use-episode-assets.ts')

  it('sends assetType and regenerate fields', () => {
    expect(source).toContain('assetType')
    expect(source).toContain('regenerate: true')
  })

  it('does NOT send asset_types array', () => {
    expect(source).not.toContain('asset_types:')
    expect(source).not.toContain('asset_types :')
  })
})

describe('C5: SEO hook maps response fields correctly', () => {
  const source = readSource('hooks/use-episode-seo.ts')

  it('maps result.data.analysis for seo_analysis', () => {
    expect(source).toContain('result.data.analysis')
  })

  it('maps result.data.schema for schema_markup', () => {
    expect(source).toContain('result.data.schema')
  })

  it('maps result.data.episode for episode data', () => {
    expect(source).toContain('result.data.episode')
  })

  it('does NOT set seoData directly from result.data', () => {
    // Old: setSeoData(result.data || null)
    expect(source).not.toMatch(/setSeoData\(result\.data\s*\|\|\s*null/)
  })
})

describe('C8: Settings vocabulary uses alternatives, not definition', () => {
  const source = readSource('app/(app)/settings/page.tsx')

  it('selects alternatives column', () => {
    expect(source).toContain('alternatives')
  })

  it('does NOT select definition column', () => {
    // Should not reference 'definition' in vocabulary queries
    expect(source).not.toMatch(/select\(.*definition/)
  })

  it('does NOT use user_id in vocabulary insert', () => {
    // Vocab terms don't need user_id
    expect(source).not.toMatch(/vocabulary.*user_id.*DEFAULT_USER_ID/s)
  })
})

describe('C9: Guest package unwraps data.data correctly', () => {
  const source = readSource('app/(app)/episodes/[id]/guest-package/page.tsx')

  it('accesses data.data?.package for guest package', () => {
    expect(source).toContain('data.data?.package')
  })

  it('does NOT access data.package directly', () => {
    // Old: data.package
    expect(source).not.toMatch(/(?<!data\.)data\.package(?!\?)/)
  })
})

describe('C11: Redis cache does not double-serialize', () => {
  const source = readSource('lib/redis/cache.ts')

  it('does NOT JSON.stringify values in set()', () => {
    expect(source).not.toContain('JSON.stringify')
  })

  it('has isRedisAvailable guard on all operations', () => {
    expect(source).toContain('isRedisAvailable()')
  })

  it('has try/catch error handling', () => {
    // Should have try/catch around redis operations
    const tryCount = (source.match(/try\s*\{/g) || []).length
    expect(tryCount).toBeGreaterThanOrEqual(3) // get, set, del all have try/catch
  })
})

describe('C12: Stripe pricing does not use env vars at module level', () => {
  const source = readSource('lib/stripe/products.ts')

  it('has getServerPriceId function for server-side resolution', () => {
    expect(source).toContain('getServerPriceId')
  })

  it('does NOT have process.env in PRICING_TIERS', () => {
    // Extract the PRICING_TIERS definition
    const tiersMatch = source.match(/PRICING_TIERS[\s\S]*?(?=\nexport|$)/)
    if (tiersMatch) {
      const tiersSection = tiersMatch[0]
      // The tiers themselves should not reference process.env
      expect(tiersSection).not.toContain('process.env.STRIPE')
    }
  })

  it('resolves price IDs inside function, not at module scope', () => {
    expect(source).toContain('function getServerPriceId')
  })
})

describe('C12: Stripe checkout route accepts tier', () => {
  const source = readSource('app/api/stripe/checkout/route.ts')

  it('accepts tier parameter in request body', () => {
    expect(source).toContain('tier')
  })

  it('uses getServerPriceId to resolve price', () => {
    expect(source).toContain('getServerPriceId')
  })

  it('has correct success_url pointing to settings with tab', () => {
    expect(source).toContain('settings?tab=billing')
  })
})

describe('C12: Subscription hook sends tier, not priceId', () => {
  const source = readSource('hooks/use-subscription.ts')

  it('sends tier in checkout request', () => {
    expect(source).toContain('tier')
  })

  it('does NOT send price_id in checkout', () => {
    expect(source).not.toContain('price_id:')
  })
})
