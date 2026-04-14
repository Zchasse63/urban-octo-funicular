# QA Council Pipeline Log

Running log of every QA Council pipeline execution. Newest at top.
Used by the `/qa-council` orchestrator to track phase completion
across sessions and by humans to audit what was tested when.

Format per entry:
```
## {feature-name} — {date}
- Status: PASS / PARTIAL / FAIL
- Tests: N passing / M total
- Bugs: short list with severities
- Files: key artifacts
- Duration: wall-clock (optional)
```

---

## episode-detail — 2026-04-09

- **Status:** PASS ✅
- **Tests:** 8 / 8 passing
- **Bugs:** 0
- **Iterations:** 1 (zero Healer iterations needed)
- **Files:**
  - `specs/features/episode-detail-analysis.md`
  - `specs/plans/episode-detail-test-plan.md`
  - `specs/audits/episode-detail-audit.md`
  - `specs/healing/episode-detail-healing-log.md`
  - `specs/reports/episode-detail-report.md`
  - `app/test/e2e/flows/episode-detail.spec.ts`
  - `app/test/e2e/pages/episode-detail-page.ts`
- **Notes:** Fastest pipeline run to date. Benefited from
  data-testids added earlier in the session and shared helpers.

## upload-wizard — 2026-04-09

- **Status:** PASS ✅ (after bug fix)
- **Tests:** 7 / 7 passing
- **Bugs:**
  - **Bug #1 HIGH:** `CreateEpisodeSchema` rejected `null` for
    optional fields; wizard sent `null` → 400 → silent failure for
    users who skipped Step 2 context. Fixed in `upload-wizard.tsx`
    by changing `|| null` to `|| undefined`.
- **Iterations:** 3 (locator fix → bug fix → tab assertion fix)
- **Files:**
  - `specs/features/upload-wizard-analysis.md`
  - `specs/plans/upload-wizard-test-plan.md`
  - `specs/audits/upload-wizard-audit.md`
  - `specs/healing/upload-wizard-healing-log.md`
  - `specs/bugs/upload-wizard-bugs.md`
  - `specs/reports/upload-wizard-report.md`

## show-creation — 2026-04-09

- **Status:** PASS ✅
- **Tests:** 8 / 8 passing
- **Bugs:** 0 (infrastructure + documentation fixes only)
- **Iterations:** 3 (port collision → POM locator → final pass)
- **Files:**
  - `specs/features/show-creation-analysis.md`
  - `specs/plans/show-creation-test-plan.md`
  - `specs/audits/show-creation-audit.md`
  - `specs/healing/show-creation-healing-log.md`
  - `specs/reports/show-creation-report.md`

## processing-pipeline (partial) — 2026-04-09

- **Status:** PARTIAL — unit-level only, full E2E deferred
- **Tests:** 9 / 9 passing (assemblyai webhook auth only)
- **Bugs:**
  - **Bug #2 HIGH:** `crypto.timingSafeEqual` crashed the
    AssemblyAI webhook handler with a 500 when an attacker or probe
    sent a token of different length than the secret. Fixed in
    `src/app/api/webhooks/assemblyai/route.ts` by checking lengths
    before calling timingSafeEqual.
- **Files:**
  - `app/test/unit/api/assemblyai-webhook-auth.test.ts`
  - `specs/bugs/processing-pipeline-bugs.md`
- **Follow-up:** Full E2E pipeline coverage (Trigger.dev → AssemblyAI
  → Grok → episode completion) still requires either a mocked
  integration test with deterministic fixtures or real API
  credentials in a staging environment. Tracked in Tier 4 of
  `specs/testing-roadmap.md`.
