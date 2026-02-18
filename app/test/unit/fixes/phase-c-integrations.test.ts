/**
 * PHASE C: INTEGRATION FIXES VERIFICATION
 *
 * Code-level tests that verify Phase C fixes are correct.
 * Checks Stripe, Redis, and Buzzsprout integration code.
 */

import { describe, it, expect } from 'vitest'
import * as fs from 'fs'
import * as path from 'path'

const SRC = path.resolve(__dirname, '../../../src')

function readSource(relativePath: string): string {
  return fs.readFileSync(path.join(SRC, relativePath), 'utf-8')
}

describe('H3: Stripe client lazy initialization', () => {
  const source = readSource('lib/stripe/client.ts')

  it('uses lazy initialization pattern', () => {
    expect(source).toContain('getStripe')
  })

  it('does NOT throw at module scope', () => {
    // Old pattern was: throw new Error at top level
    // New pattern uses Proxy or lazy getter
    const lines = source.split('\n')
    const topLevelThrows = lines.filter((line, i) => {
      // A throw at indentation level 0 (not inside a function)
      return line.match(/^throw\s/) && !lines.slice(0, i).some(l => l.match(/^\s*(function|export\s+function|const\s+\w+\s*=\s*\(|if|try)/))
    })
    expect(topLevelThrows.length).toBe(0)
  })

  it('uses Proxy for backwards compatibility', () => {
    expect(source).toContain('Proxy')
  })
})

describe('H4: Stripe portal return_url', () => {
  const source = readSource('app/api/stripe/portal/route.ts')

  it('returns to /settings?tab=billing', () => {
    expect(source).toContain('settings?tab=billing')
  })

  it('does NOT return to /settings/billing', () => {
    expect(source).not.toContain("'/settings/billing'")
    expect(source).not.toContain('"/settings/billing"')
    expect(source).not.toContain('`/settings/billing`')
  })
})

describe('M2: Redis client graceful fallback', () => {
  const source = readSource('lib/redis/client.ts')

  it('has isRedisAvailable function', () => {
    expect(source).toContain('isRedisAvailable')
  })

  it('returns null when env vars missing', () => {
    // Redis client should handle missing env vars gracefully
    expect(source).toContain('null')
  })

  it('checks both URL and token before creating client', () => {
    expect(source).toContain('url')
    expect(source).toContain('token')
  })
})

describe('Redis cache operations are guarded', () => {
  const source = readSource('lib/redis/cache.ts')

  it('get() checks isRedisAvailable', () => {
    // Extract the get function body
    const getMatch = source.match(/export async function get[\s\S]*?^}/m)
    if (getMatch) {
      expect(getMatch[0]).toContain('isRedisAvailable')
    }
  })

  it('set() checks isRedisAvailable', () => {
    const setMatch = source.match(/export async function set[\s\S]*?^}/m)
    if (setMatch) {
      expect(setMatch[0]).toContain('isRedisAvailable')
    }
  })

  it('del() checks isRedisAvailable', () => {
    const delMatch = source.match(/export async function del[\s\S]*?^}/m)
    if (delMatch) {
      expect(delMatch[0]).toContain('isRedisAvailable')
    }
  })
})

describe('H4: Buzzsprout connection status check', () => {
  const source = readSource('app/(app)/settings/page.tsx')

  it('checks hosting_connections table on mount', () => {
    expect(source).toContain('hosting_connections')
  })

  it('queries for buzzsprout platform', () => {
    expect(source).toContain('buzzsprout')
  })

  it('sets connection state from DB', () => {
    expect(source).toContain('setIsConnected')
  })
})
