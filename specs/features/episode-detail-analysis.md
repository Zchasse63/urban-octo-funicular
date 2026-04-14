# Feature Design Document — Episode Detail

**Feature:** `episode-detail`
**Analyst:** qa-analyst
**Date:** 2026-04-09

## Overview

The Episode Detail page at `/episodes/[id]` is the primary workspace for
an episode: it shows all generated content across six tabs (Show Notes,
Assets, Transcript, Guest Package, Intelligence, RSS Tags). The big
refactor this session removed pervasive hardcoded Stoicism/Marcus
Aurelius mock data from ShowNotes, Transcript, Intelligence, and
GuestPackage tabs. Now every tab derives from real `Episode` fields and
renders graceful empty states when data is absent.

The page depends on:
- `useEpisode(episodeId)` — fetches the episode row
- `useEpisodeAssets(episodeId)` — fetches generated assets + exposes `generateAsset` and `regenerateAsset`
- `useEpisodeSeo(episodeId)` — fetches SEO analysis separately

## User Workflows

### Flow A — Viewing a processed episode

1. User clicks an episode from `/episodes` list.
2. Navigates to `/episodes/[id]`.
3. Page shows episode title, status badge, signal chain, and 6 tabs.
4. **Show Notes tab** (default) renders the real markdown/HTML, SEO gauge, keywords, suggestions.
5. User switches to **Assets** tab — sees Core/Social/Long-form/Guest/Visual/AI-Summary categories, each with generated assets marked "Ready" or a Generate button.
6. User switches to **Transcript** tab — sees real timestamped segments.
7. User switches to **Intelligence** tab — sees topic clusters derived from `seo_analysis.keyword_density`.
8. User switches to **Guest Package** tab — sees real guest name/bio (or "Solo Episode" badge).
9. User switches to **RSS Tags** tab — sees Podcasting 2.0 XML snippet.

### Flow B — Viewing an unprocessed episode (edge case)

1. User navigates to an episode with `status: 'pending'` and no `seo_analysis`.
2. Show Notes tab shows "No show notes yet" empty state (not mock Stoicism content).
3. Transcript tab shows "Transcript not yet available" empty state.
4. Intelligence tab shows Topic Count = 0 and unified "Not yet generated" card.
5. Assets tab shows 0 of N assets generated; each row shows a Generate button.

### Flow C — Generating an individual asset

1. User on Assets tab, clicks the Generate button on an idle asset row.
2. Button switches to "Generating…" spinner.
3. `useEpisodeAssets.generateAsset(dbType)` POSTs to `/api/episodes/[id]/assets` with `regenerate: false`.
4. On success, the row switches to "Ready" and the assetMap updates.
5. On failure, the row reverts to idle state.

### Flow D — Generating all remaining assets

1. User clicks "Generate All Remaining" on Assets tab.
2. Real progress bar appears showing `{done}/{total}` assets.
3. Concurrency=3 `Promise.allSettled` loop dispatches POSTs.
4. Toast shows success, partial success, or complete failure at the end.
5. `isBatchRunning` is reset in `finally` so the button never gets stuck.

### Flow E — Inline title editing

1. User hovers the episode title; pencil icon appears.
2. Click pencil → title becomes an `<input>` with the current value.
3. User types new title, presses Enter (or blurs) → PUT `/api/episodes/[id]` with `{title}`.
4. `refetch()` refreshes episode data.

### Flow F — Editing show notes

1. User on Show Notes tab clicks "Edit" button.
2. Markdown textarea appears with current `show_notes` content.
3. User edits, clicks Save → PUT `/api/episodes/[id]` with `{show_notes}`.
4. `onSaved()` refetches.

## Selector Inventory

| Selector | Element | Purpose |
|---|---|---|
| `[data-testid="episode-detail-tabs"]` | Tab bar container | Stable anchor for tab region |
| `[data-testid="episode-tab-show-notes"]` | Show Notes tab button | |
| `[data-testid="episode-tab-assets"]` | Assets tab button | |
| `[data-testid="episode-tab-transcript"]` | Transcript tab button | |
| `[data-testid="episode-tab-guest"]` | Guest Package tab button | |
| `[data-testid="episode-tab-intelligence"]` | Intelligence tab button | |
| `[data-testid="episode-tab-rss-tags"]` | RSS Tags tab button | |
| `h1` containing episode title | Page header | |
| Text `"No show notes yet"` | Show Notes empty state | |
| Text `"Transcript not yet available"` | Transcript empty state | |
| Text `"Topic Clusters"` | Intelligence section header | |
| Text `"Sentiment & engagement analysis"` | Intelligence unified empty state | |
| Text matching `/Generated .* assets/` | Assets tab header | |
| Button `"Generate All Remaining"` | Batch generate button | |
| Button `"Edit"` inside ShowNotesTab toolbar | Toggle edit mode | |
| Button `"Save"` inside ShowNotesTab toolbar | Commit show notes edit |

**Evidence (line numbers from current episode-detail.tsx):**
- `1951` — `data-testid={` for tab buttons (just added this session)
- `1946` — `data-testid="episode-detail-tabs"` (just added)
- `554` — "No show notes yet" empty state
- `1208` — "Transcript not yet available" empty state
- `1635` — "Sentiment & engagement analysis" unified empty state
- `1147` — "assets generated" count label

## API Endpoints

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/episodes/[id]` | Fetch the episode (via useEpisode) |
| GET | `/api/episodes/[id]/assets` | Fetch generated assets |
| GET | `/api/episodes/[id]/seo` | Fetch SEO analysis |
| PUT | `/api/episodes/[id]` | Update title or show_notes |
| POST | `/api/episodes/[id]/assets` | Generate/regenerate asset |

## Edge Cases

1. **Episode not found** — `useEpisode` returns error; page shows "Failed to load episode" with a back link.
2. **Episode still processing** — All tabs render empty states, not mock data.
3. **seo_analysis null** — Keywords card shows placeholder, SEO metrics empty, Intelligence shows "awaiting analysis".
4. **transcript_segments empty** — Transcript tab shows empty state, NOT MOCK_TRANSCRIPT (bug fixed this session).
5. **guest_name null** — Guest tab shows "Solo Episode" badge, PreInterviewPanel hidden.
6. **show_notes_html null but show_notes present** — HTML mode shows amber notice + raw markdown in `<pre>`.
7. **Asset generation 409 (already exists)** — `generateAsset` refetches silently; no error shown.
8. **Batch generation partial failure** — Toast shows `X of Y generated, Z failed` warning.

## Dependencies

- **Authenticated session** — middleware redirects `/episodes/[id]` to `/login`
- **Episode row in database** — required; the URL `[id]` must match an owned episode
- **Assets are optional** — empty assets array is a valid state

## Recommended Test Priorities

### P0 — Critical smoke
1. Episode detail loads with real episode data (no Stoicism/Marcus Aurelius anywhere)
2. All 6 tab buttons are visible and clickable via data-testid
3. Empty-state episode (no seo_analysis, no transcript_segments) renders all empty states correctly

### P1 — Important
4. Switching to Transcript tab renders real transcript segments from the episode
5. Switching to Intelligence tab shows real topic clusters from seo_analysis.keyword_density
6. Switching to Guest tab with a guest_name shows the real guest name (not "Marcus Aurelius")
7. Show Notes tab HTML mode shows amber notice + markdown when show_notes_html is null

### P2 — Nice-to-have
8. Generate button on an asset row changes state to "Generating…" then "Ready"
9. Inline title edit saves successfully

## Regression guards

The P1 tests are explicit regression guards for the Stoicism mock data
removal. If any future edit accidentally reintroduces MOCK_* constants,
the grep-free assertions in these tests will catch it.
