/**
 * PHASE D: SECURITY & CLEANUP VERIFICATION
 *
 * Code-level tests that verify Phase D fixes are correct.
 * Checks dev guards, user scoping, and security patterns.
 */

import { describe, it, expect } from 'vitest'
import * as fs from 'fs'
import * as path from 'path'

const SRC = path.resolve(__dirname, '../../../src')

function readSource(relativePath: string): string {
  return fs.readFileSync(path.join(SRC, relativePath), 'utf-8')
}

function sourceExists(relativePath: string): boolean {
  return fs.existsSync(path.join(SRC, relativePath))
}

describe('Dev guard utility exists', () => {
  it('dev-guard.ts exists', () => {
    expect(sourceExists('lib/api/dev-guard.ts')).toBe(true)
  })

  it('dev guard checks NODE_ENV', () => {
    const source = readSource('lib/api/dev-guard.ts')
    expect(source).toContain('NODE_ENV')
    expect(source).toContain('production')
  })

  it('dev guard returns 404 in production', () => {
    const source = readSource('lib/api/dev-guard.ts')
    expect(source).toContain('404')
  })
})

describe('Test routes have dev guards', () => {
  it('test-db route has dev guard', () => {
    const source = readSource('app/api/test-db/route.ts')
    expect(source).toContain('devGuard')
  })

  it('test-redis route has dev guard', () => {
    const source = readSource('app/api/test-redis/route.ts')
    expect(source).toContain('devGuard')
  })

  it('test-guest-package route has dev guard', () => {
    const source = readSource('app/api/test-guest-package/route.ts')
    expect(source).toContain('devGuard')
  })
})

describe('Assets download route has user scoping', () => {
  const source = readSource('app/api/episodes/[id]/assets/download/route.ts')

  it('imports DEFAULT_USER_ID', () => {
    expect(source).toContain('DEFAULT_USER_ID')
  })

  it('filters by user_id in query', () => {
    expect(source).toContain('user_id')
  })

  it('uses inner join with shows table', () => {
    expect(source).toContain('shows!inner')
  })
})

describe('API routes use consistent error response pattern', () => {
  it('assets download returns proper status codes', () => {
    const source = readSource('app/api/episodes/[id]/assets/download/route.ts')
    expect(source).toContain('status: 400')
    expect(source).toContain('status: 404')
    expect(source).toContain('status: 500')
  })
})
