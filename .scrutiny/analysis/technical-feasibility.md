# Technical Feasibility Agent Report

**Agent:** technical-feasibility
**Plan:** PodBrain Launch Roadmap — Full 8-Phase Analysis
**Complexity Class:** MAJOR
**Analysis Depth:** Extended (Deep+)
**Date:** 2026-02-26

---

## Agent Verdict

**MODIFY** — The plan is technically executable but contains three material feasibility gaps that must be addressed before timeline estimates are trustworthy: (1) the Trigger.dev 30-minute timeout blocks the Phase 0 success criteria for real-world audio, yet the fix isn't until Phase 5; (2) the `grok-beta` model identifier is an instability bomb sitting across 7+ production call sites with no migration plan to a specific stable model; (3) the Taddy pre-interview intelligence feature will fail as a synchronous API route due to 3-10 minute execution times. The Phase 0 bug fixes are credible and the core architecture is sound. The path to launch is real. These specific gaps require explicit resolution before implementation.

---

## 1. Phase 0 Bug Fixes — Feasibility

**Verdict: CREDIBLE with one caveat**

The 10 bugs are correctly identified and fix complexity estimates are largely accurate:

- B1 (signedUrl field), B3, B4, B6, B9, B10: All 1-3 line fixes. Credible.
- B5 (SEO hook): 3 lines. Credible.
- B2 (status polling): "~20 lines" is right, but requires understanding Trigger.dev v4's actual run status enum values. Not zero-research. Budget 2-3 hours for B2 alone.
- B7 (uncomment xAI call): The uncomment is trivial. But the first real end-to-end run will surface issues: Does the API key have credits? Are the prompt formats still correct for the current Grok model? Does the response parsing still match? This requires at least one full test run with real data.
- B8 (Stripe price IDs on client): "Move to API-side resolution" is 15-30 lines of refactoring plus a new API endpoint or server action. Not a trivial fix.

**Revised Phase 0 estimate: 1 full day (not 2-4 hours). Budget 1.5 days for safety.**

---

## 2. CRITICAL: Trigger.dev 30-Minute Timeout

**Verdict: UNRESOLVED CRITICAL GAP**

CRIT-04 from the audit: Trigger.dev jobs have a 30-minute timeout. The podcast transcription pipeline uses AssemblyAI which can take 2x the audio duration. A 2-hour podcast = ~4-hour audio duration potential → transcription exceeds timeout.

**The sequencing problem:**
- Phase 0 milestone: "Upload episode → processing completes → real AI output"
- Phase 5 fix: "Restructure AssemblyAI transcription to use webhook callbacks"
- If Phase 0 testing uses a podcast episode > 25 minutes, the Phase 0 milestone silently fails

**The webhook fix complexity:** AssemblyAI webhook callbacks require:
1. A publicly accessible HTTPS endpoint that AssemblyAI can POST to
2. Trigger.dev job restructured to wait on the webhook (not poll)
3. State machine between job initiation and callback receipt
4. This is a 2-3 day architectural change, not a minor fix

**Immediate recommendation:** Phase 0 must explicitly specify "test with audio < 20 minutes." Add this constraint to the Phase 0 milestone definition. Flag that the product cannot serve its core use case (long-form podcasts) until Phase 5 completes.

---

## 3. `grok-beta` Model Identifier

**Verdict: HIGH RISK, SIMPLE FIX DEFERRED TOO LONG**

`grok-beta` is used in 7+ locations. xAI's production-stable model identifiers are versioned (e.g., `grok-2-1212`, `grok-3-beta`). If xAI deprecates or removes `grok-beta`:
- All AI generation breaks simultaneously across every feature
- Zero warning before failure (no deprecation header in responses)

The plan addresses this in Phase 1 ("Pin xAI model to stable identifier"). This is correct phasing. However, the plan does not specify WHICH stable model to use. At time of writing, `grok-2-1212` or `grok-3-beta` may be appropriate — this must be verified against xAI's current model catalog.

**Additional risk:** If the model capabilities differ between `grok-beta` and the replacement, prompt formats written for `grok-beta` may produce degraded output with a newer model. The plan should include explicit output quality validation after model pin.

---

## 4. Supabase Auth Migration (Phase 2)

**Verdict: FEASIBLE BUT EFFORT IS UNDERSTATED**

Phase 2 lists "Replace DEFAULT_USER_ID with auth.uid() in all route handlers" as a single checklist item. In reality this is:
- 26 route files to update
- Each requires extracting auth from the request context
- Each requires updating Supabase client instantiation to use the user's session
- RLS policy updates on every table (currently `USING (true)`)
- Testing that no route breaks after the change

The existing schema has tables prepared for multi-user (user_id columns present) but the DEFAULT_USER_ID pattern is pervasive. This is genuinely a 3-5 day migration task. Planning as a single checklist item will cause schedule slip.

**Additionally:** The middleware.ts referenced in Phase 2 doesn't currently exist. Creating it to protect 26 routes including webhook exclusions requires careful testing — Stripe webhooks must NOT be protected by auth middleware.

---

## 5. Transcription Webhook Architecture (Phase 5)

**Verdict: NECESSARY, SCOPED CORRECTLY**

Phase 5 correctly identifies the need to switch from polling to webhook callbacks for AssemblyAI. This is the right fix for the Trigger.dev timeout problem.

**Technical considerations for implementation:**
- The webhook endpoint must be behind its own authentication (AssemblyAI HMAC signature verification), not the user auth middleware from Phase 2
- The Trigger.dev job must support a "wait for webhook" pattern — Trigger.dev v4 has `triggerAndWait` but this requires a different job structure than polling
- The endpoint URL must be configured in AssemblyAI at job submission time, which requires the production URL to be known

**Correctly placed in Phase 5. This is non-trivial but well-understood architecture.**

---

## 6. Taddy Pre-Interview Intelligence — Architectural Gap

**Verdict: CRITICAL ARCHITECTURAL FLAW IN THE PLAN**

The plan places pre-interview intelligence at `app/api/episodes/[id]/pre-interview/route.ts` — a Next.js API route. The expected execution flow:
1. Search Taddy (multiple paginated calls)
2. Fetch 10-20 transcripts (10 seconds each per hour of audio)
3. 10-20 Grok analysis calls (1-5 seconds each)
4. Synthesis call to Grok

**Expected total duration: 3-10 minutes minimum.**

Next.js API routes on Vercel/Netlify have a 60-second timeout. Even on Vercel Pro with extended timeouts, blocking the user's request for 3-10 minutes is unacceptable UX.

**The fix:** Pre-interview intelligence must be a Trigger.dev background job, following the same pattern as episode processing. The API route creates the job and returns immediately. The UI polls for completion.

This adds scope to Phase 7 but is architecturally necessary.

---

## 7. Podcasting 2.0 Tag Generation — Technical Assessment

**Verdict: TECHNICALLY SOUND, BEST-EXECUTED PART OF PHASE 7**

The data mapping in the Podcasting 2.0 strategy is technically correct:

- `viral_moments[]` → `<podcast:soundbite>`: Data model maps directly. Near-zero implementation complexity.
- AssemblyAI transcript → VTT format: Well-documented conversion, low complexity. VTT files are small (~50KB per hour).
- Show notes sections → chapters JSON: More complex than implied. Requires AI chapter detection to produce timestamps, not just section titles. Need to verify the chapter detection pipeline works.
- `<podcast:person>` basic tags: Requires `guest_name` to be populated on episodes. The upload wizard currently has no guest name field (to be added in Phase 1). Basic person tags won't be populated until users start entering guest names.

**The flywheel claim is real but slow.** PodBrain generates tags → Podcast Index/Taddy indexes them. Taddy's indexing frequency for non-popular feeds is unknown. The flywheel could take 12-18 months to show measurable effect. This is an investment in long-term positioning, not a near-term business driver.

---

## 8. Missing RPC Function

**Verdict: SILENT FAILURE RISK**

`find_similar_sections` RPC function is referenced in the codebase but was never created in any migration. Cross-episode similarity code will fail silently. The plan places this in Phase 8 (post-launch), which means it will cause errors in production for any user who triggers the cross-episode linking feature.

**Minimum fix:** Add a database migration to create a stub `find_similar_sections` function that returns an empty array (prevents crashes), to be replaced with the real implementation in Phase 8.

---

## 9. Rate Limiting Not Applied

**Verdict: HIGH PRIORITY, CORRECTLY IN PHASE 1**

Rate limiting code exists but is applied to 0 routes. An AI processing call costs ~$0.15. A free user (or attacker) can trigger unlimited processing runs at no cost to them. Phase 1 correctly includes "Apply rate limiting to processing and asset generation routes."

However: Phase 1 does not mention applying rate limiting to Taddy routes. The Taddy pre-interview route consumes transcript credits ($10-12 effective cost per credit-consuming request). This route must have rate limiting applied from day one of Phase 7, not after.

---

## 10. Redis Double-Serialization (B10)

**Verdict: CORRECTLY IDENTIFIED, FIX REQUIRED BEFORE ANY CACHING RELIES ON REDIS**

B10 (double JSON.stringify) means cached data stored as `"\"stringified\"" ` instead of `"stringified"`. This affects deserialization — `JSON.parse(cache)` will return a string, not an object. Any feature that relies on cached Redis data is silently broken until this is fixed.

B10 is in Phase 0. This is correct. Without this fix, the Taddy caching strategy (which plans to use Redis as L1 cache) would silently corrupt cached Taddy responses.

---

## Technical Risk Register

| Risk | Severity | Phase Addressed | Action Required |
|------|----------|-----------------|-----------------|
| Trigger.dev 30-min timeout | CRITICAL | Phase 5 | Phase 0 must restrict to short audio |
| Pre-interview route as sync API | CRITICAL | Phase 7 (unmentioned) | Must use Trigger.dev background job |
| `grok-beta` identifier | HIGH | Phase 1 | Specify target model ID before implementation |
| Auth migration effort (26 routes) | HIGH | Phase 2 | Budget 3-5 days, not 1 checklist item |
| Transcript truncation (8000 chars) | HIGH | Phase 5 | Quality degradation visible pre-Phase 5 |
| B7 uncomment untested | MEDIUM | Phase 0 | Budget full day, include end-to-end test run |
| `persons` field 0% mainstream coverage | MEDIUM | Phase 7 | Design fallback strategy explicitly |
| 100 transcript credits/month (Pro) | MEDIUM | Phase 7 | Business plan required for T3; or per-use gating |
| No Sentry until Phase 5 | MEDIUM | Phase 5 | Consider moving to Phase 2 |
| `find_similar_sections` missing | LOW | Phase 8 | Add stub migration to prevent crashes |
| `hosting_connections` schema conflict | LOW | Unaddressed | Add to migrations plan |

---

## Feasibility Conclusion

The plan is **technically executable** by a skilled full-stack developer. The core architecture is sound and most of the "broken" items are genuinely simple fixes. The revised recommendation: execute the plan with these modifications:

1. Phase 0: Restrict test audio to < 20 minutes; budget 1.5 days not 2-4 hours
2. Phase 1: Move `grok-beta` fix to Phase 0 or early Phase 1; specify the target model ID
3. Phase 2: Budget 3-5 days for auth migration; include stub for missing RPC function
4. Phase 5: Consider moving Sentry to Phase 2-3
5. Phase 7: Pre-interview intelligence must be Trigger.dev background job, not sync API route
