# Feature Analysis: Third-Party Integrations

**Status:** Reviewed
**Author:** qa-analyst (in-process)
**Date:** 2026-04-18
**Target:** http://localhost:3001 + `app/src/lib/{taddy,buzzsprout,transistor,webhooks,rss}/` + corresponding API routes
**Source files:** See Section 2

## 1. Overview

Third-party integrations are the highest-risk surface area for launch. They
span five distinct subsystems:

1. **Taddy** — GraphQL podcast discovery + guest intelligence. Used for
   expert/guest discovery, pre-interview intel, and podcast search.
   Schema drift risk is high (external API). Cached in `taddy_*_cache`
   tables with per-table TTLs.
2. **Buzzsprout** — Podcast hosting API. User stores an encrypted API
   token, then lists/pushes show notes. Credential is round-trip
   encrypted (AES-256-GCM).
3. **Transistor** — Parallel hosting integration, documented as optional
   (global `TRANSISTOR_API_KEY`). Endpoints return 404 or error if not
   configured.
4. **Outbound webhooks** — HMAC-SHA256 signed fire-and-forget POSTs to
   user-configured URLs on `episode.completed` / `episode.failed` /
   `asset.generated`. Per-webhook secret stored encrypted.
5. **RSS import** — zero-dependency RSS 2.0 parser with Podcasting 2.0
   support, fetches a remote URL and batch-inserts episodes. No SSRF
   guard today.

## 2. Source Code Map

| File | Responsibility |
|------|----------------|
| `app/src/lib/taddy/client.ts` | GraphQL client (retries, rate tracking, 15s timeout) |
| `app/src/lib/taddy/cache.ts` | Cache-first strategy (admin client writes to shared cache) |
| `app/src/lib/taddy/search.ts` | Higher-level search wrappers |
| `app/src/lib/taddy/queries.ts` | GraphQL query strings |
| `app/src/lib/taddy/types.ts` | Taddy GraphQL response shapes |
| `app/src/lib/buzzsprout/client.ts` | Buzzsprout REST client with retries + 429 handling |
| `app/src/lib/buzzsprout/encryption.ts` | AES-256-GCM envelope: `encryptCredentials`, `decryptCredentials`, `encryptString`, `decryptString` |
| `app/src/lib/buzzsprout/helpers.ts` | Buzzsprout credential retrieval helper |
| `app/src/lib/transistor/client.ts` | Transistor client (assume analogous) |
| `app/src/lib/transistor/helpers.ts` | `getTransistorClient(userId)` |
| `app/src/lib/webhooks/dispatcher.ts` | HMAC-signed fire-and-forget POSTs, 10s timeout, no retries, no SSRF guard |
| `app/src/lib/rss/parser.ts` | Zero-dep RSS 2.0 parser, 30s timeout, no SSRF guard |
| `app/src/lib/validation-schemas.ts` | `httpUrl`, `CreateWebhookSchema`, `ImportFeedSchema` |
| `app/src/app/api/taddy/search/route.ts` | `GET` — rate-limited 30 req/min, requires auth + term |
| `app/src/app/api/buzzsprout/connect/route.ts` | `POST` validates token by calling `getPodcasts()`, encrypts, stores |
| `app/src/app/api/buzzsprout/connect/route.ts` | `DELETE` — removes row by user_id |
| `app/src/app/api/buzzsprout/podcasts/route.ts` | `GET` — lists podcasts via stored token |
| `app/src/app/api/buzzsprout/episodes/route.ts` | `GET` — lists episodes |
| `app/src/app/api/buzzsprout/push-notes/route.ts` | `POST` — pushes show notes |
| `app/src/app/api/episodes/[id]/buzzsprout-inject/route.ts` | `POST` — push this episode's notes |
| `app/src/app/api/transistor/shows/route.ts` | `GET` — 404 when no connection |
| `app/src/app/api/transistor/episodes/route.ts` | `GET` — analogous |
| `app/src/app/api/episodes/[id]/transistor-inject/route.ts` | `POST` — push to Transistor |
| `app/src/app/api/webhooks/route.ts` | `GET`/`POST` — list/create, secret encrypted + masked in responses |
| `app/src/app/api/webhooks/[id]/route.ts` | `DELETE` — delete webhook |
| `app/src/app/api/webhooks/assemblyai/route.ts` | `POST` — AssemblyAI inbound callback, token-auth via query param (timing-safe compare) |
| `app/src/app/api/shows/[id]/import/route.ts` | `POST` — RSS batch import, rate-limited 5/min, 500-episode cap |
| `app/src/app/api/shows/[id]/rss/route.ts` | `GET` — public RSS proxy feed |

## 3. Selector Inventory

This cluster tests API/library behavior, not UI. No DOM selectors. Test
targets are:

- HTTP endpoints under `/api/`
- Exported library functions (`parseRSSFeed`, `dispatchWebhooks`,
  `encryptCredentials/decryptCredentials`, Taddy client retries)
- Database rows (`hosting_connections`, `webhooks`, cache tables)

## 4. Workflows

### W-1: Taddy search (cache-hit path)
- **Preconditions:** `TADDY_API_KEY` + `TADDY_USER_ID` set; user authenticated.
- **Steps:**
  1. `GET /api/taddy/search?term=foo&type=PODCASTSERIES` → first call hits real API, writes cache.
  2. Second identical call within TTL → served from cache (no network).
- **Assertions:** Status 200, `count` matches, response shape stable.

### W-2: Taddy search (rate limit)
- **Steps:** 31 requests in one minute from same user → 31st returns 429.
- **Assertions:** Status 429, body has `error`.

### W-3: Taddy search — not configured
- **Steps:** `TADDY_API_KEY` missing → 503 with message "not configured".

### W-4: Buzzsprout connect (happy path)
- **Steps:**
  1. `POST /api/buzzsprout/connect` with valid token.
  2. Token verified via `getPodcasts()`.
  3. Encrypted credentials saved in `hosting_connections`.
- **Assertions:** 200, row exists with provider=buzzsprout, `credentials` is
  JSON envelope (not plaintext), decrypts back to original token.

### W-5: Buzzsprout connect — bad token → 401
- **Steps:** `POST` with invalid token → Buzzsprout returns non-2xx → 401 "Invalid Buzzsprout API token".

### W-6: Buzzsprout connect — input validation
- **Missing token** → 400.
- **Oversized token (>200 chars)** → 400.
- **Invalid show_id type** → 400.

### W-7: Buzzsprout disconnect
- `DELETE /api/buzzsprout/connect` → removes only the caller's row.

### W-8: RLS isolation on hosting_connections
- User A creates a Buzzsprout connection.
- User B cannot read User A's row (list endpoints return empty).

### W-9: Transistor — not configured
- `GET /api/transistor/shows` when user has no `hosting_connections` row for provider=transistor → 404 "No Transistor connection found".

### W-10: Webhook CRUD
- `POST /api/webhooks` with `{url, events, secret}` → 201 with `has_secret: true`, no raw `secret` in response.
- `GET /api/webhooks` → list excludes `secret`.
- `DELETE /api/webhooks/[id]` → removes row.
- Secret at rest: stored row has `secret` as JSON envelope (encrypted), never plaintext.

### W-11: Webhook create — validation
- Invalid URL (e.g., `not-a-url`) → 400.
- Unknown event name → 400.
- Rate limit: 11th create in 60s → 429.

### W-12: Webhook dispatch — HMAC signature correctness
- Create webhook with known secret `S`.
- `dispatchWebhooks(userId, payload)` posts to capture endpoint.
- Signature header equals `HMAC-SHA256(body, S)`.

### W-13: Webhook dispatch — no secret
- Webhook with `secret: null` dispatched → POST arrives WITHOUT `X-PodBrain-Signature`.

### W-14: Webhook dispatch — filter by event
- Webhook subscribed to `episode.completed` only.
- Dispatch `episode.failed` → no POST arrives.

### W-15: Webhook dispatch — inactive rows skipped
- `active=false` row → no POST.

### W-16: Webhook dispatch — network failure
- Capture endpoint returns 500 → dispatcher logs, returns without throw.
- (Retries are documented as "planned" but not implemented today — flag.)

### W-17: AssemblyAI webhook — signed payload
- `POST /api/webhooks/assemblyai?token=<secret>` with matching transcript.
- Length-mismatched token → 401 (no RangeError).
- Correct token with unknown `transcript_id` → 404.

### W-18: RSS import — happy path
- `POST /api/shows/[id]/import` with a fixture feed URL → episodes inserted, duplicates skipped.

### W-19: RSS import — malformed XML
- Response body is HTML, not RSS → 422 "does not appear to be a valid RSS feed".

### W-20: RSS parser — podcast namespace extensions
- Feed contains `<itunes:image>`, `<itunes:duration>`, `<podcast:value>` → core fields parsed, unknown tags ignored safely.

### W-21: RSS import — rate limit
- 6 imports in 60s → 6th returns 429.

### W-22: Encryption round-trip
- `encryptCredentials({api_token: 'X'})` → envelope has `salt`, `iv`, `tag`, ciphertext ≠ 'X'.
- `decryptCredentials(envelope)` returns exact original object.
- Tampering the tag byte → `decryptCredentials` throws.

### W-23: Encryption — weak secret rejected
- `ENCRYPTION_SECRET` with <32 chars → `validateEncryptionSecret` throws.
- <16 unique chars → throws.

## 5. Loading, Empty, and Error States

| State | Trigger | Observable |
|-------|---------|------------|
| Taddy not configured | missing env | 503 from `/api/taddy/search` |
| Taddy rate limited | 31st req in 60s | 429 |
| Taddy API error | upstream 500 | propagates as handled error |
| Buzzsprout bad key | upstream 401 | 401 from our route |
| Transistor not configured | no `hosting_connections` row | 404 "No Transistor connection found" |
| Webhook URL unreachable | DNS or 500 | logs error, no throw |
| RSS feed 404 | upstream 404 | 422 with message |
| RSS feed timeout | >30s | 422 with "timed out" |

## 6. Edge Cases

- **EC-1:** Taddy returns `{ data: null, errors: [...] }` → client throws `TaddyApiError` with first error's message.
- **EC-2:** Taddy returns new/unknown top-level fields → ignored by response typing (no crash).
- **EC-3:** Buzzsprout API key leak — CRITICAL: `hosting_connections.credentials` must NEVER be plaintext. Verify via raw DB inspection.
- **EC-4:** Webhook URL = `http://localhost:8080/admin` (SSRF) — **BUG**: no guard exists today. Dispatcher will happily POST to internal URLs.
- **EC-5:** Webhook URL = `http://169.254.169.254/latest/meta-data/` (AWS IMDS) — **BUG**: no guard exists today.
- **EC-6:** RSS feed URL = `http://localhost:3001/api/anything` — **BUG**: no SSRF guard. Could exfiltrate internal responses.
- **EC-7:** RSS feed URL redirects 302 → internal IP — **BUG**: fetch follows redirect; no post-redirect validation.
- **EC-8:** Two webhooks subscribed, one fails, other must still deliver — `Promise.allSettled` ✓.
- **EC-9:** Webhook secret column has BOTH legacy-plaintext strings AND new JSON envelopes — dispatcher handles via try/catch fallback. Tested.
- **EC-10:** Inbound AssemblyAI webhook with token of differing length — previously caused `RangeError`; fix is in place (length pre-check).
- **EC-11:** Taddy cache write fails (RLS or DB error) — must NOT fail user request. Verified: `cacheEpisodesInBackground(...).catch(() => {})`.
- **EC-12:** Concurrent Taddy searches from same user: 32 in 60s → exactly 30 succeed.
- **EC-13:** User A cannot read user B's webhook rows (RLS).
- **EC-14:** Encryption envelope with wrong `version` → throws informative error.

## 7. Async Behavior

- Taddy client: 15s AbortSignal.timeout, 2 retries with 1s sleep — test via `vi.mock('fetch')`.
- Buzzsprout client: 3 retries with exponential backoff, 429-aware — test via mock.
- Webhook dispatch: fire-and-forget, 10s AbortSignal.timeout per delivery — test via local http.createServer.
- RSS fetch: 30s AbortSignal — test with `AbortController` timing.

## 8. Data Requirements

- Two Supabase users (A, B) with `[INT-QA]` prefix for RLS tests.
- Fixture RSS feed: static XML in `app/test/fixtures/rss/` (good, malformed, namespace-heavy).
- Mock Taddy GraphQL responses for schema-drift tests.
- Mock Buzzsprout REST responses for client tests.
- Local `http.createServer` instance for webhook dispatch capture.

## 9. Accessibility Notes

N/A — this cluster is API/library only.

## 10. Out of Scope

- Real AssemblyAI live path (covered by Cluster 1).
- Real Stripe webhook (covered by billing cluster).
- Pushing real content to real Buzzsprout shows.
- Taddy monthly quota enforcement (infrastructure-side only).

## 11. Open Questions

(All resolved by inspection.)

- Webhook retry policy: code currently has **no retries**. Mark as feature gap.
- Webhook dead-letter: **not implemented**. Mark as gap.
- Webhook SSRF guard: **not implemented**. Critical bug.
- RSS SSRF guard: **not implemented**. Critical bug.
- Taddy `Retry-After` header on 429: **not forwarded** to user. Minor INFO.
