# Feature Design Document — Show Creation

**Feature:** `show-creation`
**Analyst:** qa-analyst
**Date:** 2026-04-09

## Overview

"Show creation" is the primary onboarding gate: a user who just registered has zero shows and cannot upload episodes until at least one show exists. The feature consists of a Radix UI dialog launched from the sidebar's Show Selector, backed by the existing `POST /api/shows` endpoint. Tier-limit enforcement lives in `lib/tier-limits.ts` (Free = 1 show, Pro = 5 shows, Agency = unlimited). The dialog is new in this session — before today the sidebar's "Add new show" button had no `onClick` handler, permanently blocking new users.

## User Workflows

### Flow A — First-time user creates their first show (happy path)

1. User signs in; sidebar shows "Create your first show" as the show selector label with a `+` initials badge.
2. User clicks the show selector button at the top of the sidebar.
3. Because `shows.length === 0`, clicking directly opens `CreateShowDialog` (short-circuits the dropdown).
4. Dialog opens, focus is placed on the name input after ~80ms.
5. User types a show name (e.g. "The Founder's Notebook").
6. User optionally types a description and/or picks a language.
7. User clicks "Create show" submit button.
8. `useShows().createShow()` POSTs to `/api/shows`.
9. On success, dialog closes, sidebar refreshes via the `podbrain:shows-changed` broadcast event, and the new show becomes the current show (via `onCreated` callback).

### Flow B — Returning user creates an additional show

1. User has ≥1 show; sidebar shows the current show name in the selector.
2. User clicks the show selector → dropdown opens with existing shows.
3. User clicks "Add new show" at the bottom of the dropdown.
4. `CreateShowDialog` opens (dropdown closes).
5. Same steps as Flow A from step 5 onward.

### Flow C — Tier limit hit (Free plan second show)

1. User on Free plan already has 1 show.
2. User opens `CreateShowDialog` via the "Add new show" button.
3. Submits with a valid name.
4. `POST /api/shows` returns 403 with body `{ error: "You've reached your 1 show limit on the free plan. Upgrade to add more shows." }`.
5. `useShows.createShow` extracts the message and re-throws.
6. Dialog catches the throw, displays the error text in the amber alert box, sets `isSubmitting = false`, and remains open so the user can retry with a different strategy.

### Flow D — Validation failure (empty name)

1. Dialog is open. Submit button is disabled while the name input is empty (`disabled={!name.trim() || isSubmitting}`).
2. User cannot submit. No API call is made.

### Flow E — Duplicate show name (uniqueness collision)

1. User submits a name that already exists for their account.
2. `POST /api/shows` returns 409 with body `{ error: "A show with this name already exists" }`.
3. Dialog surfaces the specific error message in the alert box (not a generic "Show creation failed" fallback).

### Flow F — Dialog close during submit

1. User clicks "Create show".
2. While the POST is in flight, user attempts to close the dialog (click overlay, Escape key, or X button).
3. `handleOpenChange` returns early because `isSubmitting === true`. Close is blocked.
4. Dialog stays open until the request resolves or rejects.

## Selector Inventory

| Selector | Element | Purpose |
|---|---|---|
| `role=dialog` | `<Dialog.Content>` | The dialog root. Radix auto-adds `role="dialog"`. |
| Dialog `data-state` attribute | `<Dialog.Content>` | `"open"` or `"closed"` — reliable for wait conditions. |
| `#show-name` | `<Input>` name field | Primary text input for the show name. |
| `#show-description` | `<textarea>` | Optional description field. |
| `#show-language` | `<select>` | Primary language selector. |
| `button[type=submit]` inside `role=dialog` | Submit button | The "Create show" button. Text changes to "Creating…" while submitting. |
| `button[aria-label="Close"]` | X close button | Header close button. |
| `role=alert` inside dialog | Error display | Shown only when the create call fails. |
| Button with text `"Create your first show"` (sidebar) | Sidebar show selector (empty state) | Opens dialog directly when `shows.length === 0`. |
| Button with text `"Add new show"` (sidebar dropdown) | Dropdown footer button | Opens dialog and closes the dropdown. |
| `Dialog.Title` text `"Create new show"` | Title heading | Stable text anchor. |

**Selector source evidence:**
- `create-show-dialog.tsx:127` — `id="show-name"`
- `create-show-dialog.tsx:146` — `id="show-description"`
- `create-show-dialog.tsx:158` — `id="show-language"`
- `create-show-dialog.tsx:113` — `aria-label="Close"`
- `create-show-dialog.tsx:179` — `type="button"` + `"Cancel"` text for the cancel button
- `create-show-dialog.tsx:184` — `type="submit"` + conditional "Creating…" / "Create show" text
- `sidebar.tsx:264–274` — `"Add new show"` dropdown button
- `sidebar.tsx:216` — show selector button (label depends on `hasShows`)
- `create-show-dialog.tsx:167–174` — `<div role="alert">` wrapping the error text

**Gap:** No `data-testid` attributes. I'm relying on stable IDs, ARIA roles, and text labels. This is acceptable for the POM because Radix provides `role=dialog` and the form fields have stable HTML IDs.

## API Endpoints

| Method | Path | Auth | Request body | Success | Errors |
|---|---|---|---|---|---|
| POST | `/api/shows` | Required (cookie session) | `{ name, description?, default_language?, style_preferences?, artwork_url? }` | `201 { data: Show }` | `400` Zod validation, `403` tier limit, `409` duplicate name, `429` rate limited (20/min), `500` internal |
| GET | `/api/shows` | Required | — | `200 { data: Show[] }` | — |

**Validation schema** (`lib/validation-schemas.ts:33`):
- `name`: trimmed string, max 200 chars, required
- `description`: optional trimmed, max 5000 chars
- `default_language`: 2–10 chars, defaults to `'en'`
- `artwork_url`: optional URL, max 2000 chars

**Rate limit:** `create-show:${userId}` → 20 requests per minute (`route.ts:68`).

## Edge Cases and Error States

1. **Empty name** — Submit disabled; no API call. Covered by input `required` + button `disabled` guards.
2. **Whitespace-only name** — `trim()` applied in `handleSubmit`; submit blocked before API call.
3. **Name > 200 chars** — `maxLength={200}` on input + Zod validation server-side.
4. **Network failure during POST** — `fetch` throws → caught → message "Failed to create show" shown in alert.
5. **Non-JSON error response** (gateway 502) — `createShow` tries `.json()` inside try/catch, falls back to generic message.
6. **Rate limit 429** — Generic "Failed to create show" shown (not enriched with retry-after info — minor gap).
7. **Dialog closed mid-submit** — Blocked by `handleOpenChange` guard.
8. **Tier limit (Free → 2nd show)** — Real API error message surfaced via throw/rethrow.
9. **Duplicate name collision** — Real API error message surfaced.
10. **Session expired during submit** — 401 response; dialog shows generic error. Middleware would also redirect on next navigation.

## Dependencies

- **Auth session** — Required. Middleware redirects `/episodes`, `/upload`, etc. to `/login` without a session.
- **`useShows` hook** — Cross-instance event broadcast via `podbrain:shows-changed` keeps the sidebar in sync.
- **Tier limits** — `canCreateShow` in `lib/tier-limits.ts`.
- **Radix UI Dialog** — Focus trap, portal, Escape-to-close, click-outside-to-close.

## Recommended Test Priorities

### P0 — Critical smoke tests
1. Empty-state sidebar opens the dialog directly (first-time user can actually create a show).
2. A new show can be created end-to-end: dialog opens, form submits, dialog closes, sidebar updates.
3. Submit button is disabled when the name field is empty.

### P1 — Important
4. Dropdown "Add new show" button opens the dialog when a show already exists.
5. Dialog surfaces the real API error message on tier-limit rejection (not a generic fallback).
6. Dialog does NOT close while a submit is in flight (race-condition safety).
7. Dialog title "Create new show" is visible when open.

### P2 — Nice-to-have
8. Description and language fields persist across a submit error (so the user doesn't lose their input).
9. Escape key closes the dialog when not submitting.
10. Focus lands on the name input after the dialog opens.
