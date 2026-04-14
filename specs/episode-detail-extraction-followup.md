# Episode Detail File Extraction — Deferred

**Status:** DEFERRED (not blocking launch)
**Created:** 2026-04-09
**Risk:** Medium (pure refactor, 2000-line file, 8 e2e tests as safety net)

## Current state

`app/src/components/episodes/episode-detail.tsx` is 2002 lines. It
contains:
- Main `EpisodeDetail` component (~250 lines)
- `ShowNotesTab` + `FormatToggle` + `CopyButton` + `SEOGauge` + `SEOMetricRow`
- `AssetsTab` + `AssetRow` + `CategoryCard` + `UI_ID_TO_DB_TYPE` + `ASSET_CATEGORIES`
- `TranscriptTab` + `mapApiSegments` + `HighlightedText` + `formatTimestamp`
- `GuestPackageTab` + `GUEST_PACKAGE_ITEMS`
- `IntelligenceTab`
- `SignalChain` + status config + helpers

## Why deferred

1. The file works correctly. All 8 `episode-detail.spec.ts` tests
   pass. Refactor risk > maintainability benefit at current pace.
2. The file is mostly read by one person at a time — the large size
   is an inconvenience, not a correctness issue.
3. A clean extraction requires passing the `episodeId` prop tree
   through new files, which increases the chance of subtle TypeScript
   errors that the existing tests might not catch.

## When to do it

Do the extraction when:
- A new feature touches one of the tabs and the file becomes a
  merge-conflict hotspot
- A new team member needs to find something in the file and gets lost
- The file crosses 2500 lines

## Recommended structure

```
app/src/components/episodes/
  episode-detail.tsx          — shell + SignalChain + status + main component (~400 lines)
  tabs/
    show-notes-tab.tsx        — ShowNotesTab + FormatToggle + CopyButton + SEOGauge + SEOMetricRow
    assets-tab.tsx            — AssetsTab + AssetRow + CategoryCard + ASSET_CATEGORIES + UI_ID_TO_DB_TYPE
    transcript-tab.tsx        — TranscriptTab + mapApiSegments + HighlightedText
    guest-tab.tsx             — GuestPackageTab + GUEST_PACKAGE_ITEMS
    intelligence-tab.tsx      — IntelligenceTab + TOPIC_CLUSTER_COLORS
  episode-detail-helpers.ts   — listVariants, listItemVariants (shared)
```

## Safety net

The following tests will catch regressions from the extraction:
- `app/test/e2e/flows/episode-detail.spec.ts` (8 tests, all currently passing)
- `app/test/e2e/flows/show-creation.spec.ts` (navigates to episode detail)
- `app/test/e2e/flows/upload-wizard.spec.ts` (P0-3 ends on episode detail)
- Global `expectNoMockData` fixture (catches any reintroduction of Stoicism content)

Run `npm run test:e2e` after the extraction to verify nothing broke.

## Estimated effort

- 2 hours for a careful extraction
- Should be done in a single focused session, not piecemeal
