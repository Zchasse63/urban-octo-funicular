# PodBrain Launch Plan — Remaining Work

**Created:** 2026-04-15
**Owner:** Zach (human) + Claude (AI pair)
**Purpose:** Single source of truth for everything remaining before full production launch. Phased, checkable, scope-locked to prevent the drift that derailed the last two sessions.

**Supersedes as the active plan:**
- `specs/planning/LAUNCH-ROADMAP.md` (historic — all 8 original phases complete)
- `specs/planning/PHASE-2-ROADMAP.md` (historic — replaced by this plan)

**Input docs this plan reads from:**
- `specs/reports/product-quality-audit.md` (round 1 audit)
- `specs/reports/launch-readiness-2026-04-15.md` (round 2 fix summary)
- `specs/bugs/*.md` (individual bug writeups)
- `specs/pipeline-log.md` (qa-council history)

---

## How to use this doc

1. **Work one phase at a time.** Do not skip ahead, do not mix phases.
2. **Check off `- [ ]` items as they complete.** Use `- [x]`.
3. **Respect Entry/Exit criteria.** Do not start a phase until Entry is met. Do not mark a phase complete until Exit is met.
4. **If you discover scope outside the current phase's task list, add it to the `Emergent scope` section of the phase that found it** — then decide in a structured moment (end of phase) whether to slot it into a later phase or defer post-launch. Do NOT fix it inline.
5. **Verification > claim.** Every task must produce a concrete artifact (log line, screenshot path, DB query, test output). "It probably works" is not acceptable.
6. **When in doubt, stop and ask.** Especially for production-affecting actions.

---

## Anti-drift rules

These exist because we have drifted every session so far:

1. **One phase per session**, unless phases are explicitly labeled "can run in parallel with X". If you finish a phase early, STOP and review before starting the next.
2. **No scope creep from "while we're at it"**. If you notice a bug while working on Phase B, add it to `Phase I — Discovered bugs`, don't fix it inline.
3. **No architecture refactors outside a dedicated refactor phase.** Surgical fixes only.
4. **Every code change touching 3+ files requires the architect step** (`feature-dev:code-architect` agent) per global CLAUDE.md.
5. **Every phase ends with the reviewer step** (`feature-dev:code-reviewer` agent) if code changed.
6. **Never skip tests or verification because "it's obvious"**. The last two sessions show us that "obvious" is wrong ~25% of the time.
7. **Production smoke tests are non-negotiable.** Code passing typecheck + unit tests is necessary but not sufficient.

---

## Current state snapshot (as of 2026-04-15)

### What is complete (all verified end-to-end somewhere)
- 22 of 31 documented audit bugs fixed (9 round 1 + 13 round 2)
- 6 production Netlify env vars pushed (NEXT_PUBLIC_APP_URL, Taddy x2, AssemblyAI webhook, encryption, Supabase pub key)
- Supabase Pro upgrade + HIBP password protection
- Supabase security advisors: 7 → 0
- 998/1021 vitest passing, 0 failing
- `next build` clean
- PR [#1](https://github.com/Zchasse63/urban-octo-funicular/pull/1) opened for round 2 fixes

### What is NOT verified (honest gap list)
- **The core audio upload → transcribe → show notes → assets pipeline has never been run end-to-end in any session.** Everything so far is unit tests, manually-inserted DB rows, or dev-server walks.
- Round 1 fixes have not been re-verified in round 2 (they may still work, we don't know)
- 13 feature areas have never been exercised under a real user session
- 0 of 7 qa-council regression pipelines have been run
- 0 of 3 Phase 4 content-quality investigations have been done
- No production smoke test post-deploy

### What is known-broken and open
- **4 MEDIUM bugs open:** #8 (auth secondary), #16 (marketing copy), #23 (Taddy cache RLS security hole — real), #26 (RLS perf debt)
- Custom domain `getpodbrain.ai` NOT attached to Netlify
- `SENTRY_DSN` / `NEXT_PUBLIC_SENTRY_DSN` NOT set in Netlify
- Resend sending domain verification status unknown
- Trigger.dev deployment status in prod unknown
- Stripe webhook endpoint configuration status unknown

---

## Phase dependency map

```
     A (merge + deploy)
     │
     ▼
     B (upload smoke test)  ◄── RISKIEST UNKNOWN
     │
     ├─► C (4 MEDIUM bugs)
     ├─► D (round 1 re-verify)
     ├─► E (8 feature areas)
     └─► H (infra hardening)
                 │
                 ▼
                 F (QA Council x7)   ◄── regression coverage
                 │
                 ▼
                 G (content quality)
                 │
                 ▼
                 J (launch gate)
```

C, D, E, H can run in parallel after B. F depends on all of them being done. G is gated on B. J is gated on everything.

---

## Quick dashboard

Update this table as phases move. `⬜` = not started · `🟡` = in progress · `✅` = done · `🔴` = blocked

| Phase | Title | Status | Gate |
|---|---|---|---|
| A | Merge PR #1 + deploy to prod | ⬜ | user action |
| B | Real upload smoke test in prod | ⬜ | depends on A |
| C | Close 4 open MEDIUM bugs | ⬜ | depends on B |
| D | Re-verify round 1 fixes in prod | ⬜ | depends on B |
| E | Verify 8 untested feature areas | ⬜ | depends on B |
| F | QA Council pipelines (7 features) | ⬜ | depends on C+D+E |
| G | Content quality validation | ⬜ | depends on B |
| H | Infrastructure hardening | ⬜ | depends on A |
| I | Discovered bugs triage | ⬜ | standing |
| J | Final launch gate review | ⬜ | depends on all |

**Minimum viable launch path:** A → B → C (at least #23) → E1 + E2 → H (domain + Sentry + Stripe webhook) → J
**Full confidence path:** A → B → C → D → E → F → G → H → J

---

## Phase A — Merge PR #1 and deploy

**Goal:** Get the 13 round 2 bug fixes live in production.

### Entry criteria
- PR #1 is open (done)
- Tests passing on the branch (done)
- User is ready to ship

### Exit criteria
- PR #1 merged to `main`
- Netlify build completes green
- Landing page loads at `https://podbrain.netlify.app` (or custom domain if attached)
- No console errors on the landing page
- `/login` renders without Suspense/hydration crashes

### Tasks
- [ ] User reviews PR #1 diff on GitHub
- [ ] User clicks Merge (auto-triggers Netlify build)
- [ ] Monitor Netlify build logs — capture the deploy URL
- [ ] Navigate to production URL, confirm landing page renders
- [ ] Check browser console for errors (should be zero)
- [ ] Navigate to `/login` — confirm form renders and no Suspense crash
- [ ] Navigate to `/register` — confirm form renders
- [ ] Navigate to `/forgot-password` — confirm form renders

### Out of scope for Phase A
- Fixing anything new found in prod (→ Phase I)
- Custom domain work (→ Phase H)
- Exercising real upload flow (→ Phase B)
- Testing any tab behind auth (→ Phase B/E)

### Emergent scope discovered during Phase A
*(leave blank until a Phase A session surfaces something)*

---

## Phase B — Real upload smoke test in production ⚠️ RISKIEST

**Goal:** Prove that the core audio → transcribe → generate → display pipeline actually works in production. This is the single biggest unknown in the entire project.

### Entry criteria
- Phase A complete
- Test user credentials work in prod
- A real audio file is available to upload (<5 min, clear speech)
- Trigger.dev dashboard access confirmed

### Exit criteria
- One audio file has been uploaded via `/upload` in prod
- AssemblyAI webhook fired and was accepted
- Trigger.dev job ran and reached `completed` state
- `episodes.status = 'completed'` in production Supabase
- Show Notes tab renders clean timestamps (BUG #11 fix LIVE)
- Transcript tab renders accurate ms-based timestamps (BUG #29 fix LIVE)
- At least 5 generated_assets rows exist for the episode
- Export SRT button downloads a valid SRT file (BUG #30 fix LIVE)

### Tasks
- [ ] Sign in to prod as `live-test@podbrain-test.local`
- [ ] Create a test show if user has none (or use existing)
- [ ] Drop a real audio file on `/upload`, go through all 3 wizard steps
- [ ] Confirm the POST returns 200 and the user is navigated to `/episodes/[id]`
- [ ] Observe the Signal Chain status advance (Upload → Transcribe → Generate → Ready)
- [ ] In parallel: open Trigger.dev dashboard, watch the job execute
- [ ] When episode reaches `completed`, refresh `/episodes/[id]?tab=show-notes`
- [ ] Verify the Show Notes display has NO `[0:53](53)` syntax anywhere
- [ ] Verify the Timestamps section renders as `- **MM:SS** — description` bullets
- [ ] Click `?tab=transcript` — verify first segment timestamp is 00:00 or 00:01 (not 12:00)
- [ ] Verify last segment timestamp matches audio duration (not 25555:50)
- [ ] Click Export SRT — verify a `.srt` file downloads
- [ ] Open the SRT in a text editor — verify valid cue format
- [ ] Click `?tab=assets` — count the Ready badges
- [ ] Query `generated_assets` in Supabase for this episode — count should match visible badges
- [ ] Click Copy on at least one Ready asset — verify content in clipboard is non-empty

### Out of scope for Phase B
- Testing billing flows (→ Phase E2)
- Testing email delivery (→ Phase E3)
- Testing Buzzsprout/Transistor (→ Phase E5)
- Fixing any new bugs (→ Phase I)

### Emergent scope discovered during Phase B
*(leave blank)*

---

## Phase C — Close the 4 open MEDIUM bugs

**Goal:** Clear the known MEDIUM-severity backlog so there are no "hidden" open bugs.

### Entry criteria
- Phase B complete — we know core features work before touching code again

### Exit criteria
- Each of #8, #16, #23, #26 has either `✅ FIXED` status with verification, or explicit `⏸ DEFERRED POST-LAUNCH` with a dated decision note in its bug file.
- Supabase security advisor still shows 0 lints
- Vitest still green
- `next build` still clean

### Tasks

**C1. BUG #23 — Taddy cache RLS `WITH CHECK (true)` security hole** 🔴 HIGH priority
- [ ] Read `specs/bugs/supabase-infra-bugs.md` Bug #23 section
- [ ] Architect (`feature-dev:code-architect` agent) a fix: likely an admin-client refactor in `lib/taddy/cache.ts` so RLS can be scoped to `service_role` only
- [ ] Write a migration that DROPs the `WITH CHECK (true)` policies and replaces with `service_role`-scoped versions
- [ ] Update `lib/taddy/cache.ts` to use the admin client where it writes
- [ ] Apply the migration via `supabase db push` or Management API
- [ ] Re-run security advisor, confirm still 0 lints
- [ ] Run the Taddy discovery flow in prod, confirm it still returns data

**C2. BUG #26 — RLS `auth.uid()` per-row re-eval perf debt**
- [ ] Read `specs/bugs/supabase-infra-bugs.md` Bug #26 section (~20 policies listed)
- [ ] Write a single migration that ALTERs each policy to wrap `auth.uid()` in `(SELECT auth.uid())`
- [ ] Apply the migration
- [ ] Re-run Supabase performance advisor, confirm the warnings are gone

**C3. BUG #8 — Auth pages secondary finding**
- [ ] Read `specs/bugs/auth-pages-bugs.md` Bug #8 section to confirm what it actually is
- [ ] Verify if it's still present in the current code (the Sonner fix may have swept it up)
- [ ] Either fix or mark explicitly as deferred with reason

**C4. BUG #16 — "30+ content assets" marketing vs ~12 visible**
- [ ] Decision needed from user: update marketing copy OR expand UI to more assets OR keep as-is
- [ ] Apply whichever decision was made
- [ ] Mark bug as FIXED or DEFERRED

### Out of scope for Phase C
- Any bug not in this list
- Rebuilding the asset system architecturally
- Adding new asset types

### Emergent scope discovered during Phase C
*(leave blank)*

---

## Phase D — Re-verify round 1 fixes in production

**Goal:** Round 1 landed 9 fixes that were never re-verified in round 2. Confirm they still hold in prod.

### Entry criteria
- Phase B complete (we have a real prod episode to test against)

### Exit criteria
- Every round 1 fix listed below is observed working in production, with a concrete artifact per item (screenshot, query result, advisor output)

### Tasks
- [ ] **BUG #17 (Related Episodes)** — open a prod episode Intelligence tab, verify Related Episodes shows real matches or empty (not fake 50%)
- [ ] **BUG #34 (Experts)** — `/experts` → search "venture capital" → verify real people (not 500 error)
- [ ] **BUG #34b (Search)** — `/search` → search "technology" → verify podcast results render
- [ ] **BUG #36 (Analytics)** — `/analytics` → verify POPULAR ASSET TYPES shows counts, not "0 types"
- [ ] **BUG #27 (find_similar_sections RPC)** — `SELECT proname FROM pg_proc WHERE proname = 'find_similar_sections'` via Management API, confirm exists
- [ ] **BUG #21 (migrations tracking)** — list migrations, confirm all 10 tracked in `supabase_migrations.schema_migrations`
- [ ] **BUG #22 (function search_path)** — security advisor call, confirm no `function_search_path_mutable` lints
- [ ] **BUG #25 (FK indexes)** — performance advisor call, confirm no `unindexed_foreign_keys` lints

### Out of scope for Phase D
- Fixing new issues found (→ Phase I)

### Emergent scope discovered during Phase D
*(leave blank)*

---

## Phase E — Verify 8 untested feature areas

**Goal:** Each of these has been either unverified this session or never verified at all. Prove each works with a concrete real-world test.

### Entry criteria
- Phase B complete

### Exit criteria
- Each of E1-E8 has either ✅ "verified working" with concrete evidence OR 🔴 "bug filed in Phase I" — no "unknown" status remains

### Tasks

**E1. Auth flow (full)**
- [ ] Register a new user with email + password
- [ ] Log in with that user
- [ ] Log out
- [ ] Forgot password → receive email → click link → reset → log in with new password
- [ ] Magic link login
- [ ] (If configured) Google OAuth
- [ ] Clean up the test user after

**E2. Stripe billing (full)**
- [ ] As a free user, open `/settings` → Subscription
- [ ] Click Upgrade → Pro, complete Stripe Checkout (test mode)
- [ ] Verify subscription state updates in the app
- [ ] Query Supabase `subscriptions` table, verify record
- [ ] Open "Manage in Stripe" portal
- [ ] Cancel subscription
- [ ] Verify downgrade state in app
- [ ] Check Stripe dashboard webhook delivery log

**E3. Email delivery (Resend)**
- [ ] Trigger a processing-complete email (Phase B upload should have done this)
- [ ] Check Resend dashboard for delivery status
- [ ] Open the email, click a link inside, verify it resolves

**E4. Guest package end-to-end**
- [ ] Process an episode WITH `guest_name` set
- [ ] Open `/episodes/[id]?tab=guest`
- [ ] Verify all guest package sections render
- [ ] Click "Download ZIP"
- [ ] Extract ZIP locally, verify contents match the tab
- [ ] (If email action exists) trigger "Send to guest" and verify delivery

**E5. Hosting integrations (credentials-dependent)**
- [ ] Buzzsprout: open `/settings` → Integrations → Connect Buzzsprout
- [ ] List Buzzsprout podcasts and episodes
- [ ] Push show notes from a PodBrain episode to Buzzsprout
- [ ] Verify the notes appear in the Buzzsprout dashboard
- [ ] (If TRANSISTOR_API_KEY set) repeat for Transistor

**E6. RSS feed serving + Podcasting 2.0 tags**
- [ ] Navigate to `/api/shows/[id]/rss` in a browser
- [ ] Verify valid XML returned
- [ ] Paste into a podcast validator (e.g., podbase.dev or castfeedvalidator.com)
- [ ] Verify Podcasting 2.0 `<podcast:person>`, `<podcast:transcript>`, `<podcast:chapters>` tags resolve

**E7. Team management**
- [ ] Check if Team tab is visible in `/settings` (note: audit said hidden for launch)
- [ ] If visible: invite a team member, verify email, accept invite, verify member list
- [ ] If hidden: verify the hidden state is intentional and document

**E8. Feature tabs spot-check**
- [ ] Pre-interview intelligence panel (open, verify content loads or graceful empty)
- [ ] A/B test panel (open, verify content or empty state)
- [ ] Viral moments panel (open, verify content or empty state)
- [ ] RSS Tags panel (open, copy the XML, paste into validator)

### Out of scope for Phase E
- Fixing any issues found (→ Phase I)
- Automating these as Playwright tests (→ Phase F)

### Emergent scope discovered during Phase E
*(leave blank)*

---

## Phase F — QA Council regression suites (7 pipelines)

**Goal:** Build automated Playwright regression coverage for the 7 highest-value feature areas. Each pipeline produces check-in-able tests that run in CI.

### Entry criteria
- Phases B, C, D, E complete — we know what "working" looks like and have closed the known bugs before codifying them

### Exit criteria
- All 7 qa-council pipelines complete
- `specs/reports/{feature}-report.md` exists for each
- Playwright tests are committed to the repo and passing in CI

### Rules for this phase
- **One pipeline per session.** Each qa-council spawns ~6 sub-agents (analyst → architect → engineer → sentinel → healer → scribe) and is context-heavy. Do not chain them.
- **If the Sentinel blocks on critical findings, fix them before moving to Healer.** Do not skip past a 🚫 PIPELINE BLOCKED verdict.
- **Run each via `Skill: qa-council`** with the feature name as the argument.

### Tasks (order optimized for highest value first)
- [ ] **F1.** Taddy Discovery Suite (`/experts` + `/search` + pre-interview) — most brittle to external schema drift
- [ ] **F2.** Settings Panel (subscription + integrations + API tabs) — verifies BUG #37 fix
- [ ] **F3.** Vocabulary CRUD — verifies BUG #33 fix
- [ ] **F4.** Analytics dashboard — verifies BUG #36 fix
- [ ] **F5.** Auth pages (login / register / forgot / magic link)
- [ ] **F6.** Guest Package generation + download — incorporates Phase E4 as a fixture
- [ ] **F7.** Landing page conversion funnel

### Out of scope for Phase F
- Fixing bugs outside the scope of each pipeline's target
- Building new features

### Emergent scope discovered during Phase F
*(leave blank)*

---

## Phase G — Content quality validation

**Goal:** Get a real data point on whether PodBrain's generated content is actually good. Use Claude as an LLM judge.

### Entry criteria
- At least one real episode processed in prod (from Phase B)
- `ANTHROPIC_API_KEY` present in env (confirmed in `.env.local`)

### Exit criteria
- `specs/reports/content-quality-grades-{date}.md` exists with per-asset rubric scores
- `specs/reports/seo-honesty-check.md` exists with a bad-content SEO score baseline
- A human decision has been recorded: content quality is or is not good enough to ship

### Tasks
- [ ] Write `app/scripts/grade-artifacts.mjs` — fetches `generated_assets` for an episode, sends each to `claude-sonnet-4-5` with a rubric (accuracy, hallucination, prompt adherence, platform-fit, length), writes JSON scores
- [ ] Run the grader on the Phase B test episode
- [ ] Write the report at `specs/reports/content-quality-grades-{date}.md`
- [ ] Any asset scoring < 6/10 on any dimension → file a bug in Phase I
- [ ] Write `app/scripts/seo-honesty-test.mjs` — creates a junk episode (50 words of nonsense), pushes through the pipeline, checks `episodes.seo_score`
- [ ] Expected: junk content should score < 40. If it scores higher, the SEO analyzer is dishonest — file a bug
- [ ] Write findings to `specs/reports/seo-honesty-check.md`

### Out of scope for Phase G
- Tuning Grok prompts based on findings (that's a follow-up session)
- Regenerating existing test episodes

### Emergent scope discovered during Phase G
*(leave blank)*

---

## Phase H — Infrastructure hardening

**Goal:** Close all remaining infra gaps so production is observable, reachable, and safe.

### Entry criteria
- Phase A complete (app is deployed)

### Exit criteria
- Custom domain serves the app with valid HTTPS
- Error tracking is live and a test error has been captured
- Email sending domain is verified and a test email has been delivered
- Trigger.dev is confirmed connected to prod
- Stripe webhook endpoint is configured and tested

### Tasks

**H1. Custom domain attachment**
- [ ] User: Netlify dashboard → Site → Domain management → Add `getpodbrain.ai`
- [ ] User: update DNS at domain registrar per Netlify's instructions (CNAME or ANAME)
- [ ] Wait for DNS propagation + Let's Encrypt cert issuance
- [ ] Verify HTTPS lock icon at `https://getpodbrain.ai`
- [ ] Re-verify RSS Tags URLs now resolve (BUG #20 end-to-end)

**H2. Sentry error tracking**
- [ ] User: create a Sentry project for PodBrain
- [ ] User: retrieve the DSN
- [ ] Push `SENTRY_DSN` and `NEXT_PUBLIC_SENTRY_DSN` to all 4 Netlify contexts via Management API
- [ ] Trigger a deliberate error in prod (e.g., call a non-existent API route)
- [ ] Verify the error appears in Sentry dashboard

**H3. Resend sending domain**
- [ ] User: check Resend dashboard for `getpodbrain.ai` verification status
- [ ] If unverified: set up SPF, DKIM, DMARC records in DNS
- [ ] Send a test email to a real inbox, verify arrival and DKIM pass

**H4. Trigger.dev production connection**
- [ ] Open Trigger.dev dashboard
- [ ] Confirm the `podbrain` project exists and is on `prod` environment
- [ ] Confirm `TRIGGER_SECRET_KEY` in Netlify env matches the prod environment token
- [ ] Verify the last successful job run timestamp is recent (from Phase B upload)

**H5. Stripe webhook endpoint**
- [ ] Stripe dashboard → Developers → Webhooks
- [ ] Add endpoint: `https://getpodbrain.ai/api/stripe/webhooks`
- [ ] Subscribe to the events used by the app (checkout.session.completed, customer.subscription.*, invoice.*)
- [ ] Copy signing secret, confirm it matches `STRIPE_WEBHOOK_SECRET` in Netlify env
- [ ] Send a test event from Stripe dashboard, verify the app processes it (check logs)

**H6. Production Stripe products + price IDs (if not already)**
- [ ] Stripe dashboard → Products
- [ ] Confirm Pro $19/mo and Agency $49/mo products exist in LIVE mode
- [ ] Confirm price IDs match the values in Netlify env (`STRIPE_PRO_PRICE_ID`, `STRIPE_AGENCY_PRICE_ID`, etc.)
- [ ] If they don't match, update Netlify env vars

### Out of scope for Phase H
- Perf tuning
- CDN / caching optimization
- Database tuning

### Emergent scope discovered during Phase H
*(leave blank)*

---

## Phase I — Discovered bugs backlog

**Goal:** A standing holding area for bugs discovered during Phases B-H. Keep them out of the current phase so they don't derail progress.

### Entry criteria
None — this is a standing backlog.

### Exit criteria
- Each discovered bug is triaged into one of:
  - **P0** — blocks launch, fix now
  - **P1** — fix post-launch week 1
  - **P2** — fix post-launch month 1
  - **P3** — backlog

### Tasks
*(add as discovered)*

**Template for each entry:**
```
### BUG-LP-{N} — {short title}
- **Discovered in:** Phase X, task Y
- **Severity:** P0 / P1 / P2 / P3
- **Evidence:** {screenshot / log / query result}
- **Proposed fix:** {1-2 sentences}
- **Status:** OPEN / FIXING / FIXED / DEFERRED
```

---

### BUG-LP-1 — Trigger.dev worker not deployed / running in any environment
- **Discovered in:** Pre-merge Phase B sanity test (2026-04-15)
- **Severity:** **P0 (blocks launch)** — without an active Trigger.dev worker, the entire audio processing pipeline is frozen; every upload sits indefinitely in `status: 'processing'`
- **Evidence:**
  - First upload attempt `a48a54ae-f382-43e5-a565-654c692614c7` stuck at `step: null, progress: null` for 3+ min with no trigger run metadata changes
  - `ps aux | grep trigger` showed no local `trigger.dev dev` process
  - After starting `npx trigger.dev dev` locally, the SECOND upload `d9d33571-942b-4c7e-ae02-479118a7e5a6` ran to completion in ~2 min (transcribe-audio 2.8s + generate-show-notes 13.3s + generate-assets 1m 8.5s)
- **Root cause:** The Trigger.dev project (`proj_zrzknejolkmpntdfpgiq`) has no deployed version and no `trigger.dev dev` worker attached. Calling `.trigger()` from the API route succeeds (returns a runId) but nothing consumes the queue.
- **Proposed fix:**
  - Dev: user keeps `npx trigger.dev dev` running in a terminal during any session that needs upload testing (or I start it in background with `run_in_background: true`).
  - Prod: run `npx trigger.dev deploy` from `app/` directory to push the compiled jobs to Trigger.dev Cloud BEFORE any production traffic hits the `/api/upload` endpoint.
- **Status:** OPEN — must fix before Phase A merge can safely land OR must be the very first post-merge action in Phase H.

---

### BUG-LP-2 — Asset slug drift round 2: pipeline writes `newsletter`/`tiktok_hook`/`quote_card`, UI expects `newsletter_email` (and has no slots for the latter two)
- **Discovered in:** Pre-merge Phase B smoke test — real pipeline completed with 8 generated_assets rows, only 5 matched UI slots
- **Severity:** **P1** — content is being generated correctly but 3 assets are orphaned in the DB and invisible in the Assets tab. Users will see a "Generate" button on the Newsletter row even though content already exists.
- **Evidence:**
  - DB query shows `generated_assets.asset_type` values: `linkedin_post`, `twitter_thread`, `instagram_carousel`, `newsletter`, `blog_post`, `youtube_description`, `tiktok_hook`, `quote_card`
  - UI `UI_ID_TO_DB_TYPE` map (episode-detail.tsx:1035 post-fix) expects: `linkedin_post`, `twitter_thread`, `instagram_carousel`, **`newsletter_email`**, `blog_post`, `youtube_description`, `seo_description`, `show_notes`, `chapter_markers`, `key_takeaways`, `guest_bio_short`, `guest_promo_kit`
  - Result: header shows "5 of 12 assets generated", Newsletter row shows Generate button despite `generated_assets` row existing
- **Proposed fix options:**
  - **A.** Align the UI map to the pipeline output (change `'newsletter' → 'newsletter'`, add `tiktok_hook` and `quote_card` slots)
  - **B.** Align the pipeline output to the UI map (rename in `asset-prompts.ts` keys)
  - **C.** Structural: replace the `UI_ID_TO_DB_TYPE` map entirely with a single source of truth (asset-types.ts registry) — this was the deferred full fix from the round 2 audit
- **Status:** OPEN — Phase C addition or new Phase C5

---

### BUG-LP-3 — Core content (show_notes, chapter_markers, seo_description, key_takeaways) is never written to `generated_assets` — always shows as "Generate" in Assets tab
- **Discovered in:** Pre-merge Phase B smoke test — Show Notes row shows Generate button despite `episodes.show_notes` having 1937 chars of real content
- **Severity:** **P1** — same class of bug as LP-2 but structurally different. The Assets tab's `assetMap` only reads from `generated_assets`, but the pipeline stores Show Notes, Chapter Markers, Episode Description, and TL;DR Bullets in their own columns on `episodes` (e.g. `show_notes`, `schema_markup.hasPart`, `seo_analysis.description`). Users who click the Show Notes row's Generate button would trigger a redundant regeneration.
- **Evidence:**
  - `episodes.show_notes` length: 1937 chars (verified via DB query)
  - `generated_assets` has 0 rows with `asset_type='show_notes'` for this episode
  - Assets tab shows "Show Notes ... Generate" button
- **Proposed fix:**
  - **A.** Have the Assets tab's `assetMap` also seed from `episodes.show_notes` / `episodes.schema_markup` where applicable
  - **B.** Have the pipeline additionally write these 4 types into `generated_assets` as well as the episode columns (denormalized duplication)
  - **C.** Remove these 4 rows from the Assets tab entirely and direct users to the dedicated Show Notes / Intelligence / RSS Tags tabs instead (simplest)
- **Status:** OPEN — Phase C addition or merge with LP-2

---

### BUG-LP-6 — Production has been returning 500 on every request for multiple commits (pre-existing, caught by first smoke test run)
- **Discovered in:** Stage 5 of DEPLOYMENT-RUNBOOK — the very first run of `post-deploy-smoke.mjs` against `https://podbrain.netlify.app` (2026-04-15, post-PR-#1-merge)
- **Severity:** **P0** — every production request was returning HTTP 500 with an `[ENV FATAL]` error body. The app literally could not boot.
- **Evidence:**
  ```
  HTTP/1.1 500
  An error occurred while loading instrumentation hook: [ENV FATAL] Missing required environment variables:
    - NEXT_PUBLIC_SENTRY_DSN: Sentry client-side DSN — required in prod so client errors are captured
    - SENTRY_DSN: Sentry server-side DSN — required in prod
  ```
- **Root cause:** `app/src/lib/env.ts` marked both Sentry DSNs as `productionOnly: true`, which gets promoted to `required` when `NODE_ENV === 'production'`. The Next.js instrumentation hook calls `validateEnv()` at startup and throws on missing required vars. Since a Sentry project had never been created for PodBrain, neither DSN was in Netlify's env vars, so every cold-start of a Netlify Function threw FATAL and returned 500.
- **Duration of outage:** Uncertain — the check was added in an earlier commit (before this session), and no one had run a smoke test against the deployed URL until round 2's smoke script was built. Looking at the Netlify deploy history, `bb186232` and `79d06407` (previous main commits) also showed `state=ready` (build succeeded) but would have had the same runtime 500 because they too didn't have Sentry DSNs. **Production has probably been 500 for at least 2 prior deploys without anyone noticing.** This is exactly the class of bug the smoke script was designed to catch.
- **Fix applied 2026-04-15:** Changed `productionOnly: true` → removed for both Sentry entries in `env.ts`. Sentry is now "strongly recommended but not enforced" until a Sentry project is created. Added inline comments pointing at this BUG-LP-6 entry so whoever tightens it back later knows why it was loosened.
- **Long-term fix (Phase H2):** Create a real Sentry project, push `NEXT_PUBLIC_SENTRY_DSN` + `SENTRY_DSN` to Netlify env (all 4 contexts), verify Sentry captures a test error, then tighten the env.ts check back to `productionOnly: true` so future deploys without DSNs fail loud again.
- **Takeaway:** The smoke script has already paid for itself. Without it, PodBrain's public launch would have been "ship → watch every user hit a 500 → scramble to diagnose". With it, we caught the outage before a single real user touched the site, and now we have a documented procedure to catch the same class of bug on every future deploy.
- **Status:** ✅ FIXED (code change); 🟡 DEFERRED (real Sentry setup is Phase H2)

---

### BUG-LP-5 — GitHub Actions CI has been red on main for 2+ consecutive commits (pre-existing)
- **Discovered in:** Pre-merge CI check on PR #1 (2026-04-15)
- **Severity:** **P1** — Not a runtime bug, but it means CI is not a reliable pre-flight gate. The project has been shipping despite CI red for multiple commits.
- **Evidence:**
  - Main's last 3 CI runs all failed with the same classes of errors (run 24464020403, 24401002219, 22685074052)
  - PR #1's CI had 8 Lint errors + E2E failures — all 8 Lint errors traced to files/code NOT modified in round 2 (confirmed via targeted eslint run on touched files only)
  - PR #1's CI was actually BETTER than main (Unit Tests now pass; main's Unit Tests failed)
- **Failure classes:**
  - **Lint errors (8)**: `react-hooks/set-state-in-effect`, `react-hooks/static-components`, `react/no-unescaped-entities`, `@typescript-eslint/no-explicit-any` — all in pre-existing code (SuggestionCard icon rendering, terms sync effects, SubscriptionTab effects, QueueItemRow icon, etc.)
  - **E2E failures**: Missing CI env vars (XAI_API_KEY, ASSEMBLYAI_API_KEY, TRIGGER_SECRET_KEY, STRIPE_*) — the CI runner doesn't have production secrets populated, so tests that need real services fail
  - **Unit Tests (main only)**: stale `RELEVANCE → EXACTNESS` assertion in taddy-client.test.ts, FIXED in round 2
- **Proposed fix (two-part):**
  - **Part A — Lint cleanup**: Fix all 8 lint errors as a dedicated focused session. Most are 1-line fixes. The `react-hooks/set-state-in-effect` ones need small refactors (use `useMemo` or move the setState into an event handler). Should be 1-2 hours of scoped work.
  - **Part B — CI env setup**: Either (a) populate GitHub Actions secrets with the required env vars for E2E tests, or (b) split the E2E suite so only the tests that don't need external services run in CI, and the rest run as a scheduled job against the deployed prod environment using `post-deploy-smoke.mjs`.
- **Status:** OPEN — Phase H addition (treat as Phase H6: "Restore CI green gate")
- **Decision on PR #1 merge:** We merged PR #1 on 2026-04-15 despite CI red because:
  1. Local pre-flight was green (tsc, vitest, next build)
  2. All 8 lint errors are pre-existing and not introduced by this PR
  3. Main has been shipping despite CI red for multiple commits already
  4. PR #1 actually improved the state (Unit Tests went from red to green)
  5. The `post-deploy-smoke.mjs` script provides an alternative end-to-end verification gate
- **Why this matters long-term:** Until CI is green, we can't rely on GitHub Actions as an automated pre-merge gate. Every deploy needs the local pre-flight + manual `post-deploy-smoke.mjs` instead. This is sustainable but less efficient — automated CI is the eventual target state.

---

### BUG-LP-4 — Audio duration stored correctly but `transcript_segments` only has 1 segment for a 2:50 monologue
- **Discovered in:** Pre-merge Phase B smoke test
- **Severity:** **P3** (not a regression — expected AssemblyAI behavior on single-speaker audio with no diarization events)
- **Evidence:**
  - `audio_duration_seconds: 170` ✓
  - `jsonb_array_length(transcript_segments): 1`
  - The single segment covers `start: 800, end: 168950` (the entire audio)
- **Analysis:** AssemblyAI produces one utterance per continuous speech block. A 2:50 monologue with no pauses / no speaker change produces 1 segment. This is correct behavior — just means the Transcript tab and SRT export have only one row, which is fine.
- **Status:** OBSERVED, NOT A BUG — confirming as expected behavior.

---

## Phase J — Final launch gate

**Goal:** The unambiguous go/no-go decision before public launch.

### Entry criteria
- Phases A, B, H complete (hard minimum)
- Phase I has zero P0 items
- Either (a) Phase E1+E2 complete OR (b) user accepts partial feature coverage with documented risk

### Exit criteria
- A fresh `specs/reports/launch-readiness-FINAL.md` document exists
- Verdict is unambiguous: GO or NO-GO
- If GO: a launch-day runbook exists at `specs/plans/launch-day-runbook.md` with rollback procedure

### Tasks
- [ ] Re-run full vitest suite — confirm 0 failures
- [ ] Re-run `next build` — confirm clean
- [ ] Re-run Supabase security advisor — confirm 0 lints
- [ ] Re-run Netlify env audit — confirm all required vars present in all 4 contexts
- [ ] Walk every page in prod using the custom domain URL
- [ ] Capture screenshots of each tab for a visual acceptance record
- [ ] Review Phase I — confirm no P0s remain
- [ ] Write `specs/reports/launch-readiness-FINAL.md`
- [ ] Write `specs/plans/launch-day-runbook.md` with:
  - Deployment steps
  - Monitoring checklist (Netlify logs, Sentry, Supabase dashboard, Trigger.dev dashboard)
  - Rollback procedure (git revert + force-redeploy via Netlify)
  - Incident contact list
- [ ] Make the go/no-go call
- [ ] If GO: announce launch
- [ ] If NO-GO: document blockers and return to the appropriate earlier phase

### Out of scope for Phase J
- Any new fixes — return to the phase that needs them
- Feature work

---

## Appendix — Mapping of original audit bugs to phases

For cross-reference between this plan and the bug docs:

| Bug | Title | Phase where resolved |
|---|---|---|
| #6 | xAI embeddings wrong model | ✅ Round 1 (pre-plan) |
| #7 | Sonner hydration auth | (pre-existing, partial) |
| #8 | Auth pages secondary | Phase C3 |
| #9 | CLAUDE.md 7 tabs drift | Low-pri docs fix (not in plan) |
| #10 | Failed-as-draft | ✅ Round 2 |
| #11 | Show Notes timestamps | ✅ Round 2 |
| #13 | Asset slug drift | ✅ Round 2 |
| #14 | Phantom Ready badges | ✅ Round 2 |
| #15 | Asset counter mismatch | ✅ Round 2 |
| #16 | Marketing "30+" vs ~12 | Phase C4 |
| #17 | Related Episodes fake 50% | ✅ Round 1 (re-verify Phase D) |
| #18 | Sidebar decorative dots | ✅ Round 2 |
| #19 | Signal Chain failed | ✅ Round 2 |
| #20 | RSS Tags localhost URLs | ✅ Round 2 + env push |
| #21 | Migrations tracking | ✅ Round 1 (re-verify Phase D) |
| #22 | Function search_path | ✅ Round 1 (re-verify Phase D) |
| #23 | Taddy cache RLS security | **Phase C1** 🔴 |
| #24 | HIBP password protection | ✅ Round 2 (Pro unlocked) |
| #25 | Unindexed FKs | ✅ Round 1 (re-verify Phase D) |
| #26 | RLS auth.uid() per row | Phase C2 |
| #27 | find_similar_sections RPC | ✅ Round 1 (re-verify Phase D) |
| #28 | URL ?tab= desync | ✅ Round 2 |
| #29 | Transcript 1000× | ✅ Round 2 |
| #30 | Export SRT dead | ✅ Round 2 |
| #31 | Whisper + E2E lies | ✅ Round 2 |
| #32 | YouTube/RSS dead import | ✅ Round 2 |
| #33 | Vocab random boost | ✅ Round 2 |
| #34 | Taddy schema drift | ✅ Round 1 (re-verify Phase D) |
| #35 | Grok fallback Zod | Deferred (Taddy is primary, works) |
| #36 | Analytics column typo | ✅ Round 1 (re-verify Phase D) |
| #37 | Fake API & Developer tab | ✅ Round 2 |

---

## Change log for this doc

| Date | Who | Change |
|---|---|---|
| 2026-04-15 | Claude (round 2 session) | Initial creation |

---

*When a phase moves from not-started to in-progress, update its row in the Quick Dashboard and its status header here. When complete, update both places and append a short completion note. This doc is the single source of truth — do not fork it.*
