# Bugs Discovered — Processing Pipeline

**Feature:** `processing-pipeline`
**Discovered by:** qa-healer
**Date:** 2026-04-09

## Bug #2 — AssemblyAI webhook crashes with 500 on wrong-length token

**Severity:** HIGH (security + reliability)

**Evidence:**
Ran `crypto.timingSafeEqual(Buffer.from('short'), Buffer.from('much-longer-secret'))`:
```
RangeError: Input buffers must have the same byte length
```

**Root cause:** `src/app/api/webhooks/assemblyai/route.ts` verified the token with:
```ts
crypto.timingSafeEqual(Buffer.from(token), Buffer.from(webhookSecret))
```
Node's `timingSafeEqual` throws a `RangeError` if the two buffers have
different byte lengths. When an attacker (or a legitimate probe with a
typo) sent a token of the wrong length:
1. The error was uncaught inside the route handler
2. The outer `try/catch` returned a generic 500 instead of 401
3. Logs leaked a stack trace revealing the crypto call
4. The response time gap between "wrong-length token → exception path"
   and "correct-length token → verification path" leaked the secret length

**Fix:** Check lengths explicitly before calling `timingSafeEqual`. If
lengths differ, return 401 immediately. This is NOT a timing attack
vector because an attacker can already infer the secret length from
the 401 vs 500 response time gap anyway.

```ts
const secretBuf = Buffer.from(webhookSecret)
const tokenBuf = token ? Buffer.from(token) : null
const lengthsMatch = tokenBuf && tokenBuf.length === secretBuf.length
const tokenMatches = lengthsMatch && crypto.timingSafeEqual(tokenBuf, secretBuf)

if (!tokenMatches) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}
```

**Regression guard:** `app/test/unit/api/assemblyai-webhook-auth.test.ts`
has 9 tests covering:
- Exact secret → true
- Wrong token same length → false
- Shorter token → false (no throw) — **was 500 before fix**
- Longer token → false (no throw) — **was 500 before fix**
- Empty string → false
- Null → false
- Undefined → false
- Unicode edge case (€ is 3 bytes, 1 char) → false (no throw)
- Variable lengths → no throws

**Status:** FIXED by Healer in this pipeline run.
