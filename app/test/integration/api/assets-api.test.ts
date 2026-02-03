/**
 * Assets API Integration Tests
 *
 * Tests the /api/episodes/[id]/assets endpoint against the REAL database.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { api } from '../../utils/api-client'
import { createTestShow, createTestEpisode, createTestAsset, createCompletedTestEpisode } from '../../utils/test-data'
import { cleanupAllTestData } from '../../setup/database'
import type { Episode, Show, GeneratedAsset, ApiResponse } from '@/types/database'

interface AssetsResponse {
  assets: GeneratedAsset[]
  episodeId: string
}

describe('GET /api/episodes/[id]/assets', () => {
  let testShow: Show
  let testEpisode: Episode
  let testAssets: GeneratedAsset[]

  beforeAll(async () => {
    testShow = await createTestShow({ name: '[TEST] Assets API Show' })
    testEpisode = await createCompletedTestEpisode(testShow.id)

    // Create test assets (using valid asset_type enum values)
    testAssets = [
      await createTestAsset(testEpisode.id, { asset_type: 'show_notes', content: 'Show notes content' }),
      await createTestAsset(testEpisode.id, { asset_type: 'twitter_thread', content: 'Twitter thread content' }),
      await createTestAsset(testEpisode.id, { asset_type: 'blog_post', content: 'Blog post content' }),
    ]
  })

  afterAll(async () => {
    await cleanupAllTestData()
  })

  it('returns all assets for an episode', async () => {
    const response = await api.get<ApiResponse<AssetsResponse>>(`/api/episodes/${testEpisode.id}/assets`)

    expect(response.ok).toBe(true)
    expect(response.status).toBe(200)
    expect(response.data.data).toBeDefined()
    expect(response.data.data?.assets).toBeDefined()
    expect(response.data.data?.assets.length).toBeGreaterThanOrEqual(3)
    expect(response.data.data?.episodeId).toBe(testEpisode.id)
  })

  it('filters assets by type', async () => {
    const response = await api.get<ApiResponse<AssetsResponse>>(`/api/episodes/${testEpisode.id}/assets`, {
      type: 'show_notes',
    })

    expect(response.ok).toBe(true)
    expect(response.data.data?.assets.length).toBe(1)
    expect(response.data.data?.assets[0].asset_type).toBe('show_notes')
  })

  it('returns 404 for non-existent episode', async () => {
    const fakeId = '00000000-0000-0000-0000-000000000999'
    const response = await api.get<ApiResponse<null>>(`/api/episodes/${fakeId}/assets`)

    expect(response.ok).toBe(false)
    expect(response.status).toBe(404)
    expect(response.data.error).toBeTruthy()
  })

  it('returns empty array when no assets exist', async () => {
    const episodeWithoutAssets = await createTestEpisode(testShow.id, {
      title: '[TEST] Episode Without Assets',
    })

    const response = await api.get<ApiResponse<AssetsResponse>>(`/api/episodes/${episodeWithoutAssets.id}/assets`)

    expect(response.ok).toBe(true)
    expect(response.data.data?.assets).toEqual([])
  })

  it('returns assets in descending created_at order', async () => {
    const response = await api.get<ApiResponse<AssetsResponse>>(`/api/episodes/${testEpisode.id}/assets`)

    expect(response.ok).toBe(true)
    const assets = response.data.data?.assets || []

    for (let i = 1; i < assets.length; i++) {
      const prev = new Date(assets[i - 1].created_at).getTime()
      const curr = new Date(assets[i].created_at).getTime()
      expect(prev).toBeGreaterThanOrEqual(curr)
    }
  })
})

describe('DELETE /api/episodes/[id]/assets', () => {
  let testShow: Show
  let testEpisode: Episode

  beforeAll(async () => {
    testShow = await createTestShow({ name: '[TEST] Assets Delete Show' })
    testEpisode = await createCompletedTestEpisode(testShow.id)
  })

  afterAll(async () => {
    await cleanupAllTestData()
  })

  it('deletes asset by type', async () => {
    // Create an asset to delete
    const asset = await createTestAsset(testEpisode.id, {
      asset_type: 'newsletter',
      content: 'Newsletter to delete',
    })

    // Delete by type
    const deleteResponse = await api.delete<ApiResponse<{ deleted: boolean }>>(
      `/api/episodes/${testEpisode.id}/assets?type=newsletter`
    )

    expect(deleteResponse.ok).toBe(true)
    expect(deleteResponse.data.data?.deleted).toBe(true)

    // Verify deletion
    const getResponse = await api.get<ApiResponse<AssetsResponse>>(`/api/episodes/${testEpisode.id}/assets`, {
      type: 'newsletter',
    })

    expect(getResponse.data.data?.assets.length).toBe(0)
  })

  it('deletes asset by id', async () => {
    // Create an asset to delete
    const asset = await createTestAsset(testEpisode.id, {
      asset_type: 'linkedin_post',
      content: 'LinkedIn post to delete',
    })

    // Delete by id
    const deleteResponse = await api.delete<ApiResponse<{ deleted: boolean }>>(
      `/api/episodes/${testEpisode.id}/assets?id=${asset.id}`
    )

    expect(deleteResponse.ok).toBe(true)
    expect(deleteResponse.data.data?.deleted).toBe(true)
  })

  it('returns 400 when neither type nor id provided', async () => {
    const response = await api.delete<ApiResponse<null>>(`/api/episodes/${testEpisode.id}/assets`)

    expect(response.ok).toBe(false)
    expect(response.status).toBe(400)
    expect(response.data.error).toContain('type or id')
  })

  it('returns 404 for non-existent episode', async () => {
    const fakeId = '00000000-0000-0000-0000-000000000999'
    const response = await api.delete<ApiResponse<null>>(`/api/episodes/${fakeId}/assets?type=show_notes`)

    expect(response.ok).toBe(false)
    expect(response.status).toBe(404)
  })
})
