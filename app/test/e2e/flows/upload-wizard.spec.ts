/**
 * Upload Wizard E2E Tests
 *
 * Tests the refactored 3-step upload flow. Focus is on the new Supabase
 * pre-signed URL flow that replaced the broken file-body-through-Netlify
 * approach during this session's Phase 2 fixes.
 *
 * Scope: up to and including the POST /api/episodes success. We do NOT
 * wait for real AssemblyAI transcription — that's too slow and expensive
 * for E2E. Processing job dispatch is verified by checking the episode
 * row exists in the database.
 *
 * Source of truth:
 * - specs/features/upload-wizard-analysis.md
 * - specs/plans/upload-wizard-test-plan.md
 */
import path from 'node:path'
import { test, expect } from '../fixtures/base'
import { getAdminClient, cleanupTestDataByPattern } from '../../setup/database'
import { UploadWizardPage } from '../pages/upload-wizard-page'
import {
  createTestUser,
  createTestShow,
  deleteTestUser,
  signIn,
  type TestUser,
} from '../helpers/auth'

// Resolved to the existing 1.3 MB test MP3 already in the repo
const FIXTURE_MP3 = path.resolve(__dirname, '../../fixtures/test-podcast-clip.mp3')

// ─────────────────────────────────────────────────────────────────────────
// P0 — Critical smoke tests
// ─────────────────────────────────────────────────────────────────────────

test.describe('Upload Wizard [P0]', () => {
  let testUser: TestUser

  test.beforeAll(async () => {
    testUser = await createTestUser('p0')
    await createTestShow(testUser.id)
  })

  test.afterAll(async () => {
    await deleteTestUser(testUser)
    await cleanupTestDataByPattern()
  })

  test.beforeEach(async ({ page }) => {
    await signIn(page, testUser)
  })

  test('P0-1: renders Step 1 with drop zone visible', async ({ page }) => {
    const wizard = new UploadWizardPage(page)
    await wizard.goto()
    await wizard.expectStep1Visible()
    await wizard.expectNextDisabled()
  })

  test('P0-2: accepts a file via hidden input and queues it', async ({ page }) => {
    const wizard = new UploadWizardPage(page)
    await wizard.goto()

    await wizard.attachFile(FIXTURE_MP3)

    // Once a file is in the queue, the drop zone swaps its label and the
    // Next button enables. Either signal confirms acceptance.
    await expect(wizard.page.getByText('Add more files')).toBeVisible({ timeout: 5000 })
    await wizard.expectNextEnabled()
  })

  test('P0-3: creates an episode via the full 3-step flow', async ({ page }) => {
    const wizard = new UploadWizardPage(page)
    await wizard.goto()
    await wizard.attachFile(FIXTURE_MP3)
    await wizard.expectNextEnabled()

    // Step 1 → Step 2
    await wizard.clickNext()
    await wizard.expectStep2Visible()

    // Step 2 → Step 3 (skip filling context — all fields optional)
    await wizard.clickNext()
    await wizard.expectStep3Visible()

    // Submit
    await wizard.submit()

    // Success criterion: URL changes to /episodes/<uuid>
    await page.waitForURL(/\/episodes\/[0-9a-f-]{36}/, { timeout: 30_000 })

    // Verify an episode row was created in the database for this user
    const admin = getAdminClient()
    const { data: shows } = await admin.from('shows').select('id').eq('user_id', testUser.id)
    const showIds = (shows ?? []).map((s) => s.id)
    const { data: episodes } = await admin
      .from('episodes')
      .select('id, title, audio_url, status')
      .in('show_id', showIds)
    expect(episodes).toBeTruthy()
    expect(episodes!.length).toBeGreaterThanOrEqual(1)
    // audio_url should be a Supabase public URL (not empty, not a placeholder)
    expect(episodes![0].audio_url).toMatch(/supabase\.co\/storage\/v1\/object\/public\/episodes\//)
  })
})

// ─────────────────────────────────────────────────────────────────────────
// P1 — Important
// ─────────────────────────────────────────────────────────────────────────

test.describe('Upload Wizard [P1]', () => {
  test('P1-1: disables Next when queue is empty', async ({ page }) => {
    const user = await createTestUser('p1-1')
    await createTestShow(user.id)
    try {
      await signIn(page, user)
      const wizard = new UploadWizardPage(page)
      await wizard.goto()
      await wizard.expectNextDisabled()
    } finally {
      await deleteTestUser(user)
    }
  })

  test('P1-2: shows error toast when no show exists', async ({ page }) => {
    // Separate test user with NO show
    const user = await createTestUser('p1-2')
    try {
      await signIn(page, user)
      const wizard = new UploadWizardPage(page)
      await wizard.goto()
      await wizard.attachFile(FIXTURE_MP3)
      await wizard.clickNext() // → Step 2
      await wizard.clickNext() // → Step 3
      await wizard.submit()

      // Toast should surface the specific error
      await expect(page.getByText(/No show found/i)).toBeVisible({ timeout: 5000 })

      // URL should still be /upload — the wizard should not navigate
      expect(page.url()).toContain('/upload')
    } finally {
      await deleteTestUser(user)
    }
  })

  test('P1-3: preserves the queue across Next/Back navigation', async ({ page }) => {
    const user = await createTestUser('p1-3')
    await createTestShow(user.id)
    try {
      await signIn(page, user)
      const wizard = new UploadWizardPage(page)
      await wizard.goto()
      await wizard.attachFile(FIXTURE_MP3)
      await expect(wizard.page.getByText('Add more files')).toBeVisible()

      // Step 1 → Step 2 → Step 1
      await wizard.clickNext()
      await wizard.expectStep2Visible()
      await wizard.clickBack()
      await wizard.expectStep1Visible()

      // Drop zone should still show the "Add more files" label because
      // the queue is preserved
      await expect(wizard.page.getByText('Add more files')).toBeVisible()
    } finally {
      await deleteTestUser(user)
    }
  })
})

// ─────────────────────────────────────────────────────────────────────────
// P2 — Nice-to-have
// ─────────────────────────────────────────────────────────────────────────

test.describe('Upload Wizard [P2]', () => {
  let testUser: TestUser

  test.beforeAll(async () => {
    testUser = await createTestUser('p2')
    await createTestShow(testUser.id)
  })

  test.afterAll(async () => {
    await deleteTestUser(testUser)
    await cleanupTestDataByPattern()
  })

  test.beforeEach(async ({ page }) => {
    await signIn(page, testUser)
  })

  test('P2-1: adds a URL to the queue', async ({ page }) => {
    const wizard = new UploadWizardPage(page)
    await wizard.goto()

    const testUrl = 'https://example.com/podcasts/episode.mp3'
    await wizard.addUrl(testUrl)

    // The queue now has 1 item. Assert via the "Ready to process" label
    // that only appears above the queue when queue.length > 0, and via the
    // Next button becoming enabled. The DropZone is hidden on the URL tab,
    // so its "Add more files" label is not a valid signal here.
    await expect(page.getByText(/Ready to process/i)).toBeVisible({ timeout: 3000 })
    await wizard.expectNextEnabled()
  })
})
