/**
 * FULL WORKFLOW INTEGRATION TESTS
 *
 * Simulates a real user workflow through the PodBrain application:
 * 1. Create a show
 * 2. Upload audio (simulate)
 * 3. Create episode
 * 4. Check processing status
 * 5. Fetch assets
 * 6. Fetch SEO data
 * 7. Fetch guest package
 * 8. Download assets
 *
 * Uses REAL database and API calls — no mocking.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { api } from '../../utils/api-client'
import { getAdminClient, cleanupAllTestData, trackTestShow, trackTestEpisode } from '../../setup/database'
import { createTestShow, createCompletedTestEpisode, createTestAsset } from '../../utils/test-data'
import type { Show, Episode } from '@/types/database'

let testShow: Show
let testEpisode: Episode

beforeAll(async () => {
  testShow = await createTestShow()
  // Create a fully completed episode with assets for testing
  testEpisode = await createCompletedTestEpisode(testShow.id)

  // Seed with some assets
  await createTestAsset(testEpisode.id, { asset_type: 'show_notes', content: '## Episode Summary\nGreat episode.' })
  await createTestAsset(testEpisode.id, { asset_type: 'linkedin_post', content: 'Check out our latest episode!' })
  await createTestAsset(testEpisode.id, { asset_type: 'twitter_thread', content: '🧵 Thread:\n1/ Great insights today...' })
  await createTestAsset(testEpisode.id, { asset_type: 'blog_post', content: '# Blog Post\nContent here...' })
})

afterAll(async () => {
  await cleanupAllTestData()
})

describe('User Workflow: Show Management', () => {
  it('lists shows for the user', async () => {
    const res = await api.get<{ data: unknown[] }>('/api/shows')
    expect(res.ok).toBe(true)
    expect(Array.isArray(res.data.data)).toBe(true)
  })

  it('creates a new show', async () => {
    const showName = `[TEST] Workflow Show ${Date.now()}`
    const res = await api.post<{
      data: { id: string; name: string }
      error: string | null
    }>('/api/shows', {
      name: showName,
      description: 'Test workflow show',
      language: 'en',
    })

    expect(res.ok).toBe(true)
    expect(res.data.data.name).toBe(showName)

    // Track for cleanup
    trackTestShow(res.data.data.id)
  })
})

describe('User Workflow: Episode Lifecycle', () => {
  it('lists episodes with pagination', async () => {
    const res = await api.get<{
      data: unknown[]
      total: number
      page: number
      per_page: number
    }>('/api/episodes', { page: 1, per_page: 10 })

    expect(res.ok).toBe(true)
    expect(res.data).toHaveProperty('data')
    expect(res.data).toHaveProperty('total')
    expect(res.data).toHaveProperty('page')
    expect(res.data).toHaveProperty('per_page')
    expect(res.data.page).toBe(1)
    expect(res.data.per_page).toBe(10)
  })

  it('filters episodes by show_id', async () => {
    const res = await api.get<{
      data: Array<{ show_id: string }>
      total: number
    }>('/api/episodes', { show_id: testShow.id })

    expect(res.ok).toBe(true)
    // All returned episodes should belong to the test show
    for (const ep of res.data.data) {
      expect(ep.show_id).toBe(testShow.id)
    }
  })

  it('filters episodes by status', async () => {
    const res = await api.get<{
      data: Array<{ status: string }>
    }>('/api/episodes', { status: 'completed' })

    expect(res.ok).toBe(true)
    for (const ep of res.data.data) {
      expect(ep.status).toBe('completed')
    }
  })
})

describe('User Workflow: Episode Content', () => {
  it('retrieves all assets for an episode', async () => {
    const res = await api.get<{
      data: {
        assets: Array<{
          id: string
          asset_type: string
          content: string
        }>
        episodeId: string
      }
    }>(`/api/episodes/${testEpisode.id}/assets`)

    expect(res.ok).toBe(true)
    expect(res.data.data.assets.length).toBeGreaterThanOrEqual(4)
    expect(res.data.data.episodeId).toBe(testEpisode.id)

    // Verify asset types are diverse
    const types = res.data.data.assets.map((a) => a.asset_type)
    expect(types).toContain('show_notes')
    expect(types).toContain('linkedin_post')
  })

  it('retrieves SEO analysis for an episode', async () => {
    const res = await api.get<{
      data: {
        analysis: unknown
        schema: unknown
        episode: { seo_score: number | null }
      }
    }>(`/api/episodes/${testEpisode.id}/seo`)

    expect(res.ok).toBe(true)
    expect(res.data.data).toHaveProperty('analysis')
    expect(res.data.data).toHaveProperty('episode')
    expect(res.data.data.episode.seo_score).toBe(85) // Set in createCompletedTestEpisode
  })
})

describe('User Workflow: Processing', () => {
  it('checks processing status (returns ApiResponse format)', async () => {
    const res = await api.get<{
      data: unknown | null
      error: string | null
    }>(`/api/episodes/${testEpisode.id}/process`)

    // Both data and error should be present in the response shape
    expect(res.data).toHaveProperty('data')
    expect(res.data).toHaveProperty('error')
  })

  it('triggers processing for an episode', async () => {
    // Create a fresh pending episode
    const client = getAdminClient()
    const { data: freshEpisode } = await client
      .from('episodes')
      .insert({
        show_id: testShow.id,
        title: `[TEST] Process Test ${Date.now()}`,
        audio_url: 'https://example.com/test.mp3',
        status: 'pending',
        metadata: {},
      })
      .select()
      .single()

    trackTestEpisode(freshEpisode.id)

    const res = await api.post<{
      data: {
        runId?: string
        episodeId?: string
        status?: string
        message?: string
      } | null
      error: string | null
    }>(`/api/episodes/${freshEpisode.id}/process`, {})

    // May fail if Trigger.dev is not configured, but format should be correct
    expect(res.data).toHaveProperty('data')
    expect(res.data).toHaveProperty('error')

    if (res.ok && res.data.data) {
      expect(res.data.data.episodeId).toBe(freshEpisode.id)
    }
  })
})

describe('User Workflow: Guest Package', () => {
  it('fetches guest package for completed episode', async () => {
    const res = await api.get<{
      data: unknown | null
      error: string | null
    }>(`/api/episodes/${testEpisode.id}/guest-package`)

    expect(res.data).toHaveProperty('data')
    expect(res.data).toHaveProperty('error')

    // If successful, verify structure
    if (res.ok && res.data.data) {
      const guestPkg = res.data.data as {
        episode: unknown
        show: unknown
        package: unknown
      }
      expect(guestPkg).toHaveProperty('episode')
      expect(guestPkg).toHaveProperty('show')
      expect(guestPkg).toHaveProperty('package')
    }
  })

  it('rejects guest package for non-completed episode', async () => {
    const client = getAdminClient()
    const { data: pendingEp } = await client
      .from('episodes')
      .insert({
        show_id: testShow.id,
        title: `[TEST] Pending EP ${Date.now()}`,
        audio_url: 'https://example.com/test.mp3',
        status: 'pending',
        metadata: {},
      })
      .select()
      .single()

    trackTestEpisode(pendingEp.id)

    const res = await api.get<{
      error: string
    }>(`/api/episodes/${pendingEp.id}/guest-package`)

    expect(res.ok).toBe(false)
    expect(res.status).toBe(400)
  })
})

describe('User Workflow: Error Handling', () => {
  it('returns 404 for non-existent episode assets', async () => {
    const fakeId = '00000000-0000-0000-0000-999999999999'
    const res = await api.get<{ error: string }>(`/api/episodes/${fakeId}/assets`)
    expect(res.status).toBe(404)
  })

  it('returns 404 for non-existent episode SEO', async () => {
    const fakeId = '00000000-0000-0000-0000-999999999999'
    const res = await api.get<{ error: string }>(`/api/episodes/${fakeId}/seo`)
    expect(res.status).toBe(404)
  })

  it('returns 404 for non-existent episode processing', async () => {
    const fakeId = '00000000-0000-0000-0000-999999999999'
    const res = await api.get<{ error: string }>(`/api/episodes/${fakeId}/process`)
    expect(res.status).toBe(404)
  })
})

describe('User Workflow: Subscriptions', () => {
  it('returns subscription status', async () => {
    const res = await api.get<unknown>('/api/subscriptions')
    expect(res.ok).toBe(true)
  })
})
