# Feature Design Document: Secondary Content Features

**Feature Slug:** `secondary-content-features`
**Author:** qa-analyst
**Date:** 2026-04-18
**Scope:** Advanced/differentiator features bundled into paid tiers —
12 distinct sub-features that extend the core content deliverable.

---

## 1. Feature Summary

PodBrain's "secondary" content features are the differentiator surface
— the things that convert a podcaster from "the show notes are nice"
to "I need this for every episode." Most run server-side as individual
API routes; each has a UI panel in the episode workspace or a dedicated
page. They all require authentication and enforce show ownership.

### Sub-feature Index

| # | Sub-feature | API Route(s) | Primary UI |
|---|-------------|--------------|------------|
| 1 | Viral moments | `GET /api/episodes/[id]/viral-moments` | Intelligence tab card |
| 2 | SEO analysis | `GET/POST/PUT /api/episodes/[id]/seo` | Show Notes tab sidebar |
| 3 | Podcasting 2.0 RSS tags | `GET /api/episodes/[id]/rss-tags` | RSS Tags tab (`RSSTagsPanel`) |
| 4 | Pre-interview intelligence | `GET/POST /api/episodes/[id]/pre-interview` | Intelligence tab (`PreInterviewPanel`) |
| 5 | Related episodes | `GET /api/episodes/[id]/related`, `GET /api/shows/[id]/related-episodes` | `RelatedEpisodes` card |
| 6 | A/B content testing | `GET/POST /api/episodes/[id]/ab-test` | `ABTestPanel` |
| 7 | Episode scheduling | `GET/POST/DELETE /api/episodes/[id]/schedule` | `ScheduleDialog` |
| 8 | AI learning insights | `GET /api/episodes/[id]/learnings` | `LearningInsights` card |
| 9 | Vocabulary management | `GET/POST/DELETE /api/shows/[id]/vocabulary` | `/vocabulary` page |
| 10 | Expert / guest discovery | `GET /api/shows/[id]/experts` | `/experts` page |
| 11 | Podcast search | `GET /api/taddy/search` | `/search` page |
| 12 | Analytics dashboard | `GET /api/analytics/overview` | `/analytics` page |

---

## 2. Verified Source Map

**API Routes (selected shape fragments):**
- `app/src/app/api/episodes/[id]/viral-moments/route.ts` — GET, returns cached moments or regenerates via Grok. 422 if no transcript. Rate limited via `viral-moments:${userId}`.
- `app/src/app/api/episodes/[id]/seo/route.ts` — GET (analysis+schema), POST (apply fix; rate-limited 20/min), PUT (regenerate).
- `app/src/app/api/episodes/[id]/rss-tags/route.ts` — GET, returns `{data: {...}, error: null}` wrapper (envelope!), URLs use `process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin || 'https://getpodbrain.ai'`.
- `app/src/app/api/episodes/[id]/pre-interview/route.ts` — GET reads cache, returns 404 if nothing cached; POST generates via Taddy + Grok; rate-limited 10/min.
- `app/src/app/api/episodes/[id]/related/route.ts` — GET, uses `findSimilarSections()` with `threshold=0.75`; returns `{relatedEpisodes, count}` (NO envelope).
- `app/src/app/api/shows/[id]/related-episodes/route.ts` — GET, similar episodes across the show.
- `app/src/app/api/episodes/[id]/ab-test/route.ts` — GET returns stored variants, POST generates via Grok; rate-limited 20/min; validates `field ∈ {"title","description"}` and clamps `variantCount ∈ [2,5]`.
- `app/src/app/api/episodes/[id]/schedule/route.ts` — POST requires future date within 30 days; episode must be `pending` or `scheduled`; DELETE reverts to `pending`.
- `app/src/app/api/episodes/[id]/learnings/route.ts` — GET, always 200 on ownership; returns `EpisodeLearnings` record.
- `app/src/app/api/shows/[id]/vocabulary/route.ts` — GET/POST/DELETE. POST validated via `CreateVocabularyTermSchema` (term <=200 chars, alternatives array of <=50 strings). Unique constraint DOES NOT exist on `(show_id, term)` — verify at test time.
- `app/src/app/api/shows/[id]/experts/route.ts` — Grok fallback path, covered in cluster 4.
- `app/src/app/api/taddy/search/route.ts` — Covered in cluster 4.
- `app/src/app/api/analytics/overview/route.ts` — GET, returns `{data: AnalyticsOverview, error: null}` envelope. Accepts `?showId=X&range=30`. Never 500s on empty dataset.

**UI Components:**
- `app/src/components/episodes/rss-tags-panel.tsx`
- `app/src/components/episodes/ab-test-panel.tsx`
- `app/src/components/episodes/schedule-dialog.tsx`
- `app/src/components/episodes/learning-insights.tsx`
- `app/src/components/episodes/related-episodes.tsx`
- `app/src/components/episodes/pre-interview-panel.tsx`
- `app/src/components/vocabulary/vocabulary-page.tsx`
- `app/src/components/experts/experts-page.tsx`
- `app/src/components/search/podcast-search-page.tsx`
- `app/src/components/analytics/analytics-dashboard.tsx`

**Libs Under Test:**
- `app/src/lib/viral-moments/detector.ts` — has Zod schema + unit test
- `app/src/lib/seo/analyzer.ts`, `schema-generator.ts` — pure functions, ideal for unit tests
- `app/src/lib/podcasting2/tag-generators.ts`, `rss-snippet.ts`, `location-extractor.ts`
- `app/src/lib/cross-episode/similarity.ts`, `embeddings.ts`
- `app/src/lib/vocabulary/service.ts`
- `app/src/lib/learning/tracker.ts`

---

## 3. Verified Selectors & Landmarks

Because the dev server is already running but we are not using Playwright
MCP live-DOM exploration (API-first strategy), selectors are derived from
**source grep of stable text/role/aria-label attributes**. All selectors
below are pulled verbatim from the source.

### 3.1 Episode detail tabs (parent)
- `page.getByTestId('episode-detail-tabs')` — tab container
- `page.getByTestId('episode-tab-show-notes' | 'episode-tab-assets' | 'episode-tab-transcript' | 'episode-tab-guest' | 'episode-tab-intelligence' | 'episode-tab-rss-tags')` — tabs

### 3.2 RSS Tags Panel (`rss-tags-panel.tsx`)
- Headings/text: "RSS Tags", "Person Tags", "Soundbites", "Chapters", "Transcript"
- Use: `page.getByRole('heading', { name: /rss tags/i })` and text matching

### 3.3 Vocabulary page (`/vocabulary`)
- `page.getByRole('button', { name: /copy term/i })` (aria-label "Copy term")
- `page.getByRole('button', { name: /delete term/i })` (aria-label "Delete term")
- Text "AI Suggestions" + "Coming Soon" (BUG #33 regression check)
- Search input, Add term button

### 3.4 Analytics dashboard (`/analytics`)
- `page.getByRole('heading', { level: 1 })` (only h1)
- Text landmarks: "Episodes per Month", "SEO Score", "Popular Asset Types", "Vocabulary"

### 3.5 Search page (`/search`)
- Placeholder: "Search podcasts..." or "Search episodes..."
- h1 at top

Given the low density of stable selectors, the tests lean heavily on
**role=heading + accessible text** and **API assertion** rather than
UI DOM walking.

---

## 4. User Workflows

### W1 — Happy path: user views viral moments for a processed episode
1. User lands on `/episodes/[id]` with `status='completed'` and existing `viral_moments` JSON.
2. API `GET /api/episodes/[id]/viral-moments` returns the cached payload.
3. UI renders moments with quote, score, timestamp.

### W2 — Happy path: SEO score honestly reflects content
1. User opens an episode with good show notes → GET /seo → score >= 60.
2. User opens an episode with empty show notes → score is very low (<30) with recommendations.

### W3 — Happy path: RSS tags snippet uses production domain
1. User opens RSS Tags tab → GET /rss-tags.
2. `snippet` XML contains URLs starting with production origin (not `localhost:3001`, not `podbrain.app`).
3. Well-formed XML.

### W4 — Pre-interview: no cached data → 404, never crash
1. GET /pre-interview on episode with no cache → 404 with `error: "No pre-interview data found"`.
2. UI handles gracefully: shows "Not yet available" / empty state.

### W5 — Related episodes: isolated show (1 episode only) → empty
1. GET /related on an episode whose show has no other episodes → `{relatedEpisodes: [], count: 0}`.

### W6 — A/B test: rate limited, validates field
1. POST /ab-test with `field="title"` → 200 with variants.
2. POST /ab-test with `field="invalid"` → 400.
3. 21st request in the same minute → 429.

### W7 — Schedule: past date rejected, future accepted, cancel reverts
1. POST /schedule with past date → 400 "Scheduled time must be in the future".
2. POST /schedule with date 15 days out → 200, episode.status='scheduled'.
3. DELETE /schedule → 200, episode.status='pending', metadata cleared.

### W8 — Learning insights: empty for a fresh episode, never 500
1. GET /learnings on a freshly-seeded episode with no corrections → 200 with mostly-empty arrays.

### W9 — Vocabulary: CRUD + edge cases
1. POST a term → 201. Term appears in GET.
2. POST same term twice → succeeds both times (no uniqueness constraint enforced at schema level).
3. POST a term with emoji/unicode/quotes → 201, body rendered safely.
4. POST a 201-char term → 400 (schema caps at 200).
5. DELETE by term_id → 200, term absent from GET.

### W10 — Analytics: empty state doesn't crash
1. GET /overview on a brand-new user's showId → 200, all fields present but mostly zero/empty.

### W11 — RSS tags: no viral moments, no sections → safely omits
1. GET /rss-tags on an episode with no `viral_moments` and no episode_sections → `soundbites: []`, `chapters: null`.

### W12 — SEO: POST fix with malicious input is sanitized
1. POST /seo with `title="<script>alert(1)</script>"` → updates episode, stored value must be escaped or handled safely by the DB (no script execution).

---

## 5. Edge Cases & Error Paths

| EC | Description | Expected |
|----|-------------|----------|
| EC-1 | Unauthenticated → any API | 401 |
| EC-2 | Cross-user episode ID → any API | 404 (don't leak existence) |
| EC-3 | Malformed UUID → any API | 400 "Invalid ID format" |
| EC-4 | Viral moments on episode w/no transcript | 422 "Transcript required for analysis" |
| EC-5 | RSS tags base URL | Starts with `https://` and matches `NEXT_PUBLIC_APP_URL` or the host, NOT `localhost` in prod-like env, NOT `podbrain.app` |
| EC-6 | Pre-interview GET with no cache | 404, not 500 |
| EC-7 | Related on show w/<2 episodes | 200 with empty array |
| EC-8 | A/B test field not in enum | 400 |
| EC-9 | A/B test variantCount=10 | Clamped to 5 |
| EC-10 | Schedule past date | 400 |
| EC-11 | Schedule > 30 days out | 400 |
| EC-12 | Schedule on a `completed` episode | 400 "Cannot schedule an episode with status: completed" |
| EC-13 | Cancel schedule on non-scheduled episode | 400 "Episode is not currently scheduled" |
| EC-14 | Vocabulary term XSS | Stored escaped OR rendered as text in UI |
| EC-15 | Vocabulary term with Unicode/emoji | Stored verbatim, retrievable |
| EC-16 | Vocabulary 201-char term | 400 validation error |
| EC-17 | Analytics with no episodes | 200, zero-counts; doesn't 500 |
| EC-18 | SEO GET on episode with empty show_notes | score < 30, suggestions populated |
| EC-19 | Learnings on freshly-seeded episode | 200 with empty insight arrays |

---

## 6. States to Verify

- **Loading:** SWR/fetch in-flight — panels show skeleton/loader.
- **Empty:** "No viral moments found," "Not yet available," "No similar episodes."
- **Error:** 500/503 → graceful user-facing error.
- **Authenticated-only:** 401 responses never leak data.

---

## 7. Known Risks / Regression Coverage

- **BUG #20 regression** — RSS tags URLs pointing to localhost or `podbrain.app`. Must assert the base URL is a real production host.
- **BUG #33 regression** — Vocabulary page must NOT show "random accuracy boost" values. Must show "Coming Soon" for AI Suggestions.
- **BUG #36 regression** — Analytics dashboard must render for a user with real data and not crash on zero-data.
- **SEO honesty** — Score on intentionally bad content (empty show notes) must be low, not inflated.

---

## 8. Out of Scope (covered elsewhere)

- Guest Package — covered by Cluster 1 (core-paid-flow)
- Tier rate limiting — covered by Cluster 2
- Taddy-specific rate limiting — covered by Cluster 4
- RLS on user-scoped tables — covered by Cluster 3
- RSS Import — covered by Cluster 4

---

## 9. Open Questions

None. All edge cases have defined expected behavior from source inspection.

---

## 10. Testing Strategy Recommendation

Given the 12-sub-feature surface area (~5,666 LoC of UI alone) and the
40–60 test budget set by the orchestrator, the Architect should:

1. **API-first** — ~80% of tests hit API routes directly with
   `request.get/post/delete` (via `apiFromPage(page).request`). This
   exercises the real production code paths, real Supabase, real xAI/Taddy
   where unavoidable, without UI selector fragility.
2. **UI smoke** — one smoke test per distinct UI surface (RSS tags panel,
   vocabulary page, analytics page) that verifies the page loads, renders
   a key heading, and doesn't surface a raw error. Reuse `signIn()` and
   the shared admin Supabase client for data seeding.
3. **Unit augmentation** — small Vitest additions for
   `lib/seo/analyzer.ts` and `lib/podcasting2/tag-generators.ts` honest-score
   and well-formed-XML assertions. These are pure functions and give high
   signal for the price of minutes.

Mock Grok/Taddy where they would otherwise run expensively; use the
Supabase admin client (`getAdminClient()`) to seed episodes with
pre-computed cached payloads so the GET endpoints read from cache
rather than regenerating on every test.
