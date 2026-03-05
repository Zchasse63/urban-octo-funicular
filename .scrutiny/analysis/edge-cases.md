# Edge Cases Analysis
**Agent:** edge-cases
**Plan:** PodBrain Codebase Refactor
**Complexity Class:** SIGNIFICANT
**Analysis Depth:** Deep
**Date:** 2026-03-04

---

## Agent Verdict

**MODIFY** — Several edge cases in Phase 2 (API route standardization) could silently break frontend callers or webhook consumers if not explicitly handled. The most dangerous are: (1) routes with non-standard success response shapes that the frontend decodes directly, (2) the AssemblyAI webhook route which must not have its response shape changed, and (3) the `_request` standardization which could break if a route handler uses the request object in a way the developer doesn't notice.

---

## Edge Case Catalog

### Edge Case 1: AssemblyAI Webhook Endpoint Must Be Excluded from Phase 2

`POST /api/webhooks/assemblyai` is a **public webhook callback** endpoint. Its response shape is not defined by internal conventions — it's defined by what AssemblyAI expects back from the webhook receiver.

Typically, webhook receivers must return HTTP 200 with a specific shape (or just 200 with no body). If Phase 2.1 modifies this route to return `{ data: null, error: null }` when it currently returns just a `200 OK`, AssemblyAI may:
- Log the response as an unexpected shape
- Retry the webhook (leading to duplicate processing)
- Depending on AssemblyAI's behavior, mark the webhook as failed

**This route must be explicitly excluded from Phase 2.1.** The plan does not mention this exclusion.

### Edge Case 2: Stripe Webhook Endpoint Must Be Excluded from Phase 2

`POST /api/stripe/webhooks` is another public webhook endpoint. Stripe sends webhook events and expects an HTTP 200 response quickly. If the response shape changes or the handler adds overhead (like wrapping in a helper that logs), Stripe may retry the event.

Additionally, this route has special handling for webhook signature verification — any change to the route's early error returns must preserve the exact error behavior that Stripe interprets.

**This route must be explicitly excluded from Phase 2.** The plan does not mention this exclusion.

### Edge Case 3: Stripe Checkout Response Shape Change Breaks Frontend

The current checkout route returns:
```typescript
return NextResponse.json({ url: session.url });
```

The frontend calls this route and does something like:
```typescript
const data = await response.json();
if (data.url) window.location.href = data.url;
```

If Phase 2.3 changes this to:
```typescript
return successResponse({ url: session.url });
// Returns: { data: { url: '...' }, error: null }
```

The frontend check `if (data.url)` becomes `if (data.data?.url)` — a breaking change. The frontend would silently fail to redirect after checkout, which means paid users can't complete checkout.

**This is a high-stakes edge case.** Stripe checkout failure is directly revenue-impacting.

The plan says "Ensure Stripe routes use consistent `{ data, error }` format" — this means the plan intends to change the shape. But it doesn't mention updating the frontend caller.

**Fix:** Before changing any Stripe route response shape, grep for the fetch call that consumes it and update the frontend in the same change.

### Edge Case 4: RSS Proxy Route Must Be Excluded

`GET /api/shows/[id]/rss` is a **public RSS feed endpoint** consumed by podcast players (e.g., Apple Podcasts, Spotify). Its response is XML, not JSON. The `errorResponse()` helper returns JSON. If Phase 2 accidentally applies `errorResponse()` to this route's error cases, podcast players would receive JSON error bodies instead of valid XML error responses, causing feed parsing failures.

This route almost certainly already returns XML directly (bypassing `NextResponse.json()`) — but the plan doesn't explicitly exclude it.

### Edge Case 5: `_request` Standardization — Silent Behavioral Change Risk

Plan Section 2.2 mentions: "Standardize unused request params: use `_request` consistently when unused."

This is normally cosmetic — renaming `request` to `_request` in a route handler where the parameter is unused. But there's a subtle edge case:

If a developer reviews a route and sees `request` is unused, then renames it to `_request`, they may be wrong if the `request` object is used indirectly. For example:
- Some routes pass `request` to middleware or helper functions implicitly
- Next.js route handlers have specific behavior for reading request headers in dynamic routes
- The `rateLimitByIP` call uses `request.headers.get("x-forwarded-for")` — if this is missed during the review, renaming `request` to `_request` creates an incorrect signal that the request is unused

This is a low-probability edge case but the fix (careful human review) is cheap.

### Edge Case 6: handleApiError Swallows Structured Error Information

When `handleApiError(error, 'context')` catches an error, the implementation details matter. If the error has structured data (e.g., a Supabase `PostgrestError` with a `code` field, a Stripe `StripeError` with an HTTP status), a generic `handleApiError` may:
- Return a 500 when the original error warrants a 400 or 404
- Lose the structured error code that the frontend uses to display specific messages
- Lose the HTTP status code that the circuit breaker uses to determine retry behavior

Currently, catch blocks in some routes inspect the error type:
```typescript
if (error instanceof Error && error.message === 'Unauthorized') {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
```

A generic `handleApiError` needs to preserve this logic — either by:
- Type-checking the error before returning
- Preserving the original status code if available
- Having a way for callers to pass the expected error-to-status mapping

The plan doesn't specify `handleApiError`'s behavior, which is the most complex of the proposed helpers.

### Edge Case 7: Dynamic Import Resolution After xAI Export Removal

The 4 files that use `createGrokClient()` via `await import('@/lib/xai-client')` use destructured imports. TypeScript's type checking for dynamic imports is weaker than for static imports, especially when the import result type isn't explicitly declared.

If `createGrokClient` is removed from `lib/xai-client.ts`:
- TypeScript may or may not error at build time depending on `isolatedModules` and dynamic import typing strictness
- The error would surface at runtime when the code path executes
- In development: visible immediately
- In production: only when a user triggers viral moments, expert discovery, or cross-episode features

The consequence: a build that passes TypeScript checks deploys and throws `TypeError: createGrokClient is not a function` in production on specific code paths. This is a worst-case scenario for a "zero behavioral changes" refactor.

### Edge Case 8: parsePagination Helper and Query Parameter Types

The plan mentions adding a `parsePagination(searchParams)` helper. Pagination parameters in Next.js App Router are typed as `URLSearchParams` or `ReadonlyURLSearchParams` depending on context (route handler vs. page).

If the helper is typed for one but called in the other context, TypeScript errors appear. Additionally, some routes may use custom pagination parameter names (`page`, `offset`, `cursor`) — a single helper needs to handle all conventions or be parameterized.

### Edge Case 9: Backwards-Compat Re-exports and Module Tree Shaking

When types are moved from hooks to `types/database.ts` with re-exports:
```typescript
// in use-pre-interview.ts
export type { PreInterviewData } from '@/types/database';
```

This creates a re-export chain. In a tree-shaken bundle, type-only re-exports are removed at build time, so no runtime cost. However, if a consumer imports the type from the hook file (`import type { PreInterviewData } from '@/hooks/use-pre-interview'`) and the type is actually a value (e.g., a runtime constant that happens to have a type annotation), the re-export chain could cause the wrong module to be included. For pure type definitions, this is fine.

### Edge Case 10: Concurrent Test Suite During Development

The plan says "run `npx vitest run` after each phase." The test suite takes ~76 seconds (per MEMORY.md). During the 17-32 hour refactor window:
- If tests are only run after each phase, regressions in Phase 1 changes are only caught after Phase 1 completes
- If a developer runs a partial test subset to go faster, they may miss cross-phase interactions
- The 12 pre-existing DB test failures need to be re-baselined at the start to confirm they're still only 12

**Recommendation:** Run the test suite continuously in watch mode (`npx vitest --watch`) during development, not just at phase boundaries.

---

## Edge Case Severity Matrix

| Edge Case | Severity | Probability | Catchable by Tests? |
|-----------|----------|-------------|---------------------|
| 1. AssemblyAI webhook excluded | HIGH | 60% if not explicit | Unlikely (needs real webhook) |
| 2. Stripe webhook excluded | HIGH | 60% if not explicit | Unlikely (needs real Stripe) |
| 3. Stripe checkout shape break | HIGH | 70% if Phase 2.3 proceeds | Possibly (if frontend test exists) |
| 4. RSS route excluded | MEDIUM | 30% | No (XML response) |
| 5. _request rename edge | LOW | 20% | Yes (TS error or test) |
| 6. handleApiError swallows info | MEDIUM | 40% | Partially (depends on test detail) |
| 7. Dynamic import removal | HIGH | 95% if xAI removal proceeds | Sometimes (TS + test) |
| 8. parsePagination types | LOW | 40% | Yes (TS error) |
| 9. Re-export tree shaking | LOW | 10% | Yes (build) |
| 10. Test baseline drift | MEDIUM | 30% | Self-evident |

---

## Recommended Explicit Exclusions for Phase 2

Before beginning Phase 2, document these routes as excluded from response shape standardization:
- `POST /api/webhooks/assemblyai` — must return specific shape for AssemblyAI
- `POST /api/stripe/webhooks` — must return specific shape for Stripe
- `GET /api/shows/[id]/rss` — returns XML, not JSON
- `GET /api/episodes/[id]/assets/download` — returns ZIP binary, not JSON
- `GET /api/episodes/[id]/guest-package/download` — returns binary/ZIP

These are all routes where the response contract is defined by an external system, not internal convention.
