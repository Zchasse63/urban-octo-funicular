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

---

## Bug #6 — Cross-episode embeddings silently broken since day one

**Severity:** HIGH (feature silently degraded)
**Discovered:** 2026-04-15, during E2E verification of fix for Bugs #2–#5
**Feature broken:** Cross-episode similarity search, "related episodes" surfacing, any pgvector semantic search over `episode_sections.embedding`

**Evidence:**

After verifying the BUG #4 fix (`audio_duration_seconds` now written), I noticed all 151 segments of the test episode had `embedding: NULL` in the `episode_sections` table. The Trigger.dev log showed:

```
run_cmnzycwle0xwt0iob4pnxebpp.1 Failed to generate embeddings:
  Error: Circuit breaker is OPEN for xai. Try again later.
    at CircuitBreaker.execute (circuit-breaker.ts:52:15)
    at Object.createEmbedding (xai-client.ts:106:28)
    at generateEmbeddings (cross-episode/embeddings.ts:8:50)
    at saveProcessingResults (save-processing-results.ts:247:23)
    at run (process-episode.ts:193:7)
```

Tested the xAI embeddings API directly with the exact hardcoded model name:

```bash
curl -X POST https://api.x.ai/v1/embeddings \
  -H "Authorization: Bearer $XAI_API_KEY" \
  -d '{"model":"grok-embedding-small","input":"This is a test sentence."}'
```

Response:
```
The model grok-embedding-small does not exist or your team
9e54e9b9-60e0-47f2-a56e-71761fe3a4e5 does not have access to it.
```

Listed the complete set of available xAI models:

```
grok-3                           grok-4-fast-non-reasoning
grok-3-mini                      grok-4-fast-reasoning
grok-4-0709                      grok-4.20-0309-non-reasoning
grok-4-1-fast-non-reasoning      grok-4.20-0309-reasoning
grok-4-1-fast-reasoning          grok-4.20-multi-agent-0309
                                 grok-code-fast-1
                                 grok-imagine-image
                                 grok-imagine-image-pro
                                 grok-imagine-video
```

**Zero embedding models.** xAI has never offered embeddings.

**Root cause:** `src/lib/cross-episode/embeddings.ts` at line 9 hardcodes `model: 'grok-embedding-small'`. `src/lib/xai-client.ts` at line 9 hardcodes `DEFAULT_EMBEDDING_MODEL = 'grok-embedding-small'`. Both lines were added in the very first commit (`45b43c9 Initial PodBrain project setup`) — someone wrote the code assuming xAI had an embeddings endpoint similar to OpenAI's, named a plausible model, and never tested it against the real API.

**Blast radius (all silently broken since day one):**

1. `saveProcessingResults` — every segment's embedding is NULL.
2. `findSimilarSections` in `lib/cross-episode/similarity.ts` — calls the `find_similar_sections` pgvector RPC with the first section's NULL embedding; RPC returns nothing or errors; **fallback path returns 10 arbitrary sections from other episodes with a hardcoded `similarity: 0.5`**, so the "related episodes" feature displays non-related episodes as if they were related.
3. The circuit breaker trips to OPEN after 5 consecutive embedding failures, which happens on every run within 500ms (100ms delay × 5). Every subsequent embedding call in the same process throws `Circuit breaker is OPEN` — this is load-bearing noise in the logs that hides the underlying model-name problem.

**Fix options:**

1. **Swap to OpenAI `text-embedding-3-small`** (recommended):
   - Native 1536 dimensions — matches the existing pgvector column, zero migration
   - ~$0.02 per 1M tokens (cheapest commercial embedding model)
   - Requires `OPENAI_API_KEY` env var
   - Minimal code change: `generateEmbeddings` swaps fetch URL, auth header, and model name; everything else stays identical

2. **Swap to Voyage `voyage-3-lite`** — 512 dim, requires migration to shrink column
3. **Swap to Cohere `embed-english-v3.0`** — 1024 dim, requires migration
4. **Remove the feature entirely** — acceptable only if cross-episode similarity is dropped from the product

**Recommended implementation** (Option 1):

```typescript
// src/lib/cross-episode/embeddings.ts
const EXPECTED_EMBEDDING_DIMENSION = 1536;

export async function generateEmbeddings(content: string): Promise<number[]> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY not set — embeddings unavailable');
  }

  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'text-embedding-3-small',
      input: content,
    }),
    signal: AbortSignal.timeout(30000),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI Embeddings API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  const embedding = data?.data?.[0]?.embedding;

  if (!Array.isArray(embedding) || embedding.length !== EXPECTED_EMBEDDING_DIMENSION) {
    throw new Error(
      `Embedding dimension mismatch: expected ${EXPECTED_EMBEDDING_DIMENSION}, got ${embedding?.length}`
    );
  }

  return embedding;
}
```

And a one-off backfill script to regenerate embeddings for existing episodes once the provider swap is live.

**Status:** DISCOVERED, NOT YET FIXED. The feature has been broken for the entire lifetime of the codebase. Swap to OpenAI `text-embedding-3-small` as soon as an `OPENAI_API_KEY` is available.
