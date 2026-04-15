# PodBrain Deployment Runbook

**Owner:** Zach
**Last updated:** 2026-04-15
**Companion doc:** [`specs/plans/LAUNCH-PLAN.md`](./LAUNCH-PLAN.md)

## Purpose

This runbook exists because PodBrain is not a single-service app. Every deploy touches 5 deployable surfaces that have to be in the right order or the pipeline breaks. We discovered this the hard way when a smoke test revealed BUG-LP-1 — Trigger.dev had never been deployed and every production upload would silently hang.

**Rule #1:** Every deploy follows this runbook. No ad-hoc pushes to main. No "just merge it and we'll check later."

**Rule #2:** A deploy is not done until `post-deploy-smoke.mjs` reports 🟢 PASSED against the target URL.

---

## The 5 deployable surfaces

| # | Surface | Changes when | Deploy command |
|---|---|---|---|
| 1 | **Supabase schema** | `supabase/migrations/*.sql` added | `supabase db push` or Management API |
| 2 | **Trigger.dev jobs** | `app/src/trigger/**` changed | `cd app && npx trigger.dev deploy` |
| 3 | **Netlify frontend** | `app/src/**` (non-trigger) changed | `git push origin main` (auto-deploys) |
| 4 | **Netlify env vars** | New secrets added | Management API push (see script in runbook) |
| 5 | **External config** (Stripe, Resend, DNS, Supabase Auth) | One-time or rare | Dashboard changes |

**Ordering matters:**
- Migrations must land BEFORE new code that depends on the schema
- Trigger.dev jobs must deploy BEFORE the frontend, so when the new Next.js code dispatches a job, the new version is waiting to process it
- Netlify deploy comes last and is the user-visible cutover

If you skip the ordering, you get LP-1-class bugs: frontend calls a backend that isn't updated, users hit stale error paths, pipeline queues fill with orphaned jobs.

---

## Pre-flight checklist (local, before any deploy)

Run these on the branch you want to ship. Every item must be green.

- [ ] `cd app && npx tsc --noEmit` — clean
- [ ] `cd app && npx vitest run` — all pass
- [ ] `cd app && npx next build` — compiles without errors
- [ ] All edits are committed and pushed to the feature branch
- [ ] The PR has been opened against `main`
- [ ] The PR description lists exactly which of the 5 surfaces need deployment this cycle
- [ ] If this cycle includes schema changes, the migration file(s) are reviewed
- [ ] If this cycle includes new env vars, you know whether they need secret scoping

---

## Deploy sequence (in order — do not skip or reorder)

### Stage 1 — Apply database migrations (ONLY if this cycle has schema changes)

Skip this stage if `git diff main..HEAD -- supabase/migrations/` is empty.

```bash
# From repo root
source /tmp/.pb-sb-env   # loads SUPABASE_ACCESS_TOKEN + SUPABASE_PROJECT_REF

# List current migrations on disk vs applied in prod
ls supabase/migrations/

# Apply any new ones (one of these two paths)
supabase db push                       # if supabase CLI is logged in
# OR use direct SQL via Management API for targeted patches
```

**Gate before Stage 2:** run Supabase security advisor; confirm 0 lints introduced.

```bash
curl -s -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" \
  "https://api.supabase.com/v1/projects/$SUPABASE_PROJECT_REF/advisors?type=security" | \
  python3 -c "import json,sys; d=json.load(sys.stdin); print('security lints:', len(d.get('lints',[])))"
```

### Stage 2 — Deploy Trigger.dev jobs (ONLY if this cycle changes `app/src/trigger/**`)

Skip this stage if `git diff main..HEAD -- app/src/trigger/` is empty.

```bash
cd app
npx trigger.dev@latest deploy
```

Expected output: build succeeds, new version shown as "Current" in dashboard. **DO NOT proceed** if the deploy fails or if the dashboard doesn't show the new version as Current.

**Gate before Stage 3:** dispatch one test task and verify it runs on the new version.

```bash
# Optional but recommended: trigger a canary test via Trigger.dev dashboard or CLI
# to confirm the workers are live before you flip the frontend.
```

### Stage 3 — Push missing env vars to Netlify (ONLY if new secrets added)

Skip this stage if no new env vars. Use the pattern from `specs/reports/launch-readiness-2026-04-15.md` §Netlify environment variable parity.

For each new var:
```bash
source /tmp/.pb-sb-env  # loads NETLIFY_AUTH_TOKEN

ACCOUNT_SLUG=zchasse63
SITE_ID=7bc7e647-b91c-4fbb-b260-211afe95494d
BASE="https://api.netlify.com/api/v1/accounts/${ACCOUNT_SLUG}/env"

# Example — push to all 4 contexts with builds+runtime+post-processing+functions scope
KEY="NEW_VAR"
VAL="the-value"
IS_SECRET=true  # false for NEXT_PUBLIC_* vars

VALUES=$(printf '[{"context":"production","value":"%s"},{"context":"deploy-preview","value":"%s"},{"context":"branch-deploy","value":"%s"},{"context":"dev","value":"%s"}]' "$VAL" "$VAL" "$VAL" "$VAL")
PAYLOAD=$(printf '[{"key":"%s","values":%s,"scopes":["builds","runtime","post-processing","functions"],"is_secret":%s}]' "$KEY" "$VALUES" "$IS_SECRET")
curl -s -X POST -H "Authorization: Bearer $NETLIFY_AUTH_TOKEN" -H "Content-Type: application/json" \
  "${BASE}?site_id=${SITE_ID}" -d "$PAYLOAD"
```

**Gate before Stage 4:** verify the new var shows up in the Netlify env list.

```bash
curl -s -H "Authorization: Bearer $NETLIFY_AUTH_TOKEN" \
  "${BASE}?site_id=${SITE_ID}" | \
  python3 -c "import json,sys; d=json.load(sys.stdin); print('\n'.join(sorted(v['key'] for v in d)))"
```

### Stage 4 — Merge PR to main → Netlify auto-deploy

```bash
# Option A: merge via GitHub UI (recommended — creates PR paper trail)
# Option B: merge locally + push main
# Either way, once main updates, Netlify auto-builds.
```

**Gate before Stage 5:** watch the Netlify build log until green. If the build fails, DO NOT proceed — revert the merge commit and go back to investigate.

### Stage 5 — Run the post-deploy smoke test

```bash
cd app
# Against the Netlify default URL
node scripts/post-deploy-smoke.mjs --mode=reuse --target=https://podbrain.netlify.app

# Or against the custom domain once attached
node scripts/post-deploy-smoke.mjs --mode=reuse --target=https://getpodbrain.ai
```

Expected output: the script prints a summary table with 7+ checks, all `✅`, and exits with code 0.

If ANY check fails: the deploy is NOT done. Follow the rollback procedure below.

### Stage 6 — Watch Sentry for 5 minutes (after H2 wiring is done)

Once Phase H2 is complete, watch the Sentry dashboard for any new errors for 5 minutes after the deploy. Escalating error rate = rollback signal.

Until Sentry is wired up, substitute: tail the Netlify function logs and look for 5xx spikes.

---

## Rollback procedure

If the smoke test fails or errors spike in Sentry:

1. **Revert the merge commit on main**
   ```bash
   git checkout main
   git pull
   git revert -m 1 <merge-commit-sha>
   git push origin main
   ```
   This triggers a new Netlify deploy with the previous code.

2. **Revert Trigger.dev to the previous version** (only if Stage 2 was in this cycle)
   ```bash
   cd app
   # Find the previous version via dashboard — then:
   # (As of Trigger.dev v4, rollback is via the dashboard UI — click the previous
   # version and promote to Current)
   ```

3. **If a migration caused the issue**: write a revert migration and apply it. Do NOT leave the DB in a half-migrated state.

4. **Re-run the smoke test against the rolled-back deploy** — expect it to pass against the previous code.

5. **Post-mortem**: capture what went wrong in `specs/reports/incident-{date}.md` with the failing check, the root cause, and the fix plan. File new bugs in `LAUNCH-PLAN.md` Phase I.

---

## The smoke test script — what it covers

`app/scripts/post-deploy-smoke.mjs` is the only authoritative "is production actually working" signal. Here's what it verifies:

| # | Check | What it proves |
|---|---|---|
| 1 | Landing page loads at `/` | Netlify deploy is live, Next.js boot works |
| 2 | `/login` page renders | Suspense wrapper + useSearchParams didn't crash (BUG #28) |
| 3 | Sign-in succeeds via Supabase auth | Auth is configured, env vars are correct |
| 4 | Real upload → Trigger.dev → completed | Full pipeline works (BUG-LP-1 regression guard) |
| 5 | Show notes has no `[MM:SS](N)` broken markdown | BUG #11 fix is live in generate-show-notes.ts |
| 6 | First segment start is ms-scale < 60000 | BUG #29 fix — segments have ms-based timestamps |
| 7 | ≥ 3 assets in `generated_assets` | BUG #13/14/15 — pipeline writes real assets |
| 8 | RSS tags do NOT contain "localhost" | BUG #20 — production URL fallback works |
| 9 | `audio_duration_seconds` populated | BUG #4 — polling + webhook both write duration |

### Two modes

**`--mode=reuse` (default)** — uses the permanent `live-test@podbrain-test.local` user. Faster (~2-3 min total). Creates a test show + episode, runs the pipeline, cleans up at the end. Best for rapid post-deploy checks.

**`--mode=fresh`** — creates `smoke-{timestamp}@podbrain-test.local`, runs the test, then deletes the user + all related data. Exercises the signup flow too. Use for weekly canaries or before major releases.

### Usage examples

```bash
# Post-deploy check against Netlify default URL (reuse mode is default)
node app/scripts/post-deploy-smoke.mjs --target=https://podbrain.netlify.app

# Fresh user canary (slower but more isolated)
node app/scripts/post-deploy-smoke.mjs --mode=fresh --target=https://getpodbrain.ai

# Against local dev (no --target needed — defaults to localhost:3000)
node app/scripts/post-deploy-smoke.mjs --mode=reuse

# Keep the test data instead of cleaning up (for debugging)
node app/scripts/post-deploy-smoke.mjs --mode=reuse --keep-data

# Custom audio file
node app/scripts/post-deploy-smoke.mjs --mp3 /path/to/other-clip.mp3
```

### Exit codes

- `0` — all checks passed, deploy is verified
- `1` — pre-flight failure (env missing, target unreachable, audio file missing)
- `2` — pipeline failed to complete within max-wait (default 10 min)
- `3` — pipeline completed but one or more regression checks failed

### Flags

| Flag | Default | Description |
|---|---|---|
| `--mode` | `reuse` | `reuse` or `fresh` |
| `--target` | `http://localhost:3000` | Target URL (scheme + host, no trailing slash) |
| `--mp3` | `app/test/fixtures/test-podcast-clip.mp3` | Audio file to upload |
| `--max-wait` | `600` | Max seconds to wait for pipeline completion |
| `--poll` | `5000` | Polling interval in ms |
| `--keep-data` | off | Skip cleanup at the end (useful for debugging) |

---

## What this runbook does NOT yet cover

These are tracked in `LAUNCH-PLAN.md` Phase H and should be added to this runbook when they land:

- [ ] **Custom domain attachment** (Phase H1) — once `getpodbrain.ai` is attached to Netlify, update the default target in this runbook
- [ ] **Sentry wiring** (Phase H2) — once the DSN is set, Stage 6 moves from "watch Netlify function logs" to "watch Sentry error rate"
- [ ] **Resend domain verification** (Phase H3) — add a post-deploy email delivery check to the smoke script
- [ ] **Stripe webhook config** (Phase H5) — add a "send test webhook event from Stripe dashboard" step for deploys that touch billing code
- [ ] **Staging environment** (Level 2 per the session discussion) — allows running the smoke test against a preview URL before merging to main. Not required for launch; nice-to-have for confidence.

---

## Deploy log

Append a short entry here after every production deploy. This is your paper trail.

Format per entry:
```
## {date} — {short commit message}

- Surfaces deployed: {list}
- Smoke test result: ✅ / ❌ (link to script output or inline)
- Rollback: none / happened / url
- Notes: {anything worth remembering}
```

### 2026-04-15 — Round 2 audit fix PR (PR #1)

- **Surfaces deployed:** pending user merge
- **Smoke test result:** pre-merge dev-server run ✅ 8/8 checks (see session transcript)
- **Rollback:** n/a (not yet deployed to prod)
- **Notes:** This runbook itself was created in the same PR. Trigger.dev deploy (Stage 2) is required as the first post-merge action — BUG-LP-1 in LAUNCH-PLAN.md Phase I documents why. Custom domain attachment (Stage 5 default target) is a separate follow-up.
