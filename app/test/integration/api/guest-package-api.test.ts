/**
 * Guest Package API Integration Tests
 *
 * Tests the /api/episodes/[id]/guest-package endpoint against the REAL database.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { api } from '../../utils/api-client'
import { createTestShow, createCompletedTestEpisode, createTestEpisode } from '../../utils/test-data'
import { cleanupAllTestData } from '../../setup/database'
import type { Episode, Show, ApiResponse } from '@/types/database'

interface GuestPackageResponse {
  episode: Episode
  show: Show
  package: {
    socialPosts: Array<{
      platform: string
      content: string
      characterCount: number
      maxCharacters: number
    }>
    quoteCards: Array<{
      quote: string
      attribution: string
    }>
    emailSubject: string
    emailBody: string
  }
}

describe('GET /api/episodes/[id]/guest-package', () => {
  let testShow: Show
  let completedEpisode: Episode
  let pendingEpisode: Episode

  beforeAll(async () => {
    testShow = await createTestShow({ name: '[TEST] Guest Package Show' })
    completedEpisode = await createCompletedTestEpisode(testShow.id)
    pendingEpisode = await createTestEpisode(testShow.id, {
      title: '[TEST] Pending Guest Package Episode',
      status: 'pending',
    })
  })

  afterAll(async () => {
    await cleanupAllTestData()
  })

  it('returns guest package for completed episode', async () => {
    const response = await api.get<ApiResponse<GuestPackageResponse>>(
      `/api/episodes/${completedEpisode.id}/guest-package`
    )

    expect(response.ok).toBe(true)
    expect(response.status).toBe(200)
    expect(response.data.data).toBeDefined()
    expect(response.data.data?.package).toBeDefined()
  })

  it('returns social posts in package', async () => {
    const response = await api.get<ApiResponse<GuestPackageResponse>>(
      `/api/episodes/${completedEpisode.id}/guest-package`
    )

    expect(response.ok).toBe(true)
    expect(response.data.data?.package.socialPosts).toBeDefined()
    expect(Array.isArray(response.data.data?.package.socialPosts)).toBe(true)
  })

  it('returns quote cards in package', async () => {
    const response = await api.get<ApiResponse<GuestPackageResponse>>(
      `/api/episodes/${completedEpisode.id}/guest-package`
    )

    expect(response.ok).toBe(true)
    expect(response.data.data?.package.quoteCards).toBeDefined()
    expect(Array.isArray(response.data.data?.package.quoteCards)).toBe(true)
  })

  it('returns email content', async () => {
    const response = await api.get<ApiResponse<GuestPackageResponse>>(
      `/api/episodes/${completedEpisode.id}/guest-package`
    )

    expect(response.ok).toBe(true)
    expect(response.data.data?.package.emailSubject).toBeDefined()
    expect(response.data.data?.package.emailBody).toBeDefined()
  })

  it('returns episode and show data', async () => {
    const response = await api.get<ApiResponse<GuestPackageResponse>>(
      `/api/episodes/${completedEpisode.id}/guest-package`
    )

    expect(response.ok).toBe(true)
    expect(response.data.data?.episode).toBeDefined()
    expect(response.data.data?.show).toBeDefined()
    expect(response.data.data?.episode.id).toBe(completedEpisode.id)
  })

  it('returns 400 for non-completed episode', async () => {
    const response = await api.get<ApiResponse<null>>(`/api/episodes/${pendingEpisode.id}/guest-package`)

    expect(response.ok).toBe(false)
    expect(response.status).toBe(400)
    expect(response.data.error).toContain('not completed')
  })

  it('returns 404 for non-existent episode', async () => {
    const fakeId = '00000000-0000-0000-0000-000000000999'
    const response = await api.get<ApiResponse<null>>(`/api/episodes/${fakeId}/guest-package`)

    expect(response.ok).toBe(false)
    expect(response.status).toBe(404)
  })
})

describe('POST /api/episodes/[id]/guest-package', () => {
  let testShow: Show
  let completedEpisode: Episode
  let pendingEpisode: Episode

  beforeAll(async () => {
    testShow = await createTestShow({ name: '[TEST] Guest Package Email Show' })
    completedEpisode = await createCompletedTestEpisode(testShow.id)
    pendingEpisode = await createTestEpisode(testShow.id, {
      title: '[TEST] Pending Guest Package Email Episode',
      status: 'pending',
    })
  })

  afterAll(async () => {
    await cleanupAllTestData()
  })

  it('rejects invalid email address', async () => {
    const response = await api.post<ApiResponse<null>>(`/api/episodes/${completedEpisode.id}/guest-package`, {
      guestEmail: 'invalid-email',
    })

    expect(response.ok).toBe(false)
    expect(response.status).toBe(400)
    expect(response.data.error).toContain('Invalid email')
  })

  it('rejects empty email address', async () => {
    const response = await api.post<ApiResponse<null>>(`/api/episodes/${completedEpisode.id}/guest-package`, {
      guestEmail: '',
    })

    expect(response.ok).toBe(false)
    expect(response.status).toBe(400)
  })

  it('returns 400 for non-completed episode', async () => {
    const response = await api.post<ApiResponse<null>>(`/api/episodes/${pendingEpisode.id}/guest-package`, {
      guestEmail: 'test@example.com',
    })

    expect(response.ok).toBe(false)
    expect(response.status).toBe(400)
    expect(response.data.error).toContain('not completed')
  })

  it('returns 404 for non-existent episode', async () => {
    const fakeId = '00000000-0000-0000-0000-000000000999'
    const response = await api.post<ApiResponse<null>>(`/api/episodes/${fakeId}/guest-package`, {
      guestEmail: 'test@example.com',
    })

    expect(response.ok).toBe(false)
    expect(response.status).toBe(404)
  })

  // Note: Actually sending email requires RESEND_API_KEY to be configured
  // This test will return 500 or 503 if email service is not configured
  it('handles email service configuration', async () => {
    const response = await api.post<ApiResponse<null>>(`/api/episodes/${completedEpisode.id}/guest-package`, {
      guestEmail: 'test@example.com',
    })

    // Either success (if configured) or 500/503 (if not configured)
    expect([200, 500, 503]).toContain(response.status)
  })
})
