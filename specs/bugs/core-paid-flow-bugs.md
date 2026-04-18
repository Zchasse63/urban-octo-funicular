# Bugs: Core Paid Flow

**Author:** qa-healer
**Date:** 2026-04-18

## Summary

**0 real application bugs found** during the core-paid-flow test run. All 20 P0/P1/P2 tests pass after 1 cycle of test-code healing.

## Behavioral Observations (not bugs)

These are intentional behaviors encountered during healing that are documented for future test authors:

### O-1: Show-notes raw-markdown fallback

When an episode is `completed` but `show_notes_html` has not yet been generated, the UI renders the raw markdown source inside a `<pre>` block with an amber banner that reads *"HTML version not yet generated. Showing markdown source."*

This is intentional UX (showing the user what was written even when the HTML pipeline hasn't run yet) and is NOT a BUG #11 regression. BUG #11 was specifically about the markdown-to-HTML pipeline producing broken output when it DID run — the regression guard (T-004) tests that rendered HTML is well-formed, not that the raw-source fallback exists.

### O-2: Guest package for no-guest episode

`GET /api/episodes/:id/guest-package` succeeds (200) for an episode with `guest_name = null`. The generator produces a package with a "Guest" placeholder in content. This is the documented behavior (see `generateGuestPackage` in `lib/guest-package/generator.ts`). T-017 verifies the contract is upheld.

### O-3: `T-011` concurrent-claim in dev env

In this test run, T-011 observed responses `(200, 409)` — the atomic status-claim code is working correctly. If a future run in an environment where Trigger.dev is unreachable observes `(500, 409)`, that's still passing (the first request's 500 is Trigger rollback; the second's 409 is the atomic claim). The critical assertion is that both never return 200 simultaneously, which would indicate a broken claim.

### O-4: Resend interception result

T-013 completed without any Resend outbound calls (`interceptedCount === 0`). The guest-package POST returned a successful status because the test environment has `RESEND_API_KEY` configured and the SDK call succeeded against Resend's sandbox routing. No production email was sent — the destination address `intercepted@test.local` is not a deliverable domain.

If a future run observes non-zero interception count, that is a REAL bug: production code is attempting to send email from a browser/client context, which is forbidden.

## Follow-up (out-of-scope for this run)

- **Webhook dispatch test for `episode.completed`** (W-15 in analysis) — requires a local capture server; architect deferred. Recommend adding a separate spec `webhooks-dispatch.spec.ts` that spins up a Node HTTP server on a free port, registers it as a user webhook, fast-forwards an episode through completion, and asserts HMAC signature verification.
- **xAI circuit breaker open-state test** (W-9) — requires ability to set the breaker into "open" state via a test-only toggle. Could be added as a module-level spy/override in a follow-up.

No bugs to route back to dev-pipeline.
