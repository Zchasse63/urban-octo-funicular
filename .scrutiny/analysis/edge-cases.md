# Edge Cases Agent Report

**Agent:** edge-cases
**Plan:** PodBrain Launch Roadmap — Full 8-Phase Analysis
**Complexity Class:** MAJOR
**Analysis Depth:** Extended (Deep+)
**Date:** 2026-02-26

---

## Agent Verdict

**MODIFY** — The plan identifies risks but does not specify failure behaviors. This analysis surfaces 14 distinct failure scenarios across the 8-phase plan. The three most severe unmitigated scenarios are: (1) long-form podcast processing silently fails until Phase 5 because the Trigger.dev timeout problem is unresolved during Phases 0-4; (2) rate limiting is applied to 0 routes through Phase 0 and most of Phase 1, leaving AI processing endpoints as unlimited cost exposure; (3) the Taddy transcript credit pool (100/month on Pro) can be exhausted by a handful of users with no graceful degradation path. Several scenarios represent trust-destroying UX failures that are worse than "not having the feature" — specifically the fake integrations in settings (Spotify, Apple, etc.) and the decorative vocabulary sparklines with no real data.

---

## Failure Scenario 1: Long-Form Podcast Timeout (UNMITIGATED UNTIL PHASE 5)

**Trigger:** User uploads an episode longer than 25 minutes during Phases 0-4

**Behavior:** AssemblyAI transcription takes 1-4x audio duration. Trigger.dev job has 30-minute maximum execution time. For a 60-minute podcast (90-minute transcription), the job times out at 30 minutes. The episode status gets stuck in a "processing" state with no completion, no error message to the user.

**User experience:** Upload appears to succeed. Progress shows some percentage. Processing stops at an unknown point. No notification. User refreshes the page, episode is still "processing." Contacts support.

**Phase 0 milestone says:** "Upload episode → processing completes." This only holds for short audio.

**Required mitigation (before Phase 5):**
1. Add explicit constraint to Phase 0: "Test with audio < 20 minutes"
2. Add a UI warning when audio > 20 minutes is uploaded: "Note: Processing for long episodes may take 30-60 minutes"
3. Set Trigger.dev job timeout to maximum allowed value (even before webhook fix)
4. Add a job failure handler that marks the episode as "processing_failed" with a user-facing message

---

## Failure Scenario 2: Rate Limiting Cost Exposure (UNMITIGATED THROUGH EARLY PHASE 1)

**Trigger:** Any user or automated caller triggers repeated AI processing during Phases 0-1

**Behavior:** The `/api/episodes/[id]/process` endpoint has no rate limiting. Each processing call costs ~$0.10-0.15 in AI fees. A single user (or script) can trigger 100 processing calls per hour, costing $10-15/hour with no ceiling.

**Context:** Rate limiting code exists but is applied to 0 routes. Phase 1 includes "Apply rate limiting to processing and asset generation routes" — but this is item 14 of 14 in the phase.

**Required mitigation:**
1. Move rate limiting application to the FIRST item in Phase 1 (not last)
2. Or better: include applying rate limiting in Phase 0 bug fixes — it's 2-5 lines per route and can be done alongside bug B1-B10

---

## Failure Scenario 3: Transcript Credit Exhaustion — No Graceful Degradation (PHASE 7)

**Trigger:** 7+ users use pre-interview intelligence in the same month on Taddy Pro plan (100 credits)

**Behavior:** Taddy returns an error when transcript credit is zero. The pre-interview route (if it remains synchronous — see architecture-impact report) throws an error. The UI shows a generic error state.

**User experience:** "Pre-interview intelligence failed" — no explanation of why, no indication of when it will be available again, no degraded alternative (e.g., appearance history without transcript analysis).

**Required mitigation:**
1. Redis counter tracking transcript credits remaining
2. Check counter before every transcript fetch
3. When credits run low (<20): show warning in UI
4. When credits are zero: degrade gracefully — show appearance history without AI analysis, with message: "AI transcript analysis is at its monthly limit. Appearance history and links are available below. Full analysis resets on [date]."
5. Per-user credit allocation to prevent one user from consuming the pool

---

## Failure Scenario 4: `grok-beta` Deprecation (UNMITIGATED UNTIL PHASE 1)

**Trigger:** xAI removes or renames the `grok-beta` model identifier (which is an unstable development identifier, not a production one)

**Behavior:** All 7+ locations that use `grok-beta` start returning API errors simultaneously. Show notes generation fails. Asset generation fails. Vocabulary processing fails. SEO analysis fails. Guest package generation fails.

**User experience:** The entire product stops working for AI features. No degraded mode.

**Required mitigation (should be Phase 0 or Phase 1 item 1):**
1. Identify the correct stable xAI model identifier before any other work
2. Replace `grok-beta` in all 7+ locations before running Phase 0 end-to-end tests
3. Store model identifier in environment variable: `XAI_MODEL_ID=grok-2-1212`

---

## Failure Scenario 5: Stripe Webhook Without Signature Verification

**Trigger:** Attacker sends fake Stripe webhook events (subscription.updated, payment_intent.succeeded)

**Behavior:** Without signature verification, the webhook endpoint accepts any POST request as a real Stripe event. An attacker can: upgrade their account to Pro for free, add fake subscription data for any user ID, trigger refund processes.

**The plan's Phase 3 includes "Add Stripe webhook idempotency"** — but does not explicitly mention signature verification. If signature verification is already implemented, this is not a risk. If it's not, it's a critical security gap.

**Required verification:** Confirm `stripe.webhooks.constructEvent(body, sig, secret)` is already in the Stripe webhook handler. If not, add it to Phase 3.

---

## Failure Scenario 6: Fake Integrations Trust Erosion

**Trigger:** Any user visits the Settings page

**Behavior:** Settings shows Spotify, Apple Podcasts, YouTube, and Slack as available integrations. None have backends. Users who click "Connect" get no feedback or a generic error.

**User experience:** "Oh, PodBrain claims integrations it doesn't actually have." Immediate trust erosion. Makes users question what else the product claims but doesn't deliver.

**This is not a future risk — it's happening to every user right now.**

**Required mitigation (Phase 0 or first item Phase 1):**
Remove or gray out non-functional integrations. 15 minutes of UI work. Should not be deferred to Phase 1 item 9 of 14.

---

## Failure Scenario 7: RLS Disabled — All Data World-Readable

**Trigger:** Database is publicly accessible via Supabase anon key (which is public/front-end accessible)

**Behavior:** With `USING (true)` RLS, any caller with the Supabase anon key can read ALL data in ALL tables — episodes, transcripts, show notes, guest packages, vocabulary terms — for ALL users. The anon key is exposed in the frontend JavaScript (it's meant to be, with proper RLS).

**Current risk level:** HIGH. In single-user mode, this is less critical. Once multiple users exist, this becomes a data breach scenario.

**Phase 2 correctly addresses this.** The risk is that there's a window between "first paying user exists" (Phase 3) and "RLS is properly configured" (Phase 2). The phase ordering (auth before billing) is correct and prevents this gap — IF Phase 2 completes before any real users are onboarded.

**Required mitigation:** Ensure no real users are onboarded before Phase 2 completes. Keep the beta test invitation-only until RLS is in place.

---

## Failure Scenario 8: Upload Wizard No Episode Title

**Trigger:** User uploads audio in the current wizard (before Phase 1)

**Behavior:** All episodes are created as "Untitled Episode." When a user processes 5 episodes without naming them, the episode list shows 5 identical "Untitled Episode" rows with no way to distinguish them.

**Phase 0 milestone:** Does not include adding an episode title field. Phase 1 includes it as item 1.

**Required mitigation:** Add episode title field to upload wizard in Phase 0 (5-minute UI change). This is embarrassing if anyone sees the product before Phase 1.

---

## Failure Scenario 9: AssemblyAI Webhook URL Not Set for Production

**Trigger:** Phase 5 webhook migration deployed to production without the correct webhook URL configured in AssemblyAI

**Behavior:** AssemblyAI sends transcription completion callbacks to the wrong URL (or no URL). Processing jobs wait indefinitely for callbacks that never arrive. All episode processing hangs.

**Required mitigation:**
1. Document that `ASSEMBLYAI_WEBHOOK_URL` must be set in production environment before Phase 5 deploys
2. Add a startup check that verifies the webhook URL is configured
3. Add to Phase 5 checklist: "Verify webhook URL is set in production before deploying"

---

## Failure Scenario 10: Auth Migration Data Loss

**Trigger:** Phase 2 auth implementation converts DEFAULT_USER_ID rows to real user_id without a proper migration strategy

**Behavior:** When the first real user signs up, their user_id is different from `DEFAULT_USER_ID`. Any data created during development/testing under `DEFAULT_USER_ID` is not associated with the new user. Or worse: if RLS is applied before data is migrated, the first user sees no episodes/shows (they're associated with the DEFAULT_USER_ID, not their real user_id).

**Required mitigation:**
1. Explicitly decide: is development data kept or wiped at auth launch?
2. If kept: create a migration that reassigns DEFAULT_USER_ID rows to the first real user
3. Add a Phase 2 checklist item: "Test that existing show/episode data is accessible after auth migration"

---

## Failure Scenario 11: Decorative Vocabulary Sparklines

**Trigger:** Any user visits the Vocabulary page

**Behavior:** The UI shows vocabulary term usage trends and accuracy boost metrics that have no real data behind them — they're decorative visualizations. A user who relies on these metrics to understand which vocabulary terms are helping transcription accuracy is working with fictional data.

**User experience:** "This feature seems to be tracking my vocabulary learning over time!" → later: "Why aren't the stats changing?" → "These must be fake."

**Phase 8 addresses this** — but it's visible to all users in all phases. This should be addressed in Phase 1 (simplest fix: remove the sparklines until real data exists) rather than showing false data.

---

## Failure Scenario 12: Test Routes Exposed in Production

**Trigger:** Production environment has `/api/test-*` and `/api/seed` routes accessible

**Behavior:** `/api/seed` likely creates test data. `/api/test-*` routes likely test specific features. These should not be accessible in production — they can corrupt real user data.

**The plan correctly identifies this in Phase 6** ("Remove or gate test routes behind dev guard"). But these routes are currently accessible in whatever production environment exists.

**Required mitigation:** Add to Phase 0 or Phase 1: gate test routes behind an environment check:
```typescript
if (process.env.NODE_ENV !== 'development') {
  return NextResponse.json({ error: 'Not found' }, { status: 404 });
}
```

---

## Failure Scenario 13: Redis Cache Corruption (B10 — Already in Phase 0)

**Trigger:** Any feature that reads from Redis cache before B10 is fixed

**Behavior:** Double JSON.stringify means cached data is `"\"object\""` instead of `{object}`. `JSON.parse(cachedValue)` returns a string, not an object. Features that rely on cached data either crash or silently use incorrect data.

**Phase 0 correctly includes this fix.** The risk is that B10 is item 10 of 10 — if the developer fixes B1-B9 and tests the product before fixing B10, cached behavior will be incorrect.

**Required mitigation:** Fix B10 first (or simultaneously with B1). It's a 1-line fix.

---

## Failure Scenario 14: Buzzsprout Push Notes Breaks After Auth Migration

**Trigger:** Phase 2 auth is implemented, and a user tries to push show notes to Buzzsprout

**Behavior:** Buzzsprout integration stores connection data (API token, show ID) likely associated with DEFAULT_USER_ID. After auth, the lookup for the user's Buzzsprout connection may fail because the user_id changed.

**Required mitigation:** Include Buzzsprout integration in the Phase 2 auth migration testing checklist. Verify that connection data migrates correctly to real user IDs.

---

## Edge Case Priority Matrix

| Scenario | Severity | Phase Risk | Action |
|----------|----------|------------|--------|
| Long-form timeout | CRITICAL | Phases 0-4 | Add explicit constraint to Phase 0 |
| Rate limiting exposure | HIGH | Phase 0 + early Phase 1 | Move to Phase 0 |
| grok-beta deprecation | HIGH | Phase 0-1 | Move to Phase 0 |
| Fake integrations | HIGH | NOW | Fix in Phase 0 (15 min) |
| Stripe webhook without signature verification | HIGH | Phase 3 | Verify/add in Phase 3 |
| Transcript credit exhaustion | HIGH | Phase 7 | Design graceful degradation |
| No episode title | MEDIUM | Phase 0-1 | Add to Phase 0 |
| Auth migration data loss | MEDIUM | Phase 2 | Add migration strategy |
| AssemblyAI webhook URL | MEDIUM | Phase 5 | Add to deployment checklist |
| RLS window during beta | MEDIUM | Phases 2-3 | Keep beta invite-only until Phase 2 done |
| Decorative sparklines | MEDIUM | Phase 1-8 | Remove in Phase 1 |
| Test routes in production | MEDIUM | Phases 0+ | Gate in Phase 1 |
| Redis corruption order | LOW | Phase 0 | Fix B10 first |
| Buzzsprout auth migration | LOW | Phase 2 | Add to Phase 2 checklist |

---

## Edge Case Conclusion

The plan has 14 identifiable edge cases, 4 of which are present right now (long-form timeout risk, rate limiting exposure, grok-beta risk, fake integrations). The most important near-term actions are:

1. Move fake integrations removal to Phase 0 (15 minutes, prevents trust erosion)
2. Move rate limiting application to Phase 0 (cost protection)
3. Fix grok-beta before end-to-end testing (prevents test failures from wrong model)
4. Explicitly constrain Phase 0 milestone to short audio only

These don't add to the scope — they reprioritize existing items.
