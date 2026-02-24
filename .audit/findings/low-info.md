# Low and Informational Findings

**Synthesizer:** audit-synthesizer
**Date:** 2026-02-24
**Total Low Findings:** 14
**Total Info Findings:** 10

Low findings are minor technical debt, code quality improvements, and polish items. They do not block launch but should be addressed during normal development cycles.

Informational findings are strengths, patterns worth noting, or observations without an action item.

---

## Low Findings

### LOW-01: No Content-Security-Policy or Security Headers

**Layer:** security

No `Content-Security-Policy`, `X-Frame-Options`, `X-Content-Type-Options`, or `HSTS` headers are configured. `next.config.ts` has no `headers()` function. These are standard web security headers that reduce XSS impact and clickjacking risk.

**Resolution:** Add a `headers()` configuration to `next.config.ts` with at minimum: `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`. Add a restrictive CSP that allows scripts from the Next.js CDN and blocks inline scripts.

---

### LOW-02: devGuard NODE_ENV Check Can Be Bypassed

**Layer:** security, api-surface

`devGuard()` uses `process.env.NODE_ENV === 'production'` to block dev routes. Non-standard NODE_ENV values (staging, test, qa) bypass this guard. Covered in MED-23 with a resolution.

---

### LOW-03: Missing seo_analyzed_at Timestamp Column

**Layer:** data-model

`episodes.seo_score` is an integer (0-100). `episodes.seo_analysis` is JSONB with the full analysis. Neither column records when the SEO analysis was last performed. Without a timestamp, there is no way to determine if the SEO analysis is stale relative to the episode content.

**Resolution:** Add `seo_analyzed_at TIMESTAMPTZ` column to `episodes`. Update the SEO generation route to populate this column when analysis is stored.

---

### LOW-04: No Soft Deletes on Episodes or Shows

**Layer:** data-model

All tables use hard deletes. `DELETE /api/episodes/[id]` and `DELETE /api/shows/[id]` are permanent. For a content platform where users may accidentally delete processed episodes (with AI-generated content that cost money to produce), soft deletes with a recovery window would be valuable.

**Resolution:** Add `deleted_at TIMESTAMPTZ` to `shows` and `episodes`. Filter `deleted_at IS NULL` in all query functions. Provide a `DELETE /api/episodes/[id]` implementation that sets `deleted_at` instead of performing a hard delete. Add a 30-day hard-delete cleanup job.

---

### LOW-05: Google Fonts Loaded Without preconnect Hint

**Layer:** ui-ux

`globals.css` imports fonts via `@import url('https://fonts.googleapis.com/...')`. Without a `<link rel="preconnect" href="https://fonts.googleapis.com">` in the root layout, the browser must complete DNS resolution and TCP/TLS handshake before the font CSS can begin loading, adding latency to the first render.

**Resolution:** Add to `app/layout.tsx`:
```tsx
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
```
Or move font loading to Next.js `next/font/google` for automatic optimization.

---

### LOW-06: Root Page Redirect May Cause Flash

**Layer:** user-flow

The root `page.tsx` at `/` redirects to `/episodes`. If this is a client-side redirect (`router.push`), users see a brief flash of the unstyled root page before the redirect completes. A server-side redirect is instantaneous.

**Resolution:** In `app/(app)/page.tsx`, use `redirect('/episodes')` from `next/navigation` instead of `router.push()`.

---

### LOW-07: No CORS Headers Configured

**Layer:** api-surface

No CORS headers are set. Currently not a problem in same-origin deployment, but if the API is ever accessed from a mobile app, browser extension, or partner integration, requests will be blocked.

**Resolution:** Add CORS headers via Next.js `headers()` configuration for specific allowed origins, or add a middleware that sets `Access-Control-Allow-Origin` for known origins.

---

### LOW-08: Inconsistent Error Response Shapes

**Layer:** api-surface

Most routes return `{ data: T | null, error: string | null }`. Some simpler routes (e.g., `buzzsprout/connect`) return `{ error: string }` without a `data` field. Client code that assumes `ApiResponse<T>` universally may encounter undefined access errors.

**Resolution:** Audit all route handlers and standardize to the `ApiResponse<T>` shape. The `api/types.ts` file should define this shape and all routes should use the same wrapper function.

---

### LOW-09: Episode Sections Insert Payload May Be Very Large

**Layer:** performance-infra

For a 4-hour podcast, the transcript can produce thousands of `episode_sections` rows. Each row includes a 1536-dimension embedding vector (approximately 12KB of float data per row). A single batch insert of 1000+ rows with embeddings could create a very large request payload. Covered in MED-27 with a batching resolution.

---

### LOW-10: Default Vitest Config Catches Co-located Tests Redundantly

**Layer:** testing-quality

`vitest.config.ts` includes `src/**/*.test.{ts,tsx}` (co-located tests) and `test/**/*.test.{ts,tsx}`. When running `npm test` (default config), the `src/lib/viral-moments/detector.test.ts` test is picked up. When running `npm run test:unit` (unit config with `test/unit/**`), it is not. This asymmetry could cause the co-located test to be counted differently across test runs.

**Resolution:** Remove `src/**/*.test.{ts,tsx}` from `vitest.config.ts` and add `src/lib/viral-moments/detector.test.ts` to `vitest.unit.config.ts` explicitly, or move the test to `test/unit/lib/viral-moments/detector.test.ts`.

---

### LOW-11: Stripe Webhook Idempotency Not Fully Implemented

**Layer:** integration

Stripe can deliver webhook events multiple times. `handleCheckoutCompleted` uses `upsert` (idempotent). `handleSubscriptionUpdated` uses `update`, which could fail idempotently if the record doesn't exist yet. There's no check against a processed `event.id` store.

**Resolution:** Add a `processed_stripe_events` table with `event_id` (unique) and check/insert before processing each event. This prevents duplicate subscription tier changes from re-delivery.

---

### LOW-12: Kokonut Drift Check Runs in CI Against Swiss Broadcast UI

**Layer:** integration

The CI workflow runs `npm run check:kokonut-drift`. The Kokonut UI system was the previous design and has been fully replaced by the Swiss Broadcast design system on `ui-rebuild-v3`. This CI check is testing for consistency with the old design system, which is irrelevant.

**Resolution:** Remove `check:kokonut-drift` from the CI workflow and `package.json` scripts, or update the drift check to validate Swiss Broadcast design tokens instead.

---

### LOW-13: Embedding Dimension Not Validated Before Storage

**Layer:** ai-layer

Before inserting embeddings returned by `createEmbedding()` into Supabase, there is no check that the returned vector has exactly 1536 dimensions. If the embedding model is changed or the API returns an unexpected response, the wrong-dimension vector would be silently stored, corrupting the similarity search index.

**Resolution:** Add an assertion before insertion: `if (embedding.length !== 1536) throw new Error('Unexpected embedding dimension: ' + embedding.length)`.

---

### LOW-14: NEXT_PUBLIC_APP_URL Not Listed in Environment Variables Documentation

**Layer:** (gap identified in synthesis)

`app/layout.tsx` references `process.env.NEXT_PUBLIC_APP_URL` for `metadataBase`. This variable is not listed in the `CLAUDE.md` environment variables section. If not set in production, `metadataBase` defaults to `http://localhost:3000`, making all Open Graph and Twitter Card meta URLs incorrect in search results and social sharing.

**Resolution:** Add `NEXT_PUBLIC_APP_URL=https://getpodbrain.ai` to the environment variables list in `CLAUDE.md`. Ensure this is set in the Netlify environment configuration.

---

## Informational Findings

### INFO-01: Stripe Webhook Implementation Is Correctly Secured

**Layer:** security, integration

`stripe/webhooks/route.ts` correctly uses `request.arrayBuffer()` and `Buffer.from()` for raw body preservation during HMAC verification. This prevents encoding normalization from breaking the signature check. Returns 401 for missing signature and 400 for invalid signature without leaking cryptographic material.

---

### INFO-02: Buzzsprout Credential Encryption Is Production-Grade

**Layer:** security, integration

`lib/buzzsprout/encryption.ts` implements AES-256-GCM with random salt (64 bytes) and IV (16 bytes) per encryption, PBKDF2 key derivation with 100,000 iterations and SHA-256, GCM authentication tag, entropy validation requiring 16+ unique characters in the encryption key, and a versioned encryption format. This is excellent credential storage implementation.

---

### INFO-03: Viral Moments Detector Has Excellent Security Practices

**Layer:** ai-layer

`lib/viral-moments/detector.ts` demonstrates the correct pattern for AI response handling: Zod schema validation with typed output, HTML entity encoding on all AI-returned string fields, maximum response size check (500,000 chars), and Unicode NFC normalization on input. This pattern should be adopted for all AI response paths.

---

### INFO-04: Three-Way Supabase Client Pattern Is Well-Implemented

**Layer:** data-model, security

The browser (anon key), server SSR (anon key + cookie handling), and admin (service role key) clients are correctly separated. The admin client is never exposed to client-side code and is only used server-side for privileged operations. The service role key is not prefixed with `NEXT_PUBLIC_` and is properly scoped.

---

### INFO-05: Test Data Prefix Convention Is Good Practice

**Layer:** testing-quality

All test data uses the `[TEST]` prefix (e.g., `[TEST] Episode API Test Show`). The `cleanupAllTestData()` function deletes rows matching this prefix. This pragmatic approach prevents test data from polluting the development database without requiring a separate test database.

---

### INFO-06: CI/CD Pipeline Structure Is Appropriately Staged

**Layer:** performance-infra

The GitHub Actions pipeline follows a logical order: lint first (fast), unit tests second, build third, deploy only on `main`. Integration and E2E tests are conditionally gated behind `HAS_TEST_SECRETS`. Netlify deploy requires a passing build. The structure is appropriate for an MVP, though tests should become mandatory before launch.

---

### INFO-07: Redis Client Has Graceful Optional Degradation

**Layer:** integration

`lib/redis/client.ts` initializes `redis = url && token ? new Redis({url, token}) : null`. The `isRedisAvailable()` guard allows rate limiting and caching to be skipped gracefully if Redis is not configured. This is correct for development environments where Redis may not be available.

---

### INFO-08: Typography Scale Is Excellent for a Podcast Content Platform

**Layer:** ui-ux

Three typefaces with clear semantic roles: Space Grotesk (headings/UI — modern precision), Source Serif 4 (body text — editorial warmth appropriate for long-form content), JetBrains Mono (metadata/labels — technical precision). The combination is distinctive and well-suited to content-heavy applications.

---

### INFO-09: Playwright Configuration Is Production-Ready

**Layer:** testing-quality

The Playwright E2E configuration uses traces on first retry, screenshots on failure, and video recording on first retry. Single worker is used for database consistency. This configuration gives excellent debugging information when tests fail in CI.

---

### INFO-10: Upload File/URL Tab Toggle Is a Clean UX Pattern

**Layer:** user-flow

The upload wizard's Step 1 toggle between file upload (drag-and-drop) and URL import (paste a link) using the Tabs component is an elegant UX pattern. Both input modes are validated before proceeding to Step 2. This accommodates the two primary ways podcasters source their audio.
