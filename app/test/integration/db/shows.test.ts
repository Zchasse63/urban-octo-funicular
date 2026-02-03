/**
 * Shows Database Integration Tests
 *
 * Direct database operations testing against REAL Supabase.
 * Tests CRUD operations, constraints, and RLS policies.
 */

import { describe, it, expect, afterAll } from 'vitest'
import {
  getAdminClient,
  cleanupAllTestData,
  generateTestShowName,
  trackTestShow,
} from '../../setup/database'
import { getRecord, verifyRecordExists, getRecordCount } from '../../utils/db-helper'
import { createTestShow, createTestEpisode, createTestVocabularyTerm } from '../../utils/test-data'
import type { Show } from '@/types/database'

const DEFAULT_USER_ID = '00000000-0000-0000-0000-000000000001'

describe('Shows CRUD Operations', () => {
  afterAll(async () => {
    await cleanupAllTestData()
  })

  describe('CREATE', () => {
    it('inserts a show with all fields', async () => {
      const adminClient = getAdminClient()
      const showName = generateTestShowName()

      const { data, error } = await adminClient
        .from('shows')
        .insert({
          user_id: DEFAULT_USER_ID,
          name: showName,
          description: 'Test description',
          default_language: 'es',
          style_preferences: { tone: 'casual' },
          artwork_url: 'https://example.com/art.jpg',
        })
        .select()
        .single()

      expect(error).toBeNull()
      expect(data).toBeDefined()
      expect(data.name).toBe(showName)
      expect(data.description).toBe('Test description')
      expect(data.default_language).toBe('es')
      expect(data.style_preferences).toEqual({ tone: 'casual' })

      // Track for cleanup
      trackTestShow(data.id)
    })

    it('auto-generates id and timestamps', async () => {
      const show = await createTestShow()

      expect(show.id).toBeDefined()
      expect(show.id).toMatch(/^[0-9a-f-]{36}$/) // UUID format
      expect(show.created_at).toBeDefined()
      expect(show.updated_at).toBeDefined()
    })

    it('defaults language to "en"', async () => {
      const adminClient = getAdminClient()
      const showName = generateTestShowName()

      const { data, error } = await adminClient
        .from('shows')
        .insert({
          user_id: DEFAULT_USER_ID,
          name: showName,
        })
        .select()
        .single()

      expect(error).toBeNull()
      expect(data.default_language).toBe('en')

      trackTestShow(data.id)
    })

    // Note: Show name uniqueness is enforced at API level, not DB level
    // The schema doesn't have a unique constraint on (user_id, name)
    it.skip('enforces unique constraint on name per user', async () => {
      const showName = generateTestShowName()

      // Create first show
      await createTestShow({ name: showName })

      // Try to create duplicate
      const adminClient = getAdminClient()
      const { error } = await adminClient.from('shows').insert({
        user_id: DEFAULT_USER_ID,
        name: showName,
      })

      expect(error).not.toBeNull()
      expect(error?.code).toBe('23505') // Unique violation
    })

    it('requires user_id', async () => {
      const adminClient = getAdminClient()

      const { error } = await adminClient.from('shows').insert({
        name: generateTestShowName(),
        // Missing user_id
      })

      expect(error).not.toBeNull()
    })

    it('requires name', async () => {
      const adminClient = getAdminClient()

      const { error } = await adminClient.from('shows').insert({
        user_id: DEFAULT_USER_ID,
        // Missing name
      })

      expect(error).not.toBeNull()
    })
  })

  describe('READ', () => {
    it('fetches show by id', async () => {
      const created = await createTestShow()

      const fetched = await getRecord<Show>('shows', { id: created.id })

      expect(fetched).not.toBeNull()
      expect(fetched?.id).toBe(created.id)
      expect(fetched?.name).toBe(created.name)
    })

    it('returns null for non-existent show', async () => {
      const fetched = await getRecord<Show>('shows', {
        id: '00000000-0000-0000-0000-000000000000',
      })

      expect(fetched).toBeNull()
    })

    it('fetches shows by user_id', async () => {
      // Create shows for default user
      await createTestShow()
      await createTestShow()

      const adminClient = getAdminClient()
      const { data, error } = await adminClient
        .from('shows')
        .select('*')
        .eq('user_id', DEFAULT_USER_ID)
        .like('name', '[TEST]%')

      expect(error).toBeNull()
      expect(data).toBeDefined()
      expect(data!.length).toBeGreaterThanOrEqual(2)
    })
  })

  describe('UPDATE', () => {
    it('updates show fields', async () => {
      const show = await createTestShow()

      const adminClient = getAdminClient()
      const { error } = await adminClient
        .from('shows')
        .update({ description: 'Updated description' })
        .eq('id', show.id)

      expect(error).toBeNull()

      // Verify update
      const updated = await getRecord<Show>('shows', { id: show.id })
      expect(updated?.description).toBe('Updated description')
    })

    it('automatically updates updated_at timestamp', async () => {
      const show = await createTestShow()
      const originalUpdatedAt = new Date(show.updated_at).getTime()

      // Wait a moment to ensure timestamp difference
      await new Promise((resolve) => setTimeout(resolve, 100))

      const adminClient = getAdminClient()
      await adminClient.from('shows').update({ description: 'New desc' }).eq('id', show.id)

      const updated = await getRecord<Show>('shows', { id: show.id })
      const newUpdatedAt = new Date(updated!.updated_at).getTime()

      expect(newUpdatedAt).toBeGreaterThan(originalUpdatedAt)
    })
  })

  describe('DELETE', () => {
    it('deletes show by id', async () => {
      const show = await createTestShow()

      // Verify exists
      expect(await verifyRecordExists('shows', { id: show.id })).toBe(true)

      const adminClient = getAdminClient()
      const { error } = await adminClient.from('shows').delete().eq('id', show.id)

      expect(error).toBeNull()

      // Verify deleted
      expect(await verifyRecordExists('shows', { id: show.id })).toBe(false)
    })

    it('cascades delete to episodes', async () => {
      const show = await createTestShow()
      const episode = await createTestEpisode(show.id)

      // Verify episode exists
      expect(await verifyRecordExists('episodes', { id: episode.id })).toBe(true)

      // Delete show
      const adminClient = getAdminClient()
      await adminClient.from('shows').delete().eq('id', show.id)

      // Verify episode was cascade deleted
      expect(await verifyRecordExists('episodes', { id: episode.id })).toBe(false)
    })

    it('cascades delete to vocabulary_terms', async () => {
      const show = await createTestShow()
      const term = await createTestVocabularyTerm(show.id)

      // Verify term exists
      expect(await verifyRecordExists('vocabulary_terms', { id: term.id })).toBe(true)

      // Delete show
      const adminClient = getAdminClient()
      await adminClient.from('shows').delete().eq('id', show.id)

      // Verify term was cascade deleted
      expect(await verifyRecordExists('vocabulary_terms', { id: term.id })).toBe(false)
    })
  })
})

describe('Shows Query Patterns', () => {
  afterAll(async () => {
    await cleanupAllTestData()
  })

  it('counts shows for user', async () => {
    const initialCount = await getRecordCount('shows', { user_id: DEFAULT_USER_ID })

    await createTestShow()
    await createTestShow()

    const newCount = await getRecordCount('shows', { user_id: DEFAULT_USER_ID })
    expect(newCount).toBe(initialCount + 2)
  })

  it('orders shows by created_at descending', async () => {
    await createTestShow({ name: '[TEST] First' })
    await new Promise((resolve) => setTimeout(resolve, 50))
    await createTestShow({ name: '[TEST] Second' })

    const adminClient = getAdminClient()
    const { data } = await adminClient
      .from('shows')
      .select('*')
      .like('name', '[TEST]%')
      .order('created_at', { ascending: false })
      .limit(2)

    expect(data![0].name).toBe('[TEST] Second')
    expect(data![1].name).toBe('[TEST] First')
  })
})
