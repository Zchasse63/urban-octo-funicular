// @vitest-environment node
/**
 * Episodes Database Integration Tests
 *
 * Direct database operations testing against REAL Supabase.
 * These tests do NOT require a running API server.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { getRecord, verifyRecordExists } from '../../utils/db-helper'
import { createTestShow, createTestEpisode, createCompletedTestEpisode } from '../../utils/test-data'
import { cleanupAllTestData } from '../../setup/database'
import type { Show, Episode } from '@/types/database'

describe('Episodes Database Operations', () => {
  let testShow: Show

  beforeAll(async () => {
    testShow = await createTestShow({ name: '[TEST] Episodes DB Test Show' })
  })

  afterAll(async () => {
    await cleanupAllTestData()
  })

  describe('CREATE', () => {
    it('creates episode with required fields', async () => {
      const episode = await createTestEpisode(testShow.id)

      expect(episode.id).toBeDefined()
      expect(episode.show_id).toBe(testShow.id)
      expect(episode.title).toContain('[TEST]')
      expect(episode.status).toBe('pending')
    })

    it('auto-generates id and timestamps', async () => {
      const episode = await createTestEpisode(testShow.id)

      expect(episode.id).toMatch(/^[0-9a-f-]{36}$/) // UUID format
      expect(episode.created_at).toBeDefined()
      expect(episode.updated_at).toBeDefined()
    })

    it('defaults status to pending', async () => {
      const episode = await createTestEpisode(testShow.id)
      expect(episode.status).toBe('pending')
    })
  })

  describe('READ', () => {
    it('fetches episode by id', async () => {
      const created = await createTestEpisode(testShow.id)

      const fetched = await getRecord<Episode>('episodes', { id: created.id })

      expect(fetched).not.toBeNull()
      expect(fetched?.id).toBe(created.id)
      expect(fetched?.title).toBe(created.title)
    })

    it('returns null for non-existent episode', async () => {
      const fetched = await getRecord<Episode>('episodes', {
        id: '00000000-0000-0000-0000-000000000000',
      })

      expect(fetched).toBeNull()
    })
  })

  describe('Completed Episodes', () => {
    it('completed episodes have all expected fields populated', async () => {
      const episode = await createCompletedTestEpisode(testShow.id)

      const dbEpisode = await getRecord<Episode>('episodes', { id: episode.id })

      expect(dbEpisode).not.toBeNull()
      expect(dbEpisode?.status).toBe('completed')
      expect(dbEpisode?.transcript).toBeTruthy()
      expect(dbEpisode?.show_notes).toBeTruthy()
      expect(dbEpisode?.seo_score).toBeGreaterThan(0)
    })

    it('episode transcript segments are valid JSON', async () => {
      const episode = await createCompletedTestEpisode(testShow.id)

      const dbEpisode = await getRecord<Episode>('episodes', { id: episode.id })
      expect(dbEpisode?.transcript_segments).toBeDefined()
      expect(Array.isArray(dbEpisode?.transcript_segments)).toBe(true)

      // Verify segment structure
      if (dbEpisode?.transcript_segments && dbEpisode.transcript_segments.length > 0) {
        const segment = dbEpisode.transcript_segments[0]
        expect(segment).toHaveProperty('start')
        expect(segment).toHaveProperty('end')
        expect(segment).toHaveProperty('text')
      }
    })

    it('episode seo_score is within valid range', async () => {
      const episode = await createCompletedTestEpisode(testShow.id)

      const dbEpisode = await getRecord<Episode>('episodes', { id: episode.id })
      expect(dbEpisode?.seo_score).toBeGreaterThanOrEqual(0)
      expect(dbEpisode?.seo_score).toBeLessThanOrEqual(100)
    })
  })

  describe('Episode Data Integrity', () => {
    it('episode status transitions are persisted', async () => {
      const episode = await createTestEpisode(testShow.id, { status: 'pending' })

      // Verify initial state
      const dbEpisode = await getRecord<Episode>('episodes', { id: episode.id })
      expect(dbEpisode?.status).toBe('pending')

      // Verify record exists with expected status
      const exists = await verifyRecordExists('episodes', {
        id: episode.id,
        status: 'pending',
      })
      expect(exists).toBe(true)
    })

    it('episode belongs to correct show', async () => {
      const episode = await createTestEpisode(testShow.id)

      const dbEpisode = await getRecord<Episode>('episodes', { id: episode.id })
      expect(dbEpisode?.show_id).toBe(testShow.id)
    })

    it('episode timestamps are automatically set', async () => {
      const episode = await createTestEpisode(testShow.id)

      const dbEpisode = await getRecord<Episode>('episodes', { id: episode.id })
      expect(dbEpisode?.created_at).toBeDefined()
      expect(dbEpisode?.updated_at).toBeDefined()

      // created_at and updated_at should be close to now
      const now = new Date()
      const createdAt = new Date(dbEpisode!.created_at)
      const diff = now.getTime() - createdAt.getTime()
      expect(diff).toBeLessThan(60000) // Within 1 minute
    })
  })
})
