#!/usr/bin/env node
/**
 * Snapshot a completed episode's full artifact set to /tmp so we can grade each
 * piece with the Anthropic API without re-hitting the DB.
 *
 * Uses the Planet Money 25-min episode by default (the longest real content we
 * have). Writes one JSON file per artifact to /tmp/podbrain-quality/ so the
 * grader script can consume them independently.
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createClient } from '@supabase/supabase-js'

// -------------------------- ENV LOADER --------------------------
const __dirname = dirname(fileURLToPath(import.meta.url))
const envPath = resolve(__dirname, '..', '.env.local')
const envText = readFileSync(envPath, 'utf8')
for (const line of envText.split('\n')) {
  const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/)
  if (m) process.env[m[1]] = m[2]
}

const OUT = '/tmp/podbrain-quality'
mkdirSync(OUT, { recursive: true })

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
)

// Prefer the Planet Money 25-min episode the E2E run produced.
const { data: episodes } = await admin
  .from('episodes')
  .select('*')
  .eq('status', 'completed')
  .not('transcript', 'is', null)
  .ilike('title', '%Planet Money 25min%')
  .order('created_at', { ascending: false })
  .limit(1)

const ep = episodes?.[0]
if (!ep) {
  console.error('No Planet Money 25min episode found')
  process.exit(1)
}

console.log('Snapshotting episode', { id: ep.id, title: ep.title })

writeFileSync(
  `${OUT}/episode.json`,
  JSON.stringify(
    {
      id: ep.id,
      title: ep.title,
      description: ep.description,
      status: ep.status,
      guest_name: ep.guest_name,
      guest_bio: ep.guest_bio,
      duration: ep.duration,
      seo_score: ep.seo_score,
      seo_analysis: ep.seo_analysis,
      schema_markup: ep.schema_markup,
      viral_moments: ep.viral_moments,
      transcript_chars: ep.transcript?.length ?? 0,
      show_notes_chars: ep.show_notes?.length ?? 0,
      show_notes_html_chars: ep.show_notes_html?.length ?? 0,
    },
    null,
    2
  )
)

writeFileSync(`${OUT}/transcript.txt`, ep.transcript ?? '')
writeFileSync(`${OUT}/show-notes.md`, ep.show_notes ?? '')
writeFileSync(`${OUT}/show-notes.html`, ep.show_notes_html ?? '')

const { data: assets } = await admin
  .from('generated_assets')
  .select('id, asset_type, content, metadata, created_at')
  .eq('episode_id', ep.id)
  .order('asset_type')

console.log('Assets found', { count: assets?.length ?? 0 })
writeFileSync(`${OUT}/assets.json`, JSON.stringify(assets ?? [], null, 2))
for (const asset of assets ?? []) {
  const fname = `asset-${asset.asset_type}.txt`
  writeFileSync(`${OUT}/${fname}`, asset.content ?? '')
}

const { data: sections } = await admin
  .from('episode_sections')
  .select('id, content, start_time, end_time, speaker')
  .eq('episode_id', ep.id)
  .order('start_time')

console.log('Sections found', { count: sections?.length ?? 0 })
writeFileSync(`${OUT}/sections.json`, JSON.stringify(sections ?? [], null, 2))

console.log('\nSnapshot complete:')
console.log(`  ${OUT}/episode.json`)
console.log(`  ${OUT}/transcript.txt (${ep.transcript?.length ?? 0} chars)`)
console.log(`  ${OUT}/show-notes.md (${ep.show_notes?.length ?? 0} chars)`)
console.log(`  ${OUT}/show-notes.html (${ep.show_notes_html?.length ?? 0} chars)`)
console.log(`  ${OUT}/assets.json (${assets?.length ?? 0} assets)`)
console.log(`  ${OUT}/sections.json (${sections?.length ?? 0} sections)`)
console.log(`  Plus ${assets?.length ?? 0} per-asset .txt files`)
