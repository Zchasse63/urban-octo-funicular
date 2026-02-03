/**
 * Episodes CRUD API Integration Tests
 *
 * Tests the episode listing and filtering endpoints against the REAL database.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { api } from '../../utils/api-client'
import { getRecord, verifyRecordExists } from '../../utils/db-helper'
import { createTestShow, createTestEpisode, createCompletedTestEpisode } from '../../utils/test-data'
import { cleanupAllTestData, generateTestEpisodeTitle } from '../../setup/database'
import type { Episode, Show, ApiResponse, PaginatedResponse } from '@/types/database'

interface EpisodeListItem {
  id: string
  show_id: string
  title: string | null
  description: string | null
  status: string
  seo_score: number | null
  created_at: string
  shows: { user_id: string; name: string }
}

describe('GET /api/episodes', () => {
  let testShow: Show
  let testEpisodes: Episode[]

  beforeAll(async () => {
    // Create test show and episodes
    testShow = await createTestShow({ name: '[TEST] Episodes API Show' })
    testEpisodes = [
      await createTestEpisode(testShow.id, { title: '[TEST] Episode A', status: 'pending' }),
      await createTestEpisode(testShow.id, { title: '[TEST] Episode B', status: 'completed' }),
      await createTestEpisode(testShow.id, { title: '[TEST] Episode C', status: 'processing' }),
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
    expect(response.data.total).toBeGreaterThanOrEqual(3)
    expect(response.data.page).toBe(1)
  })

  it('filters episodes by show_id', async () => {
    const response = await api.get<PaginatedResponse<EpisodeListItem>>('/api/episodes', {
      show_id: testShow.id,
    })

    expect(response.ok).toBe(true)
    expect(response.data.data.length).toBe(3)
    expect(response.data.data.every((ep) => ep.show_id === testShow.id)).toBe(true)
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

  it('supports pagination parameters', async () => {
    const response = await api.get<PaginatedResponse<EpisodeListItem>>('/api/episodes', {
      page: 1,
      per_page: 2,
    })

    expect(response.ok).toBe(true)
    expect(response.data.data.length).toBeLessThanOrEqual(2)
    expect(response.data.per_page).toBe(2)
  })

  it('returns episodes in descending created_at order', async () => {
    const response = await api.get<PaginatedResponse<EpisodeListItem>>('/api/episodes', {
      show_id: testShow.id,
    })

    expect(response.ok).toBe(true)
    const episodes = response.data.data

    for (let i = 1; i < episodes.length; i++) {
      const prev = new Date(episodes[i - 1].created_at).getTime()
      const curr = new Date(episodes[i].created_at).getTime()
      expect(prev).toBeGreaterThanOrEqual(curr)
    }
  })

  it('includes show relation data', async () => {
    const response = await api.get<PaginatedResponse<EpisodeListItem>>('/api/episodes', {
      show_id: testShow.id,
    })

    expect(response.ok).toBe(true)
    expect(response.data.data[0].shows).toBeDefined()
    expect(response.data.data[0].shows.name).toBe('[TEST] Episodes API Show')
  })
})

describe('Episodes Database Verification', () => {
  let testShow: Show

  beforeAll(async () => {
    testShow = await createTestShow({ name: '[TEST] DB Verify Show' })
  })

  afterAll(async () => {
    await cleanupAllTestData()
  })

  it('test episodes exist in real database', async () => {
    const episode = await createTestEpisode(testShow.id, {
      title: '[TEST] DB Verify Episode',
    })

    const exists = await verifyRecordExists('episodes', { id: episode.id })
    expect(exists).toBe(true)

    const dbEpisode = await getRecord<Episode>('episodes', { id: episode.id })
    expect(dbEpisode?.title).toBe('[TEST] DB Verify Episode')
    expect(dbEpisode?.show_id).toBe(testShow.id)
  })

  it('completed episodes have full data', async () => {
    const episode = await createCompletedTestEpisode(testShow.id)

    const dbEpisode = await getRecord<Episode>('episodes', { id: episode.id })
    expect(dbEpisode?.status).toBe('completed')
    expect(dbEpisode?.transcript).toBeTruthy()
    expect(dbEpisode?.show_notes).toBeTruthy()
    expect(dbEpisode?.seo_score).toBeGreaterThan(0)
  })
})

describe('Episode Status Transitions', () => {
  let testShow: Show

  beforeAll(async () => {
    testShow = await createTestShow({ name: '[TEST] Status Transitions Show' })
  })

  afterAll(async () => {
    await cleanupAllTestData()
  })

  it('episodes can be created with pending status', async () => {
    const episode = await createTestEpisode(testShow.id, { status: 'pending' })
    expect(episode.status).toBe('pending')
  })

  it('episodes can be created with processing status', async () => {
    const episode = await createTestEpisode(testShow.id, { status: 'processing' })
    expect(episode.status).toBe('processing')
  })

  it('episodes can be created with completed status', async () => {
    const episode = await createTestEpisode(testShow.id, { status: 'completed' })
    expect(episode.status).toBe('completed')
  })

  it('episodes can be created with failed status', async () => {
    const episode = await createTestEpisode(testShow.id, { status: 'failed' })
    expect(episode.status).toBe('failed')
  })
})
