# Bugs Discovered — Episode Detail (/episodes/[id])

**Feature:** episode-detail
**Discovered by:** live-walkthrough during product-quality audit
**Date:** 2026-04-15
**Dev server:** `next dev` (Turbopack) against Supabase project `itnzbdojxvbhuxnwqgzg`
**Test user:** `live-test@podbrain-test.local` (agency tier, active)
**Episode under test:** `e3e5fc46-a302-4533-af7e-3f714f540712` — `[TEST] Planet Money 25min — fix verification`

---

## Bug #11 — Show-notes timestamps render as broken markdown-link syntax

**Severity:** HIGH — every completed episode ships with broken timestamp
links. Users see literal text like `[0:53](0:53)` and `[2:10](130)` in
the Show Notes tab instead of clickable chapter jumps. The mismatched
format (`0:53` vs `130` seconds as the parenthesized value) also makes
the content look sloppy and AI-generated.

**Symptom:**

Open any completed episode → Show Notes tab → scroll to "Timestamps"
section. Rendered DOM shows:

```
[0:53](0:53) Introduction to Cindy Cordes at Capital Safety...
[2:10](130) Workers' fears over KKR private equity buyout...
[3:50](230) Pete Stavros' backstory and his dad's union battles...
[6:32](392) Launch of Pete's equity-sharing experiment at KKR...
[8:39](519) Sloppy first rollout at Capital Safety...
[11:59](719) Surprise equity payout announcement at Capital Safety...
[14:49](889) Pete admits communication failure (F grade)...
[15:38](938) Evolution to successful model at GSI...
[17:15](1035) Mike Pavelko on how ownership changes mindset...
[19:24](1164) Mike's shocking $250K payout revelation...
[21:21](1281) Business impact: GSI turnover plummets from 50% to 15%...
[23:47](1427) Key to success: Empathetic leaders...
```

The first entry is especially wrong — `(0:53)` instead of `(53)` — so
the model isn't even internally consistent.

**Evidence:**

Queried `episodes.show_notes` (markdown) and `episodes.show_notes_html`
directly. The markdown field stores the literal `[MM:SS](seconds)`
pattern; the HTML renderer preserves it verbatim (no-op) because it's
invalid markdown link syntax (URL is not a URL).

**Root cause:**

`app/src/lib/xai/prompts.ts:31` tells the model:

```
3. TIMESTAMPS
Provide 5-10 key timestamps with brief descriptions of what's discussed at each point.
Format: [MM:SS] - Description
```

Then at line 42-46 it ALSO asks for a pre-rendered markdown field:

```json
{
  "timestamps": [{"time": 120, "description": "..."}],
  ...
  "markdown": "# Show Notes\\n\\n..."
}
```

The model, trying to be helpful, bold-wraps `[MM:SS]` in markdown and
accidentally collapses into link syntax `[label](url)` where it puts
raw seconds as the "url". The JSON `timestamps` array has the correct
structured data (`{time: 120, description: "..."}`) but the rendered
markdown does not use it — the model hallucinates its own rendering.

**Fix:**

Stop asking Grok to pre-render the timestamp markdown. Render it
server-side from the structured `timestamps` array in
`save-processing-results.ts` (or wherever the response is persisted):

```ts
function formatTimestampsMarkdown(timestamps: Array<{ time: number; description: string }>) {
  return timestamps
    .map(t => {
      const mm = Math.floor(t.time / 60);
      const ss = String(t.time % 60).padStart(2, '0');
      return `- **${mm}:${ss}** ${t.description}`;
    })
    .join('\n');
}
```

Then either (a) splice this into the `markdown` field before storing,
overwriting whatever Grok generated, or (b) remove the `markdown`
field from the schema entirely and render in the component layer.

Optional enhancement: make the timestamps actually clickable if the
episode has an audio player with a time parameter:

```ts
`- <a href="#t=${t.time}">**${mm}:${ss}**</a> ${t.description}`
```

**Blast radius:**

Every completed episode rendered through the show-notes pipeline has
broken timestamps. Affects HTML, MD, and TXT exports. The Copy button
will copy broken markdown into whatever the user pastes it into
(Buzzsprout, Transistor, email draft, etc.).

**Status:** DISCOVERED, NOT YET FIXED.

---

## Observation — Episode Detail has 6 tabs, not 7 as documented

**Severity:** LOW (docs drift, not a functional bug)

`CLAUDE.md` claims the episode workspace has a "7-tab interface: Notes,
Assets, Transcript, Guest Package, Intelligence, RSS Tags, +
Pre-Interview in Intelligence tab". The live UI only has 6 tab buttons:

1. Show Notes
2. Assets
3. Transcript
4. Guest Package
5. Intelligence
6. RSS Tags

Pre-Interview is indeed consolidated inside the Intelligence tab (per
the CLAUDE.md note), so the "7-tab" framing is a documentation error.
Fix: update CLAUDE.md to say "6 tabs" or "6 primary tabs with
Pre-Interview nested inside Intelligence".

**Status:** OBSERVED. Low priority.

---

## Bug #17 — Related Episodes feature returned fake 50% matches for every query ⭐ FIXED 2026-04-15

**Severity:** HIGH — the Intelligence tab's "Related Episodes" section
confidently displayed unrelated episodes as "50% similar" to every
episode, for the entire lifetime of the codebase. Users saw legit-looking
cross-episode recommendations that were completely random.

**Symptom:**

Open any completed episode → Intelligence tab → scroll to "Related
Episodes". Displays one or more episodes with a "50%" badge. The matches
are arbitrary — often the same set of episodes regardless of content.

**Evidence (DB-verified 2026-04-15):**

Queried `episode_sections.embedding` across the entire project:

```sql
SELECT COUNT(*) total, COUNT(embedding) with_embedding FROM episode_sections;
→ { total: 604, with_embedding: 0 }
```

**Zero of 604 sections had embeddings.** And `pg_proc` had no
`find_similar_sections` function:

```sql
SELECT proname FROM pg_proc WHERE proname = 'find_similar_sections';
→ [] (empty)
```

**Four-layer root cause:**

1. **Wrong embedding model:** `lib/cross-episode/embeddings.ts` originally
   called xAI's `grok-embedding-small` model — which has never existed
   (xAI has no embeddings API). Every embedding call failed, tripping the
   circuit breaker. Fixed in a prior commit to use OpenAI
   `text-embedding-3-small`. See `specs/bugs/processing-pipeline-bugs.md#bug-6`.
2. **No OPENAI_API_KEY in env:** The fixed code still threw because the
   key wasn't set, so embeddings stayed NULL in all 604 rows. Fixed
   2026-04-15 by writing `OPENAI_API_KEY` to `app/.env.local` and pushing
   it to Netlify prod + deploy-preview + branch-deploy contexts.
3. **`find_similar_sections` RPC missing from DB:** The code has been
   calling `supabase.rpc('find_similar_sections', ...)` since day one,
   but the function was never written into any migration. Every call
   returned an error, triggering the fallback path. Fixed 2026-04-15 by
   migration `supabase/migrations/20260415000000_find_similar_sections_rpc.sql`.
4. **Fallback lied instead of returning empty:**
   `lib/cross-episode/similarity.ts:32-50` fell through to "return 10
   arbitrary non-matching sections with a hardcoded `similarity: 0.5`"
   whenever the RPC errored. Users saw "Related Episodes at 50%" that
   had zero semantic relationship to the source. Fixed 2026-04-15 by
   replacing the fallback with `return []`.

**Fix verification (2026-04-15):**

After applying all four layers of the fix, ran an end-to-end similarity
query against the Planet Money test episode:

```sql
SELECT f.episode_id, ROUND(f.similarity::numeric, 4) AS similarity
FROM find_similar_sections(
  (SELECT embedding FROM episode_sections
    WHERE episode_id = 'e3e5fc46-a302-4533-af7e-3f714f540712'
      AND embedding IS NOT NULL LIMIT 1),
  0.3::float, 5,
  'e3e5fc46-a302-4533-af7e-3f714f540712'::uuid
) f ORDER BY f.similarity DESC;
```

Result:

| episode_id | similarity |
|---|---|
| 54aa4fbf-d336-423e-a0e6-f304e7b50948 | 1.0000 |
| 54aa4fbf-d336-423e-a0e6-f304e7b50948 | 1.0000 |
| 54aa4fbf-d336-423e-a0e6-f304e7b50948 | 0.4468 |
| 54aa4fbf-d336-423e-a0e6-f304e7b50948 | 0.4468 |
| 54aa4fbf-d336-423e-a0e6-f304e7b50948 | 0.3599 |

All five matches are legitimate pgvector cosine-similarity results. The
1.0000 matches are expected because the two test episodes reprocess the
same Planet Money source audio. The 0.4468 and 0.3599 matches correspond
to semantically related content about engagement scores and business
metrics. **This is the first time the Related Episodes feature has ever
returned real data.**

**Backfill cost:** 604 embeddings generated via OpenAI
`text-embedding-3-small`, total 24,018 tokens, **$0.00048**. Ran
`node app/scripts/backfill-embeddings.mjs`. 100% success rate, 0 NULL
remaining.

**Status:** ✅ **FIXED 2026-04-15**. Migration + backfill applied to
production Supabase, env key pushed to Netlify. The fix lands the moment
the next Netlify deploy ships.

---

## Bug #19 — Signal Chain shows "Transcribe done" on failed episodes regardless of where failure occurred

**Severity:** MEDIUM — misleads users about where in the pipeline an
episode failed. Episodes that fail during transcription appear in the UI
as if transcription succeeded and the failure happened downstream.

**Symptom:**

Any episode with `status = 'failed'` renders the Signal Chain with:

```
● UPLOAD ── ● TRANSCRIBE ── ○ GENERATE ── ○ READY
```

(Upload + Transcribe green, Generate + Ready empty.) This is the
hardcoded response regardless of the actual failure step.

**Evidence:**

`app/src/components/episodes/episode-detail.tsx:1820-1826`:

```ts
case 'failed':
  return [
    { id: 'upload', label: 'Upload', status: 'done' },
    { id: 'transcribe', label: 'Transcribe', status: 'done' },  // ← always
    { id: 'generate', label: 'Generate', status: 'pending' },
    { id: 'ready', label: 'Ready', status: 'pending' },
  ];
```

The mapping function takes `status` and optional `processingStep` as
inputs, but the `failed` case ignores `processingStep` entirely. Whether
the episode crashed during AssemblyAI upload, transcription, vocabulary
post-processing, Grok generation, or SEO analysis, the UI tells the same
story: "transcribe succeeded, generate failed."

**Blast radius:**

Any user debugging a failed episode gets a false impression of where the
pipeline broke. Support requests that say "my episode failed during
generation" may actually be transcription failures. The status badge on
the row is the only error indicator, and it doesn't tell you the step.

**Fix:**

Add a `failed_step` column to `episodes` (or store in `metadata`), have
the process-episode Trigger.dev job write the step name when it catches
an error, and switch the signal chain mapping to use it:

```ts
case 'failed': {
  const failedStep = processingStep || metadata?.failed_step;
  const steps = [
    { id: 'upload', label: 'Upload', status: 'done' },
    { id: 'transcribe', label: 'Transcribe', status: 'done' },
    { id: 'generate', label: 'Generate', status: 'done' },
    { id: 'ready', label: 'Ready', status: 'done' },
  ];
  // Mark the failed step red and everything after it pending
  const failedIdx = stepIndexOf(failedStep);
  if (failedIdx >= 0) {
    steps[failedIdx].status = 'failed';
    for (let i = failedIdx + 1; i < steps.length; i++) {
      steps[i].status = 'pending';
    }
  }
  return steps;
}
```

This requires adding a `'failed'` variant to `StepStatus` and a red dot
config in `stepStatusConfig`.

**Status:** DISCOVERED, NOT YET FIXED.

---

## Bug #20 — RSS Tags feed embeds `localhost:3000` URLs in the generated XML

**Severity:** HIGH for production — the Podcasting 2.0 RSS tags generator
writes the dev server URL (`http://localhost:3000/api/episodes/<id>/transcript.vtt`)
into the `<podcast:transcript url>` tag. When users copy these tags into
their real RSS feed in production, the transcript URL points at nothing.

**Symptom:**

Open any completed episode → RSS Tags tab → observe the rendered XML:

```xml
<podcast:transcript
  url="http://localhost:3000/api/episodes/e3e5fc46-a302-4533-af7e-3f714f540712/transcript.vtt"
  type="text/vtt"
  language="en" rel="captions" />
```

The `localhost:3000` prefix is baked in at render time.

**Evidence:**

Confirmed via the user's screenshot of the RSS Tags tab on the Planet
Money test episode. Source code likely uses `process.env.NEXT_PUBLIC_APP_URL`
or falls back to `window.location.origin`, which is `localhost:3000` in
dev. Need to verify the fallback path at
`app/src/app/api/episodes/[id]/rss-tags/route.ts`.

**Fix:**

Ensure the generator uses a `PUBLIC_APP_URL` env var that is set in both
dev AND prod environments, and falls back to the request's host header
rather than `localhost:3000`. For Netlify production, verify
`NEXT_PUBLIC_APP_URL` is set to `https://getpodbrain.ai`.

**Netlify env check (2026-04-15):** `NEXT_PUBLIC_APP_URL` is NOT in the
current Netlify env var list (21 vars total, missing this one). This
means production is ALSO generating localhost URLs unless there's a
Netlify build-time default I haven't found. Needs to be added.

**Blast radius:**

Every podcaster who copies RSS tags from a PodBrain-processed episode
and pastes them into their real RSS feed (Buzzsprout, Transistor,
Anchor, etc.) will publish broken transcript URLs to their listeners.
Podcast app parsers that fail to load the URL will either silently drop
the transcript, show an error, or break the feed entirely.

**Status:** DISCOVERED, NOT YET FIXED.

---

## Bug #28 — URL `?tab=` query param is not synced to active tab (deep-linking broken)

**Severity:** LOW-MEDIUM (functional regression for shareable links)

**Symptom:**

The episode detail page has 6 tabs (Show Notes, Assets, Transcript,
Guest Package, Intelligence, RSS Tags). The URL has a `?tab=<name>`
query parameter, but:

1. **Loading** a URL like `/episodes/<id>?tab=intelligence` does NOT
   select the Intelligence tab — the page defaults to Show Notes
   regardless of the query param.
2. **Clicking** a different tab in the UI does NOT update the URL —
   the `?tab=` query param stays stale even as the active tab changes.

Demonstrated during live walk 2026-04-15 on the Planet Money test
episode: opened `/episodes/<id>?tab=intelligence`, got Show Notes tab,
clicked Transcript tab, URL still read `?tab=intelligence` while the
Transcript tab was visibly active.

**Blast radius:**

- Users cannot deep-link to a specific tab (paste-sharing a URL with
  `?tab=rss-tags` takes the recipient to Show Notes instead).
- Browser back/forward navigation doesn't restore tab state.
- Any external integration that tries to jump to a specific tab via a
  URL (email notifications, Slack links, etc.) fails.

**Fix:**

The tab state is stored in component state (`activeTab`) but isn't
synced with `useSearchParams()` / `router.replace()`. Standard Next.js
App Router pattern:

```tsx
const searchParams = useSearchParams();
const router = useRouter();
const pathname = usePathname();

// Read on mount
const initialTab = searchParams.get('tab') || 'show-notes';
const [activeTab, setActiveTab] = useState(initialTab);

// Write on change
useEffect(() => {
  const params = new URLSearchParams(searchParams);
  params.set('tab', activeTab);
  router.replace(`${pathname}?${params.toString()}`, { scroll: false });
}, [activeTab, pathname, router, searchParams]);
```

**Status:** DISCOVERED, NOT YET FIXED.

---

## Bug #29 — Transcript timestamps are off by a factor of 1000× (ms treated as seconds)

**Severity:** HIGH — every timestamp on every transcript is wrong.
The first segment of a 25-minute episode renders as "12:00", the last
renders as "25555:50". Users see nonsensical navigation anchors on
every episode.

**Symptom:**

Open any completed episode → Transcript tab. Every segment shows a
timestamp like:

```
12:00  A  This message is brought to you by the Planet Money Book Tour...
226:40 B  I'm so sorry, Kent...
325:20 A  All right, go right ahead.
...
25555:50 F  And I'm Waylon Wong. This is npr. Thanks for listening.
```

None of those are valid times for a 25-minute episode.

**Evidence (DB + code verified 2026-04-15):**

DB query of the first 8 segments of the Planet Money test episode:

```sql
SELECT start_time, end_time, speaker, SUBSTRING(content FROM 1 FOR 60)
FROM episode_sections
WHERE episode_id = 'e3e5fc46-a302-4533-af7e-3f714f540712'
ORDER BY start_time ASC LIMIT 8;
```

| start_time | end_time | speaker | snippet |
|---:|---:|---|---|
| 720    | 12800  | A | "This message is brought to you by the Planet Money Book Tour" |
| 13600  | 19520  | B | "I'm so sorry, Kent. I do feel like we're maybe underselling" |
| 19520  | 20640  | A | "All right, go right ahead." |
| 20640  | 21440  | C | "Okay, thank you." |
| 21920  | 52260  | B | "So the Planet Money book Tour really is unlike any other" |
| 53460  | 73120  | D | "This is Planet Money from npr. Cindy Cordes loved her job." |
| 73360  | 86240  | E | "I was in the shocks, which. The shocks was the part that" |
| 86530  | 88050  | D | "What was your favorite part of the job?" |

`start_time = 720` means **720 milliseconds** = 0.72 seconds — the
opening line of the episode, as expected. `start_time = 1533350` for
the last segment = 1533.35 seconds = 25:33, matching the 25:42 total
duration.

**Root cause:**

`app/src/components/episodes/episode-detail.tsx:1274-1279`:

```ts
// Helper to format seconds to MM:SS
const formatTimestamp = (seconds: number): string => {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};
```

The function signature claims the input is seconds, but the call site
at line 1305 passes `seg.start` from `episode.transcript_segments`,
which comes from AssemblyAI — and **AssemblyAI's start/end timestamps
are in milliseconds, not seconds**.

Formula walkthrough:
- `720` ms treated as seconds → `Math.floor(720 / 60) = 12 min`, `720 % 60 = 0 sec` → **"12:00"** ❌
- `1533350` ms treated as seconds → `Math.floor(1533350 / 60) = 25555 min`, `1533350 % 60 = 50 sec` → **"25555:50"** ❌

Both match the observed wrong values exactly.

**Fix:**

Convert ms to seconds before calling the formatter. Two options:

**Option A** (fix at the call site, minimal change):
```ts
// episode-detail.tsx:1305
timestamp: formatTimestamp(seg.start / 1000),
```

**Option B** (fix the formatter to accept ms, rename param):
```ts
const formatTimestamp = (milliseconds: number): string => {
  const totalSeconds = Math.floor(milliseconds / 1000);
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};
```

Option B is safer because it makes the ms assumption explicit and
prevents future callers from making the same mistake. But double-check
if `formatTimestamp` is called anywhere else with seconds values (the
Show Notes tab timestamps `[0:53](0:53)` in BUG #11 come from a
different source — Grok JSON — and already use real seconds, so they
probably don't go through this function).

**Note on Show Notes vs Transcript:**

The Show Notes tab's timestamps (see BUG #11) are correctly formatted
because they come from Grok's JSON output in seconds, via a different
code path. The Transcript tab is the only place where this ms-as-seconds
bug manifests.

**Blast radius:**

Every episode in the system (all 8 completed test episodes today, plus
every future episode) has broken transcript timestamps. Users cannot
use transcript timestamps to navigate. If BUG #30 (dead Export SRT
button) ever gets wired up, the SRT file would also contain broken
timestamps unless the fix here reaches that code path too.

**Status:** DISCOVERED, NOT YET FIXED.

---

## Bug #30 — "Export SRT" button is a dead button (no click handler)

**Severity:** MEDIUM — the button is displayed, advertised ("Export SRT")
with a download icon, and appears clickable. Users who click it see
nothing happen. No error message, no download, no feedback. Just a
no-op.

**Symptom:**

Transcript tab has a button in the top-right labeled "Export SRT" with
a download icon. Clicking it produces zero effect: no download, no
toast, no network request, no loading state.

**Evidence (code verified 2026-04-15):**

`app/src/components/episodes/episode-detail.tsx:1376-1379`:

```tsx
<button className="flex items-center gap-1.5 px-3 py-2 rounded-lg ...">
  <Download className="w-3.5 h-3.5" />
  Export SRT
</button>
```

No `onClick={...}` handler. No `type="submit"` inside a form. No React
Hook Form context. No `data-` attributes hinting at a handler attached
externally. It's a styled button with no behavior.

Also runtime-verified via a Playwright click-interceptor that monkey-
patched `URL.createObjectURL` and `HTMLAnchorElement.prototype.click`
to capture any blob or download the button might create. Clicking the
button resulted in zero captured blobs, zero anchor clicks.

**Fix:**

Implement an SRT generator. SRT format is simple:

```
1
00:00:00,720 --> 00:00:12,800
This message is brought to you by the Planet Money Book Tour...

2
00:00:13,600 --> 00:00:19,520
I'm so sorry, Kent. I do feel like we're maybe underselling...
```

Add a helper:

```ts
function formatSrtTimestamp(ms: number): string {
  const h = Math.floor(ms / 3600_000);
  const m = Math.floor((ms % 3600_000) / 60_000);
  const s = Math.floor((ms % 60_000) / 1000);
  const msRem = ms % 1000;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')},${String(msRem).padStart(3, '0')}`;
}

function generateSrt(segments: Array<{ start: number; end: number; text: string }>): string {
  return segments
    .map((seg, i) => `${i + 1}\n${formatSrtTimestamp(seg.start)} --> ${formatSrtTimestamp(seg.end)}\n${seg.text}\n`)
    .join('\n');
}
```

Then wire the button:

```tsx
<button
  onClick={() => {
    const srt = generateSrt(episode.transcript_segments);
    const blob = new Blob([srt], { type: 'text/srt;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${episode.title.replace(/\s+/g, '-')}.srt`;
    a.click();
    URL.revokeObjectURL(url);
  }}
  className="..."
>
  <Download className="w-3.5 h-3.5" />
  Export SRT
</button>
```

**Blast radius:**

Any podcaster who wants captions for YouTube, Spotify, or their own
video edits expected this feature to work. Currently they silently
click and get nothing.

**Status:** DISCOVERED, NOT YET FIXED.

---

## Observation — Transcript has no audio playback or clickable timestamps

**Severity:** LOW (missing feature, not a regression)

**Symptom:**

The Transcript tab displays timestamps, speakers, and text, but there
is no `<audio>` element, no inline play button per segment, and no
clickable timestamps. Users cannot click "12:34" to jump to that moment
in the audio.

**Evidence:**

`document.querySelector('audio')` returns null on the Transcript tab.
The segment timestamps are wrapped in `<span>` elements, not `<a>` or
`<button>`, and have no click handlers.

**Observation, not a bug:** This is a missing feature, not broken
behavior. A fix would require:
1. Embedding an `<audio>` element referencing `episode.audio_url`
2. Wiring each timestamp to `audioEl.currentTime = seg.start / 1000`
3. Scroll-to-current-segment on playback (nice UX polish)

Would require fixing BUG #29 first — otherwise clicking "12:00" on the
first segment would seek to 720 seconds instead of 0.72 seconds.

**Status:** OBSERVED. Feature request, low priority.

---
