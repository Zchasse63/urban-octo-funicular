# PodBrain Kokonut UI/UX Audit
Date: 2026-02-06  
Audited by: Codex

## Scope
- App routes in `app/src/app`
- Shared UI and feature components in `app/src/components`
- Kokonut migration and implementation docs in `docs/kokonut`
- Legacy documentation placement in `docs`

## Method
- Read the Kokonut design/migration docs and compared them to current implementation.
- Ran static drift checks for legacy class names and token usage.
- Validated build and lint status:
  - `npm run build` (passes with warnings)
  - `npm run lint` (fails with 12 errors, 102 warnings)

## Executive Summary
The migration is partial. Core navigation and some card wrappers are Kokonut-aligned, but multiple active flows still rely on removed legacy classes and legacy components.

## Resolution Update (2026-02-06)
All findings in this audit have now been remediated in the codebase.

- Legacy class APIs removed from active flows (`topo-card`, `btn-*`, `input`, `progress-*`, `alert-card`).
- Undefined token usage resolved (`--border-subtle`, `--accent-green-bg` now defined/normalized).
- Exposed token examples removed from tracked Kokonut setup docs and replaced with placeholders.
- Core routes and dependent components migrated off legacy card patterns.
- Settings layout switched from hardcoded gray/blue utilities to app tokens.
- Duplicate `ToastProvider` mount removed (single mount in root layout).
- Targeted non-kokonut files no longer use `dark:*` utility drift.
- Lint blocking errors resolved (eslint now reports warnings only, no errors).
- Build drift warnings resolved (metadata `themeColor` moved to `viewport`, Turbopack root configured).

Validation rerun after remediation:
- `npm run lint` -> `0` errors
- `npm run build` -> passes without prior metadata/root warnings

Key metrics:
- 21 route page files found under `app/src/app`.
- 3 active route files still import `TopoCard` directly:
  - `app/src/app/episodes/[id]/assets/page.tsx:21`
  - `app/src/app/episodes/[id]/guest-package/page.tsx:8`
  - `app/src/app/shows/[id]/page.tsx:8`
- 12 source files still reference removed legacy class APIs (`topo-card`, `btn-*`, `input`, `progress-*`), with 31 total references.
- `npm run lint` fails (12 errors), including issues in customized Kokonut components used by the app.

## Critical Findings

### P0: Active UI depends on removed legacy class APIs
Legacy class names are still used in live flows, but these classes are no longer defined in `app/src/app/globals.css`.

Evidence:
- `app/src/components/connections/BuzzsproutConnect.tsx:119`
- `app/src/components/connections/BuzzsproutConnect.tsx:127`
- `app/src/components/connections/BuzzsproutConnect.tsx:131`
- `app/src/components/connections/BuzzsproutConnect.tsx:175`
- `app/src/components/connections/BuzzsproutConnect.tsx:204`
- `app/src/components/upload/step-context.tsx:55`
- `app/src/components/upload/step-context.tsx:114`
- `app/src/components/upload/step-upload.tsx:253`
- `app/src/components/upload/step-upload.tsx:301`
- `app/src/components/upload/step-processing.tsx:101`
- `app/src/components/upload/step-processing.tsx:113`
- `app/src/components/episodes/content-health-card.tsx:39`

Impact:
- Upload and connection UX can render without intended styling and hierarchy.
- Form controls and buttons lose consistent states and affordance.
- Progress and alert visuals can break silently.

### P0: Undefined design tokens used in production components
Two app-level tokens are referenced but not defined in `globals.css`.

Evidence:
- `app/src/components/ui/card.tsx:87` uses `--border-subtle`
- `app/src/components/ui/card.tsx:134` uses `--border-subtle`
- `app/src/app/settings/billing/page.tsx:87` uses `--accent-green-bg`

Impact:
- Border and status styling regress or fall back inconsistently.

### P0: Secrets committed in repo docs and local env file
Sensitive keys/tokens are present in tracked files.

Evidence:
- `app/.env.local:24`
- `app/.env.local:27`
- `app/.env.local:30`
- `app/.env.local:33`
- `docs/kokonut/kokonut-ui-pro-setup-guide.md:103`
- `docs/kokonut/kokonut-ui-pro-setup-guide.md:111`

Impact:
- Immediate security and key-rotation risk.

## High Findings

### P1: Migration docs claim completion, but codebase still has legacy dependencies
`IMPLEMENTATION-ISSUES.md` states full migration and removal of deprecated classes, but active code still uses them.

Evidence:
- `docs/kokonut/IMPLEMENTATION-ISSUES.md:104`
- Legacy usage evidence listed in P0 and P1 sections.

Impact:
- Team decisions are based on inaccurate state.
- Migration work is harder to prioritize.

### P1: Core routes still use legacy `TopoCard` stack
Active routes are still tied to `TopoCard` and old `CardHeader/CardContent` patterns.

Evidence:
- `app/src/app/episodes/[id]/assets/page.tsx:21`
- `app/src/app/episodes/[id]/guest-package/page.tsx:8`
- `app/src/app/shows/[id]/page.tsx:8`
- `app/src/components/shows/show-card.tsx:7`
- `app/src/components/guest-package/social-post-card.tsx:5`
- `app/src/components/guest-package/quote-cards.tsx:5`
- `app/src/components/guest-package/email-template.tsx:5`
- `app/src/components/seo/seo-score-card.tsx:6`

Impact:
- Visual and interaction inconsistency across key product surfaces.
- Higher maintenance overhead from mixed paradigms.

### P1: Tokenization inconsistency and legacy naming still dominate global theme
Theme foundation still advertises old design system and mostly uses `--bg-* / --text-*` legacy naming.

Evidence:
- `app/src/app/globals.css:4` (Alabaster heading)
- `app/src/app/globals.css:9` to `app/src/app/globals.css:27` (legacy token namespace as primary source)

Impact:
- Drift from Kokonut docs and quick reference.
- Harder to enforce a single source of truth for design tokens.

### P1: Settings area ignores Kokonut token language and component patterns
Settings sub-layout uses hardcoded Tailwind gray/blue classes instead of app tokens/Kokonut patterns.

Evidence:
- `app/src/app/settings/layout.tsx:21`
- `app/src/app/settings/layout.tsx:35`
- `app/src/app/settings/layout.tsx:36`

Impact:
- Clear visual mismatch inside a core account area.

## Medium Findings

### P2: Duplicate toast providers in app shell path
`ToastProvider` is mounted in both root layout and app shell.

Evidence:
- `app/src/app/layout.tsx:52`
- `app/src/components/layout/app-shell.tsx:22`

Impact:
- Risk of duplicated portal containers, duplicated announcements, and unexpected stacking behavior.

### P2: Mixed dark-mode utility usage in a light-system design
Non-kokonut app and podbrain files still include `dark:*` classes.

Evidence examples:
- `app/src/app/expert-finder/page.tsx:233`
- `app/src/app/guests/page.tsx:150`
- `app/src/components/podbrain/search.tsx:121`
- `app/src/components/podbrain/audio-upload.tsx:146`

Impact:
- Inconsistent visual output and extra maintenance burden for a design direction that is not dark-first.

### P2: Lint health blocks quality gates for UI modernization
Lint currently fails, including app-relevant component code.

High-impact examples:
- `app/src/components/kokonutui/action-search-bar.tsx:162`
- `app/src/components/kokonutui/action-search-bar.tsx:179`
- `app/src/components/kokonutui/bento-grid.tsx:549`
- `app/src/components/kokonutui/smooth-tab.tsx:374`
- `app/src/components/podbrain/processing-states.tsx:189`

Impact:
- Slows safe refactors and increases regression risk.

### P2: Build warnings indicate metadata and config drift
`next build` reports metadata API warnings and workspace root ambiguity.

Evidence:
- `app/src/app/layout.tsx:30` (`themeColor` metadata warning target)
- Duplicate lockfiles warning from build (`/package-lock.json` and `/app/package-lock.json`)

Impact:
- No immediate blocker, but adds noise and future maintenance risk.

## Route-Level Status

Red (high drift):
- `/upload`
- `/settings/connections`
- `/episodes/[id]`
- `/episodes/[id]/assets`
- `/episodes/[id]/guest-package`
- `/shows/[id]`
- `/pricing`

Amber (partial alignment):
- `/episodes`
- `/shows`
- `/settings`
- `/expert-finder`
- `/guests`
- `/trending`
- `/support`
- `/competitors`
- `/(marketing)/*`

Green (mostly aligned):
- Sidebar shell (`app-shell` + `sidebar`) with motion and drawer behavior
- Core tokenized wrappers in `app/src/components/podbrain/*` (except files noted above)

## Recommended Remediation Plan

### Phase 1: Stabilize Foundations (P0)
1. Replace legacy class API usage (`topo-card`, `btn-*`, `input`, `progress-*`) in active flows with PodBrain/Kokonut components.
2. Define or remove undefined tokens (`--border-subtle`, `--accent-green-bg`) and normalize status token usage.
3. Remove secrets from repo, rotate exposed keys immediately, and replace docs with placeholder examples.

### Phase 2: Complete Route Migration (P1)
1. Migrate `episodes/[id]/assets`, `episodes/[id]/guest-package`, and `shows/[id]` from `TopoCard` patterns to `ContentCard`/`InteractiveCard` compositions.
2. Rework upload wizard subcomponents to use current PodBrain button/input/progress primitives.
3. Replace settings sub-layout hardcoded colors with app token-based styles and navigation motion patterns.

### Phase 3: Consistency and Quality (P2)
1. Remove duplicate provider mounting (`ToastProvider` once at the highest valid level).
2. Resolve lint errors in customized Kokonut and PodBrain components.
3. Clean build warnings (`themeColor` -> viewport export, lockfile root strategy).

### Phase 4: Documentation Integrity
1. Update migration docs to match actual implementation state.
2. Add a CI drift check:
   - Fail on legacy class API usage.
   - Fail on undefined CSS token usage.
   - Fail if migration checklist says complete while drift exists.

## Validation Notes
- Build result: pass (`npm run build`) with warnings.
- Lint result: fail (`npm run lint`) with 12 errors, 102 warnings.
