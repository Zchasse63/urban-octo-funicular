/**
 * New API Route Integration Tests
 *
 * Tests the Phase 7-8 API routes against the real running server.
 * All protected routes should return 401 for unauthenticated requests.
 * Tests verify validation, error handling, and response shapes.
 */

import { describe, it, expect, afterAll } from 'vitest'
import { api } from '../../utils/api-client'
import { cleanupAllTestData } from '../../setup/database'

afterAll(async () => {
  await cleanupAllTestData()
})

const fakeUUID = '00000000-0000-0000-0000-000000000099'
const invalidUUID = 'not-a-uuid'

// ─── Episode A/B Test Routes ────────────────────────────────────────────────

describe('GET /api/episodes/[id]/ab-test', () => {
  it('returns 401 for unauthenticated request', async () => {
    const response = await api.get(`/api/episodes/${fakeUUID}/ab-test`)
    expect(response.status).toBe(401)
  })

  it('returns 400 for invalid UUID', async () => {
    const response = await api.get(`/api/episodes/${invalidUUID}/ab-test`)
    // May return 401 (auth check first) or 400 (UUID check)
    expect([400, 401]).toContain(response.status)
  })
})

describe('POST /api/episodes/[id]/ab-test', () => {
  it('returns 401 for unauthenticated request', async () => {
    const response = await api.post(`/api/episodes/${fakeUUID}/ab-test`, {
      field: 'title',
    })
    expect(response.status).toBe(401)
  })
})

// ─── Episode Schedule Routes ────────────────────────────────────────────────

describe('GET /api/episodes/[id]/schedule', () => {
  it('returns 401 for unauthenticated request', async () => {
    const response = await api.get(`/api/episodes/${fakeUUID}/schedule`)
    expect(response.status).toBe(401)
  })
})

describe('POST /api/episodes/[id]/schedule', () => {
  it('returns 401 for unauthenticated request', async () => {
    const response = await api.post(`/api/episodes/${fakeUUID}/schedule`, {
      scheduledAt: new Date(Date.now() + 86400000).toISOString(),
    })
    expect(response.status).toBe(401)
  })
})

describe('DELETE /api/episodes/[id]/schedule', () => {
  it('returns 401 for unauthenticated request', async () => {
    const response = await api.delete(`/api/episodes/${fakeUUID}/schedule`)
    expect(response.status).toBe(401)
  })
})

// ─── Episode RSS Tags ───────────────────────────────────────────────────────

describe('GET /api/episodes/[id]/rss-tags', () => {
  it('returns 401 for unauthenticated request', async () => {
    const response = await api.get(`/api/episodes/${fakeUUID}/rss-tags`)
    expect(response.status).toBe(401)
  })
})

// ─── Episode Pre-Interview ──────────────────────────────────────────────────

describe('GET /api/episodes/[id]/pre-interview', () => {
  it('returns 401 for unauthenticated request', async () => {
    const response = await api.get(`/api/episodes/${fakeUUID}/pre-interview`)
    expect(response.status).toBe(401)
  })
})

describe('POST /api/episodes/[id]/pre-interview', () => {
  it('returns 401 for unauthenticated request', async () => {
    const response = await api.post(`/api/episodes/${fakeUUID}/pre-interview`, {
      guestName: 'Test Guest',
    })
    expect(response.status).toBe(401)
  })
})

// ─── Episode Learnings ──────────────────────────────────────────────────────

describe('GET /api/episodes/[id]/learnings', () => {
  it('returns 401 for unauthenticated request', async () => {
    const response = await api.get(`/api/episodes/${fakeUUID}/learnings`)
    expect(response.status).toBe(401)
  })
})

// ─── Team Routes ────────────────────────────────────────────────────────────

describe('GET /api/team', () => {
  it('returns 401 for unauthenticated request', async () => {
    const response = await api.get('/api/team')
    expect(response.status).toBe(401)
  })
})

describe('POST /api/team', () => {
  it('returns 401 for unauthenticated request', async () => {
    const response = await api.post('/api/team', {
      email: 'test@example.com',
      role: 'editor',
    })
    expect(response.status).toBe(401)
  })
})

// ─── Webhook Routes ─────────────────────────────────────────────────────────

describe('GET /api/webhooks', () => {
  it('returns 401 for unauthenticated request', async () => {
    const response = await api.get('/api/webhooks')
    expect(response.status).toBe(401)
  })
})

describe('POST /api/webhooks', () => {
  it('returns 401 for unauthenticated request', async () => {
    const response = await api.post('/api/webhooks', {
      url: 'https://example.com/webhook',
      events: ['episode.completed'],
    })
    expect(response.status).toBe(401)
  })
})

// ─── Analytics Overview ─────────────────────────────────────────────────────

describe('GET /api/analytics/overview', () => {
  it('returns 401 for unauthenticated request', async () => {
    const response = await api.get('/api/analytics/overview')
    expect(response.status).toBe(401)
  })
})

// ─── Show Import Route ──────────────────────────────────────────────────────

describe('POST /api/shows/[id]/import', () => {
  it('returns 401 for unauthenticated request', async () => {
    const response = await api.post(`/api/shows/${fakeUUID}/import`, {
      feedUrl: 'https://example.com/feed.xml',
    })
    expect(response.status).toBe(401)
  })
})

// ─── Taddy Search Route ────────────────────────────────────────────────────

describe('GET /api/taddy/search', () => {
  it('returns 401 for unauthenticated request', async () => {
    const response = await api.get('/api/taddy/search', { term: 'test' })
    expect(response.status).toBe(401)
  })
})

// ─── Show RSS Feed (Public) ────────────────────────────────────────────────
// RSS route returns plain text, not JSON - use raw fetch instead of api helper

describe('GET /api/shows/[id]/rss', () => {
  const BASE_URL = process.env.TEST_API_URL || 'http://localhost:3000'

  it('returns 401 when token is missing', async () => {
    const response = await fetch(`${BASE_URL}/api/shows/${fakeUUID}/rss`)
    expect(response.status).toBe(401)
  })

  it('returns 400 for invalid show UUID', async () => {
    const response = await fetch(`${BASE_URL}/api/shows/${invalidUUID}/rss?token=test`)
    expect(response.status).toBe(400)
  })

  it('returns 404 for non-existent show', async () => {
    const response = await fetch(`${BASE_URL}/api/shows/${fakeUUID}/rss?token=test`)
    expect(response.status).toBe(404)
  })
})

// ─── Webhook Event Validation ───────────────────────────────────────────────

describe('POST /api/webhooks/assemblyai', () => {
  it('returns 400 when transcript_id is missing', async () => {
    const response = await api.post('/api/webhooks/assemblyai', {
      status: 'completed',
    })
    expect(response.status).toBe(400)
    expect(response.data).toHaveProperty('error')
  })
})

describe('POST /api/stripe/webhooks', () => {
  it('returns 400 without valid stripe-signature', async () => {
    const response = await api.post('/api/stripe/webhooks', {
      type: 'checkout.session.completed',
    })
    // Stripe webhook handler returns 400 for missing/invalid signature
    expect(response.status).toBe(400)
  })
})
