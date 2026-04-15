# Bugs Discovered — Episodes List (/episodes)

**Feature:** episodes-list
**Discovered by:** live-walkthrough during product-quality audit
**Date:** 2026-04-15
**Dev server:** `next dev` (Turbopack) against Supabase project `itnzbdojxvbhuxnwqgzg`
**Test user:** `live-test@podbrain-test.local` (agency tier, active)

---

## Bug #10 — Failed episodes render as "Draft" in the episode list (data loss / visibility)

**Severity:** HIGH — users have no way to see that a processing job failed.
A "failed" episode is indistinguishable from a pristine draft, so users
re-upload, re-process, or assume the episode is simply unstarted. The
actual failure reason is buried in the episode detail page (and even
there may not be surfaced).

**Symptom:**

1. Pick any episode whose DB `episodes.status = 'failed'`
2. Navigate to `/episodes`
3. In the filter tabs at the top of the list, the episode is counted
   under **Draft**, not under a dedicated **Failed** tab
4. In the row itself, the status pill reads **Draft**

**Evidence:**

Filter tabs from the live snapshot:

```
All / Completed 8 / Processing / Draft 1
```

The single "Draft" episode (`[TEST] NPR News Now - Run 1 (4:40)`) has
`status = 'failed'` in the `episodes` table — confirmed via direct
Supabase admin query:

```
{"title":"[TEST] NPR News Now - Run 1 (4:40)","status":"failed","seo":null,"dur":null,"transcript_len":0}
```

**Root cause:**

`app/src/components/episodes/episode-list.tsx:907` explicitly rewrites
the DB status:

```ts
status: (ep.status === 'failed' || ep.status === 'pending' ? 'draft' : ep.status) as Episode['status'],
```

And the `EpisodeStatus` type at line 14 of the same file only has three
values:

```ts
type EpisodeStatus = 'completed' | 'processing' | 'draft';
```

So the list component is structurally incapable of rendering a `failed`
state.

**Blast radius:**

- Users with failing processing runs see them as "drafts" — they cannot
  distinguish a failed job from a fresh upload.
- The filter tab counters are misleading: `Draft 1` could mean 1 fresh
  upload OR 1 failure OR any mix.
- Re-processing a failed episode goes through the same "draft" path,
  which may or may not correctly retry depending on downstream
  assumptions.
- Analytics over `status = 'failed'` in the dashboard still work
  correctly because they read directly from the DB — only the list UI
  is affected.

**Fix:**

Add `'failed'` to the `EpisodeStatus` union, add a Failed filter tab,
and render a distinct red/destructive pill for failed rows. Also remove
the mapping at line 907. Example:

```ts
// line 14
type EpisodeStatus = 'completed' | 'processing' | 'draft' | 'failed';

// line 907 — delete the ternary, pass through ep.status unchanged
status: ep.status as Episode['status'],

// line 560 — add 'failed' to the filter tab list
{(['', 'completed', 'processing', 'draft', 'failed'] as const).map(...)}
```

Consider also adding a "retry processing" CTA on the failed row since
retry is the obvious next action.

**Status:** DISCOVERED, NOT YET FIXED.

---

## Observation — Older completed episodes show `0:00` duration (stale data, not a bug)

**Severity:** LOW (cosmetic polish, not a live regression)

**Symptom:**

6 of the 9 completed episodes in the `/episodes` list render `0:00` in
the duration column:

```
[TEST] Planet Money 25min          — dur=null → UI "0:00"   (pre-fix stale)
[TEST] Planet Money 19min          — dur=null → UI "0:00"   (pre-fix stale)
[TEST] Bulk NPR News 1/3           — dur=null → UI "0:00"   (pre-fix stale)
[TEST] Bulk NPR News 2/3           — dur=null → UI "0:00"   (pre-fix stale)
[TEST] Bulk NPR News 3/3           — dur=null → UI "0:00"   (pre-fix stale)
[TEST] NPR News Now Run-1 Bucket…  — dur=null → UI "0:00"   (pre-fix stale)
```

These are left over from before `specs/bugs/processing-pipeline-bugs.md#bug-4`
was fixed — the save-processing-results.ts path now writes
`audio_duration_seconds` from the AssemblyAI response (line 175) and
the assemblyai webhook also writes it (route.ts:144).

The `[TEST] Planet Money 25min — fix verification` episode processed
AFTER the fix shows the correct `25:42` duration, confirming the write
path works.

**Fix options (all low priority):**

1. Render `—` or "unavailable" instead of `0:00` when
   `audio_duration_seconds` is null — truthier.
2. One-off backfill script that re-reads each completed episode's
   AssemblyAI transcript JSON for `audio_duration` and updates the row.
3. Do nothing — new episodes will always have a duration, so the
   problem self-heals as stale test data ages out.

**Recommended:** option 1 (render `—`). One line in
`episode-list.tsx:909` and `episode-detail.tsx:2002`.

**Status:** OBSERVED, NOT A REGRESSION. Flagged for polish.

---
