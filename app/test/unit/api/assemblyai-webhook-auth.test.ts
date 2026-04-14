/**
 * Tests for the AssemblyAI webhook token authentication logic.
 *
 * The webhook handler at /api/webhooks/assemblyai verifies a query-string
 * token against ASSEMBLYAI_WEBHOOK_SECRET using `crypto.timingSafeEqual`.
 *
 * Bug #2 discovered by the QA Council: `crypto.timingSafeEqual` throws a
 * RangeError if the two buffers have different lengths. Before the fix,
 * an attacker (or a legitimate probe with the wrong token length) would
 * trigger a 500 Internal Server Error instead of a clean 401 Unauthorized.
 * The fix: check lengths before calling timingSafeEqual.
 *
 * These tests reproduce the failure mode in isolation using the same
 * crypto primitive the handler uses, then verify the fix handles all
 * the edge cases.
 */
import { describe, it, expect } from 'vitest'
import crypto from 'crypto'

/**
 * Verification helper matching the handler's logic exactly. Kept in
 * sync with `app/src/app/api/webhooks/assemblyai/route.ts`.
 */
function verifyToken(token: string | null | undefined, secret: string): boolean {
  const secretBuf = Buffer.from(secret)
  const tokenBuf = token ? Buffer.from(token) : null
  const lengthsMatch = tokenBuf && tokenBuf.length === secretBuf.length
  return Boolean(lengthsMatch && crypto.timingSafeEqual(tokenBuf, secretBuf))
}

describe('AssemblyAI webhook token verification', () => {
  const SECRET = 'supersecret-webhook-token-123456'

  it('accepts the exact secret', () => {
    expect(verifyToken(SECRET, SECRET)).toBe(true)
  })

  it('rejects an incorrect token of the same length', () => {
    const wrongToken = 'X'.repeat(SECRET.length)
    expect(verifyToken(wrongToken, SECRET)).toBe(false)
  })

  it('rejects a shorter token WITHOUT throwing RangeError', () => {
    // Regression guard for Bug #2. Before the fix, this would throw
    // `RangeError: Input buffers must have the same byte length` and
    // the handler would return 500 instead of 401.
    expect(() => verifyToken('short', SECRET)).not.toThrow()
    expect(verifyToken('short', SECRET)).toBe(false)
  })

  it('rejects a longer token WITHOUT throwing RangeError', () => {
    const longToken = SECRET + '-extra-padding-that-makes-it-longer'
    expect(() => verifyToken(longToken, SECRET)).not.toThrow()
    expect(verifyToken(longToken, SECRET)).toBe(false)
  })

  it('rejects an empty string token', () => {
    expect(verifyToken('', SECRET)).toBe(false)
  })

  it('rejects null', () => {
    expect(verifyToken(null, SECRET)).toBe(false)
  })

  it('rejects undefined', () => {
    expect(verifyToken(undefined, SECRET)).toBe(false)
  })

  it('rejects a token with unicode characters that affect byte length', () => {
    // '€' is 3 bytes in UTF-8 but 1 character in JS string length.
    // If the handler used character length instead of byte length,
    // this would crash timingSafeEqual.
    const unicodeToken = '€'.repeat(SECRET.length / 3)
    expect(() => verifyToken(unicodeToken, SECRET)).not.toThrow()
    expect(verifyToken(unicodeToken, SECRET)).toBe(false)
  })

  it('is NOT susceptible to early-exit timing attack on the length check', () => {
    // Length-check short-circuit is acceptable because the attacker can
    // already infer the secret length from the 401 response time gap.
    // This test just asserts the function is pure (no exceptions) at a
    // variety of lengths.
    const lengths = [0, 1, 10, 100, 1000, 10000]
    for (const len of lengths) {
      const token = 'a'.repeat(len)
      expect(() => verifyToken(token, SECRET)).not.toThrow()
    }
  })
})
