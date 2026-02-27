# Normalized Scrutiny Plan: PodBrain Launch Roadmap

**Scrutiny Date:** 2026-02-26
**Complexity Class:** MAJOR
**Mode:** Deep+ (all 7 agents, extended analysis)
**Source Documents:**
- `docs/planning/LAUNCH-ROADMAP.md` — 8-phase build and launch plan (primary)
- `docs/planning/TADDY-INTEGRATION-PLAN.md` — Phase 7 Taddy API integration detail
- `docs/planning/PODCASTING-2.0-STRATEGY.md` — Phase 7 Podcasting 2.0 tag generation strategy

---

## 1. Plan Identity

**Product:** PodBrain — AI-powered podcast platform
**Domain:** getpodbrain.ai
**Stage:** Pre-launch, single developer
**Goal:** Ship a working, monetized, defensible SaaS product for independent podcasters and podcast agencies

**Value Proposition:**
- Transforms podcast audio into SEO-optimized show notes + 30+ content assets
- AI learns the show's vocabulary for improved accuracy over time
- First AI podcast platform to generate Podcasting 2.0 tags automatically (claimed differentiator)
- Real podcast ecosystem data (via Taddy API) replacing hallucinated expert suggestions

**Target Users:** Independent podcasters and podcast agencies
**Pricing:** Free (3 episodes/month, 1 show), Pro $19/month, Agency $49/month

---

## 2. Current State Assessment

**What Exists (approximate):**
- 26 API routes (all unauthenticated — no middleware.ts)
- 12 pages with Swiss Broadcast UI design system (Next.js App Router)
- 17+ service modules
- 12 custom hooks
- Trigger.dev v4 processing pipeline (AssemblyAI + xAI Grok)
- Supabase schema with pgvector embeddings
- Stripe billing infrastructure (implemented but broken)
- Buzzsprout API integration (working)
- Rate limiting code exists but applied to 0 routes
- RLS policies set to `USING (true)` — all data publicly accessible

**Current Completeness:** ~60% MVP features built; ~30% built-but-broken; ~10% not started

**10 Critical Bugs (Phase 0):**
1. B1: Upload wizard reads `result.url` instead of `result.signedUrl` — every upload creates episode with no audio (1-line fix)
2. B2: Processing status polling reads Trigger.dev shape, not app steps — progress never updates past 10% (~20-line fix)
3. B3: Assets hook stores `{assets, episodeId}` object instead of array — assets tab crashes with TypeError (1-line fix)
4. B4: Asset regeneration sends `{asset_types}` instead of `{assetType}` — individual regen fails (1-line fix)
5. B5: SEO hook reads wrong response shape — SEO tab always empty (3-line fix)
6. B6: Guest package response not unwrapped — guest package page always empty (1-line fix)
7. B7: Real xAI API call commented out in `generate-assets.ts` — 30+ assets return placeholder text (uncomment ~20 lines)
8. B8: Stripe `priceId` reads server-only env vars on client — upgrade buttons broken (move to API-side resolution)
9. B9: Stripe checkout success URL points to non-existent route `/settings/billing` (page is at `/settings?tab=billing`) — post-checkout 404 (1-line URL fix)
10. B10: Redis cache double-serialization — cached data may be corrupt strings (remove 1 JSON.stringify)

---

## 3. The 8-Phase Plan

| Phase | Name | Estimated Duration | Work Items | Key Milestone |
|-------|------|--------------------|------------|---------------|
| 0 | Critical Bug Fixes | 1-2 days | 10 bugs | End-to-end processing works, real AI output |
| 1 | Core Experience Polish | 1-2 weeks | 14 items | Product usable by real podcaster |
| 2 | Authentication & Security | 1-2 weeks | 11 items | Safe for multiple users, internet-hardened |
| 3 | Billing & Tier Enforcement | 1 week | 11 items | Business model functional |
| 4 | Onboarding & Landing Page | 1 week | 8 items | Product discoverable, legally compliant |
| 5 | Performance & Reliability | 1 week | 10 items | Handles real workloads |
| 6 | Testing & CI/CD | 1 week | 9 items | Ship with confidence |
| 7 | Taddy API + Podcasting 2.0 | 2-3 weeks | 35+ items | Product differentiated |
| 8 | Post-Launch Enhancements | Ongoing | 16+ items | Competitive advantage built |

**Total estimated timeline: 8-11 weeks (single developer)**
**Total discrete work items: 98+**

---

## 4. Phase Detail: Core Phases (0-6)

### Phase 0 (1-2 days): Fix all 10 bugs above
Milestone: Upload episode → processing completes → real AI show notes + assets appear → SEO score visible → guest package renders

### Phase 1 (1-2 weeks): Core Experience Polish
- Add episode title field to upload wizard
- Add language selector to upload wizard
- Add inline show notes editing (rich text or markdown)
- Add format toggle: HTML / Markdown / Plain text
- Add processing ETA and fix step labels
- Add episode edit/rename in workspace
- Fix vocabulary page to use correct hook
- Remove/hide non-functional integrations (Spotify, Apple, YouTube, Slack — keep only Buzzsprout)
- Fix sidebar nav counts to use real API data
- Add breadcrumb navigation
- Consistent copy-to-clipboard across all assets
- Pin xAI model to stable identifier (replace `grok-beta` in 7+ locations)
- Apply rate limiting to processing and asset generation routes

### Phase 2 (1-2 weeks): Authentication & Security
- Implement Supabase Auth (email/password + Google OAuth + magic link)
- Create `middleware.ts` protecting all `/api/*` routes (except webhooks)
- Replace `DEFAULT_USER_ID` with `auth.uid()` in all route handlers
- Update RLS policies from `USING (true)` to `USING (user_id = auth.uid())`
- UUID validation on all route path parameters
- Login/register/forgot-password pages
- Session management (30-day persistence)
- DOMPurify sanitization verification for `show_notes_html`
- Input sanitization on AI prompt injection vectors

### Phase 3 (1 week): Billing & Tier Enforcement
- Fix Stripe checkout flow completely (B8, B9)
- Implement tier-based feature gating middleware
- Enforce episode count limits (Free: 3/mo, Pro: 50/mo)
- Enforce show count limits (Free: 1, Pro: 5, Agency: 20)
- Gate advanced assets behind Pro tier
- Usage tracking wired to real data
- Upgrade prompts when approaching limits
- Billing history from Stripe invoices
- Stripe webhook idempotency
- Reconcile pricing tier definitions across 3 locations

### Phase 4 (1 week): Onboarding & Landing Page
- Landing page at `/` (hero, problem/solution, pricing, CTA)
- "Get Started Free" → first show creation flow
- Guided first-upload experience with contextual help
- Terms of Service, Privacy Policy, Cookie Policy pages
- Cookie consent banner (EU compliance)
- OpenGraph/meta tags for social sharing
- Basic SEO for the marketing site itself

### Phase 5 (1 week): Performance & Reliability
- Restructure AssemblyAI to use webhook callbacks (fixes 4-hour audio timeout vs 30-min Trigger.dev limit)
- Implement transcript chunking for asset generation (replace 8000-char truncation)
- Add circuit breaker for xAI API calls
- HTTP caching headers on stable GET endpoints
- `AbortSignal.timeout()` on all xAI fetch calls
- Batch episode section inserts
- Email notification on processing completion
- Implement Sentry error tracking
- Set up analytics (PostHog or Vercel Analytics)

### Phase 6 (1 week): Testing & CI/CD
- Fix button component tests for Swiss Broadcast classes
- Set coverage thresholds in vitest config (60% minimum)
- Add tests for upload wizard, episode workspace, show notes tab
- Add hook tests for all 12 custom hooks
- GitHub Actions for PR checks (lint + test + build)
- Separate Supabase project for E2E testing
- Auto-deploy on push to main
- Preview deployments for PRs
- Remove/gate test routes (`/api/test-*`, `/api/seed`) behind dev guard

---

## 5. Phase 7 — Taddy Integration (2-3 weeks)

**Problem solved:** Expert Discovery currently hallucinates — Grok invents names, appearances, bios with no real data source.

**Taddy API characteristics:**
- GraphQL API, 4M+ podcasts, 200M+ episodes
- `persons` field: populated only when podcasters add `<podcast:person>` RSS tags — 0% coverage on mainstream podcasts
- Text search: primary discovery method ("Guest Name" appears in episode title/description)
- Pro plan: $75/mo, 100K requests + 100 transcript credits/month
- Business plan: $150/mo, 350K requests + 2,000 transcript credits + webhooks
- Caching explicitly allowed; cached responses free

**New infrastructure:**
- 8 new files (4 Taddy lib modules + 2 API routes + 2 UI components)
- 7 modified files
- 4 new database tables (`taddy_podcast_cache`, `taddy_episode_cache`, `guest_appearances`, `pre_interview_cache`)
- 2 new env vars (TADDY_USER_ID, TADDY_API_KEY)

**Features:**
1. Expert Discovery rewrite (Taddy text search replaces Grok hallucinations; Grok kept for bio enrichment)
2. Pre-Interview Guest Intelligence (new: find guest's prior appearances, extract topics, generate interview prep)
3. Enhanced Guest Package (real appearance history, real cover art, real episode links)
4. Podcast Search & Discovery UI (post-launch, T5)
5. Growing guest credits database as competitive data moat

**Cost impact:** Per-episode cost increases from $0.10-0.15 to ~$0.18-0.20 (33% increase; PRD budget needs updating)

---

## 6. Phase 7 — Podcasting 2.0 Integration (within 2-3 week Phase 7 window)

**Core insight:** PodBrain already generates the data these tags need — it's mainly a formatting/export step.

**Tags to generate (Batch 1 — no Taddy dependency):**
- `<podcast:transcript>` — VTT from AssemblyAI output → Supabase Storage URL (Low effort, HIGH value — Apple Podcasts displays transcripts)
- `<podcast:soundbite>` — from `viral_moments[]` array already in DB (Trivial — reformatting existing data)
- `<podcast:chapters>` — from AI chapter detection / show notes sections → JSON hosted on Supabase Storage
- `<podcast:person>` — guest name + host from episode/show metadata (basic version)
- `<podcast:medium>`, `<podcast:txt>`, `<podcast:funding>` — trivial tags

**Tags to generate (Batch 2 — requires Taddy):**
- Enriched `<podcast:person>` with img/href from Taddy
- `<podcast:podroll>` from cross-show intelligence
- Buzzsprout auto-injection via API

**Delivery MVP:** Copy-paste RSS snippet in episode workspace. Later: Buzzsprout auto-injection.
**Additional cost:** Near-zero (VTT files ~50KB each, within Supabase Storage free tier)
**Claimed flywheel:** PodBrain generates tags → Taddy indexes → PodBrain expert discovery improves

**Competitive claim:** No SaaS podcast platform currently generates Podcasting 2.0 tags automatically (Castopod does but is self-hosted open source, different market).

---

## 7. Existing System Context

**Tech Stack:**
- Next.js 16.1.6, React 19, TypeScript (App Router, Netlify deployment)
- Tailwind CSS v4
- Supabase (PostgreSQL + pgvector via @supabase/ssr ^0.8.0)
- Trigger.dev v4.3.3 (background jobs)
- AssemblyAI v4.8.0 (transcription with speaker diarization)
- xAI Grok (content generation — using unstable `grok-beta` identifier)
- Stripe v20.3.0 (payments)
- Upstash Redis v1.34.0 (caching — currently double-serializing)
- Resend v6.9.1 (email)
- Zod v4.3.6 (validation)
- Vitest v3.1.3 + Playwright (testing — 41/42 components untested, 0/11 hooks tested)

**Database migrations present:**
- `0001_initial_schema.sql`
- `20260202000000_phase7_integrations.sql`
- `20260202_phase6_advanced_features.sql`
- `20260218000000_schema_alignment.sql`

**Outstanding technical debt (from prior audits):**
- All 26 API routes unauthenticated (intentionally deferred but creates real security risk)
- RLS `USING (true)` on all tables — all data is world-readable
- `grok-beta` in 7+ locations (unstable model identifier)
- Trigger.dev 30-min timeout incompatible with 4-8 hour transcriptions (CRIT)
- 8000-char transcript truncation breaks content quality for long podcasts
- `find_similar_sections` RPC function never created despite code referencing it
- Dual schema conflict in `hosting_connections` table
- 3 separate xAI client implementations (inconsistency)
- Two competing auth patterns across routes

---

## 8. Key Assumptions in the Combined Plan

1. Single developer can complete 98+ tasks in 8-11 weeks
2. Phase 0 bugs are genuinely 1-5 line fixes (plan claims ~2-4 hours total)
3. Auth deferral remains acceptable — no security incidents during single-user phase
4. Taddy text search is a sufficient substitute for a real guest credits database
5. The `persons` field gap (0% mainstream coverage) doesn't undermine expert discovery enough to make it useless
6. 100 transcript credits/month (Taddy Pro) is sufficient for pre-interview feature at launch
7. $75/mo Taddy Pro is sufficient for early growth (~2,000 active users before needing Business plan)
8. Podcasting 2.0 adoption will continue growing (not already plateaued)
9. The flywheel effect (generate tags → improve own data quality) materializes in a meaningful timeframe
10. Cost per episode at $0.18-0.20 is sustainable at $19/month Pro pricing
11. Current 60% completeness means 8-11 weeks is realistic (not optimistic)
12. Phase sequencing is correct — especially placing auth (Phase 2) before billing (Phase 3) before landing page (Phase 4)
13. No blocking external dependencies (Taddy API access, Stripe account, AssemblyAI credits) will stall the timeline

---

## 9. Explicit Open Questions

From Taddy Integration Plan:
1. Should Taddy be PRIMARY or supplementary for expert discovery?
2. Is pre-interview intelligence worth transcript credit cost at scale?
3. Guest credits database: incremental (search-triggered) vs bulk import?
4. How to handle `persons` field gap (fallback strategy)?
5. Should Taddy search be user-facing or internal only?
6. Pro ($75/mo) vs Business ($150/mo) at launch?
7. Taddy vs Buzzsprout: complementary (confirmed yes) or overlapping?
8. Should Taddy webhooks be a launch feature or post-launch?

---

## 10. Out of Scope for This Plan (Phase 8 / Deferred)

- Native iOS/Android apps (PWA only)
- Live transcription
- Video podcast support
- Public API access
- White-label solution
- Transistor integration
- Audiogram generation (Remotion)
- RSS feed import (full back catalog)
- Multi-language UI (i18n)
- Team/collaboration features (Agency tier seats)
- Scheduling (process and publish on schedule)
- YouTube/Spotify/Apple OAuth for direct publishing
- Content A/B testing
- RSS proxy feed
- `<podcast:value>` streaming payments (V4V)
- Competitor episode monitoring
- Social media scheduling integration
- Podcast directory submission helper
