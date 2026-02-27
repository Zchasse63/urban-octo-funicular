# PodBrain — Continuation Prompt for Next Claude Code Session

Copy and paste the prompt below to start the next Claude Code session.

---

## The Prompt

```
I'm building PodBrain, an AI-powered podcast platform at this directory. Read the CLAUDE.md first to understand the project context.

The entire 8-phase launch roadmap (docs/planning/LAUNCH-ROADMAP.md) has been implemented — 98 items, 48 API routes, 16 pages, 27 components, 17 hooks, 82 lib modules. TypeScript compiles with zero errors. 513 unit/integration tests pass.

BUT: The app has never been run end-to-end with real API keys. Many features were implemented by agents writing code in parallel without runtime verification. Things will be broken.

Your job is to execute the Phase 2 roadmap at docs/planning/PHASE-2-ROADMAP.md. This covers testing, debugging, and launch finalization.

Start with Phase 2.0 — Codebase Audit & Smoke Test:

1. Run `cd app && npm run build` and fix any build errors
2. Start the dev server and systematically verify every page loads
3. Hit key API endpoints and verify response shapes
4. Run all existing tests to confirm baseline: `cd app && npx vitest run`
5. Document every issue you find

Then move through Phase 2.1 (E2E critical paths), 2.2 (integration tests for untested features), and 2.3 (component tests).

Fix bugs as you find them. Write tests as you go. The goal is production-ready.

Key things to know:
- AI model is xAI Grok `grok-4-1-fast` (set in 8 files across the codebase)
- Auth uses Supabase Auth with @supabase/ssr — middleware refreshes sessions
- Taddy API is the podcast data source (GraphQL at api.taddy.org)
- Podcasting 2.0 RSS tags are a key differentiator
- Processing pipeline uses Trigger.dev v4 with AssemblyAI webhook callbacks
- Circuit breaker protects xAI calls
- Stripe handles billing with tier enforcement middleware

Continue working through the entire Phase 2 roadmap until we're 100% production-ready. Don't ask me questions — just work through the plan systematically. If you hit a blocker that requires my input (like API keys), note it and move on to the next item.
```

---

## What the Next Session Should Accomplish

### Session 1: Smoke Test + Build Fix (2-3 hours)
- Run `npm run build` — expect several issues (SSR vs client components, missing env vars at build time, dynamic import issues)
- Navigate every page in browser — find crashes
- Test auth flow (may need real Supabase credentials)
- Fix all build errors
- Document all runtime issues

### Session 2: Critical Path E2E (4-6 hours)
- Test the upload → process → results pipeline with a real short audio file
- Test Stripe checkout with test cards
- Test vocabulary learning loop
- Test guest package email delivery
- Fix data shape mismatches as found

### Session 3: Integration Tests (4-6 hours)
- Write tests for all Phase 7-8 features (Taddy, Podcasting 2.0, RSS, webhooks, team, analytics)
- Get to 80%+ test coverage
- Configure Playwright for E2E tests

### Session 4: Production Deployment (2-3 hours)
- Configure Netlify
- Set up production Supabase project
- Configure all external services
- Deploy and verify

---

## Known Risk Areas

These are the most likely places things will break:

1. **Processing pipeline** — The Trigger.dev → AssemblyAI → xAI chain has never run end-to-end. Webhook URLs, API key configuration, response parsing all untested.

2. **Auth + RLS** — Auth was added retroactively across all 48 routes. Some routes may have inconsistent auth patterns or RLS policies that are too restrictive/permissive.

3. **Stripe billing** — Checkout URLs, webhook event processing, tier enforcement after payment — all implemented but untested with real Stripe events.

4. **Data shape mismatches** — Multiple agents wrote API routes and frontend hooks independently. The response shapes may not match what the frontend expects. This was the #1 bug category in Phase 0.

5. **SSR/Client boundary** — Next.js 16 with React 19 has strict server/client component boundaries. Some components may use browser APIs (`localStorage`, `window`) without proper `'use client'` directives.

6. **Parallel agent artifacts** — Phase 7-8 were built by parallel agents. They may have created duplicate utilities, inconsistent patterns, or files that reference each other in circular ways.

7. **Migration ordering** — 8 migrations that reference each other. Running on a fresh database may hit foreign key or enum conflicts.

---

## Files the Next Session Should Read First

1. `CLAUDE.md` — Full project context (just updated)
2. `docs/planning/PHASE-2-ROADMAP.md` — The roadmap to execute
3. `docs/planning/LAUNCH-ROADMAP.md` — What was built (all checked off)
4. `docs/testing/TEST_STRATEGY.md` — Testing philosophy and current state
5. `docs/design/DATA-FLOW.md` — How data flows through the app
