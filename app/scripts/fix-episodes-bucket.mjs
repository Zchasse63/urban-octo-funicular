// Flip the episodes bucket to public so AssemblyAI can download files.
// The bug: /api/upload/route.ts calls getPublicUrl() which only returns
// working URLs for public buckets. Episodes bucket was private, so every
// upload produced a 404 URL and AssemblyAI could not download.
import { readFileSync } from 'node:fs'
import { createClient } from '@supabase/supabase-js'

const envText = readFileSync('/Users/zach/urban-octo-funicular/app/.env.local', 'utf8')
for (const line of envText.split('\n')) {
  const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/)
  if (m) process.env[m[1]] = m[2]
}

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
)

console.log('BEFORE — listing buckets…')
const before = await admin.storage.listBuckets()
console.log(JSON.stringify(before.data?.map(b => ({
  id: b.id, name: b.name, public: b.public,
  file_size_limit: b.file_size_limit,
  allowed_mime_types: b.allowed_mime_types,
})), null, 2))

console.log('\nAttempting updateBucket with just { public: true } …')
const upd = await admin.storage.updateBucket('episodes', { public: true })
console.log('updateBucket result:', upd)

console.log('\nAFTER — listing buckets…')
const after = await admin.storage.listBuckets()
console.log(JSON.stringify(after.data?.map(b => ({
  id: b.id, name: b.name, public: b.public,
  file_size_limit: b.file_size_limit,
  allowed_mime_types: b.allowed_mime_types,
})), null, 2))
