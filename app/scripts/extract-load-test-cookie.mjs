#!/usr/bin/env node
/**
 * Signs in as the live test user (or a dedicated load-test user) and
 * prints a ready-to-use Cookie header value that k6 can feed to the
 * dev server. Uses the same SSR cookie format the @supabase/ssr
 * middleware reads.
 *
 * Usage:
 *   node scripts/extract-load-test-cookie.mjs > /tmp/k6-cookie.txt
 *   AUTH_COOKIE_HEADER="$(cat /tmp/k6-cookie.txt)" k6 run test/load/upload-signed-url.js
 */
import { readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createClient } from '@supabase/supabase-js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const envPath = resolve(__dirname, '..', '.env.local')
const envText = readFileSync(envPath, 'utf8')
for (const line of envText.split('\n')) {
  const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/)
  if (m) process.env[m[1]] = m[2]
}

const TEST_EMAIL = 'live-test@podbrain-test.local'
const TEST_PASSWORD = 'LiveTest!2026SecurePassword'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !anonKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY')
  process.exit(1)
}

// Ensure test user exists
const admin = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false },
})
const { data: users } = await admin.auth.admin.listUsers()
let existing = users?.users?.find((u) => u.email === TEST_EMAIL)
if (!existing) {
  const { data: created } = await admin.auth.admin.createUser({
    email: TEST_EMAIL,
    password: TEST_PASSWORD,
    email_confirm: true,
  })
  existing = created.user
  // mirror row in public.users
  await admin.from('users').upsert(
    { id: existing.id, email: TEST_EMAIL, subscription_tier: 'agency' },
    { onConflict: 'id' }
  )
}

// Sign in to get a session
const anon = createClient(supabaseUrl, anonKey, {
  auth: { persistSession: false, autoRefreshToken: false },
})
const { data: signIn, error } = await anon.auth.signInWithPassword({
  email: TEST_EMAIL,
  password: TEST_PASSWORD,
})
if (error || !signIn.session) {
  console.error('Sign-in failed:', error?.message)
  process.exit(1)
}

const session = signIn.session
const projectRef = new URL(supabaseUrl).hostname.split('.')[0]
const cookieName = `sb-${projectRef}-auth-token`

// @supabase/ssr stores the session as `base64-<b64(json)>`
// If > ~3KB, it splits into .0 / .1 / .2 cookies
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

// Chunked to match @supabase/ssr chunk size (3180 bytes)
const CHUNK_SIZE = 3180
const chunks = []
for (let i = 0; i < b64.length; i += CHUNK_SIZE) {
  chunks.push(b64.slice(i, i + CHUNK_SIZE))
}

const cookies =
  chunks.length === 1
    ? [`${cookieName}=${encodeURIComponent(chunks[0])}`]
    : chunks.map((c, i) => `${cookieName}.${i}=${encodeURIComponent(c)}`)

// Print just the Cookie header value
process.stdout.write(cookies.join('; '))
