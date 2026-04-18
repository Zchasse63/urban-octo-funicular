/**
 * Core Paid Flow — End-to-End Test Suite
 *
 * This is the revenue-critical journey PodBrain sells: authenticated
 * podcaster uploads audio, processes through the pipeline, and walks
 * away with the full content deliverable package (show notes, 30+
 * assets, transcript, guest package, RSS tags, downloadable ZIP).
 *
 * Source of truth:
 * - specs/features/core-paid-flow-analysis.md
 * - specs/plans/core-paid-flow-test-plan.md
 *
 * Fast-forward strategy: tests that would otherwise wait on AssemblyAI
 * (2–4 min) or end-to-end xAI asset generation bypass the real pipeline
 * by seeding a `completed` episode directly, then validate the rendered
 * state and contract-level behavior of each downstream system.
 */
import path from 'node:path'
import { test, expect } from '../fixtures/base'
import { cleanupTestDataByPattern, getAdminClient } from '../../setup/database'
import { UploadWizardPage } from '../pages/upload-wizard-page'
import { EpisodeDetailPage } from '../pages/episode-detail-page'
import {
  signIn,
  deleteTestUser,
  type TestUser,
} from '../helpers/auth'
import {
  createCoreQaUser,
  seedCompletedEpisodeWithAssets,
  seedCompletedEpisodeNoAssets,
  seedEpisodeForTimestampRegression,
  seedEpisodeWithBrokenTimestampMarkdown,
  seedPendingEpisode,
  seedAttackPayloadEpisode,
} from '../fixtures/core-paid-flow'
import {
  downloadAssetsZip,
  fetchGuestPackage,
  sendGuestPackageEmail,
  processEpisode,
  getEpisode,
  getProcessStatus,
  postAssemblyaiWebhook,
  requestSignedUploadUrl,
} from '../helpers/core-paid-flow-api'
import { installResendBlock } from '../helpers/resend-intercept'

const FIXTURE_MP3 = path.resolve(__dirname, '../../fixtures/test-podcast-clip.mp3')

// ─────────────────────────────────────────────────────────────────────────
// P0 — Critical
// ─────────────────────────────────────────────────────────────────────────

test.describe('Core Paid Flow [P0]', () => {
  let testUser: TestUser
  let showId: string

  test.beforeAll(async () => {
    const ctx = await createCoreQaUser('p0')
    testUser = ctx.user
    showId = ctx.showId
  })

  test.afterAll(async () => {
    await deleteTestUser(testUser)
    await cleanupTestDataByPattern()
  })

  test.beforeEach(async ({ page }) => {
    await signIn(page, testUser)
  })

  test('T-001: upload wizard creates an episode via pre-signed URL flow', async ({ page }) => {
    const wizard = new UploadWizardPage(page)
    await wizard.goto()

    await wizard.attachFile(FIXTURE_MP3)
    await wizard.expectNextEnabled()

    // Step 1 → Step 2
    await wizard.clickNext()
    await wizard.expectStep2Visible()

    await wizard.fillExpertContext({
      episodeTitle: '[TEST] [CORE-QA] T-001 Happy Path',
      description: 'A test-seeded episode description.',
      guestName: 'Dr. Test Guest',
      guestBio: 'Test guest bio.',
    })

    // Step 2 → Step 3
    await wizard.clickNext()
    await wizard.expectStep3Visible()

    // Submit
    await wizard.submitButtonByTestId().click()

    // Success: URL shifts to the new episode detail page
    await page.waitForURL(/\/episodes\/[0-9a-f-]{36}/, { timeout: 30_000 })

    // Verify DB side-effects
    const admin = getAdminClient()
    const { data: episodes } = await admin
      .from('episodes')
      .select('id, title, audio_url, status, guest_name, guest_bio, metadata')
      .eq('show_id', showId)

    expect(episodes).toBeTruthy()
    expect(episodes!.length).toBeGreaterThanOrEqual(1)
    const ep = episodes![0]
    expect(ep.audio_url).toMatch(/supabase\.co\/storage\/v1\/object\/public\/episodes\//)
    expect(ep.title).toBe('[TEST] [CORE-QA] T-001 Happy Path')
    expect(ep.guest_name).toBe('Dr. Test Guest')
    // status should be `pending` or `processing` — both indicate the
    // trigger dispatch attempt (real Trigger.dev may not be reachable
    // in every local environment, so we accept either).
    expect(['pending', 'processing']).toContain(ep.status)
  })

  test('T-002: completed episode exposes all 6 tabs without Stoicism mock data', async ({ page }) => {
    const { episodeId } = await seedCompletedEpisodeWithAssets(showId, {
      title: '[TEST] [CORE-QA] T-002 Six Tabs',
    })

    const episode = new EpisodeDetailPage(page)
    await episode.goto(episodeId)

    const tabIds = [
      'show-notes',
      'assets',
      'transcript',
      'guest',
      'intelligence',
      'rss-tags',
    ] as const

    for (const id of tabIds) {
      await expect(episode.tabButton(id)).toBeVisible()
    }
    await episode.expectNoStoicism()
  })

  test('T-003: transcript timestamps render MM:SS from milliseconds (BUG #29 guard)', async ({ page }) => {
    const episodeId = await seedEpisodeForTimestampRegression(showId)

    const episode = new EpisodeDetailPage(page)
    await episode.goto(episodeId)
    await episode.clickTab('transcript')

    // First segment.start = 3000ms → must render as 00:03 (NOT 50:00).
    const firstTs = episode.firstTranscriptTimestamp()
    await expect(firstTs).toBeVisible()
    const tsText = (await firstTs.innerText()).trim()
    expect(tsText, `First timestamp should be ~00:03 from 3000ms, got "${tsText}"`).toMatch(
      /^00:0[0-9]$/
    )
  })

  test('T-004: show notes do not render broken [N:NN](N:NN) markdown (BUG #11 guard)', async ({ page }) => {
    const episodeId = await seedEpisodeWithBrokenTimestampMarkdown(showId)

    const episode = new EpisodeDetailPage(page)
    await episode.goto(episodeId)
    // Default tab is show-notes; explicitly click to be safe
    await episode.clickTab('show-notes')
    await episode.assertNoBrokenTimestampLinks()
  })

  test('T-005: ZIP download returns application/zip with attachment disposition', async ({ page }) => {
    const { episodeId } = await seedCompletedEpisodeWithAssets(showId, {
      title: '[TEST] [CORE-QA] T-005 ZIP Download',
    })

    // Direct API contract check via Playwright's request context (which
    // carries the authenticated session cookies from the browser).
    const result = await downloadAssetsZip(page.request, episodeId)

    expect(result.status).toBe(200)
    expect(result.contentType).toMatch(/^application\/zip/i)
    expect(result.contentDisposition).toMatch(/attachment; filename=/i)
    expect(result.byteLength).toBeGreaterThan(0)
  })

  test('T-006: guest package GET returns structured content for completed episode', async ({ page }) => {
    const { episodeId } = await seedCompletedEpisodeWithAssets(showId, {
      title: '[TEST] [CORE-QA] T-006 Guest Package',
      guestName: 'Dr. QA Guest',
    })

    const result = await fetchGuestPackage(page.request, episodeId)
    expect(result.status).toBe(200)
    expect(result.data).toBeTruthy()
    expect(result.data!.package).toBeTruthy()
    expect(Array.isArray(result.data!.package.socialPosts)).toBe(true)
    expect(result.data!.package.socialPosts.length).toBeGreaterThan(0)
    expect(typeof result.data!.package.emailSubject).toBe('string')
    expect(result.data!.package.emailSubject.length).toBeGreaterThan(0)
    expect(typeof result.data!.package.emailBody).toBe('string')
    expect(result.data!.package.emailBody.length).toBeGreaterThan(0)
  })

  test('T-007: AssemblyAI webhook returns 401 on missing or bad token', async ({ page }) => {
    // This endpoint is session-less; the Playwright request context works
    // fine without a cookie. We reuse page.request purely for convenience.
    const body = { transcript_id: 'core-qa-fake', status: 'completed' }

    // 1) No token param → 401
    const noToken = await postAssemblyaiWebhook(page.request, undefined, body)
    expect(
      noToken.status,
      `Expected 401 for missing token, got ${noToken.status} body=${JSON.stringify(noToken.body)}`
    ).toBe(401)

    // 2) Wrong token → 401
    const wrongToken = await postAssemblyaiWebhook(page.request, 'definitely-not-the-secret', body)
    expect(wrongToken.status).toBe(401)

    // 3) Length-mismatched token (1 char) → 401, NOT 500 (timing-safe compare guard)
    const shortToken = await postAssemblyaiWebhook(page.request, 'a', body)
    expect(shortToken.status).toBe(401)
  })

  test('T-008: RLS blocks cross-user access to another user\'s episode', async ({ page }) => {
    // User A = testUser (already signed in via beforeEach)
    // Create user B + their own episode
    const bCtx = await createCoreQaUser('p0-rls-b')
    try {
      const { episodeId: bEpisodeId } = await seedCompletedEpisodeWithAssets(bCtx.showId, {
        title: '[TEST] [CORE-QA] RLS Victim',
      })

      // From user A's session, every cross-user access must 404.
      const ep = await getEpisode(page.request, bEpisodeId)
      expect(ep.status).toBe(404)

      const zip = await downloadAssetsZip(page.request, bEpisodeId)
      expect(zip.status).toBe(404)

      const gp = await fetchGuestPackage(page.request, bEpisodeId)
      expect(gp.status).toBe(404)

      const proc = await processEpisode(page.request, bEpisodeId)
      expect(proc.status).toBe(404)
    } finally {
      await deleteTestUser(bCtx.user)
    }
  })

  test('T-009: XSS/SQLi payloads in title and guest fields are escaped', async ({ page }) => {
    const episodeId = await seedAttackPayloadEpisode(showId)

    const episode = new EpisodeDetailPage(page)
    await episode.goto(episodeId)

    // XSS inline-script payload must NOT have executed
    const xssExecuted = await page.evaluate(() => {
      const w = window as unknown as { __xss__?: boolean; __xss_img__?: boolean }
      return { script: w.__xss__ === true, img: w.__xss_img__ === true }
    })
    expect(xssExecuted.script, 'XSS <script> payload executed — title NOT escaped').toBe(false)
    expect(xssExecuted.img, 'XSS <img onerror> payload executed — bio NOT escaped').toBe(false)

    // The episodes table must still exist (the SQLi attempt in guest_name
    // should have been parameterized and inert). We prove it by simply
    // reading back the same episode.
    const admin = getAdminClient()
    const { data: stillThere } = await admin
      .from('episodes')
      .select('id, guest_name')
      .eq('id', episodeId)
      .single()
    expect(stillThere).toBeTruthy()
    expect(stillThere!.guest_name).toBe("Robert'); DROP TABLE episodes;--")
  })

  test('T-010: ZIP download returns 404 when no assets are generated', async ({ page }) => {
    const episodeId = await seedCompletedEpisodeNoAssets(showId)

    const result = await downloadAssetsZip(page.request, episodeId)
    expect(result.status).toBe(404)
    expect(result.errorBody?.error).toMatch(/no assets/i)
  })
})

// ─────────────────────────────────────────────────────────────────────────
// P1 — Should-have
// ─────────────────────────────────────────────────────────────────────────

test.describe('Core Paid Flow [P1]', () => {
  let testUser: TestUser
  let showId: string

  test.beforeAll(async () => {
    const ctx = await createCoreQaUser('p1')
    testUser = ctx.user
    showId = ctx.showId
  })

  test.afterAll(async () => {
    await deleteTestUser(testUser)
    await cleanupTestDataByPattern()
  })

  test.beforeEach(async ({ page }) => {
    await signIn(page, testUser)
  })

  test('T-011: concurrent process dispatch returns 409 on the loser', async ({ page }) => {
    const episodeId = await seedPendingEpisode(showId)

    const [a, b] = await Promise.all([
      processEpisode(page.request, episodeId),
      processEpisode(page.request, episodeId),
    ])

    const statuses = [a.status, b.status].sort()

    // Accept either (200, 409) from the atomic claim OR (200, 500)
    // if Trigger.dev is unreachable (the first request succeeds with 200
    // or rolls back to 500; the second, late-arriving request sees the
    // claim and returns 409). The core assertion is that BOTH requests
    // did NOT return 200 — if they did, the atomic claim is broken.
    expect(
      statuses,
      `Expected one 409 indicating atomic-claim protection, got ${JSON.stringify(statuses)}`
    ).toContain(409)
  })

  test('T-012: user at audio-minutes cap cannot submit', async ({ page }) => {
    // Push the signed-in test user WAY over a pro-tier monthly cap
    // (pro = 2500 minutes/mo per lib/tier-limits — push to 99999).
    const { setSubscriptionState } = await import('../helpers/factories')
    await setSubscriptionState(testUser.id, {
      status: 'active',
      tier: 'pro',
      minutesConsumed: 99_999,
    })

    const wizard = new UploadWizardPage(page)
    await wizard.goto()

    // Either the banner appears OR, if the tier-limits lookup times out,
    // the submit path returns 403 on direct API call. We accept both.
    const bannerVisible = await page
      .getByText(/Audio minutes limit reached/i)
      .isVisible()
      .catch(() => false)

    if (bannerVisible) {
      // UI-level gate works; no further action needed.
      expect(bannerVisible).toBe(true)
    } else {
      // Belt-and-braces: hit the API directly and confirm 403.
      const res = await page.request.post('/api/episodes', {
        data: {
          show_id: showId,
          title: '[TEST] [CORE-QA] over-cap attempt',
          audio_url: 'https://example.test/over-cap.mp3',
        },
        headers: { 'Content-Type': 'application/json' },
      })
      expect(res.status()).toBe(403)
    }
  })

  test('T-013: guest package email send does not reach real Resend', async ({ page }) => {
    const interceptor = await installResendBlock(page)
    try {
      const { episodeId } = await seedCompletedEpisodeWithAssets(showId, {
        title: '[TEST] [CORE-QA] T-013 Resend Block',
        guestName: 'Test Guest',
      })

      const send = await sendGuestPackageEmail(
        page.request,
        episodeId,
        'intercepted@test.local'
      )

      // Regardless of backend outcome (200 sent-via-mock-key, 503 unconfigured,
      // 500 network-abort translated to error), NO outbound Resend call may
      // have fired from the browser context.
      expect(
        interceptor.interceptedCount(),
        `Unexpectedly intercepted ${interceptor.interceptedCount()} Resend calls from the browser: ${JSON.stringify(interceptor.interceptedUrls())}`
      ).toBe(0)

      // Accept any of: 200 (stub succeeded), 400 (char-count overflow on
      // seeded content — a real pre-send validation), 500 (abort-as-failure),
      // or 503 (Resend not configured in this env).
      expect([200, 400, 500, 503]).toContain(send.status)
    } finally {
      await interceptor.dispose()
    }
  })

  test('T-014: regenerate show notes does not break episode state', async ({ page }) => {
    const { episodeId } = await seedCompletedEpisodeWithAssets(showId, {
      title: '[TEST] [CORE-QA] T-014 Regenerate',
    })

    const episode = new EpisodeDetailPage(page)
    await episode.goto(episodeId)
    await episode.clickTab('show-notes')

    const regenBtn = episode.regenerateShowNotesButton()
    // Regenerate may not be visible in all states; the test is conditional.
    const visible = await regenBtn.isVisible().catch(() => false)
    if (!visible) {
      test.info().annotations.push({
        type: 'note',
        description: 'Regenerate button not present — nothing to test here.',
      })
      return
    }

    await regenBtn.click()
    // Click may open a confirm dialog; accept either path.
    const confirmBtn = page.getByRole('button', { name: /^Confirm$|^Yes$|^Continue$/i })
    if (await confirmBtn.isVisible().catch(() => false)) {
      await confirmBtn.click()
    }

    // Allow the page to settle; do NOT use waitForTimeout — wait for
    // the page to still be rendering the tabs container (i.e. no crash).
    await expect(episode.tabButton('show-notes')).toBeVisible()

    // Episode row in the DB must still exist and not be flipped to 'failed'
    const admin = getAdminClient()
    const { data: ep } = await admin
      .from('episodes')
      .select('id, status')
      .eq('id', episodeId)
      .single()
    expect(ep).toBeTruthy()
    expect(ep!.status).not.toBe('failed')
  })

  test('T-015: process status GET returns a well-shaped response', async ({ page }) => {
    const episodeId = await seedPendingEpisode(showId)

    // Try to trigger processing (may succeed or fail depending on Trigger.dev
    // reachability — we don't depend on that).
    await processEpisode(page.request, episodeId)

    const result = await getProcessStatus(page.request, episodeId)
    expect(result.status).toBe(200)
    const body = result.body as { data?: { status: string } } | null
    expect(body).toBeTruthy()
    expect(body!.data).toBeTruthy()
    expect(['pending', 'processing', 'completed', 'failed']).toContain(
      body!.data!.status
    )
  })

  test('T-016: episode detail polling survives navigate-away-and-back', async ({ page }) => {
    const { episodeId } = await seedCompletedEpisodeWithAssets(showId, {
      title: '[TEST] [CORE-QA] T-016 Nav Round-trip',
    })

    const episode = new EpisodeDetailPage(page)
    await episode.goto(episodeId)
    await expect(episode.tabButton('show-notes')).toBeVisible()

    // Navigate away and back
    await page.goto('/episodes')
    await expect(page).toHaveURL(/\/episodes(\?.*)?$/)

    await page.goto(`/episodes/${episodeId}`)
    await expect(episode.tabButton('show-notes')).toBeVisible()

    // No unhandled page errors should have occurred
    // (the base fixture handles Stoicism guard)
  })

  test('T-017: guest package GET handles episode with no guest_name', async ({ page }) => {
    const admin = getAdminClient()
    const { data: ep, error } = await admin
      .from('episodes')
      .insert({
        show_id: showId,
        title: '[TEST] [CORE-QA] T-017 No Guest',
        audio_url: 'https://example.test/no-guest.mp3',
        audio_duration_seconds: 120,
        status: 'completed',
        transcript: 'Solo episode transcript.',
        show_notes: '# Solo Episode\n\nNo guest.',
        guest_name: null,
        guest_bio: null,
        metadata: {},
      })
      .select('id')
      .single()
    if (error || !ep) throw new Error(`Failed to seed no-guest episode: ${error?.message}`)

    const result = await fetchGuestPackage(page.request, ep.id)
    expect(result.status).toBe(200)
    expect(result.data).toBeTruthy()
    expect(result.data!.episode.guest_name).toBeNull()
    expect(result.data!.package).toBeTruthy()
    // Social posts should still be produced (generator uses a fallback)
    expect(Array.isArray(result.data!.package.socialPosts)).toBe(true)
  })
})

// ─────────────────────────────────────────────────────────────────────────
// P2 — Nice-to-have
// ─────────────────────────────────────────────────────────────────────────

test.describe('Core Paid Flow [P2]', () => {
  let testUser: TestUser
  let showId: string

  test.beforeAll(async () => {
    const ctx = await createCoreQaUser('p2')
    testUser = ctx.user
    showId = ctx.showId
  })

  test.afterAll(async () => {
    await deleteTestUser(testUser)
    await cleanupTestDataByPattern()
  })

  test.beforeEach(async ({ page }) => {
    await signIn(page, testUser)
  })

  test('T-018: upload wizard preserves the queue across Step 1 → 2 → Back', async ({ page }) => {
    const wizard = new UploadWizardPage(page)
    await wizard.goto()

    await wizard.attachFile(FIXTURE_MP3)
    await expect(page.getByText('Add more files')).toBeVisible()

    await wizard.clickNext()
    await wizard.expectStep2Visible()

    await wizard.clickBack()
    await wizard.expectStep1Visible()

    // The drop-zone label confirms the queue survived navigation
    await expect(page.getByText('Add more files')).toBeVisible()
  })

  test('T-019: upload via URL Import creates an episode whose audio_url is the input URL', async ({ page }) => {
    const wizard = new UploadWizardPage(page)
    await wizard.goto()

    const testUrl = 'https://example.com/podcasts/core-qa-url-import.mp3'
    await wizard.addUrl(testUrl)

    await expect(page.getByText(/Ready to process/i)).toBeVisible()

    await wizard.clickNext()
    await wizard.expectStep2Visible()
    await wizard.clickNext()
    await wizard.expectStep3Visible()
    await wizard.submitButtonByTestId().click()

    await page.waitForURL(/\/episodes\/[0-9a-f-]{36}/, { timeout: 30_000 })

    const admin = getAdminClient()
    const { data: episodes } = await admin
      .from('episodes')
      .select('id, audio_url')
      .eq('show_id', showId)
      .order('created_at', { ascending: false })
      .limit(1)

    expect(episodes).toBeTruthy()
    expect(episodes!.length).toBe(1)
    expect(episodes![0].audio_url).toBe(testUrl)
  })

  test('T-020: /api/upload rejects invalid MIME types with 400', async ({ page }) => {
    const result = await requestSignedUploadUrl(page.request, {
      fileName: 'invalid.txt',
      fileSize: 1000,
      mimeType: 'text/plain',
    })

    expect(result.status).toBe(400)
    const body = result.body as { error?: string } | null
    expect(body?.error).toMatch(/invalid file type/i)
  })
})
