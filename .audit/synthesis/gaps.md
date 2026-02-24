# Coverage Gaps

**Synthesizer:** audit-synthesizer
**Date:** 2026-02-24

This document records areas that no audit layer covered or that require additional investigation.

---

## Gap 1: ShowNotesTab Rendering of HTML from AI

No layer verified how `show_notes_html` is rendered in `ShowNotesTab.tsx`. If `dangerouslySetInnerHTML` is used without DOMPurify sanitization at render time, this would be a critical XSS vulnerability. The security layer flagged this as a risk but could not confirm the implementation without reading the component. The `isomorphic-dompurify` dependency suggests sanitization is intended.

**Action needed:** Read `components/episodes/show-notes-tab.tsx` and verify HTML rendering method.

---

## Gap 2: Trigger.dev Job File Contents (transcribe-audio, generate-show-notes, generate-assets)

Only `process-episode.ts` was fully analyzed. The three sub-tasks (`transcribeAudioTask`, `generateShowNotesTask`, `generateAssetsTask`) were not individually reviewed. Each may have additional error handling concerns, timeout issues, or AI prompt patterns not captured in the current analysis.

**Action needed:** Read `trigger/jobs/transcribe-audio.ts`, `trigger/jobs/generate-show-notes.ts`, `trigger/jobs/generate-assets.ts`.

---

## Gap 3: Guest Package Generator

`lib/guest-package/generator.ts` was not read during the audit. This module generates guest promo packages using xAI Grok. It's unknown whether it has proper error handling, prompt injection resistance, or response validation. The ai-layer report flags this as "Unknown."

**Action needed:** Read `lib/guest-package/generator.ts` and `lib/guest-intel/service.ts`.

---

## Gap 4: Cross-Episode Similarity Implementation

`lib/cross-episode/similarity.ts` and `lib/cross-episode/embeddings.ts` were not fully analyzed. These modules perform pgvector similarity queries which could have N+1 patterns or missing index usage if not implemented correctly.

**Action needed:** Read cross-episode library files and verify query patterns.

---

## Gap 5: Corrections Service Integration

The `corrections` table exists in the database schema and `lib/corrections/service.ts` exists, but no UI flow was identified that allows users to submit corrections. The vocabulary learning from corrections (`learnFromCorrections()` in vocabulary/service.ts) appears implemented but it's unclear how users trigger it. No API route for corrections was found in the inventory.

**Action needed:** Verify whether a corrections API route exists (may be missing from the 26-route inventory) and whether there's UI for submitting corrections.

---

## Gap 6: Public/Marketing Pages

`test/e2e/flows/marketing-pages.spec.ts` tests "marketing pages" but no marketing route was found under `app/src/app/(app)/`. The root `page.tsx` redirects to `/episodes`. It's unclear whether marketing pages exist at a different route or if the test is testing a non-existent route.

**Action needed:** Verify whether marketing/landing pages exist at any route.

---

## Gap 7: Subscription Enforcement

No layer verified whether subscription limits (3 episodes free, 50 episodes Pro, 200 episodes Agency) are enforced at any point in the API. The `PRICING_TIERS` and `SUBSCRIPTION_TIERS` constants define limits but no route handler was observed checking the current user's tier before allowing episode creation or processing.

**Action needed:** Check `POST /api/episodes` and `POST /api/episodes/[id]/process` for subscription tier enforcement logic.

---

## Gap 8: NEXT_PUBLIC_APP_URL Environment Variable

`app/layout.tsx` references `process.env.NEXT_PUBLIC_APP_URL` for `metadataBase`. This variable is not listed in the CLAUDE.md environment variables section. If not set in production, `metadataBase` defaults to `http://localhost:3000`, which would make all Open Graph and Twitter Card meta URLs incorrect.

**Action needed:** Verify `NEXT_PUBLIC_APP_URL` is set in production environment.

---

## Gap 9: Duplicate Rate Limit Implementations

Two rate limiting files exist: `lib/rate-limit.ts` and `lib/redis/rate-limit.ts`. Neither was analyzed to determine if they have identical behavior or if one wraps the other. The existence of two implementations suggests code duplication or an incomplete refactoring.

**Action needed:** Read `lib/rate-limit.ts` to understand its relationship to `lib/redis/rate-limit.ts`.

---

## Gap 10: Mobile Performance

No mobile-specific performance analysis was conducted. The UI is mobile-responsive (as noted in ui-ux) but the performance impact of loading fonts from Google CDN, rendering the blueprint grid background, and the stagger animations on low-end mobile devices was not assessed.
