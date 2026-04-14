/**
 * Show Creation E2E Tests
 *
 * Tests the complete CreateShowDialog flow that was introduced in the
 * Phase 2 refactor (previously the "Add new show" button was a dead
 * no-op that blocked new users from ever uploading episodes).
 *
 * These tests run against REAL Supabase. Test users and shows are cleaned
 * up in afterAll. All artifacts use the [TEST] prefix so the global
 * cleanup helper catches any strays.
 *
 * Source of truth:
 * - specs/features/show-creation-analysis.md
 * - specs/plans/show-creation-test-plan.md
 */
import { test, expect } from '../fixtures/base'
import { getAdminClient, cleanupTestDataByPattern } from '../../setup/database'
import { ShowCreationPage } from '../pages/show-creation-page'
import { createTestUser, deleteTestUser, signIn, type TestUser } from '../helpers/auth'

// ─────────────────────────────────────────────────────────────────────────
// P0 — Critical smoke tests
// ─────────────────────────────────────────────────────────────────────────

test.describe('Show Creation [P0]', () => {
  let testUser: TestUser

  test.beforeAll(async () => {
    testUser = await createTestUser('p0')
  })

  test.afterAll(async () => {
    await deleteTestUser(testUser)
    await cleanupTestDataByPattern()
  })

  test.beforeEach(async ({ page }) => {
    await signIn(page, testUser)
  })

  test('P0-1: opens CreateShowDialog when clicking sidebar empty-state button', async ({ page }) => {
    const showPage = new ShowCreationPage(page)

    // The sidebar should show the empty-state label because this is a fresh user
    await expect(page.getByRole('button', { name: /Create your first show/i })).toBeVisible()

    await showPage.openDialogFromEmptyState()
    await showPage.expectDialogOpen()
    await expect(showPage.dialogTitle()).toBeVisible()

    // Focus should land on the name input shortly after open (useEffect ~80ms)
    await expect(showPage.nameInput()).toBeFocused()
  })

  test('P0-2: creates a new show end-to-end from the empty state', async ({ page }) => {
    const showPage = new ShowCreationPage(page)
    const showName = `[TEST] Smoke Show ${Date.now()}`

    await showPage.createShowFromEmptyState(showName)
    await showPage.expectDialogClosed()

    // The sidebar should now show the new show name
    await expect(page.getByText(showName).first()).toBeVisible({ timeout: 5000 })

    // Verify the show was persisted in the database
    const admin = getAdminClient()
    const { data: shows } = await admin
      .from('shows')
      .select('id,name,user_id')
      .eq('user_id', testUser.id)
    expect(shows).toHaveLength(1)
    expect(shows?.[0].name).toBe(showName)
  })

  test('P0-3: disables submit button when name is empty', async ({ page }) => {
    const showPage = new ShowCreationPage(page)

    // We need to make the current user has 0 shows again. P0-2 may have
    // created one, but per-test isolation is handled by beforeAll scoping
    // to the describe block — inside a describe block tests share state.
    // To keep P0-3 independent, delete any lingering shows before opening
    // the dialog.
    const admin = getAdminClient()
    await admin.from('shows').delete().eq('user_id', testUser.id)
    await page.reload()

    await showPage.openDialogFromEmptyState()
    await showPage.expectDialogOpen()

    // Name field starts empty → submit should be disabled
    await expect(showPage.nameInput()).toHaveValue('')
    await expect(showPage.submitButton()).toBeDisabled()

    // Typing whitespace only should not enable the button
    await showPage.fillName('   ')
    await expect(showPage.submitButton()).toBeDisabled()
  })
})

// ─────────────────────────────────────────────────────────────────────────
// P1 — Important
// ─────────────────────────────────────────────────────────────────────────

test.describe('Show Creation [P1]', () => {
  let testUser: TestUser
  let preExistingShowName: string

  test.beforeAll(async () => {
    testUser = await createTestUser('p1')
    // Pre-seed 1 show so the dropdown path is exercised and the free-tier
    // limit can be hit.
    preExistingShowName = `[TEST] Pre-existing ${Date.now()}`
    const admin = getAdminClient()
    await admin.from('shows').insert({
      user_id: testUser.id,
      name: preExistingShowName,
      default_language: 'en',
    })
  })

  test.afterAll(async () => {
    await deleteTestUser(testUser)
    await cleanupTestDataByPattern()
  })

  test.beforeEach(async ({ page }) => {
    await signIn(page, testUser)
  })

  test('P1-1: opens dialog from dropdown "Add new show" button', async ({ page }) => {
    const showPage = new ShowCreationPage(page)

    // With a pre-existing show, clicking the selector opens the dropdown
    await showPage.openDialogFromDropdown(preExistingShowName)
    await showPage.expectDialogOpen()
    await expect(showPage.dialogTitle()).toBeVisible()
  })

  test('P1-2: surfaces real API error when free tier limit exceeded', async ({ page }) => {
    const showPage = new ShowCreationPage(page)

    await showPage.openDialogFromDropdown(preExistingShowName)
    await showPage.expectDialogOpen()
    await showPage.fillName(`[TEST] Second Show ${Date.now()}`)
    await showPage.submit()

    // The dialog should surface the specific tier-limit error, NOT a
    // generic "Show creation failed" — this is the regression guard.
    await showPage.expectErrorMessage(/1 show limit on the free plan/i)

    // Dialog must remain open so the user can take corrective action
    await expect(showPage.dialog()).toBeVisible()
  })

  test('P1-4: shows "Create new show" title when open', async ({ page }) => {
    const showPage = new ShowCreationPage(page)
    await showPage.openDialogFromDropdown(preExistingShowName)
    await expect(showPage.dialogTitle()).toHaveText('Create new show')
  })
})

// ─────────────────────────────────────────────────────────────────────────
// P2 — Nice-to-have
// ─────────────────────────────────────────────────────────────────────────

test.describe('Show Creation [P2]', () => {
  let testUser: TestUser

  test.beforeAll(async () => {
    testUser = await createTestUser('p2')
  })

  test.afterAll(async () => {
    await deleteTestUser(testUser)
    await cleanupTestDataByPattern()
  })

  test.beforeEach(async ({ page }) => {
    await signIn(page, testUser)
  })

  test('P2-1: focuses the name input after open', async ({ page }) => {
    const showPage = new ShowCreationPage(page)
    await showPage.openDialogFromEmptyState()
    await showPage.expectDialogOpen()
    // useEffect schedules focus ~80ms after open; the assertion auto-retries.
    await expect(showPage.nameInput()).toBeFocused()
  })

  test('P2-2: closes the dialog on Escape when idle', async ({ page }) => {
    const showPage = new ShowCreationPage(page)
    await showPage.openDialogFromEmptyState()
    await showPage.expectDialogOpen()
    await page.keyboard.press('Escape')
    await showPage.expectDialogClosed()
  })
})
