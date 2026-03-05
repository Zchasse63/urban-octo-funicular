// @vitest-environment node
/**
 * Generated Assets Database Integration Tests
 *
 * Tests CRUD operations for generated assets against the REAL database.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { getAdminClient, cleanupAllTestData, trackTestRecord } from '../../setup/database'
import { createTestShow, createTestEpisode, createTestAsset } from '../../utils/test-data'
import { getRecord, verifyRecordExists, getRecordCount } from '../../utils/db-helper'
import type { Show, Episode, GeneratedAsset } from '@/types/database'

describe('Generated Assets CRUD Operations', () => {
  let testShow: Show
  let testEpisode: Episode

  beforeAll(async () => {
    testShow = await createTestShow({ name: '[TEST] Assets Test Show' })
    testEpisode = await createTestEpisode(testShow.id, { title: '[TEST] Assets Test Episode' })
  })

  afterAll(async () => {
    await cleanupAllTestData()
  })

  describe('CREATE', () => {
    it('creates an asset with required fields', async () => {
      const asset = await createTestAsset(testEpisode.id)

      expect(asset.id).toBeDefined()
      expect(asset.episode_id).toBe(testEpisode.id)
      expect(asset.asset_type).toBe('show_notes')
      expect(asset.content).toBeDefined()
    })

    it('auto-generates id and timestamps', async () => {
      const asset = await createTestAsset(testEpisode.id)

      expect(asset.id).toMatch(/^[0-9a-f-]{36}$/)
      expect(asset.created_at).toBeDefined()
      expect(asset.updated_at).toBeDefined()
    })

    it('creates asset with different types', async () => {
      const assetTypes = ['linkedin_post', 'twitter_thread', 'newsletter'] as const

      for (const assetType of assetTypes) {
        const asset = await createTestAsset(testEpisode.id, { asset_type: assetType })
        expect(asset.asset_type).toBe(assetType)
      }
    })

    it('stores metadata as JSON', async () => {
      const adminClient = getAdminClient()

      const { data, error } = await adminClient
        .from('generated_assets')
        .insert({
          episode_id: testEpisode.id,
          asset_type: 'quote_card',
          content: 'Quote content',
          metadata: { font: 'Inter', color: '#007AFF', style: 'modern' },
        })
        .select()
        .single()

      expect(error).toBeNull()
      expect(data.metadata).toEqual({ font: 'Inter', color: '#007AFF', style: 'modern' })

      trackTestRecord('generated_assets', data.id)
    })

    it('stores file_url for downloadable assets', async () => {
      const adminClient = getAdminClient()

      const { data, error } = await adminClient
        .from('generated_assets')
        .insert({
          episode_id: testEpisode.id,
          asset_type: 'audiogram',
          content: 'Audiogram description',
          file_url: 'https://storage.example.com/audiogram-123.mp4',
        })
        .select()
        .single()

      expect(error).toBeNull()
      expect(data.file_url).toBe('https://storage.example.com/audiogram-123.mp4')

      trackTestRecord('generated_assets', data.id)
    })

    it('requires episode_id', async () => {
      const adminClient = getAdminClient()

      const { error } = await adminClient.from('generated_assets').insert({
        asset_type: 'show_notes',
        content: 'Orphan content',
      })

      expect(error).not.toBeNull()
    })

    it('requires asset_type', async () => {
      const adminClient = getAdminClient()

      const { error } = await adminClient.from('generated_assets').insert({
        episode_id: testEpisode.id,
        content: 'Content without type',
      })

      expect(error).not.toBeNull()
    })
  })

  describe('READ', () => {
    it('fetches asset by id', async () => {
      const created = await createTestAsset(testEpisode.id)

      const fetched = await getRecord<GeneratedAsset>('generated_assets', { id: created.id })

      expect(fetched).not.toBeNull()
      expect(fetched?.id).toBe(created.id)
      expect(fetched?.content).toBe(created.content)
    })

    it('returns null for non-existent asset', async () => {
      const fetched = await getRecord<GeneratedAsset>('generated_assets', {
        id: '00000000-0000-0000-0000-000000000000',
      })

      expect(fetched).toBeNull()
    })

    it('fetches assets by episode_id', async () => {
      // Create a fresh episode for isolated testing
      const isolatedEpisode = await createTestEpisode(testShow.id, {
        title: '[TEST] Isolated Assets Episode',
      })
      await createTestAsset(isolatedEpisode.id)
      await createTestAsset(isolatedEpisode.id, { asset_type: 'newsletter' })

      const adminClient = getAdminClient()
      const { data, error } = await adminClient
        .from('generated_assets')
        .select('*')
        .eq('episode_id', isolatedEpisode.id)

      expect(error).toBeNull()
      expect(data?.length).toBe(2)
    })

    it('fetches assets by type', async () => {
      const adminClient = getAdminClient()

      // Create specific assets
      const { data: asset } = await adminClient
        .from('generated_assets')
        .insert({
          episode_id: testEpisode.id,
          asset_type: 'instagram_carousel',
          content: 'Instagram content',
        })
        .select()
        .single()
      trackTestRecord('generated_assets', asset.id)

      const { data: results } = await adminClient
        .from('generated_assets')
        .select('*')
        .eq('episode_id', testEpisode.id)
        .eq('asset_type', 'instagram_carousel')

      expect(results?.length).toBeGreaterThanOrEqual(1)
    })
  })

  describe('UPDATE', () => {
    it('updates content field', async () => {
      const asset = await createTestAsset(testEpisode.id)

      const adminClient = getAdminClient()
      const { error } = await adminClient
        .from('generated_assets')
        .update({ content: 'Updated content here' })
        .eq('id', asset.id)

      expect(error).toBeNull()

      const updated = await getRecord<GeneratedAsset>('generated_assets', { id: asset.id })
      expect(updated?.content).toBe('Updated content here')
    })

    it('updates metadata', async () => {
      const asset = await createTestAsset(testEpisode.id)

      const adminClient = getAdminClient()
      await adminClient
        .from('generated_assets')
        .update({ metadata: { version: 2, edited: true } })
        .eq('id', asset.id)

      const updated = await getRecord<GeneratedAsset>('generated_assets', { id: asset.id })
      expect(updated?.metadata).toEqual({ version: 2, edited: true })
    })

    it('updates file_url', async () => {
      const asset = await createTestAsset(testEpisode.id)

      const adminClient = getAdminClient()
      await adminClient
        .from('generated_assets')
        .update({ file_url: 'https://new-url.example.com/file.pdf' })
        .eq('id', asset.id)

      const updated = await getRecord<GeneratedAsset>('generated_assets', { id: asset.id })
      expect(updated?.file_url).toBe('https://new-url.example.com/file.pdf')
    })

    it('automatically updates updated_at timestamp', async () => {
      const asset = await createTestAsset(testEpisode.id)
      const originalUpdatedAt = new Date(asset.updated_at).getTime()

      await new Promise((resolve) => setTimeout(resolve, 100))

      const adminClient = getAdminClient()
      await adminClient.from('generated_assets').update({ content: 'Modified' }).eq('id', asset.id)

      const updated = await getRecord<GeneratedAsset>('generated_assets', { id: asset.id })
      const newUpdatedAt = new Date(updated!.updated_at).getTime()

      expect(newUpdatedAt).toBeGreaterThan(originalUpdatedAt)
    })
  })

  describe('DELETE', () => {
    it('deletes asset by id', async () => {
      const asset = await createTestAsset(testEpisode.id)

      expect(await verifyRecordExists('generated_assets', { id: asset.id })).toBe(true)

      const adminClient = getAdminClient()
      const { error } = await adminClient.from('generated_assets').delete().eq('id', asset.id)

      expect(error).toBeNull()
      expect(await verifyRecordExists('generated_assets', { id: asset.id })).toBe(false)
    })

    it('cascade deletes when episode is deleted', async () => {
      const isolatedEpisode = await createTestEpisode(testShow.id, {
        title: '[TEST] Cascade Delete Episode',
      })
      const asset1 = await createTestAsset(isolatedEpisode.id)
      const asset2 = await createTestAsset(isolatedEpisode.id)

      // Verify assets exist
      expect(await verifyRecordExists('generated_assets', { id: asset1.id })).toBe(true)
      expect(await verifyRecordExists('generated_assets', { id: asset2.id })).toBe(true)

      // Delete episode
      const adminClient = getAdminClient()
      await adminClient.from('episodes').delete().eq('id', isolatedEpisode.id)

      // Verify assets are cascade deleted
      expect(await verifyRecordExists('generated_assets', { id: asset1.id })).toBe(false)
      expect(await verifyRecordExists('generated_assets', { id: asset2.id })).toBe(false)
    })
  })
})

describe('Generated Assets Query Patterns', () => {
  let testShow: Show
  let testEpisode: Episode

  beforeAll(async () => {
    testShow = await createTestShow({ name: '[TEST] Assets Query Show' })
    testEpisode = await createTestEpisode(testShow.id, { title: '[TEST] Assets Query Episode' })
  })

  afterAll(async () => {
    await cleanupAllTestData()
  })

  it('counts assets for episode', async () => {
    const initialCount = await getRecordCount('generated_assets', { episode_id: testEpisode.id })

    await createTestAsset(testEpisode.id)
    await createTestAsset(testEpisode.id)

    const newCount = await getRecordCount('generated_assets', { episode_id: testEpisode.id })
    expect(newCount).toBe(initialCount + 2)
  })

  it('orders assets by created_at descending', async () => {
    const isolatedEpisode = await createTestEpisode(testShow.id, {
      title: '[TEST] Order Test Episode',
    })

    const asset1 = await createTestAsset(isolatedEpisode.id, { content: 'First' })
    await new Promise((resolve) => setTimeout(resolve, 50))
    const asset2 = await createTestAsset(isolatedEpisode.id, { content: 'Second' })

    const adminClient = getAdminClient()
    const { data: assets } = await adminClient
      .from('generated_assets')
      .select('*')
      .eq('episode_id', isolatedEpisode.id)
      .order('created_at', { ascending: false })

    expect(assets![0].content).toBe('Second')
    expect(assets![1].content).toBe('First')
  })

  it('groups assets by type', async () => {
    const isolatedEpisode = await createTestEpisode(testShow.id, {
      title: '[TEST] Group Test Episode',
    })

    await createTestAsset(isolatedEpisode.id, { asset_type: 'show_notes' })
    await createTestAsset(isolatedEpisode.id, { asset_type: 'show_notes' })
    await createTestAsset(isolatedEpisode.id, { asset_type: 'newsletter' })

    const adminClient = getAdminClient()
    const { data: showNotesAssets } = await adminClient
      .from('generated_assets')
      .select('*')
      .eq('episode_id', isolatedEpisode.id)
      .eq('asset_type', 'show_notes')

    const { data: newsletterAssets } = await adminClient
      .from('generated_assets')
      .select('*')
      .eq('episode_id', isolatedEpisode.id)
      .eq('asset_type', 'newsletter')

    expect(showNotesAssets?.length).toBe(2)
    expect(newsletterAssets?.length).toBe(1)
  })
})
