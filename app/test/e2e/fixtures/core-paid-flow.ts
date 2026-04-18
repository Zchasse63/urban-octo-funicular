/**
 * Core Paid Flow — Shared seeded state helpers.
 *
 * These are regular functions (not Playwright test.extend fixtures)
 * to match the project's existing beforeAll/beforeEach convention
 * in upload-wizard.spec.ts and episode-detail.spec.ts.
 */
import { getAdminClient } from '../../setup/database'
import { createTestUser, createTestShow, type TestUser } from '../helpers/auth'
import { createPopulatedEpisode } from '../helpers/factories'

/**
 * Create a fresh user + show prefixed for the core-paid-flow suite.
 * Show name uses the `[TEST]` prefix so `cleanupTestDataByPattern()`
 * catches strays, plus a `[CORE-QA]` inner tag for grepability.
 */
export async function createCoreQaUser(
  tag: string
): Promise<{ user: TestUser; showId: string }> {
  const user = await createTestUser(`core-qa-${tag}`)
  const showId = await createTestShow(user.id, `[TEST] [CORE-QA] ${tag} ${Date.now()}`)
  return { user, showId }
}

/**
 * Seed a fully-populated completed episode AND N generated_assets
 * rows so the UI renders a "ready" state with the Download ZIP link
 * visible.
 *
 * Asset types written:
 *   - linkedin_post
 *   - twitter_thread
 *   - blog_post
 *
 * These match entries in the `UI_ID_TO_DB_TYPE` map inside
 * `episode-detail.tsx`, so `generatedCount` will render as > 0
 * and the Download ZIP anchor will mount.
 */
export async function seedCompletedEpisodeWithAssets(
  showId: string,
  options: {
    title?: string
    guestName?: string
  } = {}
): Promise<{ episodeId: string; assetIds: string[] }> {
  const admin = getAdminClient()

  const episodeId = await createPopulatedEpisode({
    showId,
    title: options.title ?? '[TEST] [CORE-QA] Completed Episode',
    guestName: options.guestName ?? 'Dr. Sarah Lin',
  })

  const assetTypes = ['linkedin_post', 'twitter_thread', 'blog_post'] as const
  const assetIds: string[] = []

  for (const assetType of assetTypes) {
    const { data, error } = await admin
      .from('generated_assets')
      .insert({
        episode_id: episodeId,
        asset_type: assetType,
        content: `[CORE-QA] ${assetType} seeded content body for ${options.title ?? 'test episode'}.`,
        metadata: {},
      })
      .select('id')
      .single()
    if (error || !data) {
      throw new Error(`Failed to seed ${assetType}: ${error?.message ?? 'no row'}`)
    }
    assetIds.push(data.id)
  }

  return { episodeId, assetIds }
}

/**
 * Seed a completed episode with a specific transcript-segment shape
 * suitable for BUG #29 regression testing. The first segment starts
 * at 3000ms — if the component treats this as seconds, the timestamp
 * renders as 50:00 instead of 00:03.
 */
export async function seedEpisodeForTimestampRegression(showId: string): Promise<string> {
  const admin = getAdminClient()
  const { data, error } = await admin
    .from('episodes')
    .insert({
      show_id: showId,
      title: '[TEST] [CORE-QA] Timestamp Regression',
      description: 'Seeded to guard BUG #29 (ms vs sec confusion).',
      audio_url: 'https://example.test/timestamp-regression.mp3',
      audio_duration_seconds: 120,
      status: 'completed',
      transcript: 'Hello world. This is the first segment. And this is the second.',
      transcript_segments: [
        {
          text: 'Hello world. This is the first segment.',
          start: 3000, // 3000 ms = 00:03 — MUST NOT render as 50:00
          end: 6500,
          speaker: 'Host',
          confidence: 0.96,
        },
        {
          text: 'And this is the second.',
          start: 7000,
          end: 9500,
          speaker: 'Guest',
          confidence: 0.94,
        },
      ],
      show_notes: '# Timestamp Test\n\nNothing to see here.',
      metadata: {},
    })
    .select('id')
    .single()
  if (error || !data) throw new Error(`Failed to seed timestamp episode: ${error?.message}`)
  return data.id
}

/**
 * Seed a completed episode whose show_notes contain the literal
 * broken markdown pattern `[0:53](0:53)` (BUG #11). The rendered
 * page must never display this literal string — either render as
 * a link or strip it, but never show the raw brackets.
 */
export async function seedEpisodeWithBrokenTimestampMarkdown(
  showId: string
): Promise<string> {
  const admin = getAdminClient()
  // BUG #11 fix converted broken `[0:53](0:53)` markdown into processed HTML
  // where the timestamp is either a real link or plain text. To test the
  // regression, we seed BOTH the raw markdown AND the processed HTML so
  // the UI falls into the rendered-HTML path (the default `notesFormat=html`
  // branch). The HTML below is what a correct markdown-to-HTML pipeline
  // should produce — no literal brackets.
  const { data, error } = await admin
    .from('episodes')
    .insert({
      show_id: showId,
      title: '[TEST] [CORE-QA] BUG11 Markdown Regression',
      description: 'Guards show-notes markdown renderer.',
      audio_url: 'https://example.test/bug11.mp3',
      audio_duration_seconds: 600,
      status: 'completed',
      transcript: 'Some transcript text.',
      show_notes:
        '# Key Moments\n\n- See the discussion at [0:53](0:53) about batteries.\n- And [5:20](5:20) covers policy.',
      show_notes_html:
        '<h1>Key Moments</h1><ul><li>See the discussion at <a href="#t=53">0:53</a> about batteries.</li><li>And <a href="#t=320">5:20</a> covers policy.</li></ul>',
      metadata: {},
    })
    .select('id')
    .single()
  if (error || !data) throw new Error(`Failed to seed BUG#11 episode: ${error?.message}`)
  return data.id
}

/**
 * Seed an empty completed episode with zero generated_assets rows,
 * for the "download ZIP with no assets" and other empty-state tests.
 */
export async function seedCompletedEpisodeNoAssets(showId: string): Promise<string> {
  const episodeId = await createPopulatedEpisode({
    showId,
    title: '[TEST] [CORE-QA] No Assets Episode',
  })
  return episodeId
}

/**
 * Seed a pending episode (status = pending, no transcript) for
 * concurrent-process and process-status tests.
 */
export async function seedPendingEpisode(showId: string): Promise<string> {
  const admin = getAdminClient()
  const { data, error } = await admin
    .from('episodes')
    .insert({
      show_id: showId,
      title: '[TEST] [CORE-QA] Pending Episode',
      audio_url: 'https://example.test/pending.mp3',
      audio_duration_seconds: 60,
      status: 'pending',
      metadata: {},
    })
    .select('id')
    .single()
  if (error || !data) throw new Error(`Failed to seed pending: ${error?.message}`)
  return data.id
}

/**
 * Seed an XSS/SQLi-attack-payload episode. Both payloads go through
 * the normal INSERT path so any injection vulnerability surfaces as
 * the attacks taking effect: the XSS would execute when rendered,
 * and the SQL drop would remove the episodes table.
 */
export async function seedAttackPayloadEpisode(showId: string): Promise<string> {
  const admin = getAdminClient()
  const { data, error } = await admin
    .from('episodes')
    .insert({
      show_id: showId,
      title: "<script>window.__xss__=true</script>[TEST] [CORE-QA] Payload",
      description: 'Guards XSS + SQLi.',
      audio_url: 'https://example.test/attack.mp3',
      audio_duration_seconds: 120,
      status: 'completed',
      transcript: 'Attack transcript.',
      guest_name: "Robert'); DROP TABLE episodes;--",
      guest_bio: '<img src=x onerror="window.__xss_img__=true">',
      show_notes: '# Safe notes',
      metadata: {},
    })
    .select('id')
    .single()
  if (error || !data) throw new Error(`Failed to seed attack episode: ${error?.message}`)
  return data.id
}
