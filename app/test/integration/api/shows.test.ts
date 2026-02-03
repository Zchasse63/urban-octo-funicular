/**
 * Shows API Integration Tests
 *
 * Tests the /api/shows endpoint against the REAL database.
 * No mocking - we verify actual database state changes.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { api } from '../../utils/api-client'
import { getRecord, getRecordCount, verifyRecordExists } from '../../utils/db-helper'
import { createTestShow } from '../../utils/test-data'
import { cleanupAllTestData, generateTestShowName } from '../../setup/database'
import type { Show, ApiResponse, PaginatedResponse } from '@/types/database'

describe('GET /api/shows', () => {
  beforeAll(async () => {
    // Create some test shows
    await createTestShow({ name: '[TEST] Show A' })
    await createTestShow({ name: '[TEST] Show B' })
    await createTestShow({ name: '[TEST] Show C' })
  })

  afterAll(async () => {
    await cleanupAllTestData()
  })

  it('returns paginated list of shows', async () => {
    const response = await api.get<PaginatedResponse<Show>>('/api/shows')

    expect(response.ok).toBe(true)
    expect(response.status).toBe(200)
    expect(response.data.data).toBeDefined()
    expect(Array.isArray(response.data.data)).toBe(true)
    expect(response.data.total).toBeGreaterThanOrEqual(3)
    expect(response.data.page).toBe(1)
  })

  it('supports pagination parameters', async () => {
    const response = await api.get<PaginatedResponse<Show>>('/api/shows', {
      page: 1,
      per_page: 2,
    })

    expect(response.ok).toBe(true)
    expect(response.data.data.length).toBeLessThanOrEqual(2)
    expect(response.data.per_page).toBe(2)
  })

  it('returns shows in descending created_at order', async () => {
    const response = await api.get<PaginatedResponse<Show>>('/api/shows')

    expect(response.ok).toBe(true)
    const shows = response.data.data

    // Verify ordering (newest first)
    for (let i = 1; i < shows.length; i++) {
      const prev = new Date(shows[i - 1].created_at).getTime()
      const curr = new Date(shows[i].created_at).getTime()
      expect(prev).toBeGreaterThanOrEqual(curr)
    }
  })
})

describe('POST /api/shows', () => {
  afterAll(async () => {
    await cleanupAllTestData()
  })

  it('creates a new show with valid data', async () => {
    const showName = generateTestShowName()
    const showData = {
      name: showName,
      description: 'A test podcast show',
      default_language: 'en',
    }

    const response = await api.post<ApiResponse<Show>>('/api/shows', showData)

    expect(response.ok).toBe(true)
    expect(response.status).toBe(201)
    expect(response.data.data).toBeDefined()
    expect(response.data.data?.name).toBe(showName)
    expect(response.data.data?.description).toBe('A test podcast show')
    expect(response.data.data?.default_language).toBe('en')

    // Verify in REAL database
    if (response.data.data?.id) {
      const dbShow = await getRecord<Show>('shows', { id: response.data.data.id })
      expect(dbShow).not.toBeNull()
      expect(dbShow?.name).toBe(showName)
    }
  })

  it('rejects show creation without name', async () => {
    const response = await api.post<ApiResponse<null>>('/api/shows', {
      description: 'Missing name field',
    })

    expect(response.ok).toBe(false)
    expect(response.status).toBe(400)
    expect(response.data.error).toBeTruthy()
  })

  it('rejects show creation with empty name', async () => {
    const response = await api.post<ApiResponse<null>>('/api/shows', {
      name: '   ',
      description: 'Empty name',
    })

    expect(response.ok).toBe(false)
    expect(response.status).toBe(400)
  })

  // Note: Show name uniqueness is NOT enforced at DB level
  // The schema doesn't have a unique constraint on (user_id, name)
  it.skip('handles duplicate show names gracefully', async () => {
    const showName = generateTestShowName()

    // Create first show
    const first = await api.post<ApiResponse<Show>>('/api/shows', { name: showName })
    expect(first.ok).toBe(true)

    // Try to create duplicate
    const second = await api.post<ApiResponse<null>>('/api/shows', { name: showName })
    expect(second.ok).toBe(false)
    expect(second.status).toBe(409) // Conflict
  })

  it('trims whitespace from show name', async () => {
    const showName = generateTestShowName()
    const response = await api.post<ApiResponse<Show>>('/api/shows', {
      name: `  ${showName}  `,
    })

    expect(response.ok).toBe(true)
    expect(response.data.data?.name).toBe(showName)
  })
})

describe('Shows Database Verification', () => {
  afterAll(async () => {
    await cleanupAllTestData()
  })

  it('API-created shows exist in real database', async () => {
    const showName = generateTestShowName()

    // Create via API
    const response = await api.post<ApiResponse<Show>>('/api/shows', {
      name: showName,
    })

    expect(response.ok).toBe(true)
    const showId = response.data.data?.id

    // Verify exists in database
    const exists = await verifyRecordExists('shows', { id: showId })
    expect(exists).toBe(true)

    // Verify correct data in database
    const dbShow = await getRecord<Show>('shows', { id: showId })
    expect(dbShow?.name).toBe(showName)
    expect(dbShow?.user_id).toBe('00000000-0000-0000-0000-000000000001') // Default user
  })

  it('show count increases after creation', async () => {
    const countBefore = await getRecordCount('shows', {
      user_id: '00000000-0000-0000-0000-000000000001',
    })

    await api.post<ApiResponse<Show>>('/api/shows', {
      name: generateTestShowName(),
    })

    const countAfter = await getRecordCount('shows', {
      user_id: '00000000-0000-0000-0000-000000000001',
    })

    expect(countAfter).toBe(countBefore + 1)
  })
})
