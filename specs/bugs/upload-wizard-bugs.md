# Bugs Discovered — Upload Wizard

**Feature:** `upload-wizard`
**Discovered by:** qa-healer
**Date:** 2026-04-09

## Bug #1 — `null` fields rejected by CreateEpisodeSchema → 400

**Severity:** HIGH (blocks the entire submit flow when context fields are left empty)

**Evidence from dev server log during E2E run:**
```
POST /api/upload 200 in 1903ms
POST /api/episodes 400 in 644ms
```

**Root cause:**
`app/src/components/upload/upload-wizard.tsx:940-944` posts:
```ts
description: expertContext.description || null,
guest_name: expertContext.guestName || null,
guest_bio: expertContext.guestBio || null,
```

But `CreateEpisodeSchema` in `app/src/lib/validation-schemas.ts:56-64` defines those fields as:
```ts
description: optionalTrimmed(10000),   // z.string().trim().max(10000).optional()
guest_name: optionalTrimmed(200),
guest_bio: optionalTrimmed(5000),
```

`.optional()` accepts `undefined`, NOT `null`. When the user leaves any context field empty, the wizard sends `null`, Zod rejects with 400, and the wizard shows a toast ("Failed to create episode") while leaving the user stuck on Step 3.

**Reproduction:**
1. Sign in as any user with ≥1 show.
2. Go to `/upload`.
3. Attach an audio file.
4. Click through Step 2 without filling any fields.
5. Click "Start Processing Episode" on Step 3.
6. **Expected:** Episode is created, user is navigated to `/episodes/[id]`.
7. **Actual:** Toast "Failed to create episode" appears; user remains on `/upload`.

**Why this wasn't caught earlier:** No E2E coverage of the upload wizard existed. Manual QA may have worked around this by filling in context fields.

**Fix:** Either (a) make the wizard send `undefined` instead of `null`, or (b) widen the schema with `.nullish()`. Option (a) is minimal and matches existing `UpdateEpisodeSchema` conventions. Applied: upload-wizard.tsx will use `|| undefined` instead of `|| null`.

**Status:** FIXED by Healer in iteration 2.

---

## Bug #31 — Upload wizard advertises "Whisper v3" + "End-to-end encrypted" but uses AssemblyAI and has no E2E encryption

**Severity:** HIGH (false marketing claims, potential trust issue)

**Symptom:**

The /upload page displays a footer strip at the bottom of the drop
zone that reads:

```
● Transcription via Whisper v3  ·  ~2–4 min processing  ·  End-to-end encrypted
```

Both "Whisper v3" and "End-to-end encrypted" are **false**.

**Evidence:**

1. **Transcription is AssemblyAI, not Whisper.** Every mention of the
   transcription service in the codebase uses AssemblyAI:
   - `app/src/lib/assemblyai/` (client + webhook)
   - `app/.env.local` has `ASSEMBLYAI_API_KEY` (real) but NO
     `OPENAI_WHISPER_*` variables
   - CLAUDE.md documents the transcription path as AssemblyAI
   - `save-processing-results.ts` calls the AssemblyAI API
   - There is no OpenAI Whisper integration anywhere in the codebase

2. **Hardcoded in two places in the wizard** at
   `app/src/components/upload/upload-wizard.tsx`:
   ```tsx
   // Line 792
   { icon: Mic2, label: 'Transcription via Whisper v3', detail: '~2–4 min' }
   // Line 1146
   <span className="font-mono text-[10px]">Transcription via Whisper v3</span>
   ```

3. **"End-to-end encrypted" is false** (line 1151). The audio flow is:
   - Browser → Supabase Storage (TLS in transit, AES-256 at rest —
     standard cloud encryption, but Supabase holds the keys and can
     read the file)
   - Supabase Storage → AssemblyAI (direct URL fetch — AssemblyAI
     downloads and can read the audio to transcribe it)
   - Transcript → Supabase Postgres (TLS in transit, AES-256 at rest —
     Supabase can read)
   - Transcript → xAI Grok (for show-notes generation — xAI can read)
   - Transcript → OpenAI (for embeddings — OpenAI can read)

   At least 4 parties (Supabase, AssemblyAI, xAI, OpenAI) have access
   to either the raw audio or the transcript in plaintext. This is
   "encrypted in transit and at rest with vendor-held keys," which is
   the industry norm but is NOT end-to-end encryption. E2EE means only
   the sender and receiver can read the data; intermediaries cannot.

   Claiming E2EE in marketing when you don't actually provide it is a
   potential false-advertising issue.

**Blast radius:**

- Users making purchase decisions based on "Whisper v3 quality" are
  being misled — they're getting AssemblyAI quality, which is a
  different product with different strengths/weaknesses (both good,
  but different).
- Users with sensitive content (confidential interviews, HR episodes,
  legal discussions) who chose PodBrain because of the E2EE claim are
  being misled about who can access their audio. This could be a
  privacy or compliance issue for their business.

**Fix:**

Either (a) update the copy to be accurate:

```tsx
label: 'Transcription via AssemblyAI Universal',
// And replace "End-to-end encrypted" with "Encrypted in transit + at rest"
```

Or (b) switch to actual Whisper and implement actual E2EE — this is a
much bigger product change that the current architecture doesn't
support.

Recommend option (a) for the audit.

**Status:** ✅ **FIXED 2026-04-15** (round 2). Two-line label fix in
`upload-wizard.tsx`: "Whisper v3 → AssemblyAI Universal" (lines 775 + 1131
in original numbering) and "End-to-end encrypted → Encrypted in transit +
at rest" (line 1136). Added a comment block explaining the rationale.
End-to-end verified: the page no longer contains the strings "Whisper" or
"End-to-end encrypted", and instead shows "AssemblyAI Universal" and
"Encrypted in transit + at rest".

---

## Bug #32 — URL Import is UI-only for YouTube and RSS; silently fails at the AssemblyAI stage

**Severity:** HIGH — the wizard prominently offers "YouTube" and "RSS
Feed" as import sources with icons and labels, but neither source type
has backend logic to actually ingest the content. Users who paste a
YouTube URL or RSS feed URL get an episode row that fails silently,
appears as a "Draft" in the episodes list (see BUG #10), and has no
explanation of what went wrong.

**Symptom:**

1. Navigate to `/upload` → click "URL Import" tab
2. Paste a YouTube URL (e.g. `https://youtube.com/watch?v=abc123`)
3. UI shows a red "YOUTUBE" badge next to the input (detection works)
4. Click "Add to Queue" — item added
5. Continue to Step 3, click "Start Processing"
6. Episode row is created in the DB with `audio_url = <raw YouTube URL>`
7. The processing pipeline calls AssemblyAI with the YouTube URL
8. AssemblyAI tries to fetch the URL, gets HTML (not audio), fails
9. Episode ends up with `status = 'failed'`
10. Thanks to BUG #10 (failed-as-draft conflation), the failed episode
    renders as "Draft" with no error indication

**Evidence:**

`app/src/components/upload/upload-wizard.tsx:929-931`:

```ts
} else if (item.sourceType === 'url' && item.url) {
  audioUrl = item.url;   // ← raw URL passed straight through
}
```

No YouTube download. No RSS parsing. No URL transformation. The raw
URL is stored directly as `audio_url` and the pipeline is expected to
handle it.

Grepped the entire codebase for YouTube download implementations
(`ytdl`, `youtube-dl`, `yt-dlp`, `innertube`) — **zero matches**.
Grepped `app/src/app/api/` for any route that could handle YouTube
ingestion — nothing.

The `api/publishing/[platform]/route.ts` route accepts `youtube` as a
valid platform (line 7), but it is a 501 scaffold per CLAUDE.md and
handles **publishing** (outbound), not **import** (inbound).

The UI detection at `upload-wizard.tsx:133` correctly identifies
YouTube URLs and shows a red badge, which creates the impression that
the feature is implemented.

**Three-way failure matrix:**

| URL type | UI badge | Backend path | Works? |
|---|---|---|---|
| YouTube link | ✅ "YOUTUBE" | raw URL → AssemblyAI (HTML response) | ❌ silently fails |
| RSS feed URL | ✅ "RSS FEED" | raw URL → AssemblyAI (XML response) | ❌ silently fails |
| Direct .mp3/.wav/.m4a URL | ✅ "DIRECT LINK" | raw URL → AssemblyAI (audio) | ✅ works |

**Compounds with BUG #10:**

The failure is invisible to users because BUG #10 (failed episodes
render as "Draft") hides the failure state. A user who uploads a
YouTube URL:
1. Doesn't see an error on the upload page
2. Is navigated to the episode detail page
3. Sees a "Draft" status
4. Assumes the episode is queued or still uploading
5. Later returns and sees it still as "Draft"
6. Has no path to understanding what went wrong

**Fix options:**

**Option A — Remove YouTube and RSS from the UI** (quickest):
   Delete the YouTube and RSS Feed detection + labels. Leave only
   "Direct Link" as the URL import option. Update the placeholder and
   description copy accordingly. 5-line change.

**Option B — Implement YouTube ingestion**:
   Add a server-side YouTube download path using `ytdl-core` or similar,
   extract audio as MP3, upload to Supabase Storage, proceed as a file
   upload. Non-trivial (ToS considerations, rate limits, copyright) but
   delivers on the marketing promise.

**Option C — Implement RSS feed import**:
   Parse the feed, show a list of episodes, let the user pick one, then
   use the episode's MP3 URL as the audio_url. Already partially
   supported by `app/src/app/api/shows/[id]/import/route.ts` (which
   imports full shows from RSS feeds) — the upload wizard could
   redirect to that path.

**Recommended:** Option A for the product-quality audit window. Option
B/C as future features if the product direction prioritizes them.

**Status:** ✅ **FIXED 2026-04-15** (round 2). Option A applied: removed
YouTube and RSS detection from `UrlImportPanel`. The panel now only
accepts direct audio file URLs, the placeholder reads
`https://example.com/episode.mp3`, the badge row only shows "Direct Link
to .mp3 / .wav / .m4a", and `handleSubmit` explicitly rejects YouTube and
RSS URLs with a clear error message instead of silently failing later.
End-to-end verified: navigating to `/upload` → URL Import tab shows no
YouTube or RSS Feed badges anywhere.

---
