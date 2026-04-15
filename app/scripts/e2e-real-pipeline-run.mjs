#!/usr/bin/env node
/**
 * End-to-end real pipeline test.
 *
 * Drives a real podcast audio file through the full PodBrain processing
 * pipeline EXACTLY like a paying user would:
 *
 *   1. Sign in as the live test user (agency tier)
 *   2. POST /api/shows                 — create a new test show
 *   3. POST /api/upload                — mint a signed Storage upload URL
 *   4. uploadToSignedUrl               — PUT the MP3 to Supabase Storage
 *   5. POST /api/episodes              — create an episode row pointing at the file
 *   6. POST /api/episodes/:id/process  — dispatch the Trigger.dev job
 *   7. Poll GET /api/episodes/:id/process every 5s until status = completed/failed
 *   8. Dump transcript length, show notes length, asset count, DB-side counts
 *
 * This test — unlike the previous pipeline.test.ts — goes through the actual
 * HTTP layer and the real /api/episodes/:id/process entry point, so it
 * exercises:
 *
 *   - Auth + rate limiter + tier enforcement on the API
 *   - createSignedUploadUrl + Supabase Storage PUT
 *   - CreateEpisodeSchema validation
 *   - POST /api/episodes/:id/process atomic TOCTOU claim
 *   - Trigger.dev run dispatch (triggerEpisodeProcessing → trigger.dev API)
 *   - processEpisodeTask orchestration (polling mode in local dev)
 *   - transcribeAudioTask (polling → AssemblyAI)
 *   - generateShowNotesTask (xAI Grok)
 *   - generateAssetsTask (xAI Grok × 8 asset types)
 *   - saveProcessingResults (episodes + generated_assets + episode_sections inserts)
 *
 * Usage:
 *   node scripts/e2e-real-pipeline-run.mjs \
 *     --mp3 /tmp/podbrain-e2e/npr-news-now-latest.mp3 \
 *     --title "[TEST] NPR News Now - Real Pipeline" \
 *     --api http://localhost:3000
 *
 * Environment:
 *   Reads .env.local for SUPABASE_URL / keys.
 *   Requires the dev server + trigger dev runner to both be running.
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
function arg(name, fallback) {
  const idx = process.argv.indexOf(`--${name}`)
  return idx >= 0 ? process.argv[idx + 1] : fallback
}

const MP3_PATH = arg('mp3', '/tmp/podbrain-e2e/npr-news-now-latest.mp3')
const API_BASE = arg('api', 'http://localhost:3000')
const EPISODE_TITLE = arg('title', '[TEST] Real Pipeline Run')
const POLL_INTERVAL_MS = Number(arg('poll', '5000'))
const MAX_WAIT_SECONDS = Number(arg('max-wait', '900')) // 15 min

const TEST_EMAIL = 'live-test@podbrain-test.local'
const TEST_PASSWORD = 'LiveTest!2026SecurePassword'

// -------------------------- LOGGING --------------------------
const start = Date.now()
function log(msg, obj = {}) {
  const elapsed = ((Date.now() - start) / 1000).toFixed(1).padStart(6)
  const extra = Object.keys(obj).length
    ? ' ' + JSON.stringify(obj)
    : ''
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
  bail('Missing Supabase env vars', {
    hasUrl: !!supabaseUrl,
    hasAnon: !!anonKey,
    hasService: !!serviceKey,
  })
}

let mp3Stat
try {
  mp3Stat = statSync(MP3_PATH)
} catch (e) {
  bail(`MP3 not found at ${MP3_PATH}`, { error: e.message })
}
log('MP3 file ready', {
  path: MP3_PATH,
  sizeBytes: mp3Stat.size,
  sizeMB: (mp3Stat.size / 1024 / 1024).toFixed(2),
})

// -------------------------- SIGN IN + COOKIE --------------------------
log('Ensuring test user exists…')
const admin = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false },
})

const { data: users } = await admin.auth.admin.listUsers()
let testUser = users?.users?.find((u) => u.email === TEST_EMAIL)
if (!testUser) {
  const { data: created, error } = await admin.auth.admin.createUser({
    email: TEST_EMAIL,
    password: TEST_PASSWORD,
    email_confirm: true,
  })
  if (error) bail('Failed to create test user', { error: error.message })
  testUser = created.user
  log('Created new test user', { id: testUser.id })
}
// Make sure public.users row exists + force agency tier + trialing status
await admin
  .from('users')
  .upsert(
    {
      id: testUser.id,
      email: TEST_EMAIL,
      subscription_tier: 'agency',
      subscription_status: 'active',
      trial_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    },
    { onConflict: 'id' }
  )

log('Signing in test user…')
const anon = createClient(supabaseUrl, anonKey, {
  auth: { persistSession: false, autoRefreshToken: false },
})
const { data: signIn, error: signInError } = await anon.auth.signInWithPassword({
  email: TEST_EMAIL,
  password: TEST_PASSWORD,
})
if (signInError || !signIn.session) {
  bail('Sign-in failed', { error: signInError?.message })
}

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
for (let i = 0; i < b64.length; i += CHUNK_SIZE) {
  chunks.push(b64.slice(i, i + CHUNK_SIZE))
}
const cookies =
  chunks.length === 1
    ? [`${cookieName}=${encodeURIComponent(chunks[0])}`]
    : chunks.map((c, i) => `${cookieName}.${i}=${encodeURIComponent(c)}`)
const cookieHeader = cookies.join('; ')
log('Cookie built', {
  chunks: chunks.length,
  totalBytes: b64.length,
})

// -------------------------- HTTP HELPER --------------------------
async function apiFetch(path, opts = {}) {
  const url = `${API_BASE}${path}`
  const res = await fetch(url, {
    ...opts,
    headers: {
      ...(opts.headers || {}),
      Cookie: cookieHeader,
    },
  })
  const text = await res.text()
  let body = null
  try {
    body = text ? JSON.parse(text) : null
  } catch {
    body = { raw: text }
  }
  if (!res.ok) {
    throw new Error(
      `${opts.method || 'GET'} ${path} → ${res.status}: ${JSON.stringify(body)}`
    )
  }
  return body
}

// -------------------------- PRE-FLIGHT: API ALIVE --------------------------
log('Pinging dev server…')
try {
  const resp = await fetch(`${API_BASE}/api/health`).catch(() => null)
  if (resp) {
    log('Dev server health', { status: resp.status })
  } else {
    // fall back to any authenticated route
    await apiFetch('/api/shows?per_page=1')
    log('Dev server responding on /api/shows')
  }
} catch (e) {
  bail(`Dev server not responding at ${API_BASE}`, { error: e.message })
}

// -------------------------- STEP 1: CREATE SHOW --------------------------
log('STEP 1: POST /api/shows')
const showStamp = new Date().toISOString().replace(/[:.]/g, '-')
const show = await apiFetch('/api/shows', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: `[TEST] E2E Real Pipeline ${showStamp}`,
    description: 'Ephemeral show for the real-pipeline end-to-end test.',
    default_language: 'en',
    style_preferences: { tone: 'professional' },
  }),
})
const showData = show.data || show
log('Show created', { id: showData.id, name: showData.name })

// -------------------------- STEP 2: MINT UPLOAD URL --------------------------
log('STEP 2: POST /api/upload (mint signed URL)')
const fileName = basename(MP3_PATH)
const uploadMint = await apiFetch('/api/upload', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    fileName,
    fileSize: mp3Stat.size,
    mimeType: 'audio/mpeg',
  }),
})
log('Upload URL minted', {
  filePath: uploadMint.filePath,
  publicUrl: uploadMint.publicUrl,
})

// -------------------------- STEP 3: UPLOAD TO STORAGE --------------------------
log('STEP 3: Uploading MP3 to Supabase Storage via signed URL…')
const mp3Buffer = readFileSync(MP3_PATH)
const { data: uploadResult, error: uploadError } = await admin.storage
  .from('episodes')
  .uploadToSignedUrl(
    uploadMint.filePath,
    uploadMint.token,
    mp3Buffer,
    {
      contentType: 'audio/mpeg',
      upsert: true,
    }
  )
if (uploadError) {
  bail('uploadToSignedUrl failed', { error: uploadError.message })
}
log('Storage upload complete', {
  path: uploadResult?.path,
})

// -------------------------- STEP 4: CREATE EPISODE --------------------------
log('STEP 4: POST /api/episodes')
const episodeResp = await apiFetch('/api/episodes', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    show_id: showData.id,
    title: EPISODE_TITLE,
    description: 'Downloaded from NPR News Now RSS feed. Real audio, real pipeline.',
    audio_url: uploadMint.publicUrl,
    language: 'en',
  }),
})
const episodeData = episodeResp.data || episodeResp
log('Episode created', {
  id: episodeData.id,
  status: episodeData.status,
  audio_url: episodeData.audio_url,
})

// -------------------------- STEP 5: TRIGGER PROCESSING --------------------------
log('STEP 5: POST /api/episodes/:id/process — dispatching Trigger.dev run')
const processResp = await apiFetch(
  `/api/episodes/${episodeData.id}/process`,
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  }
)
const runId = (processResp.data || processResp).runId
log('Trigger.dev run dispatched', {
  runId,
  episodeId: episodeData.id,
})

// -------------------------- STEP 6: POLL STATUS --------------------------
log('STEP 6: Polling GET /api/episodes/:id/process…')
const pollStart = Date.now()
let lastStep = null
let lastProgress = -1
let finalStatus = null

while (true) {
  const elapsed = Math.floor((Date.now() - pollStart) / 1000)
  if (elapsed > MAX_WAIT_SECONDS) {
    bail('Timed out waiting for pipeline to finish', {
      elapsedSeconds: elapsed,
      maxWait: MAX_WAIT_SECONDS,
    })
  }

  try {
    const status = await apiFetch(`/api/episodes/${episodeData.id}/process`)
    const s = status.data || status
    const step = s.processingStep ?? 'unknown'
    const progress = s.processingProgress ?? 0
    if (step !== lastStep || progress !== lastProgress) {
      log('poll', {
        status: s.status,
        step,
        progress: `${progress}%`,
        runStatus: s.status,
      })
      lastStep = step
      lastProgress = progress
    }

    if (s.status === 'completed' || s.status === 'failed') {
      finalStatus = s
      break
    }
  } catch (e) {
    log('Poll error (will retry)', { error: e.message })
  }

  await delay(POLL_INTERVAL_MS)
}

log('Pipeline finished', {
  status: finalStatus.status,
  totalWaitSeconds: Math.floor((Date.now() - pollStart) / 1000),
})

// -------------------------- STEP 7: VERIFY FINAL STATE --------------------------
log('STEP 7: Verifying final state via admin client…')

const { data: finalEp } = await admin
  .from('episodes')
  .select('*')
  .eq('id', episodeData.id)
  .single()

const { data: assetRows } = await admin
  .from('generated_assets')
  .select('id, asset_type')
  .eq('episode_id', episodeData.id)

const { count: sectionCount } = await admin
  .from('episode_sections')
  .select('*', { count: 'exact', head: true })
  .eq('episode_id', episodeData.id)

const assetTypeCounts = {}
for (const row of assetRows || []) {
  assetTypeCounts[row.asset_type] = (assetTypeCounts[row.asset_type] || 0) + 1
}

const summary = {
  episodeId: episodeData.id,
  status: finalEp?.status,
  transcriptChars: finalEp?.transcript?.length ?? 0,
  showNotesChars: finalEp?.show_notes?.length ?? 0,
  seoScore: finalEp?.seo_score,
  viralMomentsCount: Array.isArray(finalEp?.viral_moments)
    ? finalEp.viral_moments.length
    : 0,
  assetCount: assetRows?.length ?? 0,
  assetTypes: Object.keys(assetTypeCounts),
  assetTypeCounts,
  sectionCount: sectionCount ?? 0,
  totalWallClockSeconds: Math.floor((Date.now() - start) / 1000),
}

log('SUMMARY', summary)
console.log('\n=== FINAL RESULT ===')
console.log(JSON.stringify(summary, null, 2))

if (finalEp?.status !== 'completed') {
  process.exit(2)
}
process.exit(0)
