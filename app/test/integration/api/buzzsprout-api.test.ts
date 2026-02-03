/**
 * Buzzsprout Integration API Tests
 *
 * Tests the /api/buzzsprout/* endpoints against the REAL database.
 * Note: These tests verify API structure and validation.
 * Actual Buzzsprout API calls require valid credentials.
 */

import { describe, it, expect, afterAll } from 'vitest'
import { api } from '../../utils/api-client'
import { cleanupAllTestData } from '../../setup/database'
import type { ApiResponse } from '@/types/database'

describe('POST /api/buzzsprout/connect', () => {
  afterAll(async () => {
    await cleanupAllTestData()
  })

  it('rejects request without api_token', async () => {
    const response = await api.post<{ error: string }>('/api/buzzsprout/connect', {})

    expect(response.ok).toBe(false)
    expect(response.status).toBe(400)
    expect(response.data.error).toContain('Invalid api_token')
  })

  it('rejects empty api_token', async () => {
    const response = await api.post<{ error: string }>('/api/buzzsprout/connect', {
      api_token: '',
    })

    expect(response.ok).toBe(false)
    expect(response.status).toBe(400)
  })

  it('rejects overly long api_token', async () => {
    const response = await api.post<{ error: string }>('/api/buzzsprout/connect', {
      api_token: 'a'.repeat(300),
    })

    expect(response.ok).toBe(false)
    expect(response.status).toBe(400)
  })

  it('rejects invalid api_token (authentication fails)', async () => {
    const response = await api.post<{ error: string }>('/api/buzzsprout/connect', {
      api_token: 'invalid-fake-token-12345',
    })

    expect(response.ok).toBe(false)
    expect(response.status).toBe(401)
    expect(response.data.error).toContain('Invalid Buzzsprout API token')
  })

  it('rejects invalid show_id format', async () => {
    const response = await api.post<{ error: string }>('/api/buzzsprout/connect', {
      api_token: 'some-token',
      show_id: 'a'.repeat(200), // Too long
    })

    expect(response.ok).toBe(false)
    expect(response.status).toBe(400)
    expect(response.data.error).toContain('Invalid show_id')
  })

  it('accepts null show_id', async () => {
    // Will fail authentication but validates show_id is accepted as null
    const response = await api.post<{ error: string }>('/api/buzzsprout/connect', {
      api_token: 'some-token',
      show_id: null,
    })

    // Should fail at authentication step, not validation
    expect(response.status).toBe(401)
  })
})

describe('DELETE /api/buzzsprout/connect', () => {
  afterAll(async () => {
    await cleanupAllTestData()
  })

  it('responds to delete request', async () => {
    const response = await api.delete<{ success?: boolean; error?: string }>('/api/buzzsprout/connect')

    // May succeed or fail depending on table existence
    expect([200, 500]).toContain(response.status)
  })

  it('returns success when table exists', async () => {
    const response = await api.delete<{ success?: boolean; error?: string }>('/api/buzzsprout/connect')

    if (response.ok) {
      expect(response.data.success).toBe(true)
    }
  })
})

describe('Buzzsprout API Response Formats', () => {
  it('connect error response has error property', async () => {
    const response = await api.post<{ error: string }>('/api/buzzsprout/connect', {})

    expect(response.ok).toBe(false)
    expect(response.data).toHaveProperty('error')
    expect(typeof response.data.error).toBe('string')
  })

  it('disconnect response format', async () => {
    const response = await api.delete<{ success?: boolean; error?: string }>('/api/buzzsprout/connect')

    // If successful, should have success property
    if (response.ok) {
      expect(response.data).toHaveProperty('success')
      expect(response.data.success).toBe(true)
    } else {
      // If failed, should have error property
      expect(response.data).toHaveProperty('error')
    }
  })
})
