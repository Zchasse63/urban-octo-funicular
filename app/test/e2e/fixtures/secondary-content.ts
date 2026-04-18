/**
 * Secondary Content Features — seed factories
 *
 * Each factory inserts a row via the admin Supabase client and returns the
 * resulting episodeId. All seeded data uses the `[SECONDARY-QA]` inner
 * marker so a grep for the pattern reveals exactly which suite created
 * the data, while the outer `[TEST]` prefix on the show name keeps it
 * in range of `cleanupTestDataByPattern()`.
 */
import { getAdminClient } from '../../setup/database'
import { createTestUser, createTestShow, type TestUser } from '../helpers/auth'

export async function createSecondaryQaUser(
  tag: string
): Promise<{ user: TestUser; showId: string }> {
  const user = await createTestUser(`secondary-${tag}`)
  const showId = await createTestShow(
    user.id,
    `[TEST] [SECONDARY-QA] ${tag} ${Date.now()}`
  )
  return { user, showId }
}

/**
 * Seed a "pending" empty episode. No transcript, no show_notes.
 * Used by: viral-moments 422, schedule future/past, ab-test (no content),
 * vocabulary cross-ref.
 */
export async function seedEmptyEpisode(showId: string): Promise<string> {
  const admin = getAdminClient()
  const { data, error } = await admin
    .from('episodes')
    .insert({
      show_id: showId,
      title: '[TEST] [SECONDARY-QA] Empty Episode',
      description: null,
      audio_url: 'https://example.test/empty.mp3',
      audio_duration_seconds: 120,
      status: 'pending',
    })
    .select('id')
    .single()
  if (error || !data) throw new Error(`Failed to seed empty episode: ${error?.message}`)
  return data.id
}

/**
 * Seed a completed episode with full data: transcript, show_notes,
 * cached viral_moments, guest_name, and metadata.host_name. Ideal for
 * GET viral-moments (cache hit), SEO analysis, RSS tags.
 */
export async function seedCompletedWithEverything(
  showId: string
): Promise<string> {
  const admin = getAdminClient()
  const { data, error } = await admin
    .from('episodes')
    .insert({
      show_id: showId,
      title: '[TEST] [SECONDARY-QA] Full Data Episode',
      description:
        'A deep-dive interview on renewable energy storage breakthroughs and grid modernization — covering batteries, hydrogen, and policy.',
      audio_url: 'https://example.test/full.mp3',
      audio_duration_seconds: 2700,
      status: 'completed',
      transcript:
        'Welcome to the show. Today we are talking about renewable energy with our guest Dr. Sarah Lin. She has spent fifteen years studying battery storage and grid-scale renewable energy integration.',
      transcript_segments: [
        { text: 'Welcome to the show.', start: 0, end: 2, speaker: 'Host' },
        { text: 'Today we talk renewable energy.', start: 2, end: 6, speaker: 'Host' },
      ],
      guest_name: 'Dr. Sarah Lin',
      show_notes:
        '# Renewable Energy Breakthroughs\n\nIn this episode, Dr. Sarah Lin joins us to explore battery storage, grid modernization, and the future of renewable energy integration.\n\n## Key Topics\n\n- Battery chemistry advances\n- Grid-scale storage economics\n- Policy implications for renewable adoption\n\n## Links\n\n- [Dr. Lin\'s research](https://example.test/research)',
      show_notes_html:
        '<h1>Renewable Energy Breakthroughs</h1><p>In this episode, Dr. Sarah Lin joins us to explore battery storage, grid modernization, and the future of renewable energy integration.</p><h2>Key Topics</h2><ul><li>Battery chemistry advances</li><li>Grid-scale storage economics</li><li>Policy implications for renewable adoption</li></ul>',
      // Wrapper form (from the on-demand /viral-moments endpoint) so
      // the DetectionResponseSchema cache-hit path in that endpoint
      // validates successfully and we don't call real Grok during tests.
      viral_moments: {
        viralMoments: [
          {
            id: 'moment-1',
            quote: 'The grid is the most important invention of our time.',
            startTime: 120,
            endTime: 150,
            score: 85,
            category: 'quotable',
            reasoning: 'Concise, authoritative, shareable statement.',
            suggestedPlatforms: ['twitter', 'linkedin'],
          },
        ],
        topMoment: {
          id: 'moment-1',
          quote: 'The grid is the most important invention of our time.',
          startTime: 120,
          endTime: 150,
          score: 85,
          category: 'quotable',
          reasoning: 'Concise, authoritative, shareable statement.',
          suggestedPlatforms: ['twitter', 'linkedin'],
        },
      },
      metadata: {
        host_name: 'Alex Rivera',
      },
    })
    .select('id')
    .single()
  if (error || !data) throw new Error(`Failed to seed full episode: ${error?.message}`)
  return data.id
}

/**
 * Completed episode with transcript present but show_notes empty.
 * Used to verify the SEO score is honestly low for bad content.
 */
export async function seedCompletedEmptyNotes(showId: string): Promise<string> {
  const admin = getAdminClient()
  const { data, error } = await admin
    .from('episodes')
    .insert({
      show_id: showId,
      title: '[TEST] [SECONDARY-QA] Empty Notes Episode',
      description: 'Short description.',
      audio_url: 'https://example.test/empty-notes.mp3',
      audio_duration_seconds: 1800,
      status: 'completed',
      transcript: 'Short transcript.',
      show_notes: '',
      show_notes_html: '',
    })
    .select('id')
    .single()
  if (error || !data)
    throw new Error(`Failed to seed empty-notes episode: ${error?.message}`)
  return data.id
}

/**
 * Completed episode with no viral_moments and no episode_sections.
 * Used for RSS tags "gracefully-omitted" paths and related-episodes
 * empty-result path.
 */
export async function seedCompletedNoExtras(showId: string): Promise<string> {
  const admin = getAdminClient()
  const { data, error } = await admin
    .from('episodes')
    .insert({
      show_id: showId,
      title: '[TEST] [SECONDARY-QA] Isolated Episode',
      description: 'Isolated episode for cross-episode tests.',
      audio_url: 'https://example.test/isolated.mp3',
      audio_duration_seconds: 1200,
      status: 'completed',
      transcript: 'Short transcript for the isolated test episode.',
      show_notes: 'Basic show notes.',
      viral_moments: null,
    })
    .select('id')
    .single()
  if (error || !data)
    throw new Error(`Failed to seed isolated episode: ${error?.message}`)
  return data.id
}

/**
 * Seed an episode already in `scheduled` status so DELETE /schedule can
 * cancel it without first running a POST.
 */
export async function seedScheduledEpisode(showId: string): Promise<string> {
  const admin = getAdminClient()
  const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
  const { data, error } = await admin
    .from('episodes')
    .insert({
      show_id: showId,
      title: '[TEST] [SECONDARY-QA] Scheduled Episode',
      audio_url: 'https://example.test/scheduled.mp3',
      audio_duration_seconds: 900,
      status: 'scheduled',
      metadata: {
        scheduled_at: futureDate,
        scheduled_by: 'test-user',
      },
    })
    .select('id')
    .single()
  if (error || !data)
    throw new Error(`Failed to seed scheduled episode: ${error?.message}`)
  return data.id
}

/**
 * Seed a completed (finalized) episode that should REJECT schedule POST.
 */
export async function seedFinalizedEpisode(showId: string): Promise<string> {
  const admin = getAdminClient()
  const { data, error } = await admin
    .from('episodes')
    .insert({
      show_id: showId,
      title: '[TEST] [SECONDARY-QA] Completed Finalized Episode',
      audio_url: 'https://example.test/finalized.mp3',
      audio_duration_seconds: 900,
      status: 'completed',
    })
    .select('id')
    .single()
  if (error || !data)
    throw new Error(`Failed to seed finalized episode: ${error?.message}`)
  return data.id
}
