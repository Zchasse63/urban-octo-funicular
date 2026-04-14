# Accessibility — Color Contrast Follow-up

**Status:** OPEN (design review required)
**Created:** 2026-04-09
**Blocks launch:** No (non-blocking per current accessibility spec), but required for WCAG AA compliance on public/authenticated pages.

## What was done in this pass

- `--muted-foreground` token in `src/app/globals.css` darkened from
  `oklch(0.556 0 0)` (≈ #8a8a8a) to `oklch(0.46 0 0)` (≈ #6c6c6c).
  This fixes the worst offender: `text-muted-foreground` on white card
  backgrounds went from ~3.6:1 to ~5.1:1, which passes WCAG AA 4.5:1
  for normal text.
- Dark-mode `--muted-foreground` was NOT changed — it's already
  `oklch(0.708 0 0)` ≈ #b4b4b4 on `oklch(0.145 0 0)` ≈ #252525, which
  passes at ~6.3:1.

## What's still outstanding

Re-enabling the axe-core `color-contrast` rule in
`app/test/e2e/flows/accessibility.spec.ts` surfaces 21+ nodes per page
across all 7 tested pages (landing, login, register, episodes list,
episode detail, upload wizard, settings). The violations fall into
these categories:

### 1. Placeholder text in form inputs
`placeholder:text-muted-foreground/80` appears on many inputs across
the wizard, settings, vocabulary, and episode detail. The `/80` opacity
reduces the already-borderline muted color below the 4.5:1 threshold.

**Fix candidates:**
- Remove the `/80` opacity modifier everywhere, letting the darkened
  muted-foreground come through at full opacity
- OR introduce a dedicated `--placeholder-foreground` token that's
  explicitly tuned for the 4.5:1 threshold on white backgrounds

### 2. Chart colors in the Intelligence tab
The topic-cluster bars use `bg-sky-400`, `bg-violet-400`, etc. at
40% saturation. Text labels inside those bars may fall below contrast.

**Fix candidates:**
- Use `bg-sky-500` (the deeper shade) for label-bearing bars
- OR ensure label text is always on a solid card background, not
  inside the colored bar

### 3. Muted tertiary text
Many small labels (`font-mono text-[9px]`, `text-[10px] text-muted-foreground`)
are used for metadata lines like timestamps, format tags, "Ready" badges.
Small text has a stricter threshold (4.5:1 for < 18px regular weight).

**Fix candidates:**
- Bump these labels to font-weight semibold where possible (kicks them
  into the "large text" 3:1 threshold)
- OR darken the text color for specifically these tiny labels

### 4. Sidebar collapsed-state icons
When the sidebar is collapsed, icon-only buttons may rely on the icon
color alone for meaning. These need an aria-label AND sufficient
contrast.

### 5. Status badge text
The status dots (emerald-500, amber-400, stone-400, red-500) have
colored text labels inside pill backgrounds. Need to verify each
tier-name/status combination.

## Recommended approach

This is a design-system-level audit, not a one-off fix. The cleanest
path is:

1. **Design review session** — walk through every Tailwind text color
   used in the codebase and decide the canonical set of foreground
   tokens: `foreground`, `muted-foreground`, `subtle-foreground`, etc.
   Each should have a WCAG-AA-validated contrast ratio.

2. **Codemod or search-and-replace** — update every usage site at once
   to use the new tokens. Avoid piecemeal fixes that leave inconsistent
   states.

3. **Re-enable `color-contrast`** in `accessibility.spec.ts` as the
   final commit of the audit. This locks in the gains so future
   changes can't regress.

## Re-running the audit

To see the current state of violations:

```bash
# Temporarily enable color-contrast
# Edit app/test/e2e/flows/accessibility.spec.ts and remove
# 'color-contrast' from the disableRules array.

PLAYWRIGHT_BASE_URL=http://localhost:3100 npx playwright test test/e2e/flows/accessibility.spec.ts
```

Each failing test's error message includes the axe help URL with
specific node selectors. Inspect the nodes via DevTools to see the
exact `background-color` and `color` values.

## Blocking status

- **Not blocking the initial launch** because the page-level
  violations do not prevent core functionality.
- **Blocking WCAG AA formal compliance** — if a compliance claim is
  made publicly (marketing, B2B sales), this must be closed first.
- **Blocking on paid enterprise customers** that have a11y
  procurement requirements.

## Owner

Design system team, coordinating with the product engineer who owns
`globals.css` and the shared UI primitives in `src/components/ui/`.
