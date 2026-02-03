/**
 * TEST DATA FACTORIES
 *
 * Create test data directly in the REAL database.
 * All data is tracked for automatic cleanup.
 */

import {
  getAdminClient,
  trackTestShow,
  trackTestEpisode,
  trackTestRecord,
  generateTestShowName,
  generateTestEpisodeTitle,
} from '../setup/database'
import type { Show, Episode, VocabularyTerm, GeneratedAsset } from '@/types/database'

// Default user ID from the app (single-user mode)
const DEFAULT_USER_ID = '00000000-0000-0000-0000-000000000001'

/**
 * Create a test show in the REAL database
 */
export async function createTestShow(
  overrides: Partial<Omit<Show, 'id' | 'created_at' | 'updated_at'>> = {}
): Promise<Show> {
  const adminClient = getAdminClient()

  const showData = {
    user_id: DEFAULT_USER_ID,
    name: generateTestShowName(),
    description: 'Test show description',
    default_language: 'en',
    style_preferences: {},
    artwork_url: null,
    ...overrides,
  }

  const { data, error } = await adminClient.from('shows').insert(showData).select().single()

  if (error) {
    throw new Error(`Failed to create test show: ${error.message}`)
  }

  // Track for cleanup
  trackTestShow(data.id)

  return data as Show
}

/**
 * Create a test episode in the REAL database
 */
export async function createTestEpisode(
  showId: string,
  overrides: Partial<Omit<Episode, 'id' | 'show_id' | 'created_at' | 'updated_at'>> = {}
): Promise<Episode> {
  const adminClient = getAdminClient()

  const episodeData = {
    show_id: showId,
    title: generateTestEpisodeTitle(),
    description: 'Test episode description',
    audio_url: 'https://example.com/test-audio.mp3',
    audio_duration_seconds: 3600,
    language: 'en',
    status: 'pending' as const,
    transcript: null,
    transcript_segments: [],
    show_notes: null,
    show_notes_html: null,
    schema_markup: null,
    seo_score: null,
    seo_analysis: null,
    guest_name: null,
    guest_bio: null,
    guest_email: null,
    viral_moments: [],
    metadata: {},
    published_at: null,
    ...overrides,
  }

  const { data, error } = await adminClient.from('episodes').insert(episodeData).select().single()

  if (error) {
    throw new Error(`Failed to create test episode: ${error.message}`)
  }

  // Track for cleanup
  trackTestEpisode(data.id)

  return data as Episode
}

/**
 * Create a test vocabulary term in the REAL database
 */
export async function createTestVocabularyTerm(
  showId: string,
  overrides: Partial<Omit<VocabularyTerm, 'id' | 'show_id' | 'created_at' | 'updated_at'>> = {}
): Promise<VocabularyTerm> {
  const adminClient = getAdminClient()

  const termData = {
    show_id: showId,
    term: `TestTerm${Date.now()}`,
    alternatives: [],
    embedding: null,
    occurrence_count: 0,
    ...overrides,
  }

  const { data, error } = await adminClient
    .from('vocabulary_terms')
    .insert(termData)
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to create test vocabulary term: ${error.message}`)
  }

  // Track for cleanup
  trackTestRecord('vocabulary_terms', data.id)

  return data as VocabularyTerm
}

/**
 * Create a test generated asset in the REAL database
 */
export async function createTestAsset(
  episodeId: string,
  overrides: Partial<Omit<GeneratedAsset, 'id' | 'episode_id' | 'created_at' | 'updated_at'>> = {}
): Promise<GeneratedAsset> {
  const adminClient = getAdminClient()

  const assetData = {
    episode_id: episodeId,
    asset_type: 'show_notes' as const,
    content: 'Test asset content',
    metadata: {},
    file_url: null,
    ...overrides,
  }

  const { data, error } = await adminClient
    .from('generated_assets')
    .insert(assetData)
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to create test asset: ${error.message}`)
  }

  // Track for cleanup
  trackTestRecord('generated_assets', data.id)

  return data as GeneratedAsset
}

/**
 * Create a complete test setup with show and episodes
 */
export async function createTestShowWithEpisodes(
  episodeCount = 3
): Promise<{ show: Show; episodes: Episode[] }> {
  const show = await createTestShow()

  const episodes: Episode[] = []
  for (let i = 0; i < episodeCount; i++) {
    const episode = await createTestEpisode(show.id, {
      title: `${generateTestEpisodeTitle()} - ${i + 1}`,
    })
    episodes.push(episode)
  }

  return { show, episodes }
}

/**
 * Create a test episode with completed status and full data
 */
export async function createCompletedTestEpisode(showId: string): Promise<Episode> {
  return createTestEpisode(showId, {
    status: 'completed',
    transcript: 'This is a test transcript for the completed episode.',
    transcript_segments: [
      { start: 0, end: 10, text: 'Hello and welcome.', speaker: 'Speaker 1' },
      { start: 10, end: 20, text: 'Thank you for having me.', speaker: 'Speaker 2' },
    ],
    show_notes: '## Summary\n\nThis is a test episode.\n\n## Key Points\n\n- Point 1\n- Point 2',
    show_notes_html:
      '<h2>Summary</h2><p>This is a test episode.</p><h2>Key Points</h2><ul><li>Point 1</li><li>Point 2</li></ul>',
    seo_score: 85,
    seo_analysis: {
      overallScore: 85,
      suggestions: [],
    },
    guest_name: 'Test Guest',
    guest_bio: 'A test guest for testing purposes.',
  })
}
