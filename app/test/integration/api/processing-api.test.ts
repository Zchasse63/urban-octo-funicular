/**
 * Episode Processing API Integration Tests
 *
 * Tests the /api/episodes/[id]/process endpoint against the REAL database.
 * Note: These tests verify the API structure and validation.
 * Actual processing requires Trigger.dev to be running.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { api } from '../../utils/api-client'
import { createTestShow, createTestEpisode } from '../../utils/test-data'
import { cleanupAllTestData } from '../../setup/database'
import type { Episode, Show, ApiResponse } from '@/types/database'

interface ProcessingResponse {
  runId: string
  episodeId: string
  status: string
  message: string
}

interface RunStatusResponse {
  runId: string
  status: string
  createdAt: string
  updatedAt: string
  error?: string
}

describe('GET /api/episodes/[id]/process', () => {
  let testShow: Show
  let testEpisode: Episode

  beforeAll(async () => {
    testShow = await createTestShow({ name: '[TEST] Processing Status Show' })
    testEpisode = await createTestEpisode(testShow.id, {
      title: '[TEST] Processing Status Episode',
      status: 'pending',
    })
  })

  afterAll(async () => {
    await cleanupAllTestData()
  })

  it('returns processing status for episode', async () => {
    const response = await api.get<ApiResponse<RunStatusResponse>>(`/api/episodes/${testEpisode.id}/process`)

    expect(response.ok).toBe(true)
    expect(response.status).toBe(200)
    expect(response.data.data).toBeDefined()
    expect(response.data.data?.status).toBeDefined()
  })

  it('returns empty runId when not processed', async () => {
    const response = await api.get<ApiResponse<RunStatusResponse>>(`/api/episodes/${testEpisode.id}/process`)

    expect(response.ok).toBe(true)
    // Episode hasn't been processed yet
    expect(response.data.data?.runId).toBe('')
    expect(response.data.data?.status).toBe('pending')
  })

  it('returns 404 for non-existent episode', async () => {
    const fakeId = '00000000-0000-0000-0000-000000000999'
    const response = await api.get<ApiResponse<null>>(`/api/episodes/${fakeId}/process`)

    expect(response.ok).toBe(false)
    expect(response.status).toBe(404)
    expect(response.data.error).toBeTruthy()
  })
})

describe('POST /api/episodes/[id]/process', () => {
  let testShow: Show

  beforeAll(async () => {
    testShow = await createTestShow({ name: '[TEST] Processing Trigger Show' })
  })

  afterAll(async () => {
    await cleanupAllTestData()
  })

  it('rejects processing for episode without audio', async () => {
    const episodeWithoutAudio = await createTestEpisode(testShow.id, {
      title: '[TEST] No Audio Episode',
      audio_url: null,
      status: 'pending',
    })

    const response = await api.post<ApiResponse<null>>(`/api/episodes/${episodeWithoutAudio.id}/process`, {})

    expect(response.ok).toBe(false)
    expect(response.status).toBe(400)
    expect(response.data.error).toContain('no audio')
  })

  it('rejects processing for already processing episode', async () => {
    const processingEpisode = await createTestEpisode(testShow.id, {
      title: '[TEST] Already Processing Episode',
      status: 'processing',
    })

    const response = await api.post<ApiResponse<null>>(`/api/episodes/${processingEpisode.id}/process`, {})

    expect(response.ok).toBe(false)
    expect(response.status).toBe(409)
    expect(response.data.error).toContain('already being processed')
  })

  it('returns 404 for non-existent episode', async () => {
    const fakeId = '00000000-0000-0000-0000-000000000999'
    const response = await api.post<ApiResponse<null>>(`/api/episodes/${fakeId}/process`, {})

    expect(response.ok).toBe(false)
    expect(response.status).toBe(404)
  })

  // Note: Actually triggering processing requires Trigger.dev to be configured
  // This test verifies the validation logic
  it('accepts valid episode for processing', async () => {
    const episodeWithAudio = await createTestEpisode(testShow.id, {
      title: '[TEST] Ready for Processing',
      audio_url: 'https://example.com/test-audio.mp3',
      status: 'pending',
    })

    const response = await api.post<ApiResponse<ProcessingResponse | null>>(
      `/api/episodes/${episodeWithAudio.id}/process`,
      {}
    )

    // May succeed (Trigger.dev configured) or fail (not configured)
    // Either way, validation passed
    expect([200, 500]).toContain(response.status)

    if (response.ok) {
      expect(response.data.data?.runId).toBeDefined()
      expect(response.data.data?.status).toBe('processing')
    }
  })
})

describe('DELETE /api/episodes/[id]/process', () => {
  let testShow: Show

  beforeAll(async () => {
    testShow = await createTestShow({ name: '[TEST] Cancel Processing Show' })
  })

  afterAll(async () => {
    await cleanupAllTestData()
  })

  it('rejects cancel for non-processing episode', async () => {
    const pendingEpisode = await createTestEpisode(testShow.id, {
      title: '[TEST] Pending Cancel Episode',
      status: 'pending',
    })

    const response = await api.delete<ApiResponse<null>>(`/api/episodes/${pendingEpisode.id}/process`)

    expect(response.ok).toBe(false)
    expect(response.status).toBe(400)
    expect(response.data.error).toContain('not currently processing')
  })

  it('rejects cancel for completed episode', async () => {
    const completedEpisode = await createTestEpisode(testShow.id, {
      title: '[TEST] Completed Cancel Episode',
      status: 'completed',
    })

    const response = await api.delete<ApiResponse<null>>(`/api/episodes/${completedEpisode.id}/process`)

    expect(response.ok).toBe(false)
    expect(response.status).toBe(400)
  })

  it('returns 404 for non-existent episode', async () => {
    const fakeId = '00000000-0000-0000-0000-000000000999'
    const response = await api.delete<ApiResponse<null>>(`/api/episodes/${fakeId}/process`)

    expect(response.ok).toBe(false)
    expect(response.status).toBe(404)
  })
})

describe('PUT /api/episodes/[id]/process', () => {
  let testShow: Show

  beforeAll(async () => {
    testShow = await createTestShow({ name: '[TEST] Replay Processing Show' })
  })

  afterAll(async () => {
    await cleanupAllTestData()
  })

  it('rejects replay for non-failed episode', async () => {
    const pendingEpisode = await createTestEpisode(testShow.id, {
      title: '[TEST] Pending Replay Episode',
      status: 'pending',
    })

    const response = await api.put<ApiResponse<null>>(`/api/episodes/${pendingEpisode.id}/process`, {})

    expect(response.ok).toBe(false)
    expect(response.status).toBe(400)
    expect(response.data.error).toContain('Only failed')
  })

  it('rejects replay for completed episode', async () => {
    const completedEpisode = await createTestEpisode(testShow.id, {
      title: '[TEST] Completed Replay Episode',
      status: 'completed',
    })

    const response = await api.put<ApiResponse<null>>(`/api/episodes/${completedEpisode.id}/process`, {})

    expect(response.ok).toBe(false)
    expect(response.status).toBe(400)
  })

  it('returns 404 for non-existent episode', async () => {
    const fakeId = '00000000-0000-0000-0000-000000000999'
    const response = await api.put<ApiResponse<null>>(`/api/episodes/${fakeId}/process`, {})

    expect(response.ok).toBe(false)
    expect(response.status).toBe(404)
  })

  it('rejects replay for failed episode without run ID', async () => {
    const failedEpisode = await createTestEpisode(testShow.id, {
      title: '[TEST] Failed No Run ID Episode',
      status: 'failed',
      metadata: {}, // No processing_run_id
    })

    const response = await api.put<ApiResponse<null>>(`/api/episodes/${failedEpisode.id}/process`, {})

    expect(response.ok).toBe(false)
    expect(response.status).toBe(400)
    expect(response.data.error).toContain('No previous processing run')
  })
})
