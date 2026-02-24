# Layer Report: Performance & Infrastructure

**Agent:** performance-infra
**Date:** 2026-02-24
**Project:** PodBrain

---

## Summary

PodBrain deploys on Netlify with the `@netlify/plugin-nextjs` adapter, building as a server-side Next.js application. The infrastructure is simple and appropriate for an MVP — no Docker, no Kubernetes, just Netlify + Supabase + Trigger.dev cloud services. The build configuration has one notable issue: Turbopack is disabled for production builds (`TURBOPACK=false`) but Turbopack config is present in `next.config.ts`. Caching strategy is not implemented at the HTTP layer. The processing pipeline correctly uses background jobs for heavy work. Database indexes are well-designed for the query patterns used.

---

## Build Configuration

### next.config.ts

```typescript
const nextConfig: NextConfig = {
  turbopack: {
    root: process.cwd(),
  },
};
```

- **No image optimization configuration** — `next/image` settings not tuned
- **No bundle analyzer** — no bundle size monitoring
- **No `output: 'standalone'`** — not configured for containerized deployments (not needed for Netlify)
- **Turbopack configured but disabled in build script** — `"build": "TURBOPACK=false next build"` disables Turbopack at build time while `next.config.ts` has `turbopack` settings. This is contradictory — the config is dead code.

### Build Script

```json
"build": "TURBOPACK=false next build"
```

Turbopack is disabled for production builds. Next.js defaults to webpack for production. No build-time environment variable injection issues noted.

### Package Size Concerns

| Package | Size Concern |
|---------|-------------|
| `puppeteer` ^24.36.1 | Bundles Chromium (~150MB+). Should not be in production deps if only used for dev tools |
| `@playwright/test` ^1.58.1 | Dev dependency — correctly scoped |
| `motion` ^12.34.2 | Animation library — acceptable for production |

---

## Caching Strategy

### HTTP Caching

No HTTP caching headers are configured in:
- `next.config.ts` (no `headers()` function)
- API route handlers (no `Cache-Control` headers)

All API routes are effectively uncached at the HTTP layer. For a SaaS app with relatively stable data (show lists, episode details), even conservative `Cache-Control: private, max-age=60` headers on GET endpoints would reduce database load.

### Application-Level Caching (Redis)

`lib/redis/cache.ts` and `lib/redis/rate-limit.ts` implement Redis caching. The **only active cache** found is:
- Expert discovery results — 7-day TTL in the `experts` table (database cache, not Redis)

**Redis cache is implemented but not used for API responses.** `isRedisAvailable()` guard is in place for graceful degradation.

### Database Query Caching

No query result caching. Each API request creates a fresh Supabase query. The HNSW indexes on vector columns handle similarity search performance (sub-50ms for 10k+ vectors as documented in migration comments).

---

## Database Query Performance

### Query Patterns Analysis

| Query Pattern | Route | Index Used | Risk |
|--------------|-------|-----------|------|
| `episodes WHERE shows.user_id = ?` | GET /api/episodes | episodes_show_id_status_idx | Low |
| `episodes WHERE show_id = ? ORDER BY created_at DESC` | GET /api/episodes | episodes_show_id_created_at_idx | Low |
| `vocabulary_terms WHERE show_id = ? ORDER BY occurrence_count DESC` | Vocab service | vocabulary_terms_show_id_idx | Low |
| `episode_sections <-> embedding LIMIT 5` | Cross-episode | episode_sections_embedding_hnsw_idx | Low |
| `vocabulary_terms <-> embedding LIMIT ?` | Vocab service | vocabulary_terms_embedding_idx | Low |
| `experts WHERE show_id = ? AND cached_at > ? AND metadata @> ?` | Expert discovery | experts_show_id_idx | Medium — JSONB containment on metadata |

**Potential N+1:** `EpisodeList` fetches all episodes with `shows!inner(user_id, name)` in a single joined query — no N+1 risk here. However, if the episode workspace fetches assets, SEO data, and guest package separately (one request per tab render), multiple parallel requests to the API are made per episode load.

### Missing Pagination

- `getShowVocabulary()` in vocabulary service fetches all vocabulary terms without pagination
- `lib/experts/discovery.ts` fetches up to 20 cached experts (bounded, acceptable)
- Episode sections insert: `results.segments.map(...)` could insert thousands of rows in a single operation for long podcasts — no batching

---

## Infrastructure Architecture

### Hosting: Netlify

```toml
[build]
  base = "app"
  command = "npm run build"
  publish = ".next"

[[plugins]]
  package = "@netlify/plugin-nextjs"
```

- Netlify Next.js plugin handles SSR serverless functions
- No CDN configuration for static assets beyond Netlify's default
- No edge functions configured
- Node.js 20 (matches CI)

### Background Jobs: Trigger.dev v4

Processing pipeline correctly offloaded to Trigger.dev:
- `maxDuration: 1800` (30 minutes) — handles 4-hour audio files
- Global retry: 3 attempts, exponential backoff (1s → 60s max)
- Sub-tasks for transcription, show notes, assets — modular pipeline
- Asset generation failure is non-critical (pipeline continues)

### CI/CD: GitHub Actions

```
Push to main → lint → unit-tests → build → deploy to Netlify
                    ↳ integration-tests (if HAS_TEST_SECRETS=true)
                    ↳ e2e-tests (if HAS_TEST_SECRETS=true)
```

- Integration and E2E tests are **conditionally skipped** unless `vars.HAS_TEST_SECRETS == 'true'`
- This means the CI pipeline on main branch can pass with only lint + unit tests
- Netlify deploy is triggered on push to main (but current branch is `ui-rebuild-v3`, not main)
- Build uses placeholder Supabase values — not production-safe for a real deploy

---

## Performance Bottlenecks

### Processing Pipeline

| Step | Duration | Notes |
|------|----------|-------|
| File upload | < 30 sec | Depends on file size (up to 500MB) |
| AssemblyAI transcription | `<2x audio duration` | 4-hour podcast = max 8 hours (job timeout is 30 min!) |
| Vocabulary processing | < 1 sec | In-memory regex replacement |
| Grok show notes | < 60 sec | Single request |
| SEO analysis | < 100ms | Pure TypeScript |
| Asset generation | Parallel, each < 30 sec | Up to 30+ concurrent Grok requests |
| Database writes | < 5 sec | Bulk inserts for sections/assets |

**Critical finding:** `processEpisodeTask` has `maxDuration: 1800` (30 minutes). The `TIMEOUTS.transcription` constant is `8 * 60 * 60 * 1000` (8 hours). The pipeline documentation says "Support 4-hour audio files" with transcription "< 2x audio duration." A 4-hour podcast transcription could take up to 8 hours, but the Trigger.dev job will timeout at 30 minutes. AssemblyAI SDK's internal polling will be cut off.

### Memory Usage

No server-side rendering of large data sets detected. The transcript is stored in PostgreSQL and retrieved on demand. No buffering of large files in memory (upload uses `file.arrayBuffer()` which is fine for the upload endpoint, but 500MB files could cause memory pressure in serverless functions).

---

## Findings

**FINDING [CRITICAL] — Trigger.dev job maxDuration (30 min) is insufficient for 4-hour audio transcription**
`trigger.config.ts` and `processEpisodeTask` set `maxDuration: 1800` (30 minutes). AssemblyAI transcription of a 4-hour audio file can take up to 8 hours (`TIMEOUTS.transcription = 8 * 60 * 60 * 1000`). The Trigger.dev job will timeout at 30 minutes, leaving the episode in `processing` status with a failed job. The processing pipeline needs to be restructured so the AssemblyAI transcription runs as a webhook-based job (AssemblyAI sends a callback when done) rather than polling within the job.

**FINDING [HIGH] — No HTTP caching on any GET endpoint**
All 26 API routes return no `Cache-Control` headers. Read-heavy endpoints like `GET /api/shows`, `GET /api/episodes`, `GET /api/episodes/[id]/assets` could be cached at the HTTP layer with short TTLs (30-60 seconds) to reduce database load significantly without impacting freshness.

**FINDING [HIGH] — Redis rate limiting implemented but never called**
The rate limiting infrastructure (`lib/redis/rate-limit.ts`, `lib/rate-limit.ts`) is complete but zero API routes invoke it. This is both a performance concern (AI endpoints can be flooded) and a cost concern (unlimited AI API calls).

**FINDING [MEDIUM] — Turbopack configuration present but disabled via environment variable**
`next.config.ts` defines `turbopack: { root: process.cwd() }` but `package.json` build script uses `TURBOPACK=false`. The config is dead code. Either remove the turbopack config or remove the environment variable override.

**FINDING [MEDIUM] — `puppeteer` as a production dependency inflates bundle and Lambda size**
Puppeteer bundles Chromium (~150MB). As a production dependency, it is included in Netlify's serverless function bundle, increasing cold start times and potentially exceeding Netlify's function size limits.

**FINDING [MEDIUM] — No Redis caching for expensive API operations**
Endpoints like `GET /api/episodes/[id]/assets` and `GET /api/shows` query the database on every request. Redis is available (with graceful degradation) but no routes use it for response caching. Expert discovery caches in the database (7-day TTL) but not in Redis.

**FINDING [MEDIUM] — Vocabulary service fetches all terms without pagination**
`getShowVocabulary()` runs `SELECT * FROM vocabulary_terms WHERE show_id = ?` with no `LIMIT`. For a show with thousands of vocabulary terms (the service supports this), this could return a large result set and cause memory pressure in serverless functions.

**FINDING [LOW] — Episode sections inserted one row at a time in a loop**
`saveProcessingResults` maps transcript segments to section rows and calls a single `INSERT` with an array — this is actually a batch insert (good). However, for a 4-hour podcast with thousands of utterance segments, the insert payload could be very large.

**FINDING [INFO] — CI/CD integration and E2E tests are conditionally skipped**
`if: ${{ vars.HAS_TEST_SECRETS == 'true' }}` means the main branch pipeline can ship without running integration or E2E tests if the repository variable is not set. This is understandable during early development but should be mandatory before launch.

---

## Findings Summary

| Severity | Count | Items |
|----------|-------|-------|
| Critical | 1 | Job timeout shorter than max transcription time |
| High | 2 | No HTTP caching, Rate limiting never called |
| Medium | 4 | Turbopack config conflict, puppeteer in prod deps, No Redis caching, Vocabulary fetch unbounded |
| Low | 1 | Episode sections insert payload size |
| Info | 1 | CI/CD integration tests conditionally skipped |
