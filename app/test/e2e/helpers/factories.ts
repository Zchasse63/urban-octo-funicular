/**
 * Test data factories for E2E tests.
 *
 * Builds the common "populated episode" and "empty episode" fixtures
 * used across multiple spec files. Keeps the ad-hoc insert logic in
 * a single place so schema changes don't require updating every spec.
 */
import { getAdminClient } from '../../setup/database'

export interface PopulatedEpisodeOptions {
  showId: string
  title?: string
  guestName?: string
}

/**
 * Create a fully-populated `completed` episode with real transcript
 * segments, seo_analysis with keyword density, show notes, and a guest.
 * Used as the input for tests that verify the populated-tab renders
 * real data instead of mock content.
 */
export async function createPopulatedEpisode(
  options: PopulatedEpisodeOptions
): Promise<string> {
  const admin = getAdminClient()
  const title = options.title ?? '[TEST] The Future of Renewable Energy'
  const guestName = options.guestName ?? 'Dr. Sarah Lin'

  const { data, error } = await admin
    .from('episodes')
    .insert({
      show_id: options.showId,
      title,
      description:
        'A deep conversation about battery storage breakthroughs and grid modernization.',
      audio_url: 'https://example.test/audio.mp3',
      audio_duration_seconds: 2730,
      status: 'completed',
      transcript:
        'Welcome to the show. Today we are talking about renewable energy storage and battery technology breakthroughs.',
      transcript_segments: [
        {
          text: 'Welcome to the show. Today we are talking about renewable energy storage.',
          start: 0,
          end: 8,
          speaker: 'Host',
          confidence: 0.95,
        },
        {
          text: 'Battery technology has come a long way in the last five years.',
          start: 8,
          end: 15,
          speaker: 'Dr. Lin',
          confidence: 0.96,
        },
        {
          text: 'We are seeing 30% efficiency gains from solid-state designs.',
          start: 15,
          end: 22,
          speaker: 'Dr. Lin',
          confidence: 0.94,
        },
      ],
      show_notes:
        '# The Future of Renewable Energy\n\nIn this episode we explore battery storage breakthroughs.\n\n## Key Topics\n\n- Solid-state batteries\n- Grid modernization\n- MIT/Stanford research',
      seo_score: 78,
      seo_analysis: {
        keyword_density: {
          'renewable energy': 12,
          'battery storage': 8,
          'solid-state': 6,
          'grid modernization': 5,
          efficiency: 4,
          lithium: 3,
        },
        readability_score: 72,
        header_structure: true,
        suggestions: ['Add internal links to related episodes', 'Include a FAQ section'],
        estimated_position: null,
      },
      guest_name: guestName,
      guest_bio:
        'Energy researcher at MIT specializing in next-generation battery chemistries.',
      metadata: {},
    })
    .select('id')
    .single()

  if (error || !data) {
    throw new Error(`Failed to create populated episode: ${error?.message}`)
  }
  return data.id
}

/**
 * Create an empty `pending` episode with no transcript, no show notes,
 * no seo_analysis, no guest. Used as the input for empty-state
 * regression guards.
 */
export async function createEmptyEpisode(showId: string): Promise<string> {
  const admin = getAdminClient()
  const { data, error } = await admin
    .from('episodes')
    .insert({
      show_id: showId,
      title: '[TEST] Pending Episode',
      description: null,
      audio_url: 'https://example.test/empty.mp3',
      audio_duration_seconds: null,
      status: 'pending',
      transcript: null,
      transcript_segments: [],
      show_notes: null,
      show_notes_html: null,
      seo_score: null,
      seo_analysis: null,
      guest_name: null,
      guest_bio: null,
      metadata: {},
    })
    .select('id')
    .single()

  if (error || !data) {
    throw new Error(`Failed to create empty episode: ${error?.message}`)
  }
  return data.id
}

/**
 * Create a vocabulary term for a show. Returns the term id so callers
 * can verify or delete.
 */
export async function createVocabularyTerm(
  showId: string,
  term: string,
  alternatives: string[] = []
): Promise<string> {
  const admin = getAdminClient()
  const { data, error } = await admin
    .from('vocabulary_terms')
    .insert({
      show_id: showId,
      term,
      alternatives,
      auto_generated: false,
    })
    .select('id')
    .single()
  if (error || !data) {
    throw new Error(`Failed to create vocabulary term: ${error?.message}`)
  }
  return data.id
}
