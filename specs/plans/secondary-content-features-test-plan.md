# Test Plan: Secondary Content Features

**Feature Slug:** `secondary-content-features`
**Author:** qa-architect
**Date:** 2026-04-18
**Analysis:** `specs/features/secondary-content-features-analysis.md`

---

## 1. Strategy

Given the massive surface area (12 sub-features, 5,666 LoC of UI), the
test budget is ~40-60 test cases total. We go **API-first** to maximize
signal per test. Each sub-feature gets 3–5 tests targeting:

1. Happy path
2. The highest-signal edge case
3. Defense/regression for known-bug surface (#20, #33, #36, SEO honesty)

UI smoke tests cover only the three pages without a tab mount in an
existing spec: `/vocabulary`, `/analytics`, `/search`. RSS Tags UI is
already on the episode detail page — we assert API content and rely on
the existing `episode-detail.spec.ts` for UI coverage.

---

## 2. Test Infrastructure

### Existing POMs (reuse)
- `EpisodeDetailPage` — `app/test/e2e/pages/episode-detail-page.ts`
- Existing auth helpers: `signIn`, `createTestUser`, `deleteTestUser`, `createTestShow`

### New helpers
- `app/test/e2e/helpers/secondary-content-api.ts` — thin wrappers for each
  secondary-feature API endpoint. Mirrors `core-paid-flow-api.ts` style.
- `app/test/e2e/fixtures/secondary-content.ts` — seeded episode factories
  (with transcript, with cached viral moments, with show_notes, empty
  episode). Prefix all test data with `[SECONDARY-QA]`.

### No new POMs
- The small UI-smoke footprint (3 pages) is covered via `page.goto()` +
  `getByRole('heading')` inline. Creating POMs for pages we poke once is
  overkill and creates maintenance burden.

### Fixtures reuse
- Admin client for direct DB seeding (`getAdminClient()` from `test/setup/database.ts`).
- Existing auth state persistence across tests via `test.beforeAll` / `beforeEach` patterns from `core-paid-flow.spec.ts`.

---

## 3. Test Case Inventory

### P0 — Must-have (15 tests)

These guarantee each sub-feature's core contract.

| ID | Suite | Test | Method |
|----|-------|------|--------|
| T-001 | Viral Moments [P0] | GET returns cached moments for episode with `viral_moments` JSON | API |
| T-002 | Viral Moments [P0] | GET returns 422 when episode has no transcript | API |
| T-003 | SEO [P0] | GET on episode with GOOD show notes returns score >= 40 and schema object with `@type: 'PodcastEpisode'` | API |
| T-004 | SEO [P0] | GET on episode with EMPTY show notes returns score < 30, with populated suggestions (honest scoring) | API |
| T-005 | RSS Tags [P0] | GET returns well-formed XML snippet; all URLs match `NEXT_PUBLIC_APP_URL` or origin, NEVER `podbrain.app` (BUG #20 regression) | API |
| T-006 | RSS Tags [P0] | GET on episode w/ no viral moments & no sections → `soundbites: []`, `chapters: null` | API |
| T-007 | Pre-Interview [P0] | GET with no cached data → 404 with `error` field (never 500) | API |
| T-008 | Related Episodes [P0] | GET on isolated-show episode returns `{relatedEpisodes: [], count: 0}` | API |
| T-009 | A/B Test [P0] | POST with `field="title"` returns 200 with `variants` array length 2–5 | API |
| T-010 | A/B Test [P0] | POST with invalid `field` returns 400 | API |
| T-011 | Schedule [P0] | POST with past date returns 400 "Scheduled time must be in the future" | API |
| T-012 | Schedule [P0] | POST with valid future date → 200, episode.status='scheduled', DELETE reverts to 'pending' | API |
| T-013 | Vocabulary [P0] | POST → GET round-trip creates and reads a term; DELETE removes it | API |
| T-014 | Analytics [P0] | GET with no episodes returns 200, envelope shape `{data, error:null}`, never 500 (BUG #36 regression) | API |
| T-015 | Learnings [P0] | GET on fresh episode returns 200 (not 500) with insight record | API |

### P1 — Should-have (18 tests)

Common alternate paths and meaningful edge cases.

| ID | Suite | Test | Method |
|----|-------|------|--------|
| T-101 | Viral Moments [P1] | GET returns 404 for cross-user episode | API |
| T-102 | Viral Moments [P1] | GET returns 400 for malformed UUID | API |
| T-103 | SEO [P1] | POST fix with sanitized title updates episode and returns new score | API |
| T-104 | SEO [P1] | POST fix rate-limit kicks in after 20 rapid requests | API |
| T-105 | RSS Tags [P1] | GET includes `<podcast:person>` host tag when metadata.host_name set | API |
| T-106 | RSS Tags [P1] | GET generates `<podcast:soundbite>` tags from viral_moments payload | API |
| T-107 | Pre-Interview [P1] | GET returns 400 for malformed UUID | API |
| T-108 | Pre-Interview [P1] | GET returns 404 for cross-user episode | API |
| T-109 | A/B Test [P1] | POST with variantCount=10 is clamped to 5 (max enforcement) | API |
| T-110 | A/B Test [P1] | GET before POST returns `{data: null, error: null}` (no variants yet) | API |
| T-111 | Schedule [P1] | POST with date > 30 days out returns 400 | API |
| T-112 | Schedule [P1] | POST on `completed` episode returns 400 "Cannot schedule an episode with status: completed" | API |
| T-113 | Schedule [P1] | DELETE on non-scheduled episode returns 400 | API |
| T-114 | Vocabulary [P1] | POST with emoji/unicode/quotes stored and retrieved intact | API |
| T-115 | Vocabulary [P1] | POST with 201-char term returns 400 (zod cap enforcement) | API |
| T-116 | Vocabulary [P1] | GET on cross-user show returns 404 (RLS / ownership) | API |
| T-117 | Analytics [P1] | GET accepts `?showId=X&range=7` query params and filters correctly | API |
| T-118 | Vocabulary UI [P1] | `/vocabulary` page shows "AI Suggestions" + "Coming Soon" copy (BUG #33 regression) | UI |

### P2 — Nice-to-have (4 tests)

UI surface smoke for remaining pages.

| ID | Suite | Test | Method |
|----|-------|------|--------|
| T-201 | Analytics UI [P2] | `/analytics` page loads and renders h1 + at least one metric card without "500" or "error" text | UI |
| T-202 | Search UI [P2] | `/search` page loads and renders the search input placeholder | UI |
| T-203 | Viral Moments UI [P2] | Episode detail `/episodes/[id]` Intelligence tab loads Related Episodes card without crashing | UI |
| T-204 | RSS Tags Content [P2] | `channelTags` output includes `<podcast:medium value="podcast"/>` (static sanity) | API |

**Totals: 15 P0 + 18 P1 + 4 P2 = 37 tests.** Conservative — falls
within the 40-60 band with headroom. If P2 coverage needs expansion,
add variants of T-201/T-202 smoke.

---

## 4. File Layout

```
app/test/e2e/
├── flows/
│   └── secondary-content-features.spec.ts     (new — all 37 tests)
├── helpers/
│   └── secondary-content-api.ts                (new — API wrappers)
└── fixtures/
    └── secondary-content.ts                    (new — seed factories)
```

---

## 5. Data Needs

**Test data prefix:** `[SECONDARY-QA]` (per orchestrator instruction).

**Seeded fixtures (one test user, shared via beforeAll):**
1. `empty-episode` — episode with no transcript, no show_notes, `status='pending'`. For T-002, T-011, T-012, T-112 (after seed-status swap).
2. `completed-with-everything` — transcript, viral_moments, show_notes, guest_name, metadata.host_name. For T-001, T-003, T-005, T-105, T-106.
3. `completed-empty-notes` — transcript present but show_notes empty. For T-004.
4. `completed-no-extras` — no viral_moments, no episode_sections. For T-006, T-008, T-015.
5. `scheduled-episode` — `status='scheduled'` with `scheduled_at` metadata. For T-012 DELETE leg.
6. `completed-episode` — `status='completed'`. For T-112.
7. `cross-user-episode` — belongs to a second test user. For T-101, T-108, T-116.

Tear down via `cleanupTestDataByPattern()` in `afterAll`.

---

## 6. External Service Handling

- **Grok (xAI)** — Avoided in tests by seeding episodes with pre-computed
  `viral_moments` JSON. A/B test (T-009) will hit the real xAI endpoint
  since there's no cached path — accepted as "one real AI call per run."
- **Taddy** — Not invoked in these tests. Pre-interview POST would invoke
  Taddy; we only test the GET (cache) path to avoid cost.
- **Supabase** — Real project `itnzbdojxvbhuxnwqgzg` via admin client.
- **Redis (rate limiting)** — Real. T-104 expects real 429.

---

## 7. Open Questions

None. Plan is implementable as specified.

---

## 8. Implementation Notes for Engineer

1. Use the **API-first** pattern — `const api = page.request; const res = await api.get('/api/...')` — and assert response shape explicitly.
2. Seed via `getAdminClient()` from `test/setup/database.ts`.
3. Always `await cleanupTestDataByPattern()` in `afterAll`.
4. For T-005 (BUG #20), parse the returned `snippet` string and assert:
   - Does NOT include `podbrain.app` (the typo)
   - Does NOT include `localhost:3001` (when `NEXT_PUBLIC_APP_URL` is set)
   - DOES include either `process.env.NEXT_PUBLIC_APP_URL` or a valid `https://` production-style origin OR the current request origin.
   - For local dev `http://localhost:3001` is the request origin — accept this but assert it does NOT include `podbrain.app` under any condition.
5. For T-014 (analytics empty), create a fresh test user with ZERO episodes and call the endpoint.
6. For T-118 (vocabulary UI), navigate to `/vocabulary`, assert the heading, assert `getByText(/AI Suggestions/)` and `getByText(/Coming Soon/)` are both visible.
7. For UI tests, **do not** use `waitForTimeout`, `force: true`, or XPath. Use `getByRole`, `getByText`, `waitForURL`, or `locator.waitFor({state: 'visible'})`.
