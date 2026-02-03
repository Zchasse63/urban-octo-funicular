/**
 * SEO API Integration Tests
 *
 * Tests the /api/episodes/[id]/seo endpoint against the REAL database.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { api } from '../../utils/api-client'
import { createTestShow, createCompletedTestEpisode, createTestEpisode } from '../../utils/test-data'
import { cleanupAllTestData } from '../../setup/database'
import type { Episode, Show, ApiResponse } from '@/types/database'

interface SEOResponse {
  analysis: {
    overallScore: number
    factors: Record<string, unknown>
    suggestions: Array<{ title: string; description: string }>
  }
  schema: Record<string, unknown>
  episode: {
    id: string
    title: string | null
    description: string | null
    seo_score: number | null
  }
}

describe('GET /api/episodes/[id]/seo', () => {
  let testShow: Show
  let completedEpisode: Episode
  let pendingEpisode: Episode

  beforeAll(async () => {
    testShow = await createTestShow({ name: '[TEST] SEO API Show' })
    completedEpisode = await createCompletedTestEpisode(testShow.id)
    pendingEpisode = await createTestEpisode(testShow.id, {
      title: '[TEST] Pending SEO Episode',
      status: 'pending',
    })
  })

  afterAll(async () => {
    await cleanupAllTestData()
  })

  it('returns SEO analysis for completed episode', async () => {
    const response = await api.get<ApiResponse<SEOResponse>>(`/api/episodes/${completedEpisode.id}/seo`)

    expect(response.ok).toBe(true)
    expect(response.status).toBe(200)
    expect(response.data.data).toBeDefined()
    expect(response.data.data?.analysis).toBeDefined()
    expect(response.data.data?.analysis.overallScore).toBeGreaterThanOrEqual(0)
    expect(response.data.data?.analysis.overallScore).toBeLessThanOrEqual(100)
  })

  it('returns schema markup', async () => {
    const response = await api.get<ApiResponse<SEOResponse>>(`/api/episodes/${completedEpisode.id}/seo`)

    expect(response.ok).toBe(true)
    expect(response.data.data?.schema).toBeDefined()
    expect(response.data.data?.schema['@type']).toBe('PodcastEpisode')
  })

  it('returns episode metadata', async () => {
    const response = await api.get<ApiResponse<SEOResponse>>(`/api/episodes/${completedEpisode.id}/seo`)

    expect(response.ok).toBe(true)
    expect(response.data.data?.episode).toBeDefined()
    expect(response.data.data?.episode.id).toBe(completedEpisode.id)
  })

  it('returns 404 for non-existent episode', async () => {
    const fakeId = '00000000-0000-0000-0000-000000000999'
    const response = await api.get<ApiResponse<null>>(`/api/episodes/${fakeId}/seo`)

    expect(response.ok).toBe(false)
    expect(response.status).toBe(404)
  })

  it('works for episodes without show notes', async () => {
    const response = await api.get<ApiResponse<SEOResponse>>(`/api/episodes/${pendingEpisode.id}/seo`)

    expect(response.ok).toBe(true)
    // Should still return analysis even if empty
    expect(response.data.data?.analysis).toBeDefined()
  })
})

describe('PUT /api/episodes/[id]/seo', () => {
  let testShow: Show
  let testEpisode: Episode

  beforeAll(async () => {
    testShow = await createTestShow({ name: '[TEST] SEO Regenerate Show' })
    testEpisode = await createCompletedTestEpisode(testShow.id)
  })

  afterAll(async () => {
    await cleanupAllTestData()
  })

  it('regenerates SEO analysis', async () => {
    const response = await api.put<ApiResponse<SEOResponse>>(`/api/episodes/${testEpisode.id}/seo`, {})

    expect(response.ok).toBe(true)
    expect(response.data.data?.analysis).toBeDefined()
    expect(response.data.data?.schema).toBeDefined()
  })

  it('returns 404 for non-existent episode', async () => {
    const fakeId = '00000000-0000-0000-0000-000000000999'
    const response = await api.put<ApiResponse<null>>(`/api/episodes/${fakeId}/seo`, {})

    expect(response.ok).toBe(false)
    expect(response.status).toBe(404)
  })
})

describe('POST /api/episodes/[id]/seo', () => {
  let testShow: Show
  let testEpisode: Episode

  beforeAll(async () => {
    testShow = await createTestShow({ name: '[TEST] SEO Fix Show' })
    testEpisode = await createCompletedTestEpisode(testShow.id)
  })

  afterAll(async () => {
    await cleanupAllTestData()
  })

  it('applies SEO fix with title update', async () => {
    const response = await api.post<ApiResponse<{ success: boolean; newScore: number; fixId: string }>>(
      `/api/episodes/${testEpisode.id}/seo`,
      {
        fixId: 'test-fix-1',
        title: 'Updated SEO-Optimized Title',
      }
    )

    expect(response.ok).toBe(true)
    expect(response.data.data?.success).toBe(true)
    expect(response.data.data?.fixId).toBe('test-fix-1')
  })

  it('applies SEO fix with description update', async () => {
    const response = await api.post<ApiResponse<{ success: boolean; newScore: number; fixId: string }>>(
      `/api/episodes/${testEpisode.id}/seo`,
      {
        fixId: 'test-fix-2',
        description: 'Updated SEO-optimized description with keywords',
      }
    )

    expect(response.ok).toBe(true)
    expect(response.data.data?.success).toBe(true)
  })

  it('applies SEO fix with show notes update', async () => {
    const response = await api.post<ApiResponse<{ success: boolean; newScore: number; fixId: string }>>(
      `/api/episodes/${testEpisode.id}/seo`,
      {
        fixId: 'test-fix-3',
        showNotes: '## Updated Show Notes\n\nWith better structure for SEO.',
        showNotesHtml: '<h2>Updated Show Notes</h2><p>With better structure for SEO.</p>',
      }
    )

    expect(response.ok).toBe(true)
    expect(response.data.data?.success).toBe(true)
    expect(typeof response.data.data?.newScore).toBe('number')
  })

  it('returns 404 for non-existent episode', async () => {
    const fakeId = '00000000-0000-0000-0000-000000000999'
    const response = await api.post<ApiResponse<null>>(`/api/episodes/${fakeId}/seo`, {
      fixId: 'test-fix',
      title: 'New Title',
    })

    expect(response.ok).toBe(false)
    expect(response.status).toBe(404)
  })
})
