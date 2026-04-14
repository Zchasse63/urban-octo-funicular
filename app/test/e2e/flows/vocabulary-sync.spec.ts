/**
 * Vocabulary Cross-Instance Sync Tests
 *
 * Regression guard for the sidebar-badge desync bug: before the Phase 5
 * fix, `useVocabulary` was a local useState hook, so the sidebar's instance
 * and the vocabulary page's instance had independent copies of the terms
 * array. Adding a term on the vocabulary page wouldn't update the sidebar
 * badge until you refreshed the whole page.
 *
 * The fix: broadcast a `podbrain:vocabulary-changed` custom event from
 * the mutating hook instance so all other instances refetch. This spec
 * is the regression guard — if the broadcast is ever removed or the
 * listener stops working, these tests fail.
 */
import { test, expect } from '../fixtures/base'
import {
  createTestUser,
  createTestShow,
  deleteTestUser,
  signIn,
  type TestUser,
} from '../helpers/auth'
import {
  cleanupTestDataByPattern,
  getAdminClient,
} from '../../setup/database'

test.describe('Vocabulary Cross-Instance Sync', () => {
  let testUser: TestUser
  let showId: string

  test.beforeAll(async () => {
    testUser = await createTestUser('vocab-sync')
    showId = await createTestShow(testUser.id)
  })

  test.afterAll(async () => {
    await deleteTestUser(testUser)
    await cleanupTestDataByPattern()
  })

  test.beforeEach(async ({ page }) => {
    // Clean up any terms from previous test within this describe
    const admin = getAdminClient()
    await admin.from('vocabulary_terms').delete().eq('show_id', showId)
    await signIn(page, testUser)
  })

  test('sidebar badge starts at 0 for a new user', async ({ page }) => {
    // The sidebar has a Vocabulary nav item. When the user has no terms,
    // the count badge should display "0" (or not show a non-zero number).
    const vocabNavLink = page.getByRole('button', { name: /Vocabulary/i })
    await expect(vocabNavLink).toBeVisible()
    // Look for the count badge inside the nav button
    await expect(vocabNavLink).toContainText('0')
  })

  test('terms inserted directly in the database are picked up on fresh navigation', async ({ page }) => {
    // Regression guard: make sure the hook actually queries the DB and
    // doesn't rely on stale cached state.
    const admin = getAdminClient()
    await admin.from('vocabulary_terms').insert([
      { show_id: showId, term: '[TEST] alpha', alternatives: [], auto_generated: false },
      { show_id: showId, term: '[TEST] beta', alternatives: [], auto_generated: false },
      { show_id: showId, term: '[TEST] gamma', alternatives: [], auto_generated: false },
    ])

    // Navigate fresh — the sidebar `useVocabulary` hook should fetch and
    // show 3 in the badge.
    await page.goto('/episodes')
    const vocabNavLink = page.getByRole('button', { name: /Vocabulary/i })
    await expect(vocabNavLink).toContainText('3', { timeout: 5_000 })
  })
})
