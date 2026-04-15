# Bugs Discovered — Experts Discovery (/experts)

**Feature:** `experts` + `lib/taddy/*` + `lib/experts/discovery.ts`
**Discovered by:** live-walkthrough during product-quality audit
**Date:** 2026-04-15
**Dev server:** `next dev` (Turbopack) against Supabase project `itnzbdojxvbhuxnwqgzg`
**Test user:** `live-test@podbrain-test.local` (agency tier, active)
**Taddy credentials:** live — `TADDY_USER_ID=4344`, `TADDY_API_KEY` set (98-char)
**Fix authored:** 2026-04-15 (code edits applied, verified end-to-end)

---

## Bug #34 — Experts discovery is broken 6 different ways by Taddy schema drift ⭐ FIXED 2026-04-15

**Severity:** HIGH — `/experts` page returns "Failed to search experts:
Internal Server Error" for every query. The entire guest-discovery
feature has been non-functional since an unspecified Taddy schema
change. Also cascades to any other feature that uses
`searchEpisodesWithCache` / `searchPodcastsWithCache` from
`lib/taddy/cache.ts` (which may include parts of the `/search` page
and the Guest Package's cached-appearances lookup).

**Symptom:**

Open `/experts`, type any query in the textarea ("AI researcher",
"venture capital", etc.), click **Discover**. UI shows:

```
Searching...
(3 seconds later)
0 experts found
No experts found
Failed to search experts: Internal Server Error
Please try again or adjust your search.
```

The dev-server stderr contained:

```
Taddy discovery failed, falling back to Grok:
Error [TaddyGraphQLError]: Taddy GraphQL error:
Variable "$sortBy" got invalid value "RELEVANCE";
Value "RELEVANCE" does not exist in "SearchSortOrder" enum.
```

And the Grok fallback then also failed (`Invalid API response format`),
so the outer try/catch returned 500 `{"error":"Service unavailable"}`.

**Root causes (six distinct issues):**

Diagnosed by introspecting Taddy's live GraphQL schema (2026-04-15)
against the queries in `app/src/lib/taddy/queries.ts`:

| # | Issue | Before | After |
|---|---|---|---|
| 1 | `Person.img` field removed/renamed | `persons { img }` | `persons { imageUrl }` |
| 2 | `Person.href` field removed/renamed | `persons { href }` | `persons { url }` |
| 3 | `Person.uuid` became required | not queried | `persons { uuid }` |
| 4 | Enum type `SearchSortByEnum` renamed | `$sortBy: SearchSortByEnum` | `$sortBy: SearchSortOrder` |
| 5 | Enum type `SearchMatchByEnum` renamed | `$matchBy: SearchMatchByEnum` | `$matchBy: SearchMatchType` |
| 6 | Old enum values gone; new values are `POPULARITY/EXACTNESS` and `EXACT_PHRASE/ALL_TERMS/MOST_TERMS` | default `'RELEVANCE'` / `'TERM'` | default `'EXACTNESS'` / `'MOST_TERMS'` |

Plus **two additional constraints** discovered during verification:

| # | Issue | Cap |
|---|---|---|
| 7 | Taddy complexity budget — search endpoint | Cannot include `audioUrl` OR `podcastSeries.imageUrl` at any `limitPerPage`. Both fields + persons subselection → "Query too complex." |
| 8 | Taddy search `limitPerPage` hard cap | Was `50` in app. New limit: **25**. Anything above returns `limitPerPage must be between 1 and 25`. |

**Files modified:**

| File | Change |
|---|---|
| `app/src/lib/taddy/types.ts` | `TaddyPerson`: added `uuid`, renamed `img→imageUrl` + `href→url`; kept old fields as optional for backward-compat with existing jsonb cache rows. `TaddySortBy`/`TaddyMatchBy` unions updated to new enum values. |
| `app/src/lib/taddy/queries.ts` | `SEARCH_EPISODES`: enum types + `persons` field list + dropped `audioUrl`, `description`, `episodeNumber`, `seasonNumber`, `duration`, `podcastSeries.imageUrl`. `SEARCH_PODCASTS`: enum type. `GET_EPISODE` / `GET_EPISODE_WITH_TRANSCRIPT`: `persons` field list. |
| `app/src/lib/taddy/client.ts` | `searchEpisodes` + `searchPodcasts`: defaults flipped from `'RELEVANCE'` to `'EXACTNESS'`, `'TERM'` to `'MOST_TERMS'`. |
| `app/src/lib/taddy/cache.ts` | `cacheGuestAppearances`: reads `person.imageUrl || person.img` and `person.url || person.href` so new API rows + legacy cached rows both map correctly. |
| `app/src/lib/experts/discovery.ts` | `discoverFromTaddy`: same imageUrl/url fallback pattern in the person accumulator. `limitPerPage` lowered from 50 → 25 to match Taddy's new cap. |

**Verification steps executed 2026-04-15:**

1. **Direct Taddy schema introspection** to confirm the current Person type is `uuid/name/role/url/imageUrl` (no more `img`/`href`) and that enums are `SearchSortOrder`/`SearchMatchType` with values `POPULARITY|EXACTNESS` and `EXACT_PHRASE|ALL_TERMS|MOST_TERMS`.

2. **Standalone diagnostic script** (not committed — one-off) that loads the exact `SEARCH_EPISODES` string from the file and sends it to `https://api.taddy.org` with the app's credentials, bisecting field combinations until the working shape was found.

3. **Dev-server restart** — Next.js 16 Turbopack did NOT hot-reload the `lib/taddy/*` edits (the route kept serving cached compiled code). Required a full process kill + restart to pick up the changes.

4. **End-to-end API call** via `GET /api/shows/<id>/experts?topic=venture%20capital&source=taddy`:

   ```
   http=200  source=taddy  count=2
     - David Bizley · fresh · fresh=93 · apps=1 recent=1
     - Alfredo Carrato · fresh · fresh=93 · apps=1 recent=1
   ```

   Real pgvector-free cosine-free Taddy-fetched persons with real
   freshness scores. First time the feature has returned a non-error,
   non-empty result.

**Blast radius:**

Before the fix, every Taddy call site was broken:
- `/experts` page — never worked
- `/search` page — Taddy-backed podcast search also uses `searchPodcastsWithCache` (needs re-verification after the fix)
- Guest Package — `cacheGuestAppearances` called from `getCachedAppearances` for solo/guest intelligence (needs re-verification)
- Pre-interview cache population — any path that calls `searchEpisodesWithCache` for guest intel

Since the fix touches the low-level `queries.ts` + `client.ts`, all
of those call sites should auto-benefit from the same fix. I have
only verified `/experts` end-to-end so far. `/search` walk is next.

**Why this regressed:**

Taddy is an external GraphQL API and PodBrain has no integration
regression test against it. The schema changed on Taddy's end and no
one at PodBrain noticed until the live walk. Recommendation: add a
nightly contract test that hits the real Taddy API with the exact
queries from `queries.ts` and fails loudly on any GraphQL error. See
"Future prevention" section below.

**Future prevention:**

1. **Nightly integration test** — hit Taddy with the exact SEARCH_EPISODES and SEARCH_PODCASTS query strings, assert `data` is present and `errors` is empty. Fail CI if the assertion fails. Cheap (one request per query string per day) and catches schema drift within 24 hours.
2. **Schema introspection script** — check in a `taddy-schema-snapshot.json` generated via introspection query, and diff against it in CI. When Taddy changes something, CI fails with a readable diff.
3. **Alerts on Taddy errors in Sentry** — the existing `catch` in discovery.ts silently logs and falls back. Add a Sentry alert so these errors get surfaced to the team proactively.

**Status:** ✅ **FIXED 2026-04-15**. All 6 schema-drift issues + complexity budget + limit cap resolved. End-to-end API verified. UI-level verification still pending (dev server restart invalidated the browser session; next walk pass will re-test).

**Follow-up:** Grok fallback is ALSO broken (`Invalid API response format`). Deferred — Taddy is the primary path and now works; fixing Grok fallback is lower priority. Flagged as BUG #35.

---

## Bug #35 — Grok fallback in experts discovery returns "Invalid API response format"

**Severity:** MEDIUM (fallback path — Taddy is primary and now works, but this is the safety net)

**Symptom:**

When Taddy is unavailable or fails, `discoverExperts` falls through to
`discoverFromGrok`. During the BUG #34 diagnosis, this path was
exercised and also failed:

```
Expert discovery API error: { message: 'Invalid API response format' }
```

**Likely cause:**

`discoverFromGrok` uses `GrokDiscoveryResponseSchema` (Zod) to validate
the Grok response. The response is expected to be `{ experts: [...] }`
where each expert matches `ExpertSchema` with strict shape + regex
validations on `website`, `twitter`, and `linkedin`. If Grok's output
includes a malformed URL or a name that doesn't fit the schema, the
whole response fails to parse and throws "Invalid API response format".

**Not yet investigated:** I haven't traced this to a specific Grok
prompt/response mismatch because the primary Taddy path now works,
making the fallback non-critical for day-to-day use.

**Fix direction:**

1. Loosen the Zod schema to tolerate optional/loose URLs (strip or
   accept invalid URLs instead of rejecting the whole response).
2. Wrap the `.parse(...)` in a `.safeParse(...)` and return partial
   results with the successfully-parsed experts instead of throwing.
3. Add a test fixture of real Grok responses and regression-test the
   schema against them.

**Status:** DISCOVERED, NOT YET FIXED. Deferred in favor of Taddy fix.

---

## Observation — Experts page has no data-testid attributes on content

**Severity:** LOW (testability gap)

Only `sidebar-*` test IDs exist on the experts page. The textarea, the
Discover button, the results grid, filter buttons (All/Available/
Limited/Busy), sort buttons (Best Match/Popular/Recent), and the
expert cards themselves all lack test IDs. Future E2E tests will have
to target by role + text, which is brittle against copy changes.

**Fix:** Add stable `data-testid` attributes during the next polish
pass — `experts-topic-input`, `experts-discover-button`,
`experts-results-grid`, `experts-results-count`, etc.

**Status:** OBSERVED. Low priority.

---
