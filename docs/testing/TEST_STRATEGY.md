# PodBrain Test Strategy

## Current State (Updated 2026-02-27)

### Test Infrastructure

| Component | Technology | Status |
|-----------|-----------|--------|
| Unit/Integration | Vitest + happy-dom | ✅ Configured |
| Component/Hook | @testing-library/react | ✅ Configured |
| E2E | Playwright | ❌ Not yet configured |
| CI Pipeline | GitHub Actions | ✅ Configured |
| Coverage Thresholds | 60% (lines/functions/branches/statements) | ✅ Enforced |

### Current Test Stats

```
Tests:    513 passed, 1 skipped
Files:    22 test files
Coverage: 60% threshold enforced
CI:       lint → typecheck → test → build → deploy
```

### Test File Inventory

**Unit Tests (15 files):**
- `test/unit/components/ui/button.test.tsx` — Button variant rendering
- `test/unit/hooks/utility-hooks.test.ts` — useDebounce, useToast, useKeyboardShortcuts, usePolling (33 tests)
- `test/unit/hooks/data-fetching-hooks.test.ts` — useEpisodes, useShows, useEpisode, useEpisodeAssets, useEpisodeSeo (34 tests)
- `test/unit/hooks/remaining-hooks.test.ts` — useExperts, useVocabulary, useSubscription, useGuestPackage, useAuth, useUsage (47 tests)
- `test/unit/lib/constants.test.ts` — Subscription tier definitions
- `test/unit/lib/errors.test.ts` — Error handling utilities
- `test/unit/lib/schema-generator.test.ts` — JSON-LD schema generation
- `test/unit/lib/seo-analyzer.test.ts` — SEO analysis logic
- `test/unit/lib/utils.test.ts` — General utilities
- `test/unit/lib/validation.test.ts` — Input validation
- `test/unit/fixes/lib-modules.test.ts` — Module export verification
- `test/unit/fixes/phase-a-data-flow.test.ts` — Data flow integrity
- `test/unit/fixes/phase-b-schema.test.ts` — Schema alignment
- `test/unit/fixes/phase-c-integrations.test.ts` — Integration checks
- `test/unit/fixes/phase-d-security.test.ts` — Security patterns

**Integration Tests (17 files):**
- `test/integration/api/` — API route tests (shows, episodes, upload, processing, SEO, guest-package, Stripe, Buzzsprout, subscriptions, data-flow, full-workflow)
- `test/integration/db/` — Database tests (shows, episodes, assets, vocabulary, redis-cache, schema-fixes)

### Stack

| Component | Technology |
|-----------|-----------|
| Frontend | Next.js 16+ (App Router), TypeScript, Tailwind CSS v4 |
| Backend | Next.js API Routes (48 routes) |
| Database | Supabase (PostgreSQL with pgvector) |
| Auth | Supabase Auth with @supabase/ssr |
| Background Jobs | Trigger.dev v4 |
| Cache | Upstash Redis |
| Payments | Stripe |
| Email | Resend |
| Transcription | AssemblyAI (webhook-based) |
| AI Content | xAI Grok (grok-4-1-fast) |
| Podcast Data | Taddy API (GraphQL) |
| Hosting | Buzzsprout API, Transistor API |

---

## Test Philosophy

### Core Principle: Live-First

**Mocks hide bugs, live tests find them.**

- Test against real Supabase instance with isolated test data
- Use Stripe test mode keys for payment flows
- Use recorded responses for expensive AI calls (AssemblyAI, xAI)
- Mock only: Date/time, UUIDs, and rate-limited external APIs

### Test Categories

**Category A: MUST Test Live (No Mocking)**
- All Supabase database queries and mutations
- All API route handlers
- Form submissions and data validation
- User flows end-to-end
- Auth flows (login, register, session management)
- RLS policy enforcement

**Category B: Use Sandbox/Test Mode**

| Service | Test Mode | Approach |
|---------|-----------|----------|
| Stripe | `sk_test_*` | Use test API keys |
| Resend | Test mode | Use test API key |
| Supabase | Same instance | Isolate test data by markers |

**Category C: Acceptable to Mock (Last Resort)**

| What | Why Mock | Notes |
|------|----------|-------|
| Date/Time | Deterministic tests | Only for time-dependent logic |
| UUIDs | Reproducible snapshots | Only in snapshot tests |
| AssemblyAI | Cost per transcription | Use recorded responses |
| xAI Grok | Cost per generation | Use recorded responses |
| Taddy API | Rate limits (100K/mo) | Use cached responses |
| Buzzsprout | No sandbox | Mock external API calls |
| Transistor | No sandbox | Mock external API calls |

---

## What Needs Testing Next

### Priority 1: E2E Critical Path
These are the user journeys that MUST work before launch:

1. **Sign up → Create show → Upload episode → See results**
2. **Processing pipeline end-to-end** (upload → transcribe → generate → complete)
3. **Stripe checkout → Subscription active → Tier enforcement works**
4. **Guest package generation → Email to guest**
5. **Vocabulary learning → Improved accuracy on next episode**

### Priority 2: Integration Tests (Real APIs)
Test with actual API keys in a staging environment:

- AssemblyAI transcription (short audio clip, <2 min)
- xAI Grok content generation (single asset type)
- Stripe checkout + webhook flow
- Taddy search + caching
- Buzzsprout connect + push notes

### Priority 3: New Features (Not Yet Tested)
These features were added in Phases 7-8 and have no test coverage:

- Taddy client, cache, search (`lib/taddy/`)
- Podcasting 2.0 tag generators (`lib/podcasting2/`)
- RSS parser (`lib/rss/parser.ts`)
- Expert discovery (`lib/experts/discovery.ts`)
- Pre-interview intelligence
- Webhook dispatcher (`lib/webhooks/dispatcher.ts`)
- Team management
- Analytics aggregation
- A/B testing
- Schedule management
- Transistor client
- Learning tracker

### Priority 4: Component Tests
Test React components with @testing-library/react:

- Upload wizard (3-step flow)
- Episode detail (7-tab interface)
- Settings page (multiple sections)
- Asset editor (view/edit modes)
- RSS tags panel
- Pre-interview panel

---

## Test Commands

```bash
# Run all tests
cd app && npx vitest run

# Run unit tests only
cd app && npx vitest run --config vitest.unit.config.ts

# Run with coverage
cd app && npx vitest run --coverage

# Type check
cd app && npx tsc --noEmit

# Watch mode
cd app && npx vitest --watch
```

---

## Environment Variables for Testing

```bash
# .env.test (uses REAL Supabase)
NEXT_PUBLIC_SUPABASE_URL=https://[project].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[anon-key]
SUPABASE_SERVICE_ROLE_KEY=[service-key]

# Test server
TEST_API_URL=http://localhost:3000
NODE_ENV=test

# External services - use test mode keys
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
RESEND_API_KEY=re_test_...

# These can be real for E2E, mocked for unit
ASSEMBLYAI_API_KEY=[real-or-mock]
XAI_API_KEY=[real-or-mock]
TADDY_API_KEY=[real-or-mock]
TADDY_USER_ID=[real-or-mock]
```

---

## Health Metrics

| Metric | Current | Target |
|--------|---------|--------|
| Unit Test Coverage | ~60% | 80% |
| Hook Coverage | 17/17 tested | 17/17 |
| API Route Coverage | ~12/48 tested | 48/48 |
| E2E Flow Coverage | 0% | 70% |
| CI Pipeline | ✅ Yes | ✅ Yes |
| Integration Tests | 17 files | 30+ files |
