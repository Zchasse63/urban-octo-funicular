/**
 * Episodes API Integration Tests
 *
 * Tests the /api/episodes endpoint against the REAL database.
 *
 * IMPORTANT: These tests require a running dev server!
 * Start the server before running: npm run dev
 * Run tests with: npm run test:api
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { api } from '../../utils/api-client'
import { createTestShow, createTestEpisode } from '../../utils/test-data'
import { cleanupAllTestData } from '../../setup/database'
import type { Show, Episode, EpisodeListItem, PaginatedResponse } from '@/types/database'

describe('GET /api/episodes', () => {
  let testShow: Show
  let testEpisodes: Episode[]

  beforeAll(async () => {
    // Create a test show with episodes
    testShow = await createTestShow({ name: '[TEST] Episode API Test Show' })

    testEpisodes = [
      await createTestEpisode(testShow.id, { title: '[TEST] Episode 1', status: 'completed' }),
      await createTestEpisode(testShow.id, { title: '[TEST] Episode 2', status: 'processing' }),
      await createTestEpisode(testShow.id, { title: '[TEST] Episode 3', status: 'pending' }),
    ]
  })

  afterAll(async () => {
    await cleanupAllTestData()
  })

  it('returns paginated list of episodes', async () => {
    const response = await api.get<PaginatedResponse<EpisodeListItem>>('/api/episodes')

    expect(response.ok).toBe(true)
    expect(response.status).toBe(200)
    expect(response.data.data).toBeDefined()
    expect(Array.isArray(response.data.data)).toBe(true)
  })

  it('filters episodes by show_id', async () => {
    const response = await api.get<PaginatedResponse<EpisodeListItem>>('/api/episodes', {
      show_id: testShow.id,
    })

    expect(response.ok).toBe(true)
    expect(response.data.data.length).toBe(3)

    // All episodes should belong to the test show
    for (const episode of response.data.data) {
      expect(episode.show_id).toBe(testShow.id)
    }
  })

  it('filters episodes by status', async () => {
    const response = await api.get<PaginatedResponse<EpisodeListItem>>('/api/episodes', {
      show_id: testShow.id,
      status: 'completed',
    })

    expect(response.ok).toBe(true)
    expect(response.data.data.length).toBe(1)
    expect(response.data.data[0].status).toBe('completed')
  })

  it('supports pagination', async () => {
    const response = await api.get<PaginatedResponse<EpisodeListItem>>('/api/episodes', {
      show_id: testShow.id,
      page: 1,
      per_page: 2,
    })

    expect(response.ok).toBe(true)
    expect(response.data.data.length).toBeLessThanOrEqual(2)
    expect(response.data.per_page).toBe(2)
  })

  it('returns episodes with show information', async () => {
    const response = await api.get<PaginatedResponse<EpisodeListItem>>('/api/episodes', {
      show_id: testShow.id,
    })

    expect(response.ok).toBe(true)

    const episode = response.data.data[0]
    expect(episode.shows).toBeDefined()
  })

  it('returns empty array for non-existent show', async () => {
    const response = await api.get<PaginatedResponse<EpisodeListItem>>('/api/episodes', {
      show_id: '00000000-0000-0000-0000-000000000000', // Non-existent
    })

    expect(response.ok).toBe(true)
    expect(response.data.data.length).toBe(0)
  })
})

