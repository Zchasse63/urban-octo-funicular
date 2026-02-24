# Cross-Reference Analysis

**Synthesizer:** audit-synthesizer
**Date:** 2026-02-24

This document records findings corroborated by multiple independent audit layers, increasing confidence in their accuracy and severity.

---

## Cross-Reference: No Rate Limiting Applied Despite Implementation

**Corroborated by:** api-surface, security, performance-infra, integration (4 layers)

All four layers independently identified that `lib/redis/rate-limit.ts` and `lib/rate-limit.ts` implement rate limiting with defined limits in `constants.ts`, but none of the 26 API route handlers ever invoke these functions. The constants define:
- Default: 60 req/min
- Processing: 10 req/min
- Asset generation: 30 req/min

The absence of rate limiting creates an unbounded attack surface for AI cost abuse (security), API flooding (api-surface), and infrastructure cost runaway (performance-infra, integration).

**Confidence:** Very High. Implementation of rate limiting exists in lib/ but is provably absent from all route files examined.

---

## Cross-Reference: Missing Authentication on All API Routes

**Corroborated by:** project-structure, api-surface, security, data-model (4 layers)

- project-structure: No `middleware.ts` file exists
- api-surface: All 26 routes use `DEFAULT_USER_ID` directly without any auth check
- security: `validateAuth()` always returns default user, is never called from routes
- data-model: RLS policies use `USING (true)` — no database-level protection

All layers agree: the API is completely unauthenticated. This is an intentional architectural decision documented in `CLAUDE.md` ("Auth is DEFERRED"), but it is corroborated as a pre-launch blocker by four independent analyses.

**Confidence:** Very High. Confirmed by examining middleware files (absent), route handlers (no auth calls), and database RLS policies (permissive).

---

## Cross-Reference: Hardcoded Nav Counts Are Stale/Incorrect

**Corroborated by:** project-structure, ui-ux, user-flow (3 layers)

- project-structure: `sidebar.tsx` has `count={12}` (episodes) and `count={42}` (vocabulary) hardcoded
- ui-ux: Sidebar NavItem count badges are hardcoded and not connected to real data
- user-flow: This creates incorrect status information for the user about their episode/vocabulary counts

**Confidence:** High. Code directly shows hardcoded values.

---

## Cross-Reference: No Episode Title in Upload Wizard

**Corroborated by:** ui-ux, user-flow, api-surface (3 layers)

- user-flow: Upload wizard `handleSubmit()` sends no `title` field when creating an episode
- ui-ux: No title input field exists in any of the 3 wizard steps
- api-surface: `EpisodeRow` falls back to `"Untitled Episode"` for missing titles

All episodes uploaded via the wizard would be created as "Untitled Episode" unless the `POST /api/episodes` route generates a default title. This is a functional bug in the primary user flow.

**Confidence:** High. Wizard code confirmed; no title field in any of 3 steps.

---

## Cross-Reference: transcript Truncated at 8000 Characters Affects Multiple Features

**Corroborated by:** ai-layer, user-flow, integration (3 layers)

- ai-layer: `asset-prompts.ts` truncates transcript at `slice(0, 8000)` for all asset prompts
- user-flow: Show notes are the primary value proposition — truncation means notes only cover ~first 5 minutes of a 4-hour podcast
- integration: The processing pipeline (Trigger.dev job) generates full transcript but content generation discards 95%+ of it

For a 4-hour podcast (typical target audience), the transcript is ~150,000+ characters. The 8000-character limit means show notes, blog posts, social media posts, and all other assets are generated from less than 6% of the episode content.

**Confidence:** High. Confirmed in `asset-prompts.ts` source code.

---

## Cross-Reference: Trigger.dev Job Timeout vs Transcription Time

**Corroborated by:** performance-infra, integration, ai-layer (3 layers)

- performance-infra: `maxDuration: 1800` (30 min) in `trigger.config.ts` and `processEpisodeTask`
- integration: AssemblyAI transcription can take up to 2x audio duration (8 hours for 4-hour audio)
- ai-layer: Processing pipeline documents support for 4-hour audio files

The Trigger.dev job timeout (30 min) is fundamentally incompatible with the stated requirement to support 4-hour audio files when AssemblyAI polling could take up to 8 hours. The job will timeout leaving episodes stuck in `processing` status.

**Confidence:** High. Constants confirmed: `TIMEOUTS.transcription = 8 * 60 * 60 * 1000`, `maxDuration: 1800`.

---

## Cross-Reference: hosting_connections Schema Conflict

**Corroborated by:** data-model, integration, security (3 layers)

- data-model: Phase 1 and Phase 7 migrations created conflicting schemas for `hosting_connections`
- integration: The Buzzsprout API code uses Phase 7 columns (`provider`, `credentials`) but Phase 1 columns (`platform` enum, `access_token`) still exist
- security: Credentials stored in a JSONB column (`credentials`) are encrypted, but the old `access_token` column may also be present

The schema alignment migration adds Phase 7 columns but doesn't drop Phase 1 columns, leaving a confusing dual-schema state.

**Confidence:** High. Confirmed by reading all 4 migration files.

---

## Cross-Reference: Button Component Tests Test Wrong Design System

**Corroborated by:** testing-quality, ui-ux (2 layers)

- testing-quality: `button.test.tsx` checks for classes like `bg-primary`, `bg-secondary`, `bg-destructive`, `hover:bg-accent`
- ui-ux: The Swiss Broadcast Button component uses CSS custom property classes (`bg-[var(--color-text-ink)]`, `bg-[var(--color-bg-surface)]`, etc.)

The test suite was not updated when the UI was rebuilt on `ui-rebuild-v3`. These tests will fail against the current component implementation.

**Confidence:** Very High. Both the old class names in tests and new class names in button.tsx were directly confirmed.

---

## Cross-Reference: Pricing Tiers Inconsistent Across Codebase

**Corroborated by:** integration, data-model, api-surface (3 layers)

- integration: `constants.ts` Pro = unlimited episodes, 3 shows, 1 seat vs `stripe/products.ts` Pro = 50 episodes, 5 shows
- data-model: `subscriptions` table stores `subscription_tier` as TEXT, enforcement is at application layer only
- api-surface: No API route enforces subscription limits on episode creation or processing

Three different definitions of plan limits exist (constants.ts, stripe/products.ts, CLAUDE.md documentation), and none are enforced at the API level.

**Confidence:** High. Confirmed by reading constants.ts and stripe/products.ts directly.
