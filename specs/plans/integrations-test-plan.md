# Test Plan: Third-Party Integrations

**Status:** Reviewed
**Author:** qa-architect (in-process)
**Date:** 2026-04-18
**Related:** specs/features/integrations-analysis.md

## 1. Overview

This cluster verifies contract behavior of five external integrations
(Taddy, Buzzsprout, Transistor, outbound webhooks, RSS import) at the
library + API boundary. We prefer **fast, deterministic unit tests** with
mocked `fetch` for the client libraries, and a **small set of E2E
integration specs** against `http://localhost:3001` for the
auth-gated API routes and for end-to-end webhook dispatch via a local
HTTP capture server. Real Taddy/Buzzsprout network calls are avoided
unless we explicitly need to validate live contract shape (skipped under
`SKIP_LIVE=1`).

## 2. Page Object Models

No UI POMs for this cluster (API/library only). Helper modules instead:

### IntegrationsApiClient (new)
- **File:** `app/test/e2e/helpers/integrations-api.ts`
- **Responsibility:** Authenticated `fetch` wrappers for the integration API endpoints.
- **Methods:**
  - `taddySearch(term, type?)`
  - `connectBuzzsprout(token, showId?)`
  - `disconnectBuzzsprout()`
  - `listBuzzsproutPodcasts()`
  - `createWebhook({ url, events, secret? })`
  - `listWebhooks()`
  - `deleteWebhook(id)`
  - `importRssFeed(showId, feedUrl)`
  - `getTransistorShows()`

### WebhookCaptureServer (new)
- **File:** `app/test/e2e/helpers/webhook-capture.ts`
- **Responsibility:** Local `http.createServer` that records every inbound request (headers + body) for dispatcher assertions.
- **Methods:** `start()`, `stop()`, `url`, `received`, `reset()`.

## 3. Fixtures

### `[INT-QA]` users — `userA`, `userB`
- **File:** `app/test/e2e/helpers/auth.ts` (reuse `createTestUser` with `[INT-QA]` prefix).
- **Purpose:** RLS isolation + per-user state.
- **Teardown:** Cleanup via existing `cleanupTestDataByPattern('[INT-QA]')`.

### RSS feed fixtures (new)
- **File:** `app/test/fixtures/rss/`
  - `valid-minimal.xml` — 3 episodes, all required fields
  - `valid-podcasting2.xml` — with `<podcast:value>`, `<itunes:image>`, etc.
  - `malformed.xml` — invalid XML
  - `no-episodes.xml` — valid RSS, empty channel
  - `huge.xml.gz` — >1000 items (generated on-demand at test time)
- Served via `http.createServer` OR via `rss-server` helper.

## 4. Test Cases

### P0 — Critical path & security

#### T-001: Taddy search rate limit enforced
- **File:** `app/test/unit/api/taddy-search-route.test.ts` (new)
- **Type:** Route unit test (mock `checkRateLimit`).
- **Steps:** First 30 calls allowed, 31st returns 429.
- **Assertions:** status 429, JSON has `error`.

#### T-002: Taddy search — not configured
- Route returns 503 when Taddy env not set. (Mock `isTaddyAvailable = false`.)

#### T-003: Taddy client — GraphQL errors surface
- Mock `fetch` returning `{errors:[{message:'x'}]}` → `TaddyApiError` thrown.

#### T-004: Taddy client — unknown fields ignored
- Mock returning extra top-level + extra item fields. Client returns typed response; extra fields don't crash.

#### T-005: Taddy client — 429 → rate-limit error
- Mock response 429. Client throws `TaddyRateLimitError`.

#### T-006: Taddy cache write failure swallowed
- `cacheEpisodesInBackground` rejected. Verify caller does NOT reject.

#### T-010: Buzzsprout encryption round-trip
- **File:** unit test (extend existing `encryption.test.ts`).
- `encryptCredentials({ api_token: 'bzz_test_12345' })` → decrypt returns exact original; ciphertext !== plaintext; `salt`/`iv`/`tag` all present.

#### T-011: Buzzsprout encryption tamper-detection
- Flip one byte of `tag` → `decryptCredentials` throws.

#### T-012: Buzzsprout connect — bad token → 401
- Route unit test. Mock `BuzzsproutClient.getPodcasts` to throw → 401 "Invalid Buzzsprout API token".

#### T-013: Buzzsprout connect — validation
- Missing `api_token` → 400.
- `api_token` > 200 chars → 400.
- Invalid `show_id` type → 400.

#### T-014: Buzzsprout — RLS isolation (E2E)
- UserA connects, UserB's GET returns no rows.

#### T-020: Transistor — 404 when not configured
- Route unit test. Mock `getTransistorClient` to throw "No Transistor connection found" → 404.

#### T-030: Webhook CRUD — secret never leaks
- POST create webhook with `secret: 'S'` → response has `has_secret: true` and no `secret` key.
- GET list → masked form.
- Raw DB row: `secret` is a JSON envelope (includes `encrypted`, `salt`, `iv`, `tag`).

#### T-031: Webhook validation — invalid URL
- POST with `url: 'not-a-url'` → 400.

#### T-032: Webhook validation — unknown event
- POST with `events: ['unknown.event']` → 400.

#### T-033: Webhook dispatch — HMAC correctness (E2E with capture server)
- Create webhook in DB with known secret.
- Call `dispatchWebhooks(userId, payload)`.
- Capture server receives POST.
- `X-PodBrain-Signature` header equals `HMAC-SHA256(body, secret)`.
- `X-PodBrain-Event` matches payload.event.

#### T-034: Webhook dispatch — no secret, no signature
- Webhook with `secret: null` → delivered, but header absent.

#### T-035: Webhook dispatch — event filter
- Webhook subscribed only to `episode.completed`.
- Dispatch `episode.failed` → capture server receives nothing.

#### T-036: Webhook dispatch — inactive row skipped
- `active=false` → no POST.

#### T-037: Webhook dispatch — failure does not throw
- Capture server returns 500 → `dispatchWebhooks` resolves normally.

#### T-038: Webhook dispatch — SSRF guard (NEW — likely reveals bug)
- URL pointing at `http://127.0.0.1:<port>/admin` → POST must NOT be delivered (test expects guard).
- URL at `http://169.254.169.254/` → blocked.
- URL at `http://10.0.0.1/` → blocked.
- **Bug expectation:** Currently will fail (no guard). Healer will implement guard.

#### T-040: RSS import — happy path (E2E)
- Stand up local RSS server serving `valid-minimal.xml`.
- POST `/api/shows/[id]/import` with URL → 200, 3 episodes inserted.

#### T-041: RSS import — malformed → 422
- Serve `malformed.xml` → 422.

#### T-042: RSS import — dedup
- Second call with same feed → 0 imported, 3 skipped.

#### T-043: RSS import — SSRF guard (NEW — likely reveals bug)
- POST with `feedUrl: 'http://127.0.0.1:3001/api/health'` → 400 or 422 (blocked).
- POST with `feedUrl: 'http://169.254.169.254/latest/meta-data/'` → blocked.
- **Bug expectation:** Currently passes through. Healer will implement guard.

#### T-044: RSS import — rate limit
- 6 imports in 60s → 6th returns 429.

#### T-045: RSS parser — podcasting 2.0 namespaces parsed safely
- Feed with `<podcast:value>` and unknown tags → core fields parsed; no crash.

#### T-050: AssemblyAI webhook — token length mismatch → 401 (not 500)
- Request with `?token=wrong-length` → 401.

#### T-051: AssemblyAI webhook — correct token, unknown transcript → 404

### P1 — Should pass

#### T-060: Taddy 503 propagation (upstream down)
- Mock client throw → route returns 500 via `handleApiError`.

#### T-061: Buzzsprout client 429 respected with Retry-After

#### T-062: Webhook dispatcher — multiple webhooks, one failing
- Two webhooks registered, first returns 500, second 200. Both attempted; dispatcher resolves.

#### T-063: RSS parser — no episodes → `{imported:0, total:0}` 200

#### T-064: Encryption — weak secret rejected at boot
- `validateEncryptionSecret('short')` throws.
- `validateEncryptionSecret('aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa')` (32 chars, 1 unique) throws (entropy).
- `validateEncryptionSecret('Zx8Pq3Nv7Ts2Ke9Mr5Yw1Bu6Hc4Ja0Go')` (32 chars, ≥16 unique) passes.

### P2 — Nice-to-have

#### T-070: Taddy cache read MISS → HIT
- (Cache layer does not store search results; skip: documented as cache-aware at episode level only.)

#### T-071: Webhook list pagination / ordering
- Created 3, list returns newest first.

## 5. Test File Organization

```
app/test/
├── unit/
│   ├── lib/
│   │   ├── encryption.test.ts               [extend]
│   │   ├── webhook-dispatcher.test.ts       [extend — HMAC + event-filter + no-retry + SSRF]
│   │   ├── rss-parser.test.ts               [extend — SSRF + podcasting2 namespaces]
│   │   └── taddy-client.test.ts             [extend — errors, unknown fields]
│   └── api/
│       ├── taddy-search-route.test.ts       [new]
│       ├── buzzsprout-connect-route.test.ts [new]
│       ├── transistor-shows-route.test.ts   [new]
│       ├── webhooks-route.test.ts           [new]
│       ├── assemblyai-webhook-route.test.ts [new/extend]
│       └── rss-import-route.test.ts         [new — incl. SSRF]
└── e2e/
    └── flows/
        └── integrations-rls.spec.ts          [new — RLS isolation end-to-end]
```

## 6. Execution Priority Order

P0 → P1 → P2 (but all run by default in `test:unit`).

## 7. Test Data Requirements

- `ENCRYPTION_SECRET` must be set in test env (.env.test or process env). Existing test suite already sets it.
- Users under `[INT-QA]` prefix for E2E.
- Local HTTP capture server for webhook dispatch (ephemeral port).
- Local RSS server (ephemeral port) serving fixtures.

## 8. Flakiness Risks

- **WebhookCaptureServer** — port collisions. Mitigation: listen on `0.0.0.0:0`, read `.address().port`.
- **RSS local server** — same as above.
- **Buzzsprout live validation in `connect` route** — hitting real API makes the unit test flaky and slow. Mitigation: mock `BuzzsproutClient.prototype.getPodcasts`.
- **Taddy cache write timing** — we assert the request is NOT awaited. Use `setImmediate`/`queueMicrotask` barrier before checking.

## 9. Out of Scope

- Real Stripe/Resend/AssemblyAI live round trips (other clusters).
- End-to-end UI flows for settings → webhook creation (already covered by
  `settings-authenticated.spec.ts`).

## 10. Open Questions

None. 4 known feature gaps are being **tested** and will be **auto-fixed**
by the Healer: webhook retries, webhook SSRF guard, RSS SSRF guard,
Taddy Retry-After surfacing.

## 11. Plan Compliance Targets

- **40–50 test cases total**, most new.
- **Type check** and **lint** must pass.
- **Unit test runtime** < 15s additional (excluding healer).
- **E2E RLS spec** < 30s.
