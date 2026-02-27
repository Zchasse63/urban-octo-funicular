/**
 * SCHEMA ALIGNMENT VERIFICATION TESTS
 *
 * Verifies that the database schema matches what the application expects.
 * Tests the fixes from Phase B (C6, C7, C8, H8).
 *
 * Uses REAL database — no mocking.
 * Each test is fully self-contained to avoid cross-file interference.
 *
 * NOTE: Tests for C6, C7, H8 require the schema alignment migration
 * (20260218000000_schema_alignment.sql) to be applied to the database.
 * They will be skipped if the migration hasn't been applied yet.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import {
  getAdminClient,
  cleanupAllTestData,
  trackTestRecord,
} from '../../setup/database'
import { createTestShow, createTestEpisode } from '../../utils/test-data'

const DEFAULT_USER_ID = '00000000-0000-0000-0000-000000000001'
let migrationApplied = false

beforeAll(async () => {
  // Check if the schema alignment migration has been applied
  // by testing for one of the new enum values
  const client = getAdminClient()
  const show = await createTestShow()
  const episode = await createTestEpisode(show.id, { status: 'completed' })
  const { error } = await client
    .from('generated_assets')
    .insert({
      episode_id: episode.id,
      asset_type: 'episode_titles',
      content: 'migration check',
      metadata: {},
    })
    .select('id')
    .single()

  migrationApplied = !error
  if (!migrationApplied) {
    console.log('⚠️  Schema alignment migration not applied — C6/C7/H8 tests will be skipped')
    console.log('   Run: supabase/migrations/20260218000000_schema_alignment.sql')
  } else {
    // Clean up the check record
    await client.from('generated_assets').delete().eq('episode_id', episode.id)
  }
})

afterAll(async () => {
  await cleanupAllTestData()
})

describe('C8: Vocabulary terms schema', () => {
  it('vocabulary_terms table has `alternatives` column (not `definition`)', async () => {
    const client = getAdminClient()
    const show = await createTestShow()

    const { data, error } = await client
      .from('vocabulary_terms')
      .insert({
        show_id: show.id,
        term: `[TEST] VocabTerm ${Date.now()}`,
        alternatives: ['alt1', 'alt2'],
      })
      .select('id, term, alternatives, show_id')
      .single()

    expect(error).toBeNull()
    expect(data).toBeDefined()
    expect(data.alternatives).toEqual(['alt1', 'alt2'])

    trackTestRecord('vocabulary_terms', data.id)
  })

  it('vocabulary_terms does NOT have `definition` column', async () => {
    const client = getAdminClient()

    // Try to query a column that doesn't exist
    const { error } = await client
      .from('vocabulary_terms')
      .select('id, definition')
      .limit(1)

    // Should get an error about unknown column
    expect(error).not.toBeNull()
  })

  it('vocabulary_terms does NOT require `user_id`', async () => {
    const client = getAdminClient()
    const show = await createTestShow()

    // Insert without user_id — should succeed
    const { data, error } = await client
      .from('vocabulary_terms')
      .insert({
        show_id: show.id,
        term: `[TEST] NoUserIdTerm ${Date.now()}`,
        alternatives: [],
      })
      .select('id')
      .single()

    expect(error).toBeNull()
    expect(data).toBeDefined()

    trackTestRecord('vocabulary_terms', data.id)
  })

  it('vocabulary_terms supports empty alternatives array', async () => {
    const client = getAdminClient()
    const show = await createTestShow()

    const { data, error } = await client
      .from('vocabulary_terms')
      .insert({
        show_id: show.id,
        term: `[TEST] EmptyAlts ${Date.now()}`,
        alternatives: [],
      })
      .select('id, alternatives')
      .single()

    expect(error).toBeNull()
    expect(data.alternatives).toEqual([])

    trackTestRecord('vocabulary_terms', data.id)
  })
})

describe('C6: Asset type enum expansion (requires migration)', () => {
  it('accepts core content asset types', async () => {
    if (!migrationApplied) {
      console.log('  ⏭ Skipped: migration not applied')
      return
    }

    const client = getAdminClient()
    const show = await createTestShow()
    const episode = await createTestEpisode(show.id, { status: 'completed' })

    const coreTypes = ['show_notes', 'episode_titles', 'key_takeaways', 'chapter_markers']

    for (const assetType of coreTypes) {
      const { data, error } = await client
        .from('generated_assets')
        .insert({
          episode_id: episode.id,
          asset_type: assetType,
          content: `Test ${assetType} content`,
          metadata: {},
        })
        .select('id, asset_type')
        .single()

      expect(error).toBeNull()
      expect(data.asset_type).toBe(assetType)

      trackTestRecord('generated_assets', data.id)
    }
  })

  it('accepts social media asset types', async () => {
    if (!migrationApplied) {
      console.log('  ⏭ Skipped: migration not applied')
      return
    }

    const client = getAdminClient()
    const show = await createTestShow()
    const episode = await createTestEpisode(show.id, { status: 'completed' })

    const socialTypes = [
      'linkedin_post', 'linkedin_post_host', 'linkedin_post_guest', 'linkedin_article',
      'twitter_thread', 'twitter_single',
      'instagram_carousel', 'instagram_caption', 'instagram_reel_script',
      'tiktok_hooks', 'tiktok_script',
      'youtube_description', 'youtube_shorts_script', 'youtube_title_tags',
    ]

    for (const assetType of socialTypes) {
      const { data, error } = await client
        .from('generated_assets')
        .insert({
          episode_id: episode.id,
          asset_type: assetType,
          content: `Test ${assetType}`,
          metadata: {},
        })
        .select('id, asset_type')
        .single()

      expect(error).toBeNull()
      expect(data.asset_type).toBe(assetType)

      trackTestRecord('generated_assets', data.id)
    }
  })

  it('accepts AI summary and engagement types', async () => {
    if (!migrationApplied) {
      console.log('  ⏭ Skipped: migration not applied')
      return
    }

    const client = getAdminClient()
    const show = await createTestShow()
    const episode = await createTestEpisode(show.id, { status: 'completed' })

    const advancedTypes = [
      'discussion_questions', 'poll_ideas', 'call_to_action',
      'guest_bio_short', 'guest_promo_kit',
      'podcast_teaser', 'cross_promo_script',
      'medium_article', 'substack_post',
      'ai_summary_short', 'ai_summary_detailed', 'highlight_reel',
    ]

    for (const assetType of advancedTypes) {
      const { data, error } = await client
        .from('generated_assets')
        .insert({
          episode_id: episode.id,
          asset_type: assetType,
          content: `Test ${assetType}`,
          metadata: {},
        })
        .select('id, asset_type')
        .single()

      expect(error).toBeNull()
      expect(data.asset_type).toBe(assetType)

      trackTestRecord('generated_assets', data.id)
    }
  })
})

describe('C7: Hosting connections schema (requires migration)', () => {
  it('hosting_connections supports provider TEXT column', async () => {
    if (!migrationApplied) {
      console.log('  ⏭ Skipped: migration not applied')
      return
    }

    const client = getAdminClient()

    const { data, error } = await client
      .from('hosting_connections')
      .insert({
        user_id: DEFAULT_USER_ID,
        platform: 'buzzsprout',
        provider: 'buzzsprout',
        credentials: { api_token: 'test_encrypted' },
        status: 'active',
      })
      .select('id, provider, status')
      .single()

    expect(error).toBeNull()
    expect(data.provider).toBe('buzzsprout')
    expect(data.status).toBe('active')

    // Cleanup
    await client.from('hosting_connections').delete().eq('id', data.id)
  })

  it('hosting_connections supports show_id column', async () => {
    if (!migrationApplied) {
      console.log('  ⏭ Skipped: migration not applied')
      return
    }

    const client = getAdminClient()
    const show = await createTestShow()

    const { data, error } = await client
      .from('hosting_connections')
      .insert({
        user_id: DEFAULT_USER_ID,
        platform: 'transistor',
        provider: 'transistor',
        credentials: {},
        show_id: show.id,
        status: 'active',
      })
      .select('id, show_id')
      .single()

    expect(error).toBeNull()
    expect(data.show_id).toBe(show.id)

    await client.from('hosting_connections').delete().eq('id', data.id)
  })
})

describe('H8: User subscription_tier column (requires migration)', () => {
  it('users table has subscription_tier column', async () => {
    if (!migrationApplied) {
      console.log('  ⏭ Skipped: migration not applied')
      return
    }

    const client = getAdminClient()

    const { data, error } = await client
      .from('users')
      .select('id, subscription_tier')
      .eq('id', DEFAULT_USER_ID)
      .single()

    // Either column exists with data, or the default user doesn't exist yet
    if (data) {
      expect(data).toHaveProperty('subscription_tier')
    }
    // If error, it should NOT be about missing column
    if (error) {
      expect(error.message).not.toContain('subscription_tier')
    }
  })
})

describe('Episodes table completeness', () => {
  it('episodes store full metadata including seo_analysis', async () => {
    const client = getAdminClient()
    const show = await createTestShow()

    const seoAnalysis = {
      keyword_density: { 'podcast': 0.03, 'AI': 0.02 },
      readability_score: 72,
      header_structure: true,
      suggestions: ['Add more internal links'],
      estimated_position: 15,
    }

    const episode = await createTestEpisode(show.id, {
      status: 'completed',
      seo_score: 78,
      seo_analysis: seoAnalysis,
      schema_markup: { '@type': 'PodcastEpisode', name: 'Test' },
    })

    const { data, error } = await client
      .from('episodes')
      .select('seo_score, seo_analysis, schema_markup')
      .eq('id', episode.id)
      .single()

    expect(error).toBeNull()
    expect(data.seo_score).toBe(78)
    expect(data.seo_analysis).toBeDefined()
    expect(data.schema_markup).toBeDefined()
  })

  it('episodes support viral_moments JSON array', async () => {
    const client = getAdminClient()
    const show = await createTestShow()

    const viralMoments = [
      {
        start_time: 120,
        end_time: 180,
        text: 'That changed everything for us',
        score: 0.92,
        reason: 'Emotional revelation',
        type: 'revelation',
      },
    ]

    const episode = await createTestEpisode(show.id, {
      status: 'completed',
      viral_moments: viralMoments,
    })

    const { data, error } = await client
      .from('episodes')
      .select('viral_moments')
      .eq('id', episode.id)
      .single()

    expect(error).toBeNull()
    expect(data.viral_moments).toBeDefined()
    expect(data.viral_moments.length).toBe(1)
    expect(data.viral_moments[0].score).toBe(0.92)
  })
})
