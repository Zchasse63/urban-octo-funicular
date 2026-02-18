# PodBrain Full-Stack Data Flow & Integration Audit Report

**Date:** 2026-02-18
**Branch:** `main` (post UI rebuild merge)
**Auditor:** Automated deep-reasoning audit (5 parallel agents)

---

## Executive Summary

The PodBrain codebase has a **solid architectural foundation** — well-structured API routes, comprehensive service layer, proper external service integration patterns, and a complete Trigger.dev background job pipeline. However, the audit uncovered **12 critical issues** that will cause runtime failures in production, **11 high-severity issues** that significantly impair functionality, and **18 medium/low issues** that represent type safety gaps or maintenance risks.

The most impactful finding: **the UI layer and API layer have widespread response shape mismatches** — the frontend hooks expect different JSON structures than what the API routes actually return. This affects the upload flow, episode detail page (assets, SEO), guest package page, and processing status polling. These mismatches mean most core features will fail at runtime despite the build compiling successfully.

### Severity Distribution

| Severity | Count | Description |
|----------|-------|-------------|
| 🔴 CRITICAL | 12 | Will cause runtime crashes or total feature failure |
| 🟠 HIGH | 11 | Significantly impairs functionality |
| 🟡 MEDIUM | 10 | Type safety gaps, degraded features |
| 🔵 LOW | 8 | Minor inconsistencies, maintenance risks |

---

## 🔴 CRITICAL Issues (Runtime Failures)

### C1: Upload Response Shape Mismatch — Audio URL Never Captured
**Flow:** Upload → `POST /api/upload` → Frontend
**Files:** `upload/page.tsx:121`, `api/upload/route.ts:78-85`

The API returns `{ success, filePath, signedUrl, publicUrl, fileSize, mimeType }` but the frontend reads `result.data?.url || result.url || ""`. Neither `data.url` nor `url` exist. The `audioUrl` state is always `""`, so episodes are created with no audio URL, and processing fails with "Episode has no audio file."

**Fix:** Change frontend to read `result.publicUrl` or `result.signedUrl`.

---

### C2: Processing Status Polling Shape Mismatch — UI Never Updates
**Flow:** Upload → `GET /api/episodes/[id]/process` → Polling UI
**Files:** `upload/page.tsx:64-83`, `api/episodes/[id]/process/route.ts:197-206`

Frontend expects `{ current_step: "transcribing"|"completed"|..., progress: 0-100 }` but API returns Trigger.dev shapes `{ status: "PENDING"|"EXECUTING"|"COMPLETED"|... }`. Processing steps never update, progress stays at 10%, completion/failure callbacks never fire, and the user is never redirected.

**Fix:** Map Trigger.dev statuses to application-level steps in the GET endpoint, or update frontend to use `data.status`.

---

### C3: Assets Hook Response Parsing — Object Treated as Array
**Flow:** Episode Detail → `GET /api/episodes/[id]/assets` → `use-episode-assets.ts`
**Files:** `use-episode-assets.ts:32`, `api/episodes/[id]/assets/route.ts:74-80`

API returns `{ data: { assets: [...], episodeId: "..." }, error: null }`. Hook does `setAssets(result.data || [])`, storing the whole `{ assets, episodeId }` object. All subsequent `assets.length`, `.filter()`, `.map()` calls will throw TypeError.

**Fix:** Change to `setAssets(result.data?.assets || [])`.

---

### C4: Asset Regeneration Request Body Mismatch
**Flow:** Episode Detail → `POST /api/episodes/[id]/assets`
**Files:** `use-episode-assets.ts:46`, `api/episodes/[id]/assets/route.ts:11-14`

Hook sends `{ asset_types: [assetType] }` but API expects `{ assetType: AssetType, regenerate?: boolean }`. The API reads `body.assetType` which is `undefined`, causing generation to fail.

**Fix:** Change hook to send `{ assetType: type, regenerate: true }`.

---

### C5: SEO Data Shape Mismatch — Tab Always Empty
**Flow:** Episode Detail → `GET /api/episodes/[id]/seo` → `use-episode-seo.ts`
**Files:** `use-episode-seo.ts:6-10`, `api/episodes/[id]/seo/route.ts:11-20`

Hook expects `{ seo_score, seo_analysis, schema_markup }`. API returns `{ analysis: SEOAnalysisResult, schema: PodcastEpisodeSchema, episode: { seo_score } }`. Key names and nesting differ completely. The SEO tab always shows "SEO data will appear here after processing."

**Fix:** Update hook to unwrap `result.data.episode.seo_score`, `result.data.analysis`, `result.data.schema`.

---

### C6: `asset_type` Enum Mismatch — 26+ Types Will Fail on Insert
**Flow:** Asset Generation → `generated_assets` table INSERT
**Files:** `types/database.ts` (36+ types), `0001_initial_schema.sql` (10 enum values), `trigger/jobs/process-episode.ts:354`

The DB enum has 10 values but TypeScript/code uses 36+. The Trigger.dev job inserts `asset_type: asset.assetType` for all generated assets. Any of the 26 extended types (e.g., `episode_titles`, `key_takeaways`, `linkedin_post_host`) will fail with a PostgreSQL enum violation.

**Fix:** Create a migration: `ALTER TYPE asset_type ADD VALUE 'episode_titles'; ...` for each new type, OR switch the column to `TEXT`.

---

### C7: `hosting_connections` Schema Conflict — Buzzsprout Writes to Wrong Columns
**Flow:** Settings → Buzzsprout Connect → `hosting_connections` table
**Files:** `buzzsprout/connect/route.ts:43-49`, `buzzsprout/helpers.ts:14,39`, `0001_initial_schema.sql`, Phase 7 migration

Migration 0001 creates `hosting_connections` with `platform` (enum), `access_token`, `refresh_token`. Phase 7 tries `CREATE TABLE IF NOT EXISTS` with `provider` (text), `credentials` (JSONB), `show_id`, `status` — but this is a no-op. Code writes to `provider`, `credentials`, `show_id`, `status` — all non-existent columns.

**Fix:** Create a migration to ALTER the table to add/rename columns, or update the API code to use the existing schema columns.

---

### C8: Vocabulary Settings — Queries Non-Existent Columns
**Flow:** Settings → Vocabulary Tab → `vocabulary_terms` table
**Files:** `settings/page.tsx:370,394-398`

The settings page SELECTs `definition` and INSERTs `definition` + `user_id` — neither column exists on `vocabulary_terms`. The table has `term`, `alternatives`, `embedding`, `occurrence_count` (no `definition`, no `user_id`).

**Fix:** Remove `definition` and `user_id` from queries. Use `alternatives` for term descriptions, or add a `definition` column via migration.

---

### C9: Guest Package Response Shape Mismatch — Content Never Renders
**Flow:** Guest Package Page → `GET /api/episodes/[id]/guest-package`
**Files:** `guest-package/page.tsx:148-151`, `api/episodes/[id]/guest-package/route.ts`

API wraps response in `{ data: { episode, show, package }, error: null }`. Frontend reads `data.package` and `data.episode?.guest_email` directly from `response.json()` without unwrapping the `data` wrapper. `guestPackage` is always `null`.

**Fix:** Change frontend to read `data.data.package` and `data.data.episode?.guest_email`.

---

### C10: Generate Assets Trigger Job Returns Mock Data
**Flow:** Episode Processing → `generate-assets.ts` Trigger job
**Files:** `trigger/jobs/generate-assets.ts:199-224`

The actual xAI API call is **commented out** and replaced with `getMockAssetContent()`. The entire content multiplication engine (30+ asset types per episode) returns hardcoded placeholder text in production.

**Fix:** Uncomment the actual API call and remove or gate the mock behind `NODE_ENV === 'development'`.

---

### C11: Redis Cache Serialization Asymmetry — Double-Encoding Risk
**Flow:** Any cached data → `redis/cache.ts`
**Files:** `redis/cache.ts` (set/get functions)

`set()` calls `JSON.stringify()` before `redis.setex()`, but Upstash Redis SDK auto-serializes JSON. This causes double-serialization. `get()` does NOT call `JSON.parse()`, relying on Upstash auto-deserialization — but the double-encoded value may come back as a JSON string instead of an object.

**Fix:** Remove `JSON.stringify()` from `set()` (let Upstash handle it), or add `JSON.parse()` to `get()`.

---

### C12: Stripe `PRICING_TIERS` Uses Server-Only Env Vars — Upgrade Buttons Broken
**Flow:** Settings → Billing Tab → `PRICING_TIERS`
**Files:** `lib/stripe/products.ts:32,48`, `settings/page.tsx` billing section

`PRICING_TIERS` reads `process.env.STRIPE_PRO_PRICE_ID` at import time. On the client, non-`NEXT_PUBLIC_` env vars are `undefined`. The `priceId` is always `null` for pro/agency tiers, so upgrade buttons render as "Free Forever" or don't appear.

**Fix:** Make price IDs `NEXT_PUBLIC_` env vars, or send tier name to API and let server resolve the price ID.

---

## 🟠 HIGH Issues (Significantly Impaired Functionality)

### H1: Checkout success_url Points to Non-Existent Route
`success_url: ${APP_URL}/settings/billing?success=true` — but the settings page lives at `/settings?tab=billing`. Route `/settings/billing` will 404.

### H2: Checkout cancel_url Points to Deleted `/pricing` Page
The pricing page was deleted in the UI rebuild. Cancel URL leads to 404.

### H3: `STRIPE_SECRET_KEY` Guard Throws at Module Level
If the env var is missing, the module throws on import, crashing Next.js startup even for pages that don't use Stripe.

### H4: Buzzsprout Connection State Not Persisted on Page Load
IntegrationsTab starts with `isConnected = false` and never fetches existing connection status. Existing connections appear disconnected after refresh.

### H5: Expert Cache RLS Blocks Server-Side Writes
Discovery service uses anon Supabase client, but `experts` table RLS policies check `auth.uid()` which is `null` in single-user mode. Cache reads/writes silently fail, forcing a fresh xAI call every time.

### H6: Supabase `shows` Join May Return Object, Not Array
The API uses `shows!inner(user_id, name)` on a many-to-one FK. Supabase v2 returns a single object for this relationship, but `EpisodeListItem.shows` is typed as an array and accessed via `[0]`. Show names may display as "Unknown Show."

### H7: Episodes Show Filter from URL Ignored
Shows page links to `/episodes?show_id=X` but episodes page initializes `showFilter` with `useState("")` — URL param is never read.

### H8: Missing `subscription_tier` in TypeScript `User` Type
Phase 7 migration adds this column, multiple queries reference it, but the TS `User` interface doesn't include it.

### H9: No TypeScript Interfaces for `subscriptions` or `experts` Tables
Both are queried by application code but have no centralized database type definitions.

### H10: Two Competing API Architecture Patterns
Phase 6 routes use `validateAuth()` + `checkRateLimit()` + `getSupabaseClient()` while core routes use `createClient()` + `DEFAULT_USER_ID` + `shows!inner()`. Different error response formats (`{ data, error }` vs raw objects).

### H11: Assets Download Route Bypasses User Scoping
Uses `createAdminClient()` without checking ownership — any user (when auth is added) could download any episode's assets.

---

## 🟡 MEDIUM Issues

| # | Issue | Location |
|---|-------|----------|
| M1 | `find_similar_sections` RPC function called but never defined in migrations | `lib/cross-episode/similarity.ts:22-29` |
| M2 | Redis client missing env var validation (non-null assertions) | `lib/redis/client.ts` |
| M3 | xAI model name `grok-beta` hardcoded in 7+ locations | Multiple xAI client files |
| M4 | 3 separate xAI client implementations with inconsistent retry logic | `lib/xai/`, `lib/xai-client.ts`, `lib/content/generator.ts` |
| M5 | Dual AssemblyAI implementations (SDK + raw fetch) | `lib/assemblyai/`, `trigger/jobs/transcribe-audio.ts` |
| M6 | No user-scoping on direct Supabase episode fetch | `use-episode.ts:26-31` |
| M7 | Client-side search only filters current page, not full dataset | `use-episodes.ts:49-58` |
| M8 | Vocabulary service layer entirely bypassed by settings UI | `settings/page.tsx` vs `lib/vocabulary/service.ts` |
| M9 | Untyped Supabase clients — no `Database` generic parameter | All 4 Supabase client files |
| M10 | `ContactHints.email` never populated by expert discovery | `lib/experts/discovery.ts` |

---

## 🔵 LOW Issues

| # | Issue | Location |
|---|-------|----------|
| L1 | `episodes.title` DB is NOT NULL but TS type allows null | `types/database.ts:107` |
| L2 | `episodes.audio_url` DB allows null but TS says non-nullable | `types/database.ts:108` |
| L3 | `generated_assets.content` DB allows null but TS says non-nullable | `types/database.ts:170` |
| L4 | Duplicate HNSW index on `episode_sections.embedding` | Phase 6 migration |
| L5 | Shows hook uses array length for total instead of API's `total` field | `use-shows.ts:39` |
| L6 | Test routes (`test-db`, `test-redis`, `test-guest-package`) create data with no cleanup | `api/test-*/route.ts` |
| L7 | Undocumented env vars: `STRIPE_PRO_PRICE_ID`, `STRIPE_AGENCY_PRICE_ID`, `STRIPE_WEBHOOK_SECRET`, `RESEND_FROM_EMAIL`, `ENCRYPTION_SECRET`, `SUPABASE_SERVICE_ROLE_KEY` | `CLAUDE.md` |
| L8 | Idempotency keys with `Date.now()` defeat duplicate protection | `lib/trigger/client.ts` |

---

## What's Working Well ✅

- **Trigger.dev pipeline orchestration** — 4-job chain with proper error handling, status updates, and non-critical failure isolation
- **Stripe webhook verification** — raw body handling, signature validation, retry with exponential backoff
- **Buzzsprout credential encryption** — AES-256-GCM with PBKDF2, versioned format, entropy validation
- **Resend email service** — lazy singleton, retry with backoff, custom error classes, HTML + plain text templates
- **File upload validation** — duplicated at frontend and API layers (defense in depth)
- **Rate limiting** — sliding window on Redis with in-memory fallback
- **All API routes** have try/catch error handling with appropriate HTTP status codes
- **Supabase server client** setup with SSR cookie handling is correct
- **Episode list API** — proper 2-pass pagination with consistent scoping
- **Show creation** — full end-to-end flow with validation, unique constraint handling, 201 status

---

## Recommended Fix Priority

### Phase A: Critical Data Flow Fixes (Unblocks Core Features)
1. Fix upload response shape → enables audio URL capture
2. Fix processing status polling → enables upload completion
3. Fix assets hook parsing → enables episode detail assets tab
4. Fix asset regeneration request body → enables individual asset regeneration
5. Fix SEO hook data mapping → enables SEO analysis tab
6. Fix guest package response unwrapping → enables guest package page
7. Uncomment xAI API call in generate-assets job → enables real AI content

### Phase B: Database Schema Alignment (Unblocks Data Persistence)
8. Migrate `asset_type` enum to include all 36+ types
9. Resolve `hosting_connections` schema conflict
10. Fix vocabulary settings queries (remove `definition`, `user_id`)
11. Add `subscription_tier` to User TS type
12. Create TS interfaces for `subscriptions` and `experts` tables

### Phase C: Integration Fixes (Unblocks Settings & Billing)
13. Fix Stripe `priceId` client-side availability
14. Fix checkout success/cancel URLs
15. Guard Stripe client against missing env vars
16. Add Buzzsprout connection status loading on mount
17. Fix Redis cache serialization

### Phase D: Standardization & Cleanup
18. Standardize all API routes to `ApiResponse<T>` format
19. Consolidate xAI client implementations
20. Add user scoping to assets download route
21. Type Supabase clients with `Database` generic
22. Gate/remove test routes
23. Document all required env vars

---

## Files Audited

| Category | Count |
|----------|-------|
| Frontend pages | 10 |
| Custom hooks | 8 |
| API route files | 25 |
| Service/lib files | 30+ |
| Trigger.dev jobs | 4 |
| Migration files | 3 |
| Type definition files | 4 |
| **Total files read** | **80+** |
