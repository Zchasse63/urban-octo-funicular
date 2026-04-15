#!/usr/bin/env node
/**
 * End-to-end bulk pipeline test.
 *
 * Drives N real podcast episodes through the full PodBrain processing
 * pipeline CONCURRENTLY, exactly like a power user uploading multiple
 * episodes in a single session would.
 *
 *   1. Sign in as the live test user (agency tier)
 *   2. POST /api/shows                 — create a new test show
 *   3. For each MP3 in parallel:
 *      a. POST /api/upload             — mint a signed Storage upload URL
 *      b. uploadToSignedUrl            — PUT the MP3 to Supabase Storage
 *      c. POST /api/episodes           — create an episode row
 *      d. POST /api/episodes/:id/process — dispatch Trigger.dev job
 *   4. Poll all episodes in parallel until every one is completed or failed
 *   5. Dump per-episode summary + overall summary
 *
 * This is the "bulk upload" flow that was explicitly requested:
 *   "We need to try this in all different ways that the user would use
 *    our tool to make sure that we are checking all possibilities."
 *
 * Usage:
 *   node scripts/e2e-real-pipeline-bulk.mjs \
 *     --mp3 /tmp/podbrain-e2e/npr-news-now-latest.mp3 \
 *     --mp3 /tmp/podbrain-e2e/npr-news-now-02.mp3 \
 *     --mp3 /tmp/podbrain-e2e/npr-news-now-03.mp3 \
 *     --title-prefix "[TEST] Bulk NPR"
 */
import { readFileSync, statSync } from 'node:fs'
import { resolve, dirname, basename } from 'node:path'
import { fileURLToPath } from 'node:url'
import { setTimeout as delay } from 'node:timers/promises'
import { createClient } from '@supabase/supabase-js'

// -------------------------- ENV LOADER --------------------------
const __dirname = dirname(fileURLToPath(import.meta.url))
const envPath = resolve(__dirname, '..', '.env.local')
const envText = readFileSync(envPath, 'utf8')
for (const line of envText.split('\n')) {
  const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/)
  if (m) process.env[m[1]] = m[2]
}

// -------------------------- ARGS --------------------------
function argAll(name) {
  const out = []
  for (let i = 0; i < process.argv.length; i++) {
    if (process.argv[i] === `--${name}`) out.push(process.argv[i + 1])
  }
  return out
}
function arg(name, fallback) {
  const all = argAll(name)
  return all[0] ?? fallback
}

const MP3_PATHS = argAll('mp3')
if (MP3_PATHS.length === 0) {
  MP3_PATHS.push(
    '/tmp/podbrain-e2e/npr-news-now-latest.mp3',
    '/tmp/podbrain-e2e/npr-news-now-02.mp3',
    '/tmp/podbrain-e2e/npr-news-now-03.mp3'
  )
}
const API_BASE = arg('api', 'http://localhost:3000')
const TITLE_PREFIX = arg('title-prefix', '[TEST] Bulk Pipeline')
const POLL_INTERVAL_MS = Number(arg('poll', '5000'))
const MAX_WAIT_SECONDS = Number(arg('max-wait', '1800')) // 30 min for bulk

const TEST_EMAIL = 'live-test@podbrain-test.local'
const TEST_PASSWORD = 'LiveTest!2026SecurePassword'

// -------------------------- LOGGING --------------------------
const start = Date.now()
function log(msg, obj = {}) {
  const elapsed = ((Date.now() - start) / 1000).toFixed(1).padStart(6)
  const extra = Object.keys(obj).length ? ' ' + JSON.stringify(obj) : ''
  console.log(`[${elapsed}s] ${msg}${extra}`)
}
function bail(msg, obj = {}) {
  log(`FATAL: ${msg}`, obj)
  process.exit(1)
}

// -------------------------- PRE-FLIGHT --------------------------
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !anonKey || !serviceKey) {
  bail('Missing Supabase env vars')
}

const mp3Infos = MP3_PATHS.map((p) => {
  try {
    const st = statSync(p)
    return { path: p, size: st.size, name: basename(p) }
  } catch (e) {
    bail(`MP3 not found: ${p}`, { error: e.message })
  }
})
log('Bulk inputs', {
  count: mp3Infos.length,
  totalMB: (mp3Infos.reduce((s, i) => s + i.size, 0) / 1024 / 1024).toFixed(2),
  files: mp3Infos.map((i) => `${i.name} (${(i.size / 1024 / 1024).toFixed(2)} MB)`),
})

// -------------------------- SIGN IN --------------------------
log('Signing in test user…')
const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } })
const { data: users } = await admin.auth.admin.listUsers()
let testUser = users?.users?.find((u) => u.email === TEST_EMAIL)
if (!testUser) {
  const { data: created, error } = await admin.auth.admin.createUser({
    email: TEST_EMAIL,
    password: TEST_PASSWORD,
    email_confirm: true,
  })
  if (error) bail('createUser failed', { error: error.message })
  testUser = created.user
}
await admin.from('users').upsert(
  {
    id: testUser.id,
    email: TEST_EMAIL,
    subscription_tier: 'agency',
    subscription_status: 'active',
    trial_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
  },
  { onConflict: 'id' }
)

const anon = createClient(supabaseUrl, anonKey, {
  auth: { persistSession: false, autoRefreshToken: false },
})
const { data: signIn, error: signInError } = await anon.auth.signInWithPassword({
  email: TEST_EMAIL,
  password: TEST_PASSWORD,
})
if (signInError || !signIn.session) bail('Sign-in failed', { error: signInError?.message })

const session = signIn.session
const projectRef = new URL(supabaseUrl).hostname.split('.')[0]
const cookieName = `sb-${projectRef}-auth-token`
const sessionPayload = {
  access_token: session.access_token,
  token_type: session.token_type || 'bearer',
  expires_in: session.expires_in || 3600,
  expires_at: session.expires_at,
  refresh_token: session.refresh_token,
  user: session.user,
}
const json = JSON.stringify(sessionPayload)
const b64 = 'base64-' + Buffer.from(json, 'utf8').toString('base64')
const CHUNK_SIZE = 3180
const chunks = []
for (let i = 0; i < b64.length; i += CHUNK_SIZE) chunks.push(b64.slice(i, i + CHUNK_SIZE))
const cookies =
  chunks.length === 1
    ? [`${cookieName}=${encodeURIComponent(chunks[0])}`]
    : chunks.map((c, i) => `${cookieName}.${i}=${encodeURIComponent(c)}`)
const cookieHeader = cookies.join('; ')

// -------------------------- HTTP HELPER --------------------------
async function apiFetch(path, opts = {}) {
  const url = `${API_BASE}${path}`
  const res = await fetch(url, {
    ...opts,
    headers: { ...(opts.headers || {}), Cookie: cookieHeader },
  })
  const text = await res.text()
  let body = null
  try {
    body = text ? JSON.parse(text) : null
  } catch {
    body = { raw: text }
  }
  if (!res.ok) {
    throw new Error(`${opts.method || 'GET'} ${path} → ${res.status}: ${JSON.stringify(body)}`)
  }
  return body
}

// -------------------------- CREATE SHOW --------------------------
log('POST /api/shows')
const showStamp = new Date().toISOString().replace(/[:.]/g, '-')
const showResp = await apiFetch('/api/shows', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: `${TITLE_PREFIX} ${showStamp}`,
    description: 'Ephemeral show for the bulk end-to-end pipeline test.',
    default_language: 'en',
    style_preferences: { tone: 'professional' },
  }),
})
const show = showResp.data || showResp
log('Show created', { id: show.id, name: show.name })

// -------------------------- UPLOAD + CREATE + PROCESS (per MP3) --------------------------
/**
 * Does steps 2-5 for a single MP3 and returns the episodeId + runId.
 */
async function uploadCreateProcess(mp3Info, index) {
  const prefix = `#${index + 1}`
  log(`${prefix} POST /api/upload`, { file: mp3Info.name })
  const signed = await apiFetch('/api/upload', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fileName: mp3Info.name,
      fileSize: mp3Info.size,
      mimeType: 'audio/mpeg',
    }),
  })
  log(`${prefix} signed URL minted`, { filePath: signed.filePath })

  const buffer = readFileSync(mp3Info.path)
  const { data: upRes, error: upErr } = await admin.storage
    .from('episodes')
    .uploadToSignedUrl(signed.filePath, signed.token, buffer, {
      contentType: 'audio/mpeg',
      upsert: true,
    })
  if (upErr) throw new Error(`${prefix} uploadToSignedUrl: ${upErr.message}`)
  log(`${prefix} storage uploaded`, { path: upRes?.path })

  const epResp = await apiFetch('/api/episodes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      show_id: show.id,
      title: `${TITLE_PREFIX} ${index + 1}/${mp3Infos.length} — ${mp3Info.name}`,
      description: `Bulk E2E run slot ${index + 1}`,
      audio_url: signed.publicUrl,
      language: 'en',
    }),
  })
  const ep = epResp.data || epResp
  log(`${prefix} episode created`, { id: ep.id, status: ep.status })

  const procResp = await apiFetch(`/api/episodes/${ep.id}/process`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  })
  const runId = (procResp.data || procResp).runId
  log(`${prefix} process dispatched`, { runId })

  return { episodeId: ep.id, runId, file: mp3Info.name, index }
}

// Kick off all uploads concurrently (but stagger by 500ms to avoid
// hammering the /api/shows rate limiter and so we see each log line
// without everything landing in the same millisecond).
const dispatchResults = []
for (let i = 0; i < mp3Infos.length; i++) {
  dispatchResults.push(uploadCreateProcess(mp3Infos[i], i))
  await delay(500)
}
const episodes = await Promise.all(dispatchResults)
log('All episodes dispatched', { count: episodes.length })

// -------------------------- POLL UNTIL ALL DONE --------------------------
log('Polling all episodes…')
const pollStart = Date.now()
const finalStates = new Map()
const lastLogged = new Map()

while (finalStates.size < episodes.length) {
  const elapsed = Math.floor((Date.now() - pollStart) / 1000)
  if (elapsed > MAX_WAIT_SECONDS) {
    bail('Timed out waiting for bulk pipeline', {
      elapsedSeconds: elapsed,
      completed: finalStates.size,
      total: episodes.length,
    })
  }

  await Promise.all(
    episodes
      .filter((e) => !finalStates.has(e.episodeId))
      .map(async (e) => {
        try {
          const status = await apiFetch(`/api/episodes/${e.episodeId}/process`)
          const s = status.data || status
          const key = `${s.status}/${s.processingStep ?? '-'}/${s.processingProgress ?? 0}`
          if (lastLogged.get(e.episodeId) !== key) {
            log(`#${e.index + 1} poll`, {
              status: s.status,
              step: s.processingStep,
              progress: `${s.processingProgress ?? 0}%`,
            })
            lastLogged.set(e.episodeId, key)
          }
          if (s.status === 'completed' || s.status === 'failed') {
            finalStates.set(e.episodeId, s)
            log(`#${e.index + 1} FINAL`, { status: s.status })
          }
        } catch (err) {
          log(`#${e.index + 1} poll error`, { error: err.message })
        }
      })
  )

  if (finalStates.size < episodes.length) await delay(POLL_INTERVAL_MS)
}

log('All episodes finished', {
  totalWaitSeconds: Math.floor((Date.now() - pollStart) / 1000),
})

// -------------------------- VERIFY FINAL STATE --------------------------
log('Verifying final DB state per episode…')
const summaries = []
for (const e of episodes) {
  const { data: finalEp } = await admin.from('episodes').select('*').eq('id', e.episodeId).single()
  const { data: assetRows } = await admin
    .from('generated_assets')
    .select('id, asset_type')
    .eq('episode_id', e.episodeId)
  const { count: sectionCount } = await admin
    .from('episode_sections')
    .select('*', { count: 'exact', head: true })
    .eq('episode_id', e.episodeId)

  const assetTypeCounts = {}
  for (const row of assetRows || []) {
    assetTypeCounts[row.asset_type] = (assetTypeCounts[row.asset_type] || 0) + 1
  }
  summaries.push({
    slot: e.index + 1,
    file: e.file,
    episodeId: e.episodeId,
    runId: e.runId,
    status: finalEp?.status,
    transcriptChars: finalEp?.transcript?.length ?? 0,
    showNotesChars: finalEp?.show_notes?.length ?? 0,
    seoScore: finalEp?.seo_score,
    viralMomentsCount: Array.isArray(finalEp?.viral_moments) ? finalEp.viral_moments.length : 0,
    assetCount: assetRows?.length ?? 0,
    assetTypeCounts,
    sectionCount: sectionCount ?? 0,
  })
}

const overall = {
  showId: show.id,
  totalEpisodes: summaries.length,
  completed: summaries.filter((s) => s.status === 'completed').length,
  failed: summaries.filter((s) => s.status === 'failed').length,
  totalWallClockSeconds: Math.floor((Date.now() - start) / 1000),
}

console.log('\n=== PER-EPISODE SUMMARIES ===')
console.log(JSON.stringify(summaries, null, 2))
console.log('\n=== OVERALL ===')
console.log(JSON.stringify(overall, null, 2))

if (overall.failed > 0) process.exit(2)
process.exit(0)
