# QA Audit: Third-Party Integrations

**Status:** PASS
**Author:** qa-sentinel (in-process)
**Date:** 2026-04-18
**Audited files:** 7 new test files (57 test cases)

## Verdict

PASS — Test code meets quality standards. Failing tests are revealing
real production gaps (missing SSRF guard), not test-code defects. The
Healer is cleared to proceed with auto-fix.

## Automated Checks
- Type check: PASS (`npx tsc --noEmit` clean)
- Lint: PASS with 1 minor warning (`_token` unused param in a mock
  constructor — purely stylistic, does not block)

## Plan Compliance
- Test cases in plan: 34
- Test cases in code: 57 (some were split finer-grained than planned;
  expansion is within the plan's scope and improves coverage)
- Missing: 0 (all planned scenarios covered)
- Extra: 0 (no scope drift)

## POM / Helper Compliance
No DOM POMs required for this cluster. Helpers deferred — the planned
`WebhookCaptureServer` was not created because the dispatcher tests are
achievable with a `vi.stubGlobal('fetch', …)` mock, which is simpler and
faster. The planned local RSS HTTP server was similarly replaced by
mocked `fetch`. This is a net improvement (fewer moving parts) and
consistent with existing rss-parser test patterns.

## Critical Findings (BLOCK)

None.

## Warnings

### W-1: Unused mock parameter
- **File:** `test/unit/api/buzzsprout-connect-route.test.ts:28`
- **Rule:** `@typescript-eslint/no-unused-vars`
- **Description:** `constructor(_token: string) {}` triggers lint (the
  underscore prefix is not recognized by the project's config).
- **Impact:** None at runtime. Cosmetic.
- **Suggested fix:** Delete the parameter (`constructor() {}`) or cast
  the mock shape differently. Healer may apply if time permits.

### W-2: Fire-and-forget timing
- **File:** `test/unit/lib/webhook-dispatcher-behavior.test.ts`
- **Description:** Uses `await new Promise(r => setImmediate(r))` to
  flush microtasks before asserting. Works reliably, but future maintainers
  should prefer `vi.waitFor(...)` for stricter contracts.
- **Impact:** None — tests pass deterministically.

## Info
- The SSRF tests intentionally fail against the current codebase because
  the `isSafeExternalUrl` helper (and its wiring) does not yet exist.
  The Healer is authorized to create `app/src/lib/security/ssrf-guard.ts`
  and integrate it into (a) the webhook dispatcher, (b) the webhook
  validation schema, and (c) the RSS import route.

## Selector Verification
N/A — no DOM selectors.

## Test Quality Summary
- No `waitForTimeout` anywhere ✓
- No `force: true` ✓
- No hardcoded production credentials ✓
- No `test.only` / `test.skip` ✓
- All tests use web-first/async-flush primitives (`setImmediate`) ✓
- All tests are independent (module re-imported per test via `vi.resetModules()`) ✓
- All external services (Supabase, Buzzsprout, Transistor, fetch) are mocked ✓

## Next Step
Proceed to qa-healer. The Healer MUST implement the SSRF guard module
and wire it into three integration points before the test suite turns
green.
