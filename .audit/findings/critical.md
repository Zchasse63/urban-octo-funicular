# Critical Findings

**Synthesizer:** audit-synthesizer
**Date:** 2026-02-24
**Total Critical Findings:** 5

These findings represent blockers — issues that will cause functional failures or material security exposure in production. All critical findings should be resolved before launch.

---

## CRIT-01: All 26 API Routes Are Publicly Accessible With No Authentication

**Layers:** security (2 layers), api-surface, data-model, project-structure
**Corroboration:** 4 independent layers confirmed this finding.

Every API endpoint in PodBrain — including `POST /api/episodes/[id]/process` (triggers paid AI API calls), `DELETE /api/shows/[id]` (destroys user data), and `POST /api/stripe/checkout` (initiates Stripe payment sessions) — is accessible to any unauthenticated HTTP client that knows the URL.

The `validateAuth()` function in `lib/auth.ts` exists and always returns `DEFAULT_USER_ID`. No route handler calls it. No `middleware.ts` file exists. Any person or bot that discovers the API URL can:
- Trigger unlimited episode processing (real AI API cost: ~$0.15 per episode, unbounded)
- Read all transcripts, show notes, and generated assets
- Delete all shows and episodes
- Initiate Stripe checkout sessions for arbitrary price IDs

This is documented as intentional in `CLAUDE.md` ("Auth is DEFERRED") but represents a launch blocker. The schema and `validateAuth()` function are ready for auth integration — this needs to be wired up before the app goes live.

**Resolution:** Implement Supabase Auth session checking. Add `middleware.ts` to protect all routes under `/api/` (excluding `/api/stripe/webhooks` which validates via HMAC). Replace `DEFAULT_USER_ID` with `auth.uid()` at each route boundary.

---

## CRIT-02: Database RLS Policies Are Effectively Disabled on All Core Tables

**Layers:** security, data-model
**Corroboration:** 2 independent layers confirmed this finding.

The initial migration (`0001_initial_schema.sql`) enables Row Level Security on all tables but creates policies with `USING (true)`:

```sql
CREATE POLICY "Allow all operations" ON shows
  FOR ALL USING (true);
```

This means any Supabase client with a valid anon key (which is publicly visible as `NEXT_PUBLIC_SUPABASE_ANON_KEY`) can read and write all rows in all tables. The only protection is the API layer — there is no defense-in-depth at the database level. Tables affected: `users`, `shows`, `episodes`, `episode_sections`, `generated_assets`, `corrections`, `vocabulary_terms`, `hosting_connections`.

Note: The `experts` table added in Phase 6 correctly uses `USING (auth.uid() = user_id)` — this is the pattern the core tables should follow.

**Resolution:** Before adding auth, update policies to `USING (user_id = '00000000-0000-0000-0000-000000000001')` as a temporary measure. After auth is implemented, update to `USING (user_id = auth.uid())`.

---

## CRIT-03: Upload Wizard Audio URL Field Mismatch — Primary Upload Flow Is Broken

**Layers:** api-surface, user-flow (contradiction discovered in synthesis)
**Corroboration:** Identified through cross-layer contradiction analysis.

The upload wizard (`components/upload/upload-wizard.tsx`) reads the audio URL from the upload response as:

```typescript
const audioUrl = uploadData.url || uploadData.data?.url;
```

The upload API route (`app/api/upload/route.ts`) returns:

```json
{ "signedUrl": "...", "publicUrl": "...", "filePath": "...", "fileSize": 123, "mimeType": "audio/mpeg" }
```

Neither `uploadData.url` nor `uploadData.data?.url` exists in this response. The `audioUrl` variable is `undefined` for every upload. When the wizard then calls `POST /api/episodes` with `audio_url: undefined`, the episode is created with no audio URL. When processing is triggered, AssemblyAI receives no audio URL to transcribe.

The error handling in `handleSubmit()` only calls `setIsSubmitting(false)` on failure — no toast, no alert, no visible indication to the user that anything went wrong. The episode appears to be created and the user is redirected to the episode workspace, where processing will silently fail.

**Resolution:**
```typescript
// Change:
const audioUrl = uploadData.url || uploadData.data?.url;
// To:
const audioUrl = uploadData.signedUrl;
```

Add proper error handling in the catch block to display an error message to the user.

---

## CRIT-04: Trigger.dev Job Timeout (30 min) Is Incompatible With 4-Hour Audio Transcription

**Layers:** performance-infra, integration, ai-layer
**Corroboration:** 3 independent layers confirmed this finding.

The `processEpisodeTask` in `trigger/jobs/process-episode.ts` and `trigger.config.ts` set `maxDuration: 1800` (30 minutes). The `TIMEOUTS.transcription` constant in `lib/constants.ts` is `8 * 60 * 60 * 1000` (8 hours). `CLAUDE.md` documents support for 4-hour audio files.

AssemblyAI transcription is not instantaneous — it processes audio at approximately real-time speed or slower for complex audio. A 4-hour podcast can take up to 8 hours to transcribe (as documented in the constants file). The Trigger.dev job will be killed at 30 minutes, leaving the episode in `processing` status with a failed background job. The AssemblyAI SDK's internal polling will be cut off mid-transcription.

This means the documented primary use case (processing 4-hour podcast episodes) will reliably fail in production.

**Resolution:** Restructure the transcription step to use AssemblyAI's webhook callback pattern. When the AssemblyAI transcription is complete, it sends a webhook to `/api/assemblyai/callback` which then continues the processing pipeline. This removes the polling timeout constraint from the Trigger.dev job duration.

---

## CRIT-05: No Rate Limiting Applied to Any API Endpoint Despite Implementation Existing

**Layers:** api-surface, security, performance-infra, integration
**Corroboration:** 4 independent layers confirmed this finding. Classified as critical due to direct AI cost exposure.

`lib/redis/rate-limit.ts` implements a sliding window rate limiter. `lib/constants.ts` defines rate limits (60 req/min default, 10 req/min processing, 30 req/min asset generation). Neither file is imported in any of the 26 API route handlers.

Without rate limiting:
- `POST /api/episodes/[id]/process` can be called unlimited times, each triggering ~$0.10-0.15 in AssemblyAI + xAI API costs
- `POST /api/episodes/[id]/assets` can be called in a loop, generating parallel Grok requests without bound
- An automated scraper can extract all transcripts, show notes, and assets without any throttling

The financial exposure from AI API cost runaway is potentially unlimited. A single malicious actor could run up thousands of dollars in API costs overnight.

**Resolution:** Apply `checkRateLimit(request, 'processing')` in `POST /api/episodes/[id]/process` and `POST /api/episodes/[id]/assets`. Apply `checkRateLimit(request, 'default')` to all other POST/DELETE endpoints. This is a one-line addition per route using the existing implementation.
