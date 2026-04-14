# QA Council Report — Upload Wizard

**Feature:** `upload-wizard`
**Date:** 2026-04-09

## TL;DR

**Outcome: ✅ PASS — 7 of 7 tests green after 3 Healer iterations.**
**Real application bug found and fixed: 1 (HIGH severity).**

The Upload Wizard pipeline run was the first one to surface a genuine
production bug: the wizard was sending `null` for empty context fields,
which `CreateEpisodeSchema` rejected with a 400. This would have broken
the upload flow for any user who skipped the optional Step 2 fields (most
first-time users). The bug predated this session and had zero prior test
coverage.

## Tests Produced

| Priority | Planned | Implemented | Passing |
|---|---|---|---|
| **P0** (critical smoke) | 3 | 3 | **3 / 3** ✅ |
| **P1** (important) | 3 | 3 | **3 / 3** ✅ |
| **P2** (nice-to-have) | 2 | 1 | **1 / 1** ✅ |
| **Total** | **8** | **7** | **7 / 7** ✅ |

### Coverage Gaps

- **P2-2 (queue item removal)** was deferred because the remove button
  doesn't have a stable locator without adding a `data-testid` in source.

## Bugs Discovered

### Bug #1 — `null` fields rejected by CreateEpisodeSchema ❗

**Severity:** HIGH — blocked the entire upload flow for users who didn't
fill Step 2 context fields.

**Evidence:** Dev server log during Iteration 2:
```
POST /api/upload 200 in 1903ms
POST /api/episodes 400 in 644ms   ← bug
```

**Root cause:** `upload-wizard.tsx:948-951` posted `description: null`,
`guest_name: null`, `guest_bio: null`. The Zod schema used `.optional()`
which accepts `undefined` but NOT `null`. Zod rejected with 400. The
wizard showed a toast and stranded the user on Step 3.

**Fix:** Changed `|| null` → `|| undefined` in the three offending fields.
Minimum-change fix; no schema changes needed. Committed by the Healer.

**Full write-up:** `specs/bugs/upload-wizard-bugs.md`

**Verification:** P0-3 now navigates to `/episodes/[uuid]` successfully
and verifies the episode row exists in the database with a Supabase
public URL.

## Audit Findings

The Sentinel returned **PASS** with 2 warnings:
- **W1** (P0-3 depends on Trigger.dev dispatch): Unresolved but mitigated
  by asserting against the DB row directly, which is the real contract.
- **W2** (`queueItems()` speculative selector): Unresolved; method is
  unused by the current suite.

## Healing Timeline

| Iteration | Status | Root cause | Fix |
|---|---|---|---|
| 1 | 0/7 pass | POM used wrong button labels: `/^Next/` (real: `Continue to {step}`) and `/^URL$/` (real: `URL Import`). Analyst/Engineer documentation error. | Updated POM with real labels from live page snapshot. |
| 2 | 5/7 pass | **Bug #1** (null → 400) blocked P0-3. P2-1 asserted on a DropZone label that's hidden on the URL tab. | Fixed the wizard (`null` → `undefined`). Rewrote P2-1 to assert on the queue "Ready to process" label which is tab-independent. |
| 3 | **7/7 pass ✅** | — | — |

## Files Created / Modified

### Test artifacts
- `app/test/e2e/flows/upload-wizard.spec.ts` (257 lines)
- `app/test/e2e/pages/upload-wizard-page.ts` (136 lines)

### Application code (bug fix)
- `app/src/components/upload/upload-wizard.tsx` — Changed `|| null` to `|| undefined` for optional context fields (lines 948-951)

### Pipeline artifacts
- `specs/features/upload-wizard-analysis.md`
- `specs/plans/upload-wizard-test-plan.md`
- `specs/audits/upload-wizard-audit.md`
- `specs/healing/upload-wizard-healing-log.md`
- `specs/bugs/upload-wizard-bugs.md` (first non-empty bugs file!)
- `specs/reports/upload-wizard-report.md` (this report)

## Recommendations

1. **Audit all API schemas for `null` vs `undefined` mismatches.** If the
   wizard had this bug, other mutation endpoints probably do too. A
   follow-up task: grep the codebase for `|| null` inside `fetch` JSON
   bodies and cross-reference with the relevant Zod schemas.

2. **Add `data-testid="upload-drop-zone"` and `data-testid="upload-submit"`**
   to stabilize the POM. Text-based locators worked here but required two
   rounds of fixes to the Analyst's selector inventory.

3. **Extract a shared `signIn` helper** to
   `app/test/e2e/helpers/auth.ts`. It's now duplicated across
   `show-creation.spec.ts` and `upload-wizard.spec.ts`. A shared helper
   would also centralize the middleware-redirect handling.

4. **Consider a smaller test fixture MP3.** The current
   `test-podcast-clip.mp3` is 1.3 MB which adds ~2 seconds to each
   uploading test. A 4 KB silent MP3 would make the suite ~10 seconds
   faster.

5. **Run the pipeline on `episode-detail` next.** The other big refactor
   from this session (removing all the Stoicism mock data) has zero e2e
   coverage and could easily regress if someone touches `seo_analysis`
   handling.

## Sign-off

- **Analyst:** ✅ (with one documentation error caught in Healer iteration 1)
- **Architect:** ✅
- **Engineer:** ✅ (with one test-assertion error caught in iteration 2)
- **Sentinel:** ✅ (PASS with 2 warnings)
- **Healer:** ✅ (3 iterations, 1 real bug fixed)
- **Scribe:** ✅ (this report)

**Pipeline status: COMPLETE ✅**
