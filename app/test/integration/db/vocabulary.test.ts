// @vitest-environment node
/**
 * Vocabulary Terms Database Integration Tests
 *
 * Tests CRUD operations for vocabulary terms against the REAL database.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { getAdminClient, cleanupAllTestData, trackTestRecord } from '../../setup/database'
import { createTestShow, createTestVocabularyTerm } from '../../utils/test-data'
import { getRecord, verifyRecordExists, getRecordCount } from '../../utils/db-helper'
import type { Show, VocabularyTerm } from '@/types/database'

describe('Vocabulary Terms CRUD Operations', () => {
  let testShow: Show

  beforeAll(async () => {
    testShow = await createTestShow({ name: '[TEST] Vocabulary Test Show' })
  })

  afterAll(async () => {
    await cleanupAllTestData()
  })

  describe('CREATE', () => {
    it('creates a vocabulary term with required fields', async () => {
      const term = await createTestVocabularyTerm(testShow.id)

      expect(term.id).toBeDefined()
      expect(term.show_id).toBe(testShow.id)
      expect(term.term).toBeDefined()
    })

    it('auto-generates id and timestamps', async () => {
      const term = await createTestVocabularyTerm(testShow.id)

      expect(term.id).toMatch(/^[0-9a-f-]{36}$/)
      expect(term.created_at).toBeDefined()
      expect(term.updated_at).toBeDefined()
    })

    it('creates term with alternatives', async () => {
      const adminClient = getAdminClient()

      const { data, error } = await adminClient
        .from('vocabulary_terms')
        .insert({
          show_id: testShow.id,
          term: 'TestTermWithAlts',
          alternatives: ['alt1', 'alt2', 'alt3'],
        })
        .select()
        .single()

      expect(error).toBeNull()
      expect(data.alternatives).toEqual(['alt1', 'alt2', 'alt3'])

      trackTestRecord('vocabulary_terms', data.id)
    })

    it('defaults occurrence_count to 0', async () => {
      const term = await createTestVocabularyTerm(testShow.id)
      expect(term.occurrence_count).toBe(0)
    })

    it('requires show_id', async () => {
      const adminClient = getAdminClient()

      const { error } = await adminClient.from('vocabulary_terms').insert({
        term: 'OrphanTerm',
      })

      expect(error).not.toBeNull()
    })

    it('requires term field', async () => {
      const adminClient = getAdminClient()

      const { error } = await adminClient.from('vocabulary_terms').insert({
        show_id: testShow.id,
      })

      expect(error).not.toBeNull()
    })
  })

  describe('READ', () => {
    it('fetches term by id', async () => {
      const created = await createTestVocabularyTerm(testShow.id)

      const fetched = await getRecord<VocabularyTerm>('vocabulary_terms', { id: created.id })

      expect(fetched).not.toBeNull()
      expect(fetched?.id).toBe(created.id)
      expect(fetched?.term).toBe(created.term)
    })

    it('returns null for non-existent term', async () => {
      const fetched = await getRecord<VocabularyTerm>('vocabulary_terms', {
        id: '00000000-0000-0000-0000-000000000000',
      })

      expect(fetched).toBeNull()
    })

    it('fetches terms by show_id', async () => {
      await createTestVocabularyTerm(testShow.id)
      await createTestVocabularyTerm(testShow.id)

      const adminClient = getAdminClient()
      const { data, error } = await adminClient
        .from('vocabulary_terms')
        .select('*')
        .eq('show_id', testShow.id)

      expect(error).toBeNull()
      expect(data?.length).toBeGreaterThanOrEqual(2)
    })
  })

  describe('UPDATE', () => {
    it('updates term field', async () => {
      const term = await createTestVocabularyTerm(testShow.id)

      const adminClient = getAdminClient()
      const { error } = await adminClient
        .from('vocabulary_terms')
        .update({ term: 'UpdatedTerm' })
        .eq('id', term.id)

      expect(error).toBeNull()

      const updated = await getRecord<VocabularyTerm>('vocabulary_terms', { id: term.id })
      expect(updated?.term).toBe('UpdatedTerm')
    })

    it('updates alternatives array', async () => {
      const term = await createTestVocabularyTerm(testShow.id)

      const adminClient = getAdminClient()
      await adminClient
        .from('vocabulary_terms')
        .update({ alternatives: ['new1', 'new2'] })
        .eq('id', term.id)

      const updated = await getRecord<VocabularyTerm>('vocabulary_terms', { id: term.id })
      expect(updated?.alternatives).toEqual(['new1', 'new2'])
    })

    it('increments occurrence_count', async () => {
      const term = await createTestVocabularyTerm(testShow.id)

      const adminClient = getAdminClient()
      await adminClient
        .from('vocabulary_terms')
        .update({ occurrence_count: 5 })
        .eq('id', term.id)

      const updated = await getRecord<VocabularyTerm>('vocabulary_terms', { id: term.id })
      expect(updated?.occurrence_count).toBe(5)
    })

    it('automatically updates updated_at timestamp', async () => {
      const term = await createTestVocabularyTerm(testShow.id)
      const originalUpdatedAt = new Date(term.updated_at).getTime()

      await new Promise((resolve) => setTimeout(resolve, 100))

      const adminClient = getAdminClient()
      await adminClient.from('vocabulary_terms').update({ term: 'NewTerm' }).eq('id', term.id)

      const updated = await getRecord<VocabularyTerm>('vocabulary_terms', { id: term.id })
      const newUpdatedAt = new Date(updated!.updated_at).getTime()

      expect(newUpdatedAt).toBeGreaterThan(originalUpdatedAt)
    })
  })

  describe('DELETE', () => {
    it('deletes term by id', async () => {
      const term = await createTestVocabularyTerm(testShow.id)

      expect(await verifyRecordExists('vocabulary_terms', { id: term.id })).toBe(true)

      const adminClient = getAdminClient()
      const { error } = await adminClient.from('vocabulary_terms').delete().eq('id', term.id)

      expect(error).toBeNull()
      expect(await verifyRecordExists('vocabulary_terms', { id: term.id })).toBe(false)
    })

    it('deletes multiple terms by show_id', async () => {
      // Create a separate show for this test
      const isolatedShow = await createTestShow({ name: '[TEST] Isolated Vocab Show' })
      await createTestVocabularyTerm(isolatedShow.id)
      await createTestVocabularyTerm(isolatedShow.id)
      await createTestVocabularyTerm(isolatedShow.id)

      const initialCount = await getRecordCount('vocabulary_terms', { show_id: isolatedShow.id })
      expect(initialCount).toBe(3)

      const adminClient = getAdminClient()
      await adminClient.from('vocabulary_terms').delete().eq('show_id', isolatedShow.id)

      const finalCount = await getRecordCount('vocabulary_terms', { show_id: isolatedShow.id })
      expect(finalCount).toBe(0)
    })
  })
})

describe('Vocabulary Query Patterns', () => {
  let testShow: Show

  beforeAll(async () => {
    testShow = await createTestShow({ name: '[TEST] Vocab Query Show' })
  })

  afterAll(async () => {
    await cleanupAllTestData()
  })

  it('counts terms for show', async () => {
    const initialCount = await getRecordCount('vocabulary_terms', { show_id: testShow.id })

    await createTestVocabularyTerm(testShow.id)
    await createTestVocabularyTerm(testShow.id)

    const newCount = await getRecordCount('vocabulary_terms', { show_id: testShow.id })
    expect(newCount).toBe(initialCount + 2)
  })

  it('orders terms by occurrence_count descending', async () => {
    const adminClient = getAdminClient()

    // Create terms with different counts
    const { data: term1 } = await adminClient
      .from('vocabulary_terms')
      .insert({ show_id: testShow.id, term: 'LowCount', occurrence_count: 1 })
      .select()
      .single()
    trackTestRecord('vocabulary_terms', term1.id)

    const { data: term2 } = await adminClient
      .from('vocabulary_terms')
      .insert({ show_id: testShow.id, term: 'HighCount', occurrence_count: 100 })
      .select()
      .single()
    trackTestRecord('vocabulary_terms', term2.id)

    const { data: terms } = await adminClient
      .from('vocabulary_terms')
      .select('*')
      .eq('show_id', testShow.id)
      .in('id', [term1.id, term2.id])
      .order('occurrence_count', { ascending: false })

    expect(terms![0].term).toBe('HighCount')
    expect(terms![1].term).toBe('LowCount')
  })

  it('searches terms by partial match', async () => {
    const adminClient = getAdminClient()

    const { data: term } = await adminClient
      .from('vocabulary_terms')
      .insert({ show_id: testShow.id, term: 'UniqueSearchableTerm' })
      .select()
      .single()
    trackTestRecord('vocabulary_terms', term.id)

    const { data: results } = await adminClient
      .from('vocabulary_terms')
      .select('*')
      .eq('show_id', testShow.id)
      .ilike('term', '%Searchable%')

    expect(results?.length).toBeGreaterThanOrEqual(1)
    expect(results?.some((t) => t.term === 'UniqueSearchableTerm')).toBe(true)
  })
})
