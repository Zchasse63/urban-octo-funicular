# PodBrain Test Strategy - Live-First Approach

## Executive Summary

This document outlines a comprehensive live-first testing strategy for PodBrain. The core principle: **mocks hide bugs, live tests find them**.

---

## Phase 0: Current State Assessment

### Discovered Stack

| Component | Technology |
|-----------|------------|
| Frontend | Next.js 14+ (App Router), TypeScript, Tailwind CSS |
| Backend | Next.js API Routes |
| Database | Supabase (PostgreSQL with pgvector) |
| Auth | **DEFERRED** - single-user mode (DEFAULT_USER_ID) |
| Background Jobs | Trigger.dev v4 |
| Cache | Upstash Redis |
| Payments | Stripe |
| Email | Resend |
| Transcription | AssemblyAI |
| AI Content | xAI Grok |
| Podcast Hosting | Buzzsprout API |

### Current Testing State

```
Test Framework: NONE (1 file uses native node:test)
Test Files Found: 1 (detector.test.ts)
Mocking Libraries: None
Test Database: None
CI Pipeline: None
Coverage: 0%
```

### Database Tables (8)

| Table | Key Purpose |
|-------|-------------|
| users | User accounts (single-user mode) |
| shows | Podcast shows/series |
| vocabulary_terms | Custom vocabulary with embeddings |
| episodes | Episode content and processing state |
| episode_sections | Semantic segments with embeddings |
| generated_assets | AI-generated content assets |
| corrections | User corrections for learning |
| hosting_connections | OAuth connections to platforms |

### API Endpoints (25)

| Endpoint | Methods | Auth | Priority |
|----------|---------|------|----------|
| /api/shows | GET, POST | No (single-user) | HIGH |
| /api/episodes | GET | No | HIGH |
| /api/episodes/[id]/process | POST | No | HIGH |
| /api/episodes/[id]/seo | GET | No | MEDIUM |
| /api/episodes/[id]/assets | GET | No | MEDIUM |
| /api/episodes/[id]/assets/download | GET | No | MEDIUM |
| /api/episodes/[id]/guest-package | GET, POST | No | MEDIUM |
| /api/episodes/[id]/guest-package/download | GET | No | LOW |
| /api/episodes/[id]/guest-intel | GET, POST | No | LOW |
| /api/episodes/[id]/related | GET | No | LOW |
| /api/episodes/[id]/viral-moments | GET, POST | No | MEDIUM |
| /api/shows/[id]/experts | GET | No | LOW |
| /api/shows/[id]/related-episodes | GET | No | LOW |
| /api/stripe/portal | POST | No | HIGH |
| /api/stripe/checkout | POST | No | HIGH |
| /api/stripe/webhooks | POST | No | HIGH |
| /api/buzzsprout/episodes | GET | No | MEDIUM |
| /api/buzzsprout/podcasts | GET | No | MEDIUM |
| /api/buzzsprout/push-notes | POST | No | MEDIUM |
| /api/buzzsprout/connect | POST | No | MEDIUM |
| /api/subscriptions | GET | No | MEDIUM |
| /api/upload | POST | No | HIGH |
| /api/test-db | GET | No | DEBUG |
| /api/test-redis | GET | No | DEBUG |
| /api/test-guest-package | GET | No | DEBUG |

---

## Test Categories

### Category A: MUST Test Live (No Mocking)

- All Supabase database queries and mutations
- All API route handlers
- Form submissions and data validation
- User flows end-to-end
- Component rendering with real API responses
- Route navigation
- State management with real data

### Category B: Use Sandbox/Test Mode

| Service | Test Mode Available | Approach |
|---------|---------------------|----------|
| Stripe | Yes (sk_test_*) | Use test API keys |
| Resend | Yes (test mode) | Use test API key |
| Supabase | Same instance | Isolate test data by markers |

### Category C: Acceptable to Mock (Last Resort)

| What | Why Mock | No Live Alternative |
|------|----------|---------------------|
| Date/Time | Deterministic tests | Time is inherently variable |
| UUIDs | Reproducible tests | Random is inherently variable |
| AssemblyAI | Rate limits + cost | Use recorded responses for unit tests only |
| xAI Grok | Rate limits + cost | Use recorded responses for unit tests only |
| Buzzsprout | No sandbox | Mock only external API calls |

---

## Test Data Strategy

### Real Database, Isolated Test Data

We test against the **same Supabase instance** the app uses. This ensures we're testing:
- Same RLS policies
- Same edge functions
- Same database constraints
- Same triggers

### Test Data Markers

```typescript
// Test data conventions
TEST_EMAIL_PATTERN = /^test-.*@test\.local$/
TEST_USER_PREFIX = '[TEST]'
DEFAULT_TEST_PASSWORD = 'TestPassword123!'

// All test shows/episodes get identifiable names
TEST_SHOW_PREFIX = '[TEST]'
TEST_EPISODE_PREFIX = '[TEST]'
```

### Cleanup Strategy

1. **After each test**: Clean up records created during that test
2. **After test suite**: Clean up all test users (cascades to their data)
3. **Scheduled cleanup**: Delete any test data older than 24 hours

---

## Test Infrastructure

### Directory Structure

```
app/
├── test/
│   ├── setup/
│   │   ├── global-setup.ts      # Start server, setup test DB
│   │   ├── global-teardown.ts   # Clean up test data
│   │   ├── test-env.ts          # Load test environment
│   │   └── database.ts          # Real DB connection helpers
│   ├── utils/
│   │   ├── api-client.ts        # Real HTTP client (no MSW)
│   │   ├── auth-helper.ts       # Test user management
│   │   ├── db-helper.ts         # Direct DB verification
│   │   ├── test-data.ts         # Test data factories
│   │   └── assertions.ts        # Custom assertions
│   ├── fixtures/
│   │   ├── shows.ts             # Test show data
│   │   ├── episodes.ts          # Test episode data
│   │   └── vocabulary.ts        # Test vocabulary data
│   ├── integration/
│   │   ├── api/                 # Live API tests
│   │   │   ├── shows.test.ts
│   │   │   ├── episodes.test.ts
│   │   │   └── stripe.test.ts
│   │   └── db/                  # Live database tests
│   │       ├── shows.test.ts
│   │       └── episodes.test.ts
│   ├── e2e/
│   │   ├── global-setup.ts
│   │   └── flows/
│   │       ├── show-management.spec.ts
│   │       ├── episode-upload.spec.ts
│   │       └── settings.spec.ts
│   └── unit/
│       └── lib/                 # Pure function unit tests
│           ├── seo-analyzer.test.ts
│           └── validation.test.ts
├── vitest.config.ts             # Vitest configuration
└── playwright.config.ts         # Playwright configuration
```

### Framework Stack

| Purpose | Tool | Why |
|---------|------|-----|
| Unit/Integration | Vitest | Fast, modern, TypeScript-native |
| Component | React Testing Library | Test user interactions |
| E2E | Playwright | Cross-browser, reliable |
| HTTP Client | Native fetch | No mocking layer |
| DB Client | Supabase JS | Real queries |

---

## Implementation Phases

### Phase 1: Infrastructure Setup (Now)

- [ ] Install Vitest, RTL, Playwright
- [ ] Create test directory structure
- [ ] Configure vitest.config.ts
- [ ] Configure playwright.config.ts
- [ ] Create database helpers
- [ ] Create API client utilities
- [ ] Add npm scripts

### Phase 2: Database Tests (High Priority)

- [ ] Shows CRUD operations
- [ ] Episodes CRUD operations
- [ ] Vocabulary terms operations
- [ ] Generated assets operations
- [ ] Test data cleanup verification

### Phase 3: API Route Tests (High Priority)

- [ ] GET /api/shows
- [ ] POST /api/shows
- [ ] GET /api/episodes
- [ ] POST /api/upload
- [ ] POST /api/episodes/[id]/process
- [ ] Stripe webhook handling

### Phase 4: Component Tests (Medium Priority)

- [ ] ShowCard component
- [ ] EpisodeList component
- [ ] CreateShowModal component
- [ ] VocabularyList component

### Phase 5: E2E Flow Tests (Medium Priority)

- [ ] Create show flow
- [ ] Upload episode flow
- [ ] View episode details flow
- [ ] Settings and connections flow

### Phase 6: CI/CD Integration

- [ ] GitHub Actions workflow
- [ ] Test parallelization
- [ ] Coverage reporting
- [ ] Scheduled cleanup jobs

---

## Mock Elimination Checklist

### Current Mocks: NONE

The codebase currently has no mocks. This is ideal - we start from a clean slate.

### Mocks to NEVER Add

| Pattern | Why Not |
|---------|---------|
| MSW for API routes | Test real endpoints |
| jest.mock('@/lib/supabase/*') | Test real database |
| Mocked auth context | Use real test users |
| Fake timers for everything | Only mock time when testing time-dependent logic |

### Acceptable Mocks (With Justification)

| Mock | Justification | Alternative |
|------|---------------|-------------|
| Date.now() | Deterministic time assertions | Only in time-sensitive tests |
| crypto.randomUUID() | Reproducible IDs in snapshots | Only in snapshot tests |
| AssemblyAI client | $$ cost per transcription | Use fixtures for unit tests; real for E2E |
| xAI Grok client | $$ cost per generation | Use fixtures for unit tests; real for E2E |

---

## Health Metrics (Target)

| Metric | Current | Target |
|--------|---------|--------|
| Live Test Coverage | 0% | 80% |
| Mock Dependency | 0% | <5% |
| Database Coverage | 0% | 90% |
| API Coverage | 0% | 100% |
| E2E Flow Coverage | 0% | 70% |
| CI Pipeline | No | Yes |

---

## Environment Variables for Testing

```bash
# .env.test (uses REAL Supabase)
NEXT_PUBLIC_SUPABASE_URL=https://[your-project].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[your-anon-key]
SUPABASE_SERVICE_ROLE_KEY=[your-service-key]

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
```

---

## Commands

```bash
# Run all tests
npm test

# Run integration tests only
npm run test:integration

# Run E2E tests
npm run test:e2e

# Run unit tests only
npm run test:unit

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage

# Clean up stale test data
npm run test:cleanup
```
