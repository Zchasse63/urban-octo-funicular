# High Findings

**Synthesizer:** audit-synthesizer
**Date:** 2026-02-24
**Total High Findings:** 17

High severity findings represent significant issues that should be resolved before launch or in the first post-launch sprint. They may not be immediate functional failures, but carry substantial risk of security exposure, data quality degradation, or user-facing errors.

---

## HIGH-01: Using `grok-beta` Model Identifier — Not a Stable API Reference

**Layer:** ai-layer

`lib/xai-client.ts` and `lib/content/generator.ts` both set `DEFAULT_MODEL = 'grok-beta'`. The `grok-beta` identifier refers to a beta model that can be renamed, deprecated, or have its behavior changed by xAI without notice. If xAI retires the `grok-beta` alias, all content generation fails silently with a model-not-found error.

**Resolution:** Pin to a specific versioned model ID (e.g., `grok-2-1212` or whichever stable release xAI provides). Monitor xAI release notes for model deprecation notices.

---

## HIGH-02: No AI Cost Guard — Cost Estimation Function Exists but Is Never Called

**Layer:** ai-layer

`estimateGenerationCost()` in `lib/content/generator.ts` calculates expected API costs per request but is never invoked before triggering generation. With `generateMultipleAssets()` dispatching 30+ Grok requests in parallel via `Promise.all()`, there is no cost ceiling or circuit breaker. For a 4-hour audio file with a large transcript, per-episode AI costs could significantly exceed the documented `$0.15` budget.

**Resolution:** Call `estimateGenerationCost()` before `Promise.all()`. Implement a `MAX_COST_PER_EPISODE` threshold check that aborts generation if the estimate exceeds the budget (or logs a warning for human review).

---

## HIGH-03: Asset Generation Uses JSON.parse Without Schema Validation

**Layer:** ai-layer

`lib/content/generator.ts` calls `JSON.parse(content)` on xAI Grok responses for all 30+ asset types but does not validate the parsed structure against a schema. If Grok returns unexpected fields, missing required fields, or content that fails business rules, it is stored directly in `generated_assets.content` without rejection. The viral moments detector demonstrates the correct pattern: Zod schema validation with typed results.

**Resolution:** Define a `GeneratedAssetSchema` for each asset type (or at minimum, a base schema checking for `content: string` with `minLength`). Apply Zod parsing before database insertion. Return `success: false` for validation failures.

---

## HIGH-04: hosting_connections Schema Conflict Across Migrations

**Layer:** data-model

Phase 1 migration created `hosting_connections` with `platform` (enum: buzzsprout/transistor/podbean), `access_token`, `refresh_token`. Phase 7 migration recreated the table with `provider` (TEXT), `credentials` (JSONB). The schema alignment migration (`20260218000000_schema_alignment.sql`) adds Phase 7 columns conditionally with `IF NOT EXISTS` but does not drop the Phase 1 columns.

The live table likely has both schemas simultaneously: `platform`, `access_token`, `refresh_token`, `provider`, `credentials`, `show_id`, `status`. The application code uses only Phase 7 columns. The old columns are dead weight with potential for confusion and accidental use.

**Resolution:** Write and apply a migration that drops the Phase 1 columns (`platform`, `access_token`, `refresh_token`) and the `hosting_platform` enum, and updates the RLS policies to reference only the Phase 7 schema.

---

## HIGH-05: No Cache Invalidation for Custom Data Hooks

**Layer:** data-model

The 11 custom hooks (`use-episodes.ts`, `use-episode.ts`, `use-shows.ts`, etc.) use plain `fetch()` with no SWR or React Query cache layer. Data is fetched once on component mount and not revalidated automatically. When episode status transitions from `processing` to `completed`, the episode list and episode workspace do not automatically refresh to show the new content. Users must manually reload the page to see processed results.

**Resolution:** Implement polling in `use-episode.ts` for episodes in `processing` state (the `use-polling.ts` hook may already provide this). Alternatively, adopt SWR or React Query with a `revalidateOnFocus` strategy. At minimum, the episode workspace should poll every 5 seconds when `episode.status === 'processing'`.

---

## HIGH-06: Button Component Tests Reference Stale CSS Class Names

**Layers:** testing-quality, ui-ux

`test/unit/components/ui/button.test.tsx` checks for class names from the old Kokonut/shadcn design system: `bg-primary`, `bg-secondary`, `bg-destructive`, `hover:bg-accent`. The Swiss Broadcast Button component uses CSS custom properties: `bg-[var(--color-text-ink)]`, `bg-[var(--color-bg-surface)]`, etc. These tests fail against the current implementation and provide false safety on the `ui-rebuild-v3` branch.

**Resolution:** Update `button.test.tsx` to test the Swiss Broadcast class names, `data-variant` attributes, or use `getByRole` queries that are implementation-agnostic. Remove assertions on internal CSS class names in favor of behavioral assertions.

---

## HIGH-07: No Coverage Thresholds Enforced

**Layer:** testing-quality

`vitest.config.ts` configures coverage reporters but sets no `thresholds` object (no minimum for statements, branches, functions, or lines). Coverage can drop to 0% across critical paths without failing CI. Only 1 of 42 UI components has a unit test. Custom hooks, content generation, and AI client libraries have no unit coverage.

**Resolution:** Set minimum coverage thresholds in `vitest.config.ts`:
```typescript
coverage: {
  thresholds: { statements: 60, branches: 50, functions: 60, lines: 60 }
}
```
Increase these as test coverage improves. Enforce thresholds in CI before merge.

---

## HIGH-08: Missing aria-label on MoreHorizontal Action Button in EpisodeRow

**Layer:** ui-ux

`episode-row.tsx` renders a `<MoreHorizontal>` icon inside a button with no `aria-label` or screen-reader-accessible text. Screen readers announce this as an unnamed "button," providing no information about its purpose.

**Resolution:**
```tsx
<button aria-label="Episode actions" ...>
  <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
</button>
```

---

## HIGH-09: No Episode Title Available During Upload — All Episodes Start as "Untitled"

**Layers:** ui-ux, user-flow, api-surface
**Corroboration:** 3 independent layers confirmed this finding.

The upload wizard (`upload-wizard.tsx`) has 3 steps: file selection, guest context, style selection. None of the 3 steps include a `title` input field. `handleSubmit()` sends `audio_url`, `guest_name`, `guest_bio`, and `metadata` to `POST /api/episodes` but no `title`. `EpisodeRow` falls back to `"Untitled Episode"`.

Every episode uploaded via the wizard starts as "Untitled Episode." There is no post-upload UI to rename the episode within the workspace.

**Resolution:** Add a `title` input field to Step 1 or Step 2 of the upload wizard. Make it optional with a default like "Episode - [date]". Alternatively, add an episode rename inline control to the episode workspace header.

---

## HIGH-10: Upload Error Handling Is Silent — No User Feedback on Failure

**Layer:** user-flow

The `handleSubmit()` catch block in `upload-wizard.tsx` is:
```typescript
} catch (error) {
  setIsSubmitting(false);
}
```

If any API call fails — file upload, episode creation, or processing trigger — the submit button simply reverts from "Processing..." to "Process Episode" with no toast, no error message, and no indication of what failed. Users have no feedback and may re-submit multiple times, compounding errors.

**Resolution:** Import the `toast` utility from sonner (already used in other parts of the app) and call `toast.error()` in the catch block with a descriptive message. Log the error to the console for debugging.

---

## HIGH-11: No Authentication Enforcement at API Route Level (No validateAuth() Calls)

**Layer:** api-surface

Even when authentication is implemented via Supabase Auth, there is no `validateAuth()` call in any route handler. Without explicit per-route auth enforcement or a `middleware.ts` global guard, it is easy for individual routes to be accidentally missed during the auth migration. The `validateAuth()` utility is prepared but unused.

**Resolution:** Add `// TODO: [AUTH] Replace with validateAuth()` comments at the DEFAULT_USER_ID usage sites in each route handler. When implementing auth, use `middleware.ts` as the primary enforcement point (apply to all `/api/*` routes except `/api/stripe/webhooks`).

---

## HIGH-12: UUID Path Parameters Not Validated Before Database Queries

**Layer:** api-surface

Route handlers accept `params.id` and pass it directly to Supabase queries without calling `validateUUID()` from `lib/validation.ts`. A malformed input (e.g., `' OR 1=1'`, `../etc/passwd`, extremely long strings) results in a Supabase error response that may expose internal implementation details. While Supabase parameterized queries prevent SQL injection, consistent validation improves security posture and error quality.

**Resolution:** Add `const validUUID = validateUUID(params.id)` at the top of each route handler that accepts an id parameter. Return 400 immediately for invalid UUIDs.

---

## HIGH-13: Netlify Build Artifacts May Contain .env.local Secrets

**Layer:** security

`app/.netlify/functions-internal/___netlify-server-handler/.env.local` exists on disk. If the `.netlify/` directory is not in `.gitignore`, all environment variables (including `STRIPE_SECRET_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `XAI_API_KEY`, and others) would be committed to the repository.

**Resolution:** Verify `.gitignore` in the `app/` directory excludes `.netlify/`. Run `git status` to confirm the directory is not tracked. Add `**/.netlify/` to the root `.gitignore` if missing.

---

## HIGH-14: show_notes_html Stored From AI Without Verified DOMPurify Sanitization

**Layer:** security

`episodes.show_notes_html` stores Grok-generated HTML. If this HTML is rendered via `dangerouslySetInnerHTML` in `ShowNotesTab.tsx` without calling DOMPurify, XSS is possible through prompt injection: a malicious guest bio or transcript could cause Grok to generate `<script>` tags in the show notes HTML. `isomorphic-dompurify` is installed as a production dependency, indicating this risk was anticipated.

**Gap:** The actual render method in `show-notes-tab.tsx` was not confirmed during audit (see Gap 1 in gaps.md).

**Resolution:** Verify `ShowNotesTab.tsx` calls `DOMPurify.sanitize(episode.show_notes_html)` before passing to `dangerouslySetInnerHTML`. If it does not, add the sanitization call. Also sanitize at storage time in the processing pipeline before writing to the database.

---

## HIGH-15: Pricing Tiers Inconsistent Across Three Sources

**Layers:** integration, data-model, api-surface
**Corroboration:** 3 independent layers confirmed this finding.

Three different definitions of subscription plan limits exist:
- `lib/constants.ts` SUBSCRIPTION_TIERS: Pro = unlimited episodes, 3 shows, 1 seat
- `lib/stripe/products.ts` PRICING_TIERS: Pro = 50 episodes/month, 5 shows
- `CLAUDE.md` documentation: Pro ($19/mo) = unlimited episodes, 3 shows

None of these are enforced at the API level (no route checks episode count before creation). The mismatch means the UI may display incorrect limit information to users.

**Resolution:** Designate a single source of truth (recommend `stripe/products.ts` as it aligns with Stripe price configuration). Update `constants.ts` and `CLAUDE.md` to match. Implement subscription limit checks in `POST /api/episodes` and `POST /api/shows`.

---

## HIGH-16: No HTTP Caching on Any GET Endpoint

**Layer:** performance-infra

All 26 API routes return responses with no `Cache-Control` headers. Read-heavy endpoints like `GET /api/shows`, `GET /api/episodes`, and `GET /api/episodes/[id]/assets` could be cached with short TTLs (30-60 seconds) to reduce Supabase query load without impacting data freshness. Redis is deployed and available for response caching.

**Resolution:** Add `Cache-Control: private, max-age=30` headers to GET endpoints that return stable data (shows list, episode list, assets). Use Redis as an application-level cache for the most expensive operations.

---

## HIGH-17: No Circuit Breaker on External Service Calls

**Layer:** integration

No circuit breaker pattern exists for any external service. If xAI Grok API becomes unavailable, every content generation request will attempt 3 retries with exponential backoff, consuming up to 8 seconds of serverless function time before failing. During an outage, all requests queue up, cascading to function timeouts and 504 errors across the entire application.

**Resolution:** Implement a simple circuit breaker wrapper for xAI API calls. Track consecutive failures in Redis; after N failures, open the circuit and return a cached failure response immediately without attempting the API call. Close the circuit after a cooldown period.
