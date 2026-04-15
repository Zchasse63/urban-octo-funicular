#!/usr/bin/env node
/**
 * Exercise the post-transcription-pipeline task directly.
 *
 * In local dev we normally run the pipeline in POLLING mode, where the
 * process-episode orchestrator calls generate-show-notes + generate-assets
 * inline and post-transcription-pipeline NEVER fires. In production (webhook
 * mode) the AssemblyAI webhook handler triggers this task with the transcript
 * and segments.
 *
 * To confirm the task path still works end-to-end we:
 *   1. Look up an already-completed episode and copy its transcript + segments
 *   2. Fire post-transcription-pipeline with the same payload
 *   3. Wait for it to finish (it will overwrite the existing episode's
 *      show notes / assets, which is the correct behavior)
 *   4. Clean up the duplicate assets afterwards so the episode's asset
 *      count doesn't double
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

// -------------------------- LOOK UP A COMPLETED EPISODE --------------------------
log('Looking up a recent completed episode with segments…')
const { data: sourceEp, error: srcErr } = await admin
  .from('episodes')
  .select('id, show_id, title, transcript, transcript_segments, guest_name, guest_bio')
  .eq('status', 'completed')
  .not('transcript', 'is', null)
  .not('transcript_segments', 'is', null)
  .order('created_at', { ascending: false })
  .limit(1)
  .single()

if (srcErr || !sourceEp) {
  console.error('FATAL: no source episode', srcErr?.message)
  process.exit(1)
}
const segmentCount = Array.isArray(sourceEp.transcript_segments) ? sourceEp.transcript_segments.length : 0
log('Source episode', {
  id: sourceEp.id,
  showId: sourceEp.show_id,
  title: sourceEp.title,
  transcriptChars: sourceEp.transcript.length,
  segmentCount,
})

if (segmentCount === 0) {
  console.error('FATAL: source episode has no segments — cannot test post-transcription-pipeline')
  process.exit(1)
}

// Snapshot existing asset count so we can clean up duplicates after
const { count: beforeAssetCount } = await admin
  .from('generated_assets')
  .select('*', { count: 'exact', head: true })
  .eq('episode_id', sourceEp.id)
log('Assets before', { count: beforeAssetCount })

// -------------------------- FIRE THE TASK --------------------------
log('Dispatching post-transcription-pipeline …')
const handle = await tasks.trigger('post-transcription-pipeline', {
  episodeId: sourceEp.id,
  showId: sourceEp.show_id,
  transcript: sourceEp.transcript,
  segments: sourceEp.transcript_segments,
  guestName: sourceEp.guest_name,
  guestBio: sourceEp.guest_bio,
})
log('Dispatched', { runId: handle.id })

// -------------------------- POLL --------------------------
log('Polling …')
let final
while (true) {
  const r = await runs.retrieve(handle.id)
  if (r.status === 'COMPLETED') {
    log('COMPLETED', {
      runId: handle.id,
      durationMs: r.durationMs,
    })
    final = r
    break
  }
  if (r.status === 'FAILED' || r.status === 'CANCELED' || r.status === 'CRASHED') {
    log(`FAILED with ${r.status}`, { runId: handle.id, error: r.error })
    process.exit(2)
  }
  await delay(2000)
}

// -------------------------- CLEANUP: delete the new assets inserted by this run --------------------------
// The task inserts a fresh set of 8 assets. The pre-existing 8 are older.
// Identify "new" by created_at > start time and delete them so we don't
// inflate the original episode's asset count.
const { data: newAssets } = await admin
  .from('generated_assets')
  .select('id, created_at')
  .eq('episode_id', sourceEp.id)
  .gt('created_at', new Date(start).toISOString())
log('New assets created by this run', { count: newAssets?.length ?? 0 })

if (newAssets && newAssets.length) {
  const { error: delErr } = await admin
    .from('generated_assets')
    .delete()
    .in('id', newAssets.map((a) => a.id))
  log('Cleanup result', { deleted: newAssets.length, error: delErr?.message })
}

const { count: afterAssetCount } = await admin
  .from('generated_assets')
  .select('*', { count: 'exact', head: true })
  .eq('episode_id', sourceEp.id)
log('Assets after cleanup', { count: afterAssetCount })

console.log('\n=== SUMMARY ===')
console.log(JSON.stringify({
  runId: handle.id,
  status: final.status,
  durationMs: final.durationMs,
  outputPreview: typeof final.output === 'object'
    ? JSON.stringify(final.output).slice(0, 500)
    : undefined,
  assetsBefore: beforeAssetCount,
  assetsAfter: afterAssetCount,
  totalWallClockSeconds: Math.floor((Date.now() - start) / 1000),
}, null, 2))
process.exit(0)
