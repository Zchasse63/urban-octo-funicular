/**
 * Episode Detail E2E Tests
 *
 * Tests the /episodes/[id] page after the big refactor that removed all
 * hardcoded Stoicism/Marcus Aurelius mock data from ShowNotes, Transcript,
 * Intelligence, and GuestPackage tabs. The most important test here is
 * the regression guard — no tab should ever display Stoicism content.
 *
 * Source of truth:
 * - specs/features/episode-detail-analysis.md
 * - specs/plans/episode-detail-test-plan.md
 */
import { test, expect } from '../fixtures/base'
import { cleanupTestDataByPattern } from '../../setup/database'
import { EpisodeDetailPage } from '../pages/episode-detail-page'
import {
  createTestUser,
  createTestShow,
  deleteTestUser,
  signIn,
  type TestUser,
} from '../helpers/auth'
import { createPopulatedEpisode, createEmptyEpisode } from '../helpers/factories'

const EPISODE_TITLE = '[TEST] The Future of Renewable Energy'
const EMPTY_EPISODE_TITLE = '[TEST] Pending Episode'
const GUEST_NAME = 'Dr. Sarah Lin'

// ─────────────────────────────────────────────────────────────────────────
// P0 — Critical smoke tests
// ─────────────────────────────────────────────────────────────────────────

test.describe('Episode Detail [P0]', () => {
  let testUser: TestUser
  let populatedEpisodeId: string
  let emptyEpisodeId: string

  test.beforeAll(async () => {
    testUser = await createTestUser('episode-detail-p0')
    const showId = await createTestShow(testUser.id)
    populatedEpisodeId = await createPopulatedEpisode({ showId })
    emptyEpisodeId = await createEmptyEpisode(showId)
  })

  test.afterAll(async () => {
    await deleteTestUser(testUser)
    await cleanupTestDataByPattern()
  })

  test.beforeEach(async ({ page }) => {
    await signIn(page, testUser)
  })

  test('P0-1: loads populated episode with real data (no Stoicism)', async ({ page }) => {
    const episode = new EpisodeDetailPage(page)
    await episode.goto(populatedEpisodeId)
    await episode.expectTitle(EPISODE_TITLE)

    // THE regression guard — this is the single most important assertion in
    // this whole suite. If any of these ever matches, the Stoicism mock data
    // has been reintroduced somewhere.
    await episode.expectNoStoicism()

    // Real data should be visible on the default Show Notes tab
    await expect(page.getByText(/renewable energy/i).first()).toBeVisible()
  })

  test('P0-2: all 6 tabs are visible via data-testid', async ({ page }) => {
    const episode = new EpisodeDetailPage(page)
    await episode.goto(populatedEpisodeId)

    for (const id of ['show-notes', 'assets', 'transcript', 'guest', 'intelligence', 'rss-tags'] as const) {
      await expect(episode.tabButton(id)).toBeVisible()
    }
  })

  test('P0-3: empty episode shows empty states (no mock data)', async ({ page }) => {
    const episode = new EpisodeDetailPage(page)
    await episode.goto(emptyEpisodeId)

    await episode.expectTitle(EMPTY_EPISODE_TITLE)
    // Show Notes empty state
    await expect(page.getByText('No show notes yet')).toBeVisible()

    // No Stoicism leaks into any tab
    await episode.expectNoStoicism()

    // Switch to transcript — should show the empty state
    await episode.clickTab('transcript')
    await expect(page.getByText('Transcript not yet available')).toBeVisible()
    await episode.expectNoStoicism()

    // Intelligence tab — unified empty state
    await episode.clickTab('intelligence')
    await expect(page.getByText(/Sentiment & engagement analysis/i)).toBeVisible()
    await episode.expectNoStoicism()
  })
})

// ─────────────────────────────────────────────────────────────────────────
// P1 — Important
// ─────────────────────────────────────────────────────────────────────────

test.describe('Episode Detail [P1]', () => {
  let testUser: TestUser
  let populatedEpisodeId: string

  test.beforeAll(async () => {
    testUser = await createTestUser('episode-detail-p1')
    const showId = await createTestShow(testUser.id)
    populatedEpisodeId = await createPopulatedEpisode({ showId })
  })

  test.afterAll(async () => {
    await deleteTestUser(testUser)
    await cleanupTestDataByPattern()
  })

  test.beforeEach(async ({ page }) => {
    await signIn(page, testUser)
  })

  test('P1-1: Transcript tab renders real segments', async ({ page }) => {
    const episode = new EpisodeDetailPage(page)
    await episode.goto(populatedEpisodeId)
    await episode.clickTab('transcript')

    // Real transcript text from the seeded segments
    await expect(page.getByText(/Battery technology has come a long way/i)).toBeVisible()
    await episode.expectNoStoicism()
  })

  test('P1-2: Intelligence tab shows real topic clusters from keyword density', async ({ page }) => {
    const episode = new EpisodeDetailPage(page)
    await episode.goto(populatedEpisodeId)
    await episode.clickTab('intelligence')

    // Topic Clusters section renders the top keyword by density
    await expect(page.getByText(/Topic Clusters/i)).toBeVisible()
    // The seeded keyword_density has "renewable energy" as the highest
    await expect(page.getByText('renewable energy').first()).toBeVisible()
    await episode.expectNoStoicism()
  })

  test('P1-3: Guest tab shows the real guest name (not Marcus Aurelius)', async ({ page }) => {
    const episode = new EpisodeDetailPage(page)
    await episode.goto(populatedEpisodeId)
    await episode.clickTab('guest')

    // Real guest name from the seeded episode
    await expect(page.getByText(GUEST_NAME).first()).toBeVisible()
    await episode.expectNoStoicism()
  })

  test('P1-4: Show Notes HTML mode shows amber notice when show_notes_html is null', async ({ page }) => {
    const episode = new EpisodeDetailPage(page)
    await episode.goto(populatedEpisodeId)
    // Default tab is show-notes. Default format is HTML. The seeded episode
    // has show_notes but no show_notes_html, so the amber notice should show.
    await expect(page.getByText(/HTML version not yet generated/i)).toBeVisible()
  })
})

// ─────────────────────────────────────────────────────────────────────────
// P2 — Nice-to-have
// ─────────────────────────────────────────────────────────────────────────

test.describe('Episode Detail [P2]', () => {
  let testUser: TestUser
  let populatedEpisodeId: string

  test.beforeAll(async () => {
    testUser = await createTestUser('episode-detail-p2')
    const showId = await createTestShow(testUser.id)
    populatedEpisodeId = await createPopulatedEpisode({ showId })
  })

  test.afterAll(async () => {
    await deleteTestUser(testUser)
    await cleanupTestDataByPattern()
  })

  test.beforeEach(async ({ page }) => {
    await signIn(page, testUser)
  })

  test('P2-1: clicking Assets tab shows the asset count header', async ({ page }) => {
    const episode = new EpisodeDetailPage(page)
    await episode.goto(populatedEpisodeId)
    await episode.clickTab('assets')

    // "N of M assets generated" header (exact digits depend on what's seeded)
    await expect(page.getByText(/assets generated/i)).toBeVisible()
    await episode.expectNoStoicism()
  })
})
