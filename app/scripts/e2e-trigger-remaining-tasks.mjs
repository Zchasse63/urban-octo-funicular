#!/usr/bin/env node
/**
 * Exercise the remaining Trigger.dev tasks to reach 7/7 coverage:
 *   - generate-single-asset  (ad-hoc asset regeneration on existing episode)
 *   - expire-trials          (daily cron — fire manually now instead of waiting)
 *
 * Uses @trigger.dev/sdk `tasks.trigger()` to dispatch both, then polls
 * `runs.retrieve()` until each completes. Pulls an existing Planet-Money-25min
 * episode from the DB to supply a real transcript + show notes.
 */
import { readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { setTimeout as delay } from 'node:timers/promises'
import { createClient } from '@supabase/supabase-js'
import { tasks, runs, configure } from '@trigger.dev/sdk'

// -------------------------- ENV LOADER --------------------------
const __dirname = dirname(fileURLToPath(import.meta.url))
const envPath = resolve(__dirname, '..', '.env.local')
const envText = readFileSync(envPath, 'utf8')
for (const line of envText.split('\n')) {
  const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/)
  if (m) process.env[m[1]] = m[2]
}

const start = Date.now()
function log(msg, obj = {}) {
  const elapsed = ((Date.now() - start) / 1000).toFixed(1).padStart(6)
  const extra = Object.keys(obj).length ? ' ' + JSON.stringify(obj) : ''
  console.log(`[${elapsed}s] ${msg}${extra}`)
}

configure({ secretKey: process.env.TRIGGER_SECRET_KEY })

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
)

// -------------------------- PULL AN EXISTING EPISODE --------------------------
log('Looking up a recent completed episode for asset regeneration…')
const { data: recentEpisode, error: epErr } = await admin
  .from('episodes')
  .select('id, title, transcript, show_notes, viral_moments, guest_name')
  .eq('status', 'completed')
  .not('transcript', 'is', null)
  .not('show_notes', 'is', null)
  .order('created_at', { ascending: false })
  .limit(1)
  .single()

if (epErr || !recentEpisode) {
  console.error('FATAL: no completed episode found', epErr?.message)
  process.exit(1)
}
log('Source episode', {
  id: recentEpisode.id,
  title: recentEpisode.title,
  transcriptChars: recentEpisode.transcript.length,
  showNotesChars: recentEpisode.show_notes.length,
})

// -------------------------- 1. generate-single-asset --------------------------
log('Dispatching generate-single-asset …')
const singleAssetHandle = await tasks.trigger('generate-single-asset', {
  episodeId: recentEpisode.id,
  assetType: 'key_takeaways',
  transcript: recentEpisode.transcript,
  showNotes: recentEpisode.show_notes,
  guestName: recentEpisode.guest_name,
  viralMoments: recentEpisode.viral_moments || [],
})
log('Dispatched', { runId: singleAssetHandle.id })

// -------------------------- 2. expire-trials --------------------------
log('Dispatching expire-trials (manual fire of the daily cron)…')
const expireHandle = await tasks.trigger('expire-trials', {})
log('Dispatched', { runId: expireHandle.id })

// -------------------------- POLL BOTH --------------------------
async function waitFor(taskName, runId) {
  log(`Polling ${taskName}…`, { runId })
  while (true) {
    const r = await runs.retrieve(runId)
    if (r.status === 'COMPLETED') {
      log(`${taskName} COMPLETED`, {
        runId,
        durationMs: r.durationMs,
        outputPreview: typeof r.output === 'object' ? JSON.stringify(r.output).slice(0, 200) : undefined,
      })
      return r
    }
    if (r.status === 'FAILED' || r.status === 'CANCELED' || r.status === 'CRASHED') {
      log(`${taskName} ${r.status}`, { runId, error: r.error })
      throw new Error(`${taskName} ended with status ${r.status}`)
    }
    await delay(2000)
  }
}

const [singleResult, expireResult] = await Promise.all([
  waitFor('generate-single-asset', singleAssetHandle.id),
  waitFor('expire-trials', expireHandle.id),
])

console.log('\n=== SUMMARY ===')
console.log(
  JSON.stringify(
    {
      generateSingleAsset: {
        runId: singleAssetHandle.id,
        status: singleResult.status,
        output: singleResult.output,
      },
      expireTrials: {
        runId: expireHandle.id,
        status: expireResult.status,
        output: expireResult.output,
      },
      totalWallClockSeconds: Math.floor((Date.now() - start) / 1000),
    },
    null,
    2
  )
)
process.exit(0)
