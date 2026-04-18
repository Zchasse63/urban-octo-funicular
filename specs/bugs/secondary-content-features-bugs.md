# Secondary Content Features — Bug Report

**Feature Slug:** `secondary-content-features`
**Reporter:** qa-healer
**Date:** 2026-04-18

---

## BUG SEC-1: viral_moments column shape inconsistency across write paths

**Severity:** MEDIUM (feature degradation — silently loses soundbite tags from user's RSS feed)
**Status:** Open (routed to follow-up)
**Area:** `app/src/app/api/episodes/[id]/viral-moments/route.ts`, `app/src/app/api/episodes/[id]/rss-tags/route.ts`

### Observed behavior

The `episodes.viral_moments` JSON column is written in two incompatible shapes depending on which code path produced it:

**Shape A (Trigger.dev pipeline — canonical):**
```json
[
  { "id": "...", "text": "...", "start_time": 120, "end_time": 150, "score": 85, ... }
]
```
Produced by `app/src/trigger/jobs/generate-show-notes.ts` line 142 via `grokResponse.viral_moments.map(...)`. Flat array of `ViralMoment` rows in **snake_case** (DB type).

**Shape B (on-demand /viral-moments GET endpoint):**
```json
{
  "viralMoments": [
    { "id": "...", "quote": "...", "startTime": 120, "endTime": 150, "score": 85, ... }
  ],
  "topMoment": { ... }
}
```
Produced by `app/src/app/api/episodes/[id]/viral-moments/route.ts` line 100:
```typescript
await supabase.from('episodes').update({ viral_moments: detectionResult })
```
where `detectionResult` is a `DetectionResponse` — a wrapper object in **camelCase**.

### Downstream impact

`app/src/app/api/episodes/[id]/rss-tags/route.ts` line 267 casts `ep.viral_moments` to `ViralMoment[]`:

```typescript
const normalizedMoments = normalizeViralMoments(
  ep.viral_moments as ViralMoment[] | null
);
```

`normalizeViralMoments()` (lines 64-100) checks `if (!raw || !Array.isArray(raw)) return []`. When the column holds Shape B, `Array.isArray` is false → **all soundbites silently dropped** from the user's RSS feed.

### Reproduction

1. Create an episode with no `viral_moments` in the DB.
2. `GET /api/episodes/:id/viral-moments` (triggers regeneration, writes Shape B to DB).
3. `GET /api/episodes/:id/rss-tags` — response contains `soundbites: []` even though the episode has viral moments.

### Recommended fix

The write in `viral-moments/route.ts` line 100 should be:

```typescript
await supabase
  .from('episodes')
  .update({
    viral_moments: detectionResult.viralMoments.map((m) => ({
      id: m.id,
      text: m.quote,
      start_time: m.startTime,
      end_time: m.endTime,
      score: m.score,
      category: m.category,
      platform_suitability: m.suggestedPlatforms,
    })),
  })
```

This preserves a single canonical on-disk shape (Shape A) so all downstream
readers (`rss-tags`, any future consumers) work consistently. The on-demand
endpoint can still return the `DetectionResponse` wrapper to the client
from the in-memory computation without persisting the wrapper form.

### How the test works around this

`T-106` in `app/test/e2e/flows/secondary-content-features.spec.ts` directly
overwrites the episode's `viral_moments` column with Shape A via the admin
Supabase client before calling `/rss-tags`. This simulates the normal
Trigger.dev pipeline outcome and lets the test exercise the soundbite
generation path end-to-end.

### Launch-blocker assessment

**Not a launch blocker** in the common path: users who process episodes via
the normal upload → Trigger.dev pipeline will have Shape A stored and
everything works. Users who happen to hit the `/viral-moments` endpoint
directly on an unprocessed episode (uncommon flow — typically only fires
from the episode detail page IF the cache is empty) then subsequently
fetch RSS tags will see empty soundbites.

**Route to:** backend / content-generation team for a small one-line
normalize-before-write fix.
