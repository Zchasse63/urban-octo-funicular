# Bugs Found — Third-Party Integrations

All bugs below were DISCOVERED by the integrations QA cluster. Bugs
marked **[FIXED]** were auto-fixed by the Healer in this run; bugs
marked **[FLAG]** are feature gaps surfaced for follow-up work.

## Bug B-INT-001 [FIXED]: Missing SSRF guard on outbound webhook dispatcher

**Found by:** qa-healer (integrations cluster)
**Date:** 2026-04-18
**Tests:** T-038a / b / c (webhook-dispatcher-behavior.test.ts)
**File:** `app/src/lib/webhooks/dispatcher.ts`
**Severity:** **Critical** (security)

### What the test expects
A webhook whose URL points at a loopback / link-local / RFC1918 address
must not result in a fetch. The dispatcher should refuse delivery and
log the refusal.

### What actually happened (pre-fix)
`dispatchWebhooks` trusted whatever URL was in the DB row and called
`fetch(webhook.url, …)`. A malicious user (or one who bypassed schema
validation via direct DB insert) could:
  - Hit `http://127.0.0.1:3001/api/…` → fetch the server's own
    internal endpoints.
  - Hit `http://169.254.169.254/latest/meta-data/iam/security-credentials/`
    on EC2 → retrieve IAM credentials through error logs.
  - Hit `http://10.0.0.1/admin/` on a VPC → reach services that should
    be off-limits.

### Reproduction (pre-fix)
1. Insert a webhooks row with `url = 'http://127.0.0.1:3001/api/anything'`,
   `active = true`, `events = ['episode.completed']`.
2. Call `dispatchWebhooks(userId, { event: 'episode.completed', … })`.
3. Observe an outbound fetch to the internal URL in logs.

### Fix (applied)
- New module `app/src/lib/security/ssrf-guard.ts` with
  `isSafeExternalUrl()` covering IPv4 private ranges, IPv6 loopback /
  link-local / ULA, hostname-based loopback, non-http(s) schemes, and
  numeric-encoding tricks.
- `dispatcher.ts` now calls `isSafeExternalUrl` before every `fetch`
  and logs + returns on failure.

### Follow-up
- Redirect walking: `fetch` with default `redirect: 'follow'` could
  still land on an internal host after a 302. Tracked as
  `INT-001-followup`. Low priority — the create-time validation also
  blocks internal URLs from ever entering the DB.

---

## Bug B-INT-002 [FIXED]: Missing SSRF guard on RSS import

**Found by:** qa-healer
**Tests:** T-043a–f (rss-parser-ssrf.test.ts),
T-043-route-a–d (rss-import-route.test.ts)
**File:** `app/src/lib/rss/parser.ts`, `app/src/lib/validation-schemas.ts`
**Severity:** **Critical** (security)

### What the test expects
A `POST /api/shows/[id]/import` with `feedUrl` pointing at a local or
private host must return 400 before the fetch is attempted.

### What actually happened (pre-fix)
The zod schema only required `.url()` + `http(s)` scheme. Nothing
rejected `http://localhost`, `http://127.0.0.1`, `http://169.254.169.254`,
or any RFC1918 address. The parser fetched happily and surfaced the
internal response body / headers / status through its error path.

### Fix (applied)
- `ImportFeedSchema.feedUrl` now routes through the shared `httpUrl`
  primitive in validation-schemas.ts, which includes a
  `.refine(isSafeExternalUrl)` check.
- `parseRSSFeed` itself also calls `isSafeExternalUrl` as defense in
  depth — even callers that bypass the route validation are protected.

### Follow-up
- Same as B-INT-001: redirect-follow is not audited. Flagged as
  `INT-002-followup`.

---

## Bug B-INT-003 [FIXED]: IPv6 loopback not blocked when URL uses bracket literal

**Found by:** qa-healer (self-inflicted during first SSRF implementation)
**Test:** `isSafeExternalUrl > blocks ipv6 loopback`
**File:** `app/src/lib/security/ssrf-guard.ts`
**Severity:** High

### What happened
First SSRF implementation assumed Node's `URL.hostname` stripped square
brackets around IPv6 literals. It does not — `http://[::1]/` parses to
`hostname === '[::1]'`. The `host.includes(':')` check matched but the
string-equality against `'::1'` did not.

### Fix
Strip the brackets before normalization. Also added explicit block for
IPv4-mapped IPv6 loopback (`::ffff:127.0.0.1`, etc.).

---

## Bug B-INT-004 [FLAG]: Outbound webhooks have NO retries or dead-letter

**Found by:** qa-analyst (code inspection)
**File:** `app/src/lib/webhooks/dispatcher.ts`
**Severity:** Medium (reliability / product)

### What the docs claim
`docs/Archived/PODBRAIN-PRD-ALABASTER.md` and the `specs/pipeline-log`
reference retries on 5xx responses and a dead-letter log. Neither is
implemented in current code.

### What actually happens
- `dispatchWebhooks` is **fire-and-forget**: `Promise.allSettled` on all
  deliveries, then a top-level swallow.
- On 5xx or network error: we log `console.error(...)` and return. No
  retry, no DLQ, no visibility to the user in the dashboard.

### Impact
A transient outage on the user's receiving endpoint silently drops the
event. Users get no notification that deliveries are failing.

### Recommendation
Defer to a post-launch iteration:
1. Persist delivery attempts in a new `webhook_deliveries` table (status,
   attempt_count, next_retry_at, last_error).
2. Schedule retries via Trigger.dev on exponential backoff, up to N=5.
3. Surface failing webhooks in the settings UI ("last delivery failed
   N times — reconnect?").

### Route to
Backlog / post-launch. Not a launch blocker; existing behavior is
explicitly documented as "deliver once, log failures".

---

## Bug B-INT-005 [FLAG]: Taddy 429 Retry-After not surfaced to user

**Found by:** qa-analyst (code inspection)
**File:** `app/src/lib/taddy/client.ts`, `app/src/app/api/taddy/search/route.ts`
**Severity:** Low

### What happens
When Taddy returns 429, the client throws `TaddyRateLimitError`. The
API route catches via `handleApiError` and returns a generic 500 with
"Internal server error" — the `Retry-After` header from Taddy is lost.

### Recommendation
1. In the route, catch `TaddyRateLimitError` explicitly and return 503
   with a `Retry-After` header (or our own heuristic default of 60s).
2. UI search page shows a friendlier "Podcast search is temporarily
   unavailable, try again in a minute."

### Route to
Backlog. Not a launch blocker.
