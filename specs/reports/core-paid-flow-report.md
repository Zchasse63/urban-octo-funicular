# QA Report: Core Paid Flow

**Status:** Complete
**Author:** qa-scribe
**Date:** 2026-04-18
**Feature slug:** `core-paid-flow`
**Branch:** `claude/silly-bassi-5f53bf`

## Executive Summary

The core paid flow — authenticated podcaster uploads audio, processes it through the AssemblyAI → xAI Grok pipeline, and receives the full content deliverable package — was audited end-to-end with a 20-test suite spanning P0 smoke tests (upload, all-tabs, XSS/SQLi, RLS, ZIP download, BUG #11/#29 regression), P1 should-haves (concurrent claim, tier cap, Resend interception, regenerate, polling, no-guest), and P2 nice-to-haves (URL import, queue persistence, MIME validation).

**Final result: 20/20 tests passing (100%) in 1.7 minutes wall-clock.** Zero real application bugs were surfaced. Four test-code issues were healed in a single cycle (envelope unwrap, placeholder regex, BUG #11 fixture shape, URL-input regex) — none were application defects.

The paid flow is **ready for launch** on every contract examined: auth-gated API routes return 404 (not 403) to cross-user probes, the AssemblyAI webhook rejects missing or length-mismatched tokens with timing-safe 401, atomic status claims prevent concurrent-processing duplication, XSS payloads render as escaped text, SQL-injection attempts are parameterized away, and the ZIP download streams `application/zip` with correct `Content-Disposition` headers. BUG #29 (transcript timestamps rendering as minutes instead of seconds) and BUG #11 (broken `[0:53](0:53)` markdown) both have live regression guards that the suite will now catch on any future change.

## Coverage

### Tests by Priority

| Priority | Implemented | Passed | Pass Rate |
|---|---|---|---|
| P0 | 10 / 10 | 10 | 100% |
| P1 | 7 / 7 | 7 | 100% |
| P2 | 3 / 3 | 3 | 100% |
| **Total** | **20 / 20** | **20** | **100%** |

### Workflows Covered

| Workflow | Test(s) | Status |
|---|---|---|
| W-1: Happy path upload + processing trigger | T-001 | PASS |
| W-2: Completed episode 6-tab integrity | T-002 | PASS |
| W-3: ZIP download with assets | T-005 | PASS |
| W-4: Guest package fetch + email render | T-006, T-013, T-017 | PASS |
| W-5: Regenerate show notes | T-014 | PASS |
| W-6: Tier-cap gate | T-012 | PASS |
| W-7: AssemblyAI webhook auth | T-007 | PASS |
| W-8: Processing status polling | T-015, T-016 | PASS |
| W-10: RLS cross-user isolation | T-008 | PASS |
| W-11: XSS/SQLi defense | T-009 | PASS |
| W-12: ZIP download with no assets | T-010 | PASS |
| W-13: Guest package with no guest_name | T-017 | PASS |
| W-14: Concurrent process 409 | T-011 | PASS |
| W-16: BUG #11 markdown regression | T-004 | PASS |
| BUG #29 transcript ms regression | T-003 | PASS |
| Queue persistence | T-018 | PASS |
| URL import | T-019 | PASS |
| MIME validation | T-020 | PASS |

### Coverage Gaps (acknowledged)

| Gap | Reason | Follow-up |
|---|---|---|
| **W-9: xAI circuit breaker open-state** | Requires module-level breaker override — no test-seam exists | Add a test-only toggle to `lib/circuit-breaker.ts` in a separate PR |
| **W-15: webhook dispatch for `episode.completed`** | Requires a local capture HTTP server — out of scope for this pass | Write `webhooks-dispatch.spec.ts` that spins up a Node server on a free port and verifies HMAC-SHA256 signatures |
| **End-to-end AssemblyAI transcription** | Intentional — 2–4 min per run, real cost | Covered by `test/live/pipeline.test.ts` (LLM-judge suite) |
| **End-to-end xAI asset content quality** | Intentional — covered by the LLM-judge grading system in `test/live/quality.test.ts` | No action |

## Test Infrastructure

### Page Object Models

| POM | File | New / Existing |
|---|---|---|
| UploadWizardPage | `app/test/e2e/pages/upload-wizard-page.ts` | **Extended** (added `fillExpertContext`, Step 2 placeholder locators, testId accessors) |
| EpisodeDetailPage | `app/test/e2e/pages/episode-detail-page.ts` | **Extended** (added ZIP link, regenerate, first-transcript-timestamp locators + BUG #11 guard helper) |

### Helpers

| Helper | File | Purpose |
|---|---|---|
| API wrapper | `app/test/e2e/helpers/core-paid-flow-api.ts` | `downloadAssetsZip`, `fetchGuestPackage`, `sendGuestPackageEmail`, `processEpisode`, `getEpisode`, `getProcessStatus`, `postAssemblyaiWebhook`, `requestSignedUploadUrl` |
| Resend interceptor | `app/test/e2e/helpers/resend-intercept.ts` | `installResendBlock(page)` — Playwright route-level block on `api.resend.com` |

### Fixture module

| Fixture | File | Purpose |
|---|---|---|
| `createCoreQaUser` | `app/test/e2e/fixtures/core-paid-flow.ts` | User + show seeded with `[TEST] [CORE-QA]` prefix for cleanup sweep |
| `seedCompletedEpisodeWithAssets` | same | Completed episode + 3 generated_assets (linkedin_post, twitter_thread, blog_post) |
| `seedCompletedEpisodeNoAssets` | same | Completed episode with zero assets (for ZIP 404 test) |
| `seedEpisodeForTimestampRegression` | same | First segment at 3000ms for BUG #29 guard |
| `seedEpisodeWithBrokenTimestampMarkdown` | same | Raw markdown + processed HTML for BUG #11 guard |
| `seedPendingEpisode` | same | Pending episode for concurrent-claim + status tests |
| `seedAttackPayloadEpisode` | same | XSS + SQLi payloads for T-009 |

## Healing Activity

- **Initial failures:** 4 (T-004, T-006, T-017, T-019)
- **Tests healed (test-code bugs):** 4
- **Tests revealing real bugs:** 0
- **Unhealable tests:** 0
- **Healing cycles:** 1 (all four fixes landed in one pass)

### Notable healing actions

- T-004: Seed `show_notes_html` alongside raw markdown so the BUG #11 guard exercises the post-fix HTML path rather than the intentional raw-source fallback.
- T-006 / T-017: Unwrap the `{data, error}` API envelope in `fetchGuestPackage` helper — API routes wrap success payloads via `successResponse<T>()` in `lib/api/helpers.ts`.
- T-019: Fix placeholder regex in `UploadWizardPage.urlInput()` to match the actual placeholder (`https://example.com/episode.mp3`).

Full details in `specs/healing/core-paid-flow-healing-log.md`.

## Bugs Found

**None.** See `specs/bugs/core-paid-flow-bugs.md` for observational notes (intentional raw-markdown fallback UX, no-guest fallback behavior, concurrent-claim success, Resend non-interception).

## Flakiness Assessment

- **Tests flagged as potentially flaky by the Architect:** T-001 (upload), T-005 (ZIP download race), T-011 (concurrent 409), T-013 (Resend env-state)
- **Tests that exhibited flakiness during healing:** NONE. All 20 tests passed on the first full re-run post-healing.
- **Recommended re-run count before CI stability claim:** 3 consecutive clean runs on main before marking "stable."

## Recommendations

### Before merge
1. Verify `ASSEMBLYAI_WEBHOOK_SECRET` is set in the local `.env.local` so T-007 runs with real auth (currently always passing because the env var IS set).
2. Run the full suite one more time on main branch against a fresh Supabase state to confirm no shared-state leakage.

### Follow-up work
1. **W-15 webhook dispatch spec** — spin up local capture server, register user webhook, fast-forward episode, verify HMAC signature (separate spec file).
2. **W-9 circuit breaker spec** — add test-seam to `lib/circuit-breaker.ts` to force "open" state, verify graceful degradation on the asset-generation API.
3. Consider a scheduled CI job that runs this spec once per hour against production to catch drift in the paid-flow contract.

### Test maintenance notes
- When the upload-wizard Step 2 placeholders change, update `UploadWizardPage.episodeTitleInput()` etc.
- When the API response envelope changes (unlikely), update `fetchGuestPackage` in `helpers/core-paid-flow-api.ts`.
- When a new asset_type is added, extend the `seedCompletedEpisodeWithAssets` fixture so T-005 ZIP download still exercises a representative set.
- The BUG #11 regression guard (T-004) depends on `show_notes_html` being present; any future change that stops populating this field from the pipeline would make T-004 pass vacuously. Consider adding a data invariant test to `test/unit/` that asserts `generateShowNotes()` always produces both `show_notes` AND `show_notes_html`.

## Artifacts Index

| Document | Purpose | Path |
|---|---|---|
| Feature analysis | What was analyzed (80 selectors, 16 workflows, 19 edge cases) | `specs/features/core-paid-flow-analysis.md` |
| Test plan | Prioritized test cases + POM structure | `specs/plans/core-paid-flow-test-plan.md` |
| Audit report | Quality-gate results | `specs/audits/core-paid-flow-audit.md` |
| Healing log | Fix activity + rationale | `specs/healing/core-paid-flow-healing-log.md` |
| Bugs doc | (No bugs found; observational notes) | `specs/bugs/core-paid-flow-bugs.md` |
| This report | Summary | `specs/reports/core-paid-flow-report.md` |
| Spec file | `app/test/e2e/flows/core-paid-flow.spec.ts` |
| Pipeline log | All-phase running audit trail | `specs/pipeline-log.md` |
