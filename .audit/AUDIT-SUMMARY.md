# PodBrain Codebase Audit — Executive Summary

**Date:** 2026-02-26
**Project:** PodBrain — AI-powered podcast content platform
**Repository:** urban-octo-funicular (branch: main)
**Audit Methodology:** Multi-layer static analysis (10 agents), cross-layer synthesis, adversarial contradiction analysis
**Note:** This is an updated audit run. The prior audit was dated 2026-02-24. The codebase has not materially changed; findings from the prior run remain accurate. This run updates the project-structure report and verifies the security finding about Netlify build artifacts.

---

## Architecture Health Score

**Overall: 58 / 100**

| Dimension | Score | Assessment |
|-----------|-------|------------|
| Project Structure | 82 / 100 | Strong architecture, clear separation of concerns |
| Data Model | 65 / 100 | Well-designed schema, migration conflicts |
| API Surface | 48 / 100 | Consistent patterns, no auth or rate limiting |
| Testing Quality | 55 / 100 | Excellent infrastructure, poor coverage depth |
| UI/UX | 70 / 100 | Polished design system, accessibility gaps |
| User Flow | 52 / 100 | Critical upload flow bug discovered |
| AI Layer | 60 / 100 | Good architecture, unsafe model ID and truncation |
| Integration | 62 / 100 | Complete integrations, no circuit breakers |
| Security | 35 / 100 | Auth deferred (intentional), RLS effectively disabled |
| Performance/Infra | 55 / 100 | Good foundation, job timeout incompatible with 4-hour audio |

---

## Findings Summary

| Severity | Count | Description |
|----------|-------|-------------|
| Critical | 5 | Functional failures or immediate security exposure |
| High | 17 | Launch blockers or major risk if unaddressed |
| Medium | 30 | Technical debt and UX gaps, address pre-launch |
| Low | 14 | Minor polish and hygiene items |
| Info | 10 | Strengths and neutral observations |
| **Total** | **76** | |

---

## Critical Findings — Must Fix Before Launch

### CRIT-01: All 26 API Routes Are Publicly Unauthenticated
Every endpoint is accessible to any HTTP client. Any person or bot can trigger paid AI processing jobs, delete user data, and read all transcripts. Documented as intentional ("Auth is DEFERRED") but is a launch blocker. The `validateAuth()` function is ready — auth infrastructure needs to be wired in.

**Layers:** security, api-surface, data-model, project-structure (4-layer corroboration)

### CRIT-02: Database RLS Policies Are Effectively Disabled
All Phase 1 tables use `USING (true)` RLS policies, meaning any Supabase client with the public anon key can read and write all rows. There is no database-level access control on the core data tables. The `experts` table (Phase 6) correctly uses `auth.uid()` — this is the pattern all tables should follow.

**Layers:** security, data-model (2-layer corroboration)

### CRIT-03: Upload Wizard Is Functionally Broken — Audio URL Field Mismatch
**Discovered through cross-layer synthesis.** The upload wizard reads `uploadData.url || uploadData.data?.url` to get the audio URL. The upload API route returns `{ signedUrl, publicUrl, filePath... }` — neither `url` nor `data.url` exists. Every upload produces an episode with `audio_url = undefined`. Processing fails silently.

**Fix:**
```typescript
// upload-wizard.tsx handleSubmit()
// Change:
const audioUrl = uploadData.url || uploadData.data?.url;
// To:
const audioUrl = uploadData.signedUrl;
```

**Layers:** api-surface, user-flow (contradiction discovered in synthesis)

### CRIT-04: Trigger.dev Job Timeout (30 min) Cannot Support 4-Hour Audio Files
`processEpisodeTask` has `maxDuration: 1800` (30 min). `TIMEOUTS.transcription = 8 * 60 * 60 * 1000` (8 hours). AssemblyAI transcription of a 4-hour audio file can take up to 8 hours. The job will timeout, leaving episodes permanently stuck in `processing` status. Resolution requires switching from polling-in-job to AssemblyAI webhook callback architecture.

**Layers:** performance-infra, integration, ai-layer (3-layer corroboration)

### CRIT-05: Rate Limiting Is Implemented but Never Applied — AI Cost Exposure
`lib/redis/rate-limit.ts` implements a sliding window rate limiter. `constants.ts` defines rate limits (60/min default, 10/min processing, 30/min asset generation). Zero route handlers call any rate limiting function. `POST /api/episodes/[id]/process` can be triggered without limit, each call generating ~$0.10-0.15 in AssemblyAI and xAI API costs. An automated attacker could cause unlimited cost runaway.

**Layers:** api-surface, security, performance-infra, integration (4-layer corroboration)

---

## High-Priority Findings — Address Before or Shortly After Launch

The 17 high findings include (most important):

**AI Layer:**
- `grok-beta` is an unstable model identifier that xAI can retire without notice
- Asset generation uses `JSON.parse()` with no Zod schema validation — malformed AI responses stored directly to DB
- No AI cost guard despite `estimateGenerationCost()` function existing
- No timeout on direct xAI API calls — serverless functions can hang

**Data:**
- `hosting_connections` table has both Phase 1 and Phase 7 schemas active simultaneously (migration conflict)
- Custom hooks have no cache invalidation — episode status changes do not auto-refresh the UI
- Pricing tiers disagree across `constants.ts`, `stripe/products.ts`, and documentation

**Testing:**
- Button component tests reference old Kokonut CSS class names — fail against current Swiss Broadcast components
- No coverage thresholds enforced — coverage can reach 0% without failing CI

**UX:**
- No episode title field in the upload wizard — all uploaded episodes start as "Untitled Episode"
- Upload error handling is completely silent — no user feedback on failure

**Security/Infrastructure:**
- `show_notes_html` (AI-generated HTML) not verified to be DOMPurify-sanitized before render
- No circuit breaker on external service calls — xAI API degradation cascades to all routes
- *(Updated 2026-02-26)* Netlify `.env.local` artifacts: `app/.netlify/` is NOT tracked by git (verified via `git ls-files`) — prior high finding partially mitigated. However, the `app/.gitignore` does not include `.netlify/` which should be added as a defense-in-depth measure.

---

## Key Cross-Layer Discoveries

The synthesis phase identified findings that no single audit layer caught individually:

| Discovery | Layers Involved | Severity |
|-----------|----------------|----------|
| Upload wizard URL field mismatch breaks every upload | api-surface + user-flow | Critical |
| Job timeout fundamentally incompatible with 4-hour audio | performance-infra + integration + ai-layer | Critical |
| Rate limiting exists in 3 files, applied in 0 routes | api-surface + security + performance-infra + integration | Critical |
| Button tests test the wrong design system | testing-quality + ui-ux | High |
| Pricing tiers have 3 conflicting definitions | integration + data-model + api-surface | High |
| Hardcoded sidebar counts mislead all users | project-structure + ui-ux + user-flow | Medium |
| 8000-char transcript truncation affects all asset quality | ai-layer + user-flow + integration | Medium |

---

## What Is Working Well

Despite the critical findings (several of which are intentional for MVP mode), PodBrain demonstrates strong engineering fundamentals:

**Architecture:** Feature-based directory structure is clean and navigable. Service library organization is excellent — each external integration has a dedicated, well-scoped client library. The three-client Supabase pattern (browser/server/admin) is correctly implemented. Background job separation via Trigger.dev v4 is architecturally sound.

**Design System:** The Swiss Broadcast design system is sophisticated, cohesive, and internally consistent. Tailwind CSS v4 `@theme` token system is the right approach. Dark mode with FOUC prevention is correctly implemented. `prefers-reduced-motion` support is complete.

**Security Highlights:** Stripe webhook HMAC validation is correctly implemented with raw body buffer. Buzzsprout credential encryption is production-grade (AES-256-GCM + PBKDF2 with 100,000 iterations). Viral moments detector has excellent AI response security (Zod validation + HTML entity encoding).

**Test Infrastructure:** Four-way test segregation (unit/db-integration/api-integration/e2e) with appropriate concurrency models is rare for early-stage SaaS. Regression test phase organization (`test/unit/fixes/phase-*.test.ts`) prevents fix regressions. Playwright configuration is production-ready.

**Processing Pipeline:** Trigger.dev integration with modular sub-tasks (transcription, show notes, assets) is architecturally sound. Asset generation failure is non-critical (pipeline continues). Retry with exponential backoff is correctly configured.

---

## Pre-Launch Checklist

The following items are minimum requirements before public launch:

- [ ] Implement Supabase Auth and wire `validateAuth()` into all API routes
- [ ] Add `middleware.ts` to globally enforce auth on all `/api/` routes (exclude `/api/stripe/webhooks`)
- [ ] Update RLS policies from `USING (true)` to user-scoped policies on all Phase 1 tables
- [ ] Fix upload wizard audio URL field mismatch: `uploadData.signedUrl` not `uploadData.url`
- [ ] Add error toast/feedback in upload wizard `catch` block
- [ ] Add title field to upload wizard (Step 1 or Step 2)
- [ ] Restructure AssemblyAI transcription to use webhook callbacks instead of polling in Trigger.dev job
- [ ] Apply rate limiting to `POST /api/episodes/[id]/process` and `POST /api/episodes/[id]/assets`
- [ ] Replace `grok-beta` with a pinned stable model identifier (e.g., `grok-2-1212`)
- [ ] Add Zod validation to asset generation responses
- [ ] Fix button component tests for Swiss Broadcast class names
- [ ] Set coverage thresholds in vitest config (minimum 60%)
- [ ] Verify `show_notes_html` is DOMPurify-sanitized before browser render
- [ ] Set `NEXT_PUBLIC_APP_URL` in production environment
- [ ] Designate a single source of truth for subscription tier limits
- [ ] Add `.netlify/` to `app/.gitignore` as defense-in-depth

---

## Post-Launch Sprint Recommendations

**Sprint 1 — Performance and Reliability:**
- Implement transcript chunking to send full episode content to asset generation (not just 8000 chars)
- Add circuit breaker pattern for xAI API calls
- Add HTTP caching headers to GET endpoints (30-60s TTL for stable resources)
- Fix `hosting_connections` schema conflict migration (drop Phase 1 columns)
- Connect Redis cache to high-traffic read endpoints

**Sprint 2 — Test Coverage:**
- Add hook tests for all 11 custom React hooks
- Add component tests for upload wizard and episode workspace tabs
- Set up dedicated Supabase project for E2E testing (prevent test data in production DB)
- Make integration/E2E tests mandatory in CI (remove `if: vars.HAS_TEST_SECRETS` condition)
- Enforce minimum 60% coverage threshold

**Sprint 3 — UX Polish:**
- Add episode rename capability to the workspace
- Add progressive tab disclosure for unprocessed episodes (hide tabs until episode is completed)
- Fix sidebar nav counts (connect Episodes count and Vocabulary count to real API data)
- Add breadcrumb navigation to episode workspace (`/episodes / [title]`)
- Fix form accessibility: add `id` to all inputs, `htmlFor` to all labels
- Replace content style `<button>` elements in upload wizard with `<input type="radio">`
- Connect expert discovery to episode workflow (save expert as episode guest)

---

## Coverage Gaps Requiring Manual Verification

The following areas were not fully analyzed during this audit and require manual review:

1. **`components/episodes/episode-detail.tsx` ShowNotesTab section** — Verify DOMPurify is applied before `dangerouslySetInnerHTML`
2. **`app/src/trigger/jobs/transcribe-audio.ts`** — Individual sub-task error handling and AssemblyAI webhook vs. polling architecture
3. **`app/src/trigger/jobs/generate-show-notes.ts`** — Show notes generation prompt and timeout handling
4. **`app/src/trigger/jobs/generate-assets.ts`** — Asset generation parallel execution and timeout handling
5. **`lib/guest-package/generator.ts`** — AI prompt patterns and response validation
6. **`lib/cross-episode/similarity.ts`** — pgvector query patterns (N+1 risk)
7. **`lib/rate-limit.ts` vs `lib/redis/rate-limit.ts`** — Relationship between the two implementations (possible duplication)
8. **Corrections API** — No API route found for `corrections` table; the corrections UX flow may be incomplete
9. **Marketing/landing pages** — `test/e2e/flows/marketing-pages.spec.ts` tests routes that may not exist
10. **Subscription enforcement** — No route handler was observed checking tier limits before allowing episode creation or processing

---

## Audit Artifact Locations

| Document | Path |
|----------|------|
| This summary | `/Users/zach/urban-octo-funicular/.audit/AUDIT-SUMMARY.md` |
| Layer reports | `/Users/zach/urban-octo-funicular/.audit/layers/` (10 reports) |
| Architecture diagrams | `/Users/zach/urban-octo-funicular/.audit/diagrams/` (10 Mermaid files) |
| Critical findings | `/Users/zach/urban-octo-funicular/.audit/findings/critical.md` |
| High findings | `/Users/zach/urban-octo-funicular/.audit/findings/high.md` |
| Medium findings | `/Users/zach/urban-octo-funicular/.audit/findings/medium.md` |
| Low and info findings | `/Users/zach/urban-octo-funicular/.audit/findings/low-info.md` |
| Cross-references | `/Users/zach/urban-octo-funicular/.audit/synthesis/cross-references.md` |
| Contradictions | `/Users/zach/urban-octo-funicular/.audit/synthesis/contradictions.md` |
| Coverage gaps | `/Users/zach/urban-octo-funicular/.audit/synthesis/gaps.md` |
| Audit progress log | `/Users/zach/urban-octo-funicular/.audit/meta/progress.md` |
| Language detection | `/Users/zach/urban-octo-funicular/.audit/meta/language-detection.json` |

---

*Audit conducted by Codebase Cartographer multi-agent system. 10 specialized agents analyzed 10 architectural layers in 5 sequential waves. Synthesis performed adversarial cross-layer analysis, discovering 7 multi-layer corroborated findings including 1 critical functional bug (CRIT-03) not identified by any single layer in isolation. This audit represents heuristic static analysis and is not a replacement for dedicated security scanning (SAST, dependency audit, penetration testing), load testing, or runtime profiling.*
