/**
 * PHASE B: SCHEMA ALIGNMENT VERIFICATION
 *
 * Code-level tests that verify Phase B fixes are correct.
 * Checks TypeScript types, migration file existence, and
 * source code patterns.
 */

import { describe, it, expect } from 'vitest'
import * as fs from 'fs'
import * as path from 'path'

const SRC = path.resolve(__dirname, '../../../src')
const ROOT = path.resolve(__dirname, '../../..')

function readSource(relativePath: string): string {
  return fs.readFileSync(path.join(SRC, relativePath), 'utf-8')
}

describe('Phase B: Schema alignment migration exists', () => {
  it('has schema alignment migration file', () => {
    const migrationsDir = path.join(ROOT, '../supabase/migrations')
    const files = fs.readdirSync(migrationsDir)
    const alignmentMigration = files.find(f => f.includes('schema_alignment'))
    expect(alignmentMigration).toBeDefined()
  })

  it('migration adds new asset_type enum values', () => {
    const migrationsDir = path.join(ROOT, '../supabase/migrations')
    const files = fs.readdirSync(migrationsDir)
    const alignmentFile = files.find(f => f.includes('schema_alignment'))
    if (alignmentFile) {
      const content = fs.readFileSync(path.join(migrationsDir, alignmentFile), 'utf-8')
      expect(content).toContain('episode_titles')
      expect(content).toContain('key_takeaways')
      expect(content).toContain('linkedin_post_host')
      expect(content).toContain('ai_summary_short')
    }
  })
})

describe('Phase B: TypeScript types match schema', () => {
  const source = readSource('types/database.ts')

  it('User type has subscription_tier field', () => {
    expect(source).toContain('subscription_tier')
  })

  it('ProcessingStatus uses Trigger.dev statuses', () => {
    expect(source).toContain('PENDING')
    expect(source).toContain('QUEUED')
    expect(source).toContain('EXECUTING')
    expect(source).toContain('COMPLETED')
    expect(source).toContain('FAILED')
  })

  it('HostingConnection uses provider field', () => {
    expect(source).toContain('provider:')
  })

  it('TriggerRunStatus type is defined', () => {
    expect(source).toContain('TriggerRunStatus')
  })
})

describe('Phase B: Episode shows access uses hooks (not inline array)', () => {
  it('episodes page delegates to EpisodeList component', () => {
    const source = readSource('app/(app)/episodes/page.tsx')
    expect(source).toContain('EpisodeList')
  })

  it('EpisodeList component fetches shows via hook (not inline query)', () => {
    const source = readSource('components/episodes/episode-list.tsx')
    expect(source).toContain('useShows')
    // Should NOT have the old .shows?.[0]?.name pattern on episode objects
    expect(source).not.toContain('shows?.[0]?.name')
  })
})
