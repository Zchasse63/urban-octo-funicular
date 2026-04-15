#!/usr/bin/env node
/**
 * One-shot verification that the 20260414000000_subscription_state_machine.sql
 * migration is applied correctly and there are zero paying customers who would
 * be clobbered by the backfill.
 *
 * Usage: node scripts/verify-db-state.mjs
 * Requires: .env.local with SUPABASE_SERVICE_ROLE_KEY
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

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
)

console.log('\nDB state verification')
console.log('=====================')
console.log(`Project: ${process.env.NEXT_PUBLIC_SUPABASE_URL}`)

// 1. Column presence probe
const { error: colErr } = await supabase
  .from('users')
  .select('subscription_status, trial_ends_at, past_due_since')
  .limit(1)

if (colErr) {
  console.error(`❌ Column check FAILED: ${colErr.message}`)
  console.error('   Migration 20260414000000_subscription_state_machine.sql not applied.')
  process.exit(1)
}
console.log('✅ Columns present: subscription_status, trial_ends_at, past_due_since')

// 2. Full user listing
const { data: users, error } = await supabase
  .from('users')
  .select(
    'id, email, subscription_tier, subscription_status, trial_ends_at, past_due_since, created_at'
  )
  .order('created_at', { ascending: false })
  .limit(500)

if (error) {
  console.error('❌ Users query failed:', error.message)
  process.exit(1)
}

console.log(`\nTotal users (first 500): ${users.length}`)

// 3. Tier / status distribution
const tallies = {}
for (const u of users) {
  const key = `${u.subscription_tier || 'NULL'} / ${u.subscription_status || 'NULL'}`
  tallies[key] = (tallies[key] || 0) + 1
}
console.log('\ntier / status distribution:')
for (const [k, v] of Object.entries(tallies).sort()) {
  console.log(`  ${k}: ${v}`)
}

// 4. Paying customer check — anyone with a real stripe_subscription_id
const paying = users.filter(
  (u) =>
    u.stripe_subscription_id &&
    u.stripe_subscription_id.startsWith('sub_') &&
    u.subscription_status !== 'canceled'
)
console.log(`\nNon-canceled paying customers (stripe_subscription_id starts with sub_): ${paying.length}`)
if (paying.length > 0) {
  console.log('⚠️  Found paying customers — manual migration required before go-live')
  for (const u of paying.slice(0, 10)) {
    console.log(
      `  ${u.email} → tier=${u.subscription_tier}, status=${u.subscription_status}, sub=${u.stripe_subscription_id}`
    )
  }
}

// 5. Orphan detection — any user without subscription_status set? (NOT NULL should prevent this)
const orphans = users.filter((u) => !u.subscription_status)
console.log(`\nUsers missing subscription_status: ${orphans.length}`)

// 6. Status enum validation
const validStatuses = new Set(['trialing', 'active', 'past_due', 'trial_expired', 'canceled'])
const invalid = users.filter((u) => u.subscription_status && !validStatuses.has(u.subscription_status))
console.log(`Users with invalid subscription_status: ${invalid.length}`)
if (invalid.length > 0) {
  for (const u of invalid.slice(0, 5)) console.log(`  ${u.email} → ${u.subscription_status}`)
}

// 7. Tier enum validation
const validTiers = new Set(['pro', 'creator', 'agency'])
const invalidTier = users.filter((u) => u.subscription_tier && !validTiers.has(u.subscription_tier))
console.log(`Users with invalid subscription_tier: ${invalidTier.length}`)

console.log('\n=====================')
if (paying.length === 0 && orphans.length === 0 && invalid.length === 0 && invalidTier.length === 0) {
  console.log('✅ DB state is clean. Safe to go live.')
} else {
  console.log('⚠️  Issues found — review above output.')
  process.exit(2)
}
