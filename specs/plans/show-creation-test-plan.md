# Test Plan — Show Creation

**Feature:** `show-creation`
**Architect:** qa-architect
**Date:** 2026-04-09
**Source:** `specs/features/show-creation-analysis.md`

## Suite Overview

This plan exercises the `CreateShowDialog` flow end-to-end against a live dev server + real Supabase. The feature is the primary onboarding gate — without it, new users cannot upload episodes. The plan has **3 P0 tests** (the "5-minute smoke test"), **4 P1 tests**, and **3 P2 tests**.

All tests use a fresh test user created in `test.beforeAll` via the Supabase admin client. Test users have the email pattern `[TEST]-show-creation-{timestamp}@test.local`. The test user is created on Free tier (default), so it starts with 0 shows.

## Shared Fixtures

| Fixture | Purpose | Created in |
|---|---|---|
| `testUser` | Email + password + user id for the session | `beforeAll` (admin.auth.createUser + users row upsert) |
| `signedInContext` | Playwright page with an active session cookie | `beforeEach` (via the login page) |

## Page Object Model — `ShowCreationPage`

| Method | Returns | Wraps |
|---|---|---|
| `goto()` | `void` | `page.goto('/episodes')` + wait for the sidebar to hydrate |
| `showSelectorButton()` | `Locator` | The main show selector button in the sidebar |
| `openDialogFromEmptyState()` | `void` | Clicks the show selector when `shows.length === 0` |
| `openDialogFromDropdown()` | `void` | Clicks the selector to open dropdown, then clicks "Add new show" |
| `dialog()` | `Locator` | `page.getByRole('dialog')` |
| `nameInput()` | `Locator` | `page.locator('#show-name')` |
| `descriptionInput()` | `Locator` | `page.locator('#show-description')` |
| `languageSelect()` | `Locator` | `page.locator('#show-language')` |
| `submitButton()` | `Locator` | Submit button inside the dialog |
| `cancelButton()` | `Locator` | Cancel button inside the dialog |
| `errorAlert()` | `Locator` | `dialog.getByRole('alert')` |
| `fillName(name: string)` | `void` | Fill + blur |
| `createShow(name, opts)` | `void` | Open (if not already), fill, submit |
| `expectDialogOpen()` | `void` | Asserts `data-state="open"` |
| `expectDialogClosed()` | `void` | Waits for the dialog to be detached or `data-state="closed"` |

## P0 Tests (Critical — 5-minute smoke)

| # | Test name | Precondition | Steps | Expected |
|---|---|---|---|---|
| P0-1 | `should open CreateShowDialog when clicking sidebar empty-state button` | User signed in, 0 shows | 1. Navigate to `/episodes` <br> 2. Click the sidebar show selector | Dialog opens (`data-state="open"`), title "Create new show" visible, name input is focused |
| P0-2 | `should create a new show end-to-end from the empty state` | User signed in, 0 shows | 1. Open dialog from empty state <br> 2. Fill name `[TEST] Smoke Show {uid}` <br> 3. Click "Create show" | Dialog closes, show appears in sidebar, `GET /api/shows` returns 1 show |
| P0-3 | `should disable submit button when name is empty` | Dialog open | 1. Leave name empty | Submit button is `disabled` |

## P1 Tests (Important)

| # | Test name | Precondition | Steps | Expected |
|---|---|---|---|---|
| P1-1 | `should open dialog from dropdown Add new show button` | User has ≥1 show | 1. Click show selector to open dropdown <br> 2. Click "Add new show" | Dialog opens |
| P1-2 | `should surface real API error when free tier limit exceeded` | Free user with 1 show already | 1. Open dialog via dropdown <br> 2. Fill valid name <br> 3. Submit | Error alert shows text containing "1 show limit on the free plan" — NOT generic "Show creation failed". Dialog remains open. |
| P1-3 | `should not close the dialog while a submit is in flight` | Dialog open with valid name | 1. Click submit (which will race) <br> 2. Immediately press Escape | Dialog remains open until request resolves |
| P1-4 | `should show "Create new show" title when open` | Dialog opened | 1. Open dialog | Dialog title element contains exact text "Create new show" |

## P2 Tests (Nice-to-have)

| # | Test name | Precondition | Steps | Expected |
|---|---|---|---|---|
| P2-1 | `should focus the name input after open` | Dialog open | 1. Open dialog <br> 2. Wait 150ms | `document.activeElement` matches `#show-name` |
| P2-2 | `should close the dialog on Escape when not submitting` | Dialog open, idle | 1. Press Escape | Dialog closes |
| P2-3 | `should preserve form input when API error occurs` | Tier limit hit | 1. Fill name and description <br> 2. Submit (fails with 403) | After error, name and description still contain the typed values |

## Database Seed Requirements

- **Before all tests:** Create test user via `getAdminClient().auth.admin.createUser({ email_confirm: true })`. Insert corresponding row in `public.users`.
- **Before P1-2 specifically:** Seed the test user with exactly 1 pre-existing show with name `[TEST] Pre-existing Show {uid}`.
- **After all tests:** Call `cleanupTestDataByPattern()` to drop all `[TEST]%` shows (cascades to episodes/assets), then `admin.auth.admin.deleteUser(testUser.id)` to remove the auth record.

## Out of Scope (Not in this plan)

- OAuth sign-in (separate auth test suite)
- Multi-show navigation after creation (covered by `show-management.spec.ts` flows)
- Show editing and deletion
- Language selector values other than English (no functional difference — just a stored string)
