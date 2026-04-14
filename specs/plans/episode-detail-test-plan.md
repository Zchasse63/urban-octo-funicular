# Test Plan — Episode Detail

**Feature:** `episode-detail`
**Architect:** qa-architect
**Date:** 2026-04-09

## Suite Overview

Two episode fixtures are needed:
- **Populated episode** — has `title`, `description`, `transcript`,
  `transcript_segments`, `show_notes`, `seo_analysis` with keyword density,
  `guest_name`, `guest_bio`, `status: 'completed'`
- **Empty episode** — status `pending`, all other fields null/empty

The populated episode is used by P0-1 through P1-3 and P2-1.
The empty episode is used by P0-3 (empty-state regression guard).

All content uses neutral topic — "Renewable Energy" — and none of it
should ever say "Stoic", "Marcus Aurelius", or "Meditations". That IS
the regression guard.

## Shared Fixtures

| Fixture | Purpose | Created in |
|---|---|---|
| `testUser` | Signed-in user | beforeAll |
| `testShow` | Owner of both fixture episodes | beforeAll |
| `populatedEpisode` | Fully-populated `completed` episode | beforeAll |
| `emptyEpisode` | `pending` episode with nothing | beforeAll |

## Page Object Model — `EpisodeDetailPage`

| Method | Wraps |
|---|---|
| `goto(episodeId)` | `page.goto(\`/episodes/${episodeId}\`)` + wait for tabs |
| `tabButton(id)` | `page.getByTestId(\`episode-tab-${id}\`)` |
| `clickTab(id)` | Click the tab button |
| `expectTitle(text)` | Assert the `h1` contains text |
| `expectNoStoicism()` | Assert body text has no "Stoic", "Marcus", "Meditations" |

## P0 Tests (Critical Smoke)

| # | Test | Precondition | Expected |
|---|---|---|---|
| P0-1 | loads episode detail with real data (no Stoicism) | populatedEpisode | title matches, body contains episode title, body contains 0 Stoic/Marcus/Meditations refs |
| P0-2 | all 6 tabs are visible via data-testid | populatedEpisode | each `episode-tab-*` button is visible |
| P0-3 | empty episode shows all empty states without mock data | emptyEpisode | "No show notes yet" visible, body has 0 Stoic refs |

## P1 Tests

| # | Test | Precondition | Expected |
|---|---|---|---|
| P1-1 | Transcript tab renders real segments | populatedEpisode with segments | At least one real segment text is visible |
| P1-2 | Intelligence tab shows real topic clusters | populatedEpisode with seo_analysis | Real keyword from density (e.g. "renewable energy") visible under Topic Clusters |
| P1-3 | Guest tab shows the real guest name | populatedEpisode with guest_name | Guest name text visible |
| P1-4 | Show Notes HTML mode shows amber notice when show_notes_html is null | populatedEpisode with show_notes but no show_notes_html | "HTML version not yet generated" notice visible |

## P2 Tests

| # | Test | Precondition | Expected |
|---|---|---|---|
| P2-1 | Clicking a tab changes the rendered content | populatedEpisode | After clicking Assets tab, "assets generated" text visible |

## Database Seed

Both episodes created via admin client with:
- `populatedEpisode.seo_analysis.keyword_density = { 'renewable energy': 12, 'battery storage': 8, 'grid modernization': 5 }`
- `populatedEpisode.transcript_segments` = 3 real-looking segments about batteries
- `populatedEpisode.guest_name = 'Dr. Sarah Lin'`
- `populatedEpisode.show_notes = '# Renewable Energy Episode\n\nReal content.'`

## Out of Scope

- Asset generation (covered by the upload-wizard downstream flow)
- RSS Tags panel content verification
- Inline title edit round-trip (covered indirectly via refetch path)
