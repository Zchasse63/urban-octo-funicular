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

// ─── Subscription State ───────────────────────────────────────────────────────

export interface SubscriptionState {
  status: 'trialing' | 'active' | 'past_due' | 'trial_expired' | 'canceled'
  tier?: 'pro' | 'creator' | 'agency'
  /** Defaults: trialing → now+14d, all others → now-7d */
  trialEndsAt?: Date
  pastDueSince?: Date | null
  /**
   * If set, creates a backdated episode with this many minutes of audio so
   * that getAudioMinutesUsed() returns the expected value within the current
   * calendar-month billing period. Requires the user to already have a show.
   */
  minutesConsumed?: number
}

/**
 * Set a test user's subscription state directly in the database.
 *
 * Use this instead of triggering Stripe webhooks in E2E tests — all state
 * transitions that normally occur via webhooks (payment_succeeded, payment_failed,
 * subscription.deleted, cron expiry) are simulated by calling this helper
 * before the test signs in.
 *
 * @param userId - The Supabase user ID to update
 * @param state  - The desired subscription state
 */
export async function setSubscriptionState(
  userId: string,
  state: SubscriptionState,
): Promise<void> {
  const admin = getAdminClient()
  const now = new Date()

  const defaultTrialEnd = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000)
  const pastDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

  const trialEndsAt =
    state.trialEndsAt ?? (state.status === 'trialing' ? defaultTrialEnd : pastDate)

  const { error } = await admin
    .from('users')
    .update({
      subscription_status: state.status,
      subscription_tier: state.tier ?? 'pro',
      trial_ends_at: trialEndsAt.toISOString(),
      past_due_since: state.pastDueSince?.toISOString() ?? null,
    })
    .eq('id', userId)

  if (error) throw new Error(`setSubscriptionState failed: ${error.message}`)

  // Optionally create a backdated episode to simulate audio minute consumption.
  // The episode is inserted with created_at = start of the current month so
  // getAudioMinutesUsed() (which filters by billing period start) picks it up.
  if (state.minutesConsumed !== undefined && state.minutesConsumed > 0) {
    const { data: shows } = await admin
      .from('shows')
      .select('id')
      .eq('user_id', userId)
      .limit(1)

    if (!shows || shows.length === 0) {
      throw new Error(
        'setSubscriptionState: minutesConsumed requires the user to have at least one show'
      )
    }

    const billingStart = new Date(now.getFullYear(), now.getMonth(), 1)

    const { error: epError } = await admin
      .from('episodes')
      .insert({
        show_id: shows[0].id,
        title: '[TEST] Synthetic usage episode',
        audio_url: 'https://example.test/synthetic.mp3',
        audio_duration_seconds: state.minutesConsumed * 60,
        status: 'completed',
        created_at: billingStart.toISOString(),
        metadata: {},
      })

    if (epError) {
      throw new Error(
        `setSubscriptionState: failed to create usage episode: ${epError.message}`
      )
    }
  }
}
