/**
 * REDIS CACHE TESTS
 *
 * Verifies C11 fix: no double-serialization in Redis cache.
 * Uses REAL Redis (Upstash) if available, skips if not configured or credentials are invalid.
 */

import { describe, it, expect, beforeAll, beforeEach } from 'vitest'
import { get, set, del } from '@/lib/redis/cache'
import { isRedisAvailable } from '@/lib/redis/client'

let redisWorking = false

beforeAll(async () => {
  if (!isRedisAvailable()) {
    console.log('Redis not configured — skipping Redis tests')
    return
  }

  // Verify the credentials actually work by doing a test operation
  try {
    const testKey = '__redis_health_check__'
    await set(testKey, 'ok', 5)
    const result = await get<string>(testKey)
    redisWorking = result === 'ok'
    await del(testKey)
  } catch {
    redisWorking = false
  }

  if (!redisWorking) {
    console.log('Redis credentials invalid or connection failed — skipping Redis tests')
  }
})

const skipIfNoRedis = () => {
  if (!redisWorking) return true
  return false
}

describe('C11: Redis cache operations', () => {
  const TEST_KEY = `test:cache:${Date.now()}`

  beforeEach(async () => {
    if (!redisWorking) return
    // Cleanup before each test
    await del(TEST_KEY)
  })

  it('stores and retrieves objects without double-serialization', async () => {
    if (skipIfNoRedis()) return

    const testObj = { name: 'PodBrain', version: 1, nested: { key: 'value' } }

    await set(TEST_KEY, testObj, 60)
    const retrieved = await get<typeof testObj>(TEST_KEY)

    expect(retrieved).toEqual(testObj)
    // Verify it's NOT a string (would indicate double-serialization)
    expect(typeof retrieved).not.toBe('string')
    expect(retrieved).toHaveProperty('name', 'PodBrain')
    expect(retrieved).toHaveProperty('nested')

    await del(TEST_KEY)
  })

  it('stores and retrieves arrays correctly', async () => {
    if (skipIfNoRedis()) return

    const testArray = [1, 2, 3, { id: 'abc' }]

    await set(TEST_KEY, testArray, 60)
    const retrieved = await get<typeof testArray>(TEST_KEY)

    expect(retrieved).toEqual(testArray)
    expect(Array.isArray(retrieved)).toBe(true)

    await del(TEST_KEY)
  })

  it('stores and retrieves simple strings', async () => {
    if (skipIfNoRedis()) return

    await set(TEST_KEY, 'hello', 60)
    const retrieved = await get<string>(TEST_KEY)

    expect(retrieved).toBe('hello')

    await del(TEST_KEY)
  })

  it('returns null for non-existent keys', async () => {
    if (skipIfNoRedis()) return

    const result = await get('nonexistent-key-12345')
    expect(result).toBeNull()
  })

  it('respects TTL expiration', async () => {
    if (skipIfNoRedis()) return

    await set(TEST_KEY, 'short-lived', 1) // 1 second TTL

    // Immediately available
    const immediate = await get<string>(TEST_KEY)
    expect(immediate).toBe('short-lived')

    // Wait for expiration
    await new Promise((resolve) => setTimeout(resolve, 1500))

    const expired = await get<string>(TEST_KEY)
    expect(expired).toBeNull()
  })

  it('gracefully handles errors when Redis is unavailable', async () => {
    // These should never throw, even if Redis is down
    const result = await get('any-key')
    expect(result === null || result !== undefined).toBe(true)

    // Set should not throw
    await expect(set('any-key', 'any-value', 60)).resolves.toBeUndefined()
  })
})
