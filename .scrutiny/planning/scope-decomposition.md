# Scope Decomposition: PodBrain Launch Roadmap (Modified Plan)

**Date:** 2026-02-26
**Based on:** Scrutiny verdict — MODIFY
**Deviation from original plan:** Timeline recalibrated, Phase 0 expanded, Phase 7 architecture corrected

---

## Revised Phase Breakdown

### Phase 0: Critical Bug Fixes + Quick Wins (Revised: 1.5-2 days)
*Original: 1-2 days, 10 items*

**Original 10 items (keep all):**
- [ ] B1: Fix upload wizard `result.signedUrl` field
- [ ] B2: Fix processing status polling shape mapping (~20 lines)
- [ ] B3: Fix assets hook array parsing (1 line)
- [ ] B4: Fix asset regeneration request body key (1 line)
- [ ] B5: Fix SEO hook response unwrapping (3 lines)
- [ ] B6: Fix guest package response unwrapping (1 line)
- [ ] B7: Uncomment real xAI API call in generate-assets.ts
- [ ] B8: Fix Stripe `priceId` client-side availability (API-side resolution)
- [ ] B9: Fix checkout success/cancel URLs (1 line)
- [ ] B10: Fix Redis double-serialization (remove 1 JSON.stringify)

**Add to Phase 0 (moved from Phase 1 — trivial, high-trust-impact):**
- [ ] Remove/gray out non-functional settings integrations (Spotify, Apple, YouTube, Slack) — 15 min
- [ ] Pin xAI model from `grok-beta` to specific stable identifier (e.g., `XAI_MODEL_ID` env var) — 1 hour
- [ ] Apply rate limiting to `/api/episodes/[id]/process` and `/api/episodes/[id]/assets` — 1 hour
- [ ] Add episode title field to upload wizard Step 2 — 1 hour

**Phase 0 milestone:** Upload short episode (<20 min) → processing completes → real AI show notes + 30+ assets → SEO score visible → guest package renders → rate limiting active → no fake integrations in settings

**Constraint:** Audio must be <20 minutes until Phase 5 webhook migration resolves the Trigger.dev timeout

---

### Phase 1: Core Experience Polish (Revised: 2-3 weeks)
*Original: 1-2 weeks, 14 items*

Remove items moved to Phase 0 (fake integrations, rate limiting, grok-beta fix, episode title field). Remaining:

- [ ] Add language selector to upload wizard
- [ ] Add inline show notes editing (rich text or markdown editor — budget 3-4 days for this item alone)
- [ ] Add format toggle: HTML / Markdown / Plain text export
- [ ] Add processing ETA estimate to signal chain
- [ ] Fix processing step labels to show actual current step
- [ ] Add episode edit/rename capability in workspace header
- [ ] Wire vocabulary page to use `useVocabulary` hook properly
- [ ] Fix sidebar nav counts to use real API data
- [ ] Add breadcrumb navigation to episode workspace
- [ ] Add consistent copy-to-clipboard on all asset cards and show notes
- [ ] Remove decorative vocabulary sparklines (or replace with real data display)
- [ ] Validate asset output quality: run 5-10 real episodes, assess quality before proceeding to Phase 2

**Budget note:** Show notes editor (item 3 above) is 3-4 days alone. Total 2-3 weeks is realistic.

---

### Phase 2: Authentication & Security (Revised: 2.5-3.5 weeks)
*Original: 1-2 weeks, 11 items*

**Add to Phase 2:**
- [ ] Add Sentry error tracking (moved from Phase 5 — need visibility from first real users)
- [ ] Resolve `hosting_connections` dual schema conflict (add migration before touching auth tables)
- [ ] Add stub for `find_similar_sections` RPC function (prevents silent production crashes)

**Original items (keep all):**
- [ ] Implement Supabase Auth (email/password + Google OAuth + magic link)
- [ ] Design and implement `middleware.ts` (budget 2-3 days: auth check, webhook exclusions, rate limit enforcement point)
- [ ] Replace `DEFAULT_USER_ID` with `auth.uid()` in all 26 route handlers
- [ ] Update RLS policies from `USING (true)` to `USING (user_id = auth.uid())`
- [ ] Add UUID validation to all route path parameters
- [ ] Add user-scoping to assets download route
- [ ] Implement login/register/forgot-password pages
- [ ] Add session management (30-day persistence)
- [ ] Verify `.netlify/` directory is gitignored
- [ ] Add DOMPurify sanitization verification for `show_notes_html`
- [ ] Add input sanitization on AI prompt injection vectors

**Phase 2 milestone:** Multiple users can sign up, data is private per user, all routes are protected, RLS is active, production errors are visible in Sentry

---

### Phase 3: Billing & Tier Enforcement (Revised: 1.5-2 weeks)
*Original: 1 week, 11 items*

**Verify in Phase 3:**
- [ ] Confirm Stripe webhook handler has HMAC signature verification (`stripe.webhooks.constructEvent`)

**Original items (keep all):**
- [ ] Fix Stripe checkout flow completely (B8 prerequisites already done in Phase 0)
- [ ] Implement tier-based feature gating middleware (2-3 days — integrates with Phase 2 middleware.ts)
- [ ] Enforce episode count limits per tier (Free: 3/mo, Pro: 50/mo)
- [ ] Enforce show count limits per tier (Free: 1, Pro: 5, Agency: 20)
- [ ] Gate advanced assets behind Pro tier
- [ ] Add usage tracking wired to real data
- [ ] Add upgrade prompts when approaching limits
- [ ] Implement billing history from Stripe invoices
- [ ] Add Stripe webhook idempotency (prevent duplicate processing)
- [ ] Reconcile pricing tier definitions across 3 locations (constants.ts, stripe/products.ts, PRD)
- [ ] Evaluate Pro pricing: consider $29/month vs $19/month (competitive analysis suggests possible underpricing)

**Phase 3 milestone:** First paying user can subscribe, gets Pro features, free users are gated at 3 episodes/month

---

### Phase 4: Onboarding & Landing Page (Revised: 1.5-2 weeks)
*Original: 1 week, 8 items*

Keep all original items:
- [ ] Build landing page at `/` (hero, problem/solution, pricing, CTA)
- [ ] Create "Get Started Free" → first show creation flow
- [ ] Add guided first-upload experience with contextual help
- [ ] Create Terms of Service page
- [ ] Create Privacy Policy page
- [ ] Create Cookie Policy page with consent banner (EU compliance)
- [ ] Add OpenGraph/meta tags for social sharing
- [ ] Set up basic SEO for the marketing site

**Phase 4 milestone:** Product is discoverable by new users via organic search/social. Legal compliance in place. Invitation-only beta can expand to public.

---

### Phase 5: Performance & Reliability (Revised: 2-3 weeks)
*Original: 1 week, 10 items*

**Note:** Sentry moved to Phase 2. Remove from Phase 5.

**Keep all other original items:**
- [ ] Restructure AssemblyAI transcription to use webhook callbacks (budget 2-4 days — architectural change)
- [ ] Increase or remove Trigger.dev job timeout for transcription
- [ ] Implement transcript chunking for asset generation (replace 8000-char truncation)
- [ ] Add circuit breaker pattern for xAI API calls
- [ ] Add HTTP caching headers to stable GET endpoints
- [ ] Add `AbortSignal.timeout()` to all xAI fetch calls
- [ ] Batch episode section inserts for 4-hour podcasts
- [ ] Add email notification on processing completion
- [ ] Set up basic analytics (PostHog or Vercel Analytics)

**Phase 5 milestone:** Full-length podcasts (60+ minutes) process successfully. Processing times are predictable and communicated to users.

---

### Phase 6: Testing & CI/CD (Revised: 1.5-2 weeks)
*Original: 1 week, 9 items*

Keep all original items:
- [ ] Fix button component tests for Swiss Broadcast classes
- [ ] Set coverage thresholds in vitest config (60% minimum)
- [ ] Add tests for upload wizard, episode workspace, show notes tab
- [ ] Add hook tests for all 12 custom hooks
- [ ] Set up GitHub Actions for PR checks (lint + test + build)
- [ ] Create separate Supabase project for E2E testing
- [ ] Add auto-deploy on push to main
- [ ] Add preview deployments for PRs
- [ ] Remove or gate test routes (`/api/test-*`, `/api/seed`) behind dev guard

**Phase 6 milestone:** Shipping with confidence. PRs are checked. Breaking changes are caught before production.

---

### Phase 7: Taddy API + Podcasting 2.0 (Revised: 4-6 weeks)
*Original: 2-3 weeks, 35+ items*

**PARALLEL TRACK DURING PHASES 5-6:**
Start PC2.0 Batch 1 as a parallel workstream — no dependencies on auth, billing, or Taddy.

**PC2.0 Batch 1 (Build in parallel with Phases 5-6):**
- [ ] Add `rss_enhancement` to `asset_type` enum
- [ ] Create `lib/podcasting2/tag-generators.ts` — tag generator functions
- [ ] Generate VTT transcript from AssemblyAI output → upload to Supabase Storage
- [ ] Generate chapters JSON from AI chapter detection → upload to Storage
- [ ] Convert `viral_moments[]` → `<podcast:soundbite>` tags
- [ ] Generate basic `<podcast:person>` tags (guest name + host from metadata)
- [ ] Generate `<podcast:transcript>`, `<podcast:medium>`, `<podcast:txt>`, `<podcast:funding>` tags
- [ ] Create `lib/podcasting2/rss-snippet.ts` — compile all tags into copyable XML
- [ ] Store RSS enhancement as generated asset, display in episode workspace
- [ ] Add copy-to-clipboard for RSS snippet

**Taddy Foundation (T1 — at start of Phase 7):**
- [ ] Pre-flight: Run Taddy free tier — test `persons` field coverage on 10 topic searches
- [ ] Pre-flight: Compare Podchaser for guest credits quality vs. Taddy `persons` field
- [ ] Create `lib/taddy/client.ts` with auth, retry, partial response handling, circuit breaker
- [ ] Create `lib/taddy/types.ts` — TypeScript types (design for codegen replacement)
- [ ] Create `lib/taddy/queries.ts` — Pre-built queries tested against live API
- [ ] Create `lib/taddy/cache.ts` — Supabase-first, Redis L1 for hot data
- [ ] Write migration for `taddy_podcast_cache`, `taddy_episode_cache`, `guest_appearances` (with FK constraints), `pre_interview_cache` (guest-centric schema)
- [ ] Add Redis counters: Taddy API calls/day, transcript credits/month
- [ ] Add TADDY_USER_ID, TADDY_API_KEY to env vars and docs
- [ ] Decide API tier: Pro ($75) if T3 post-launch; Business ($150) if T3 at launch

**Pre-Interview Intelligence (T3 — first major Taddy feature, highest value):**
- [ ] Create `lib/taddy/search.ts` — guest appearance search with heuristic pre-filter
- [ ] Create Trigger.dev job `generatePreInterviewJob` (NOT a sync API route)
  - Input: guest name, episode_id, user_id
  - Steps: search → rank → transcript credit check → fetch transcripts → Grok analysis → synthesis → cache
  - Graceful degradation when credits exhausted: cache appearances, skip transcript analysis
  - Non-fatal transcript failures: skip, continue, note in output
- [ ] Create `app/api/episodes/[id]/pre-interview/route.ts`:
  - POST: validate, check credit budget, create Trigger.dev job, return job_id
  - GET: return cached result if available
  - Apply rate limiting from day 1 (3/day Pro, 10/day Agency)
- [ ] Create `components/episodes/pre-interview-tab.tsx` with all states
- [ ] Add 6th tab to episode workspace

**Expert Discovery Rewrite (T2 — second, builds on T3's search.ts):**
- [ ] Rewrite `lib/experts/discovery.ts`:
  - Taddy text search as primary
  - `persons` field confidence indicator ("Verified Credit" vs "Found in Episode")
  - Description-based fallback when persons empty
  - PRESERVE Grok path as named fallback (circuit breaker: Taddy down → Grok)
  - Filter user's own show from results
  - Handle name collision (genre/context filtering)
- [ ] Update types, API route, experts page component
- [ ] Apply rate limiting (50 topic searches/day/user)

**Guest Package Enhancement (T4):**
- [ ] Update `lib/guest-package/generator.ts` with cached Taddy appearance data
- [ ] "Also heard on..." section from `guest_appearances` cache
- [ ] Real cover art from `taddy_podcast_cache`

**PC2.0 Batch 2 (After T1-T2 complete):**
- [ ] Enrich `<podcast:person>` with img/href from Taddy search results
- [ ] Generate `<podcast:podroll>` from cross-show intelligence
- [ ] Buzzsprout auto-injection via API

**Post-Phase 7 (Month 3+):**
- [ ] T5: Podcast Search & Discovery UI (as originally planned)

---

## Prerequisites Checklist

Before ANY Phase 7 Taddy work begins:
- [ ] Phases 0-6 complete
- [ ] Taddy persons field coverage validated on 10+ representative searches
- [ ] Podchaser evaluated for expert credits quality comparison
- [ ] API tier decided (Pro vs. Business)
- [ ] T3 architecture confirmed as Trigger.dev job (not sync route)
- [ ] Guest-centric `pre_interview_cache` schema confirmed
- [ ] Transcript credit degradation behavior designed (UI + Redis counter)
- [ ] Taddy outage fallback designed (circuit breaker + Grok preserve)

---

## Timeline Summary

| Phase | Original | Revised | Key Driver |
|-------|----------|---------|------------|
| 0 | 1-2 days | 1.5-2 days | +4 quick wins moved from Phase 1 |
| 1 | 1-2 weeks | 2-3 weeks | Show notes editor is 3-4 days |
| 2 | 1-2 weeks | 2.5-3.5 weeks | Auth migration is 3-5 days + Sentry |
| 3 | 1 week | 1.5-2 weeks | Tier enforcement middleware |
| 4 | 1 week | 1.5-2 weeks | Landing page design time |
| 5 | 1 week | 2-3 weeks | Webhook migration is 2-4 days |
| 6 | 1 week | 1.5-2 weeks | 12 hooks to test |
| 7 | 2-3 weeks | 4-6 weeks | Pre-interview is 8-12 days alone |
| **Total** | **8-11 weeks** | **15-22 weeks** | **~75% underestimate** |
