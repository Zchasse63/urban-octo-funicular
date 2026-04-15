#!/usr/bin/env node
/**
 * backfill-embeddings.mjs
 *
 * One-off script to generate OpenAI text-embedding-3-small embeddings for
 * every `episode_sections` row where `embedding IS NULL AND content IS NOT
 * NULL AND length(trim(content)) > 0`.
 *
 * Background: the cross-episode similarity feature has been broken since
 * day one because `lib/cross-episode/embeddings.ts` originally pointed at
 * xAI's non-existent embeddings endpoint. The code was swapped to OpenAI
 * but the DB column remained NULL because no OPENAI_API_KEY had been set.
 * This script populates the historical backlog so Related Episodes starts
 * returning real matches today. See
 * `specs/bugs/processing-pipeline-bugs.md#bug-6` for the full history.
 *
 * Usage (from repo root):
 *   node app/scripts/backfill-embeddings.mjs            # run everything
 *   node app/scripts/backfill-embeddings.mjs --dry-run  # just count rows
 *   node app/scripts/backfill-embeddings.mjs --limit 50 # cap for testing
 *
 * Requirements:
 *   - OPENAI_API_KEY in app/.env.local
 *   - SUPABASE_SERVICE_ROLE_KEY in app/.env.local
 *   - NEXT_PUBLIC_SUPABASE_URL in app/.env.local
 *
 * Cost: text-embedding-3-small is $0.02 / 1M tokens. 604 sections at ~200
 * tokens each ≈ 120k tokens ≈ $0.002. Basically free.
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

// ─── Load .env.local manually (no dotenv dep) ─────────────────────────────
const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, '..', '.env.local');
try {
  const envRaw = readFileSync(envPath, 'utf8');
  for (const line of envRaw.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq);
    let value = trimmed.slice(eq + 1);
    // Strip surrounding quotes if present
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
} catch (err) {
  console.error(`Failed to load ${envPath}:`, err.message);
  process.exit(1);
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE || !OPENAI_API_KEY) {
  console.error('Missing env vars: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, OPENAI_API_KEY');
  process.exit(1);
}

// ─── Flags ───────────────────────────────────────────────────────────────
const argv = process.argv.slice(2);
const DRY_RUN = argv.includes('--dry-run');
const LIMIT_FLAG = argv.indexOf('--limit');
const LIMIT = LIMIT_FLAG >= 0 ? parseInt(argv[LIMIT_FLAG + 1], 10) : Infinity;

const BATCH_SIZE = 100; // OpenAI embeddings accepts up to 2048; 100 is comfortable
const EMBEDDING_MODEL = 'text-embedding-3-small';
const EMBEDDING_DIM = 1536;

// ─── Supabase client ─────────────────────────────────────────────────────
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// ─── OpenAI batch embedding ───────────────────────────────────────────────
async function embedBatch(inputs) {
  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({ model: EMBEDDING_MODEL, input: inputs }),
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`OpenAI ${response.status}: ${text.slice(0, 300)}`);
  }
  const data = await response.json();
  const embeddings = data.data.map((d) => d.embedding);
  for (const e of embeddings) {
    if (!Array.isArray(e) || e.length !== EMBEDDING_DIM) {
      throw new Error(`Unexpected embedding shape: length=${e?.length}`);
    }
  }
  return { embeddings, usage: data.usage };
}

// ─── Main ────────────────────────────────────────────────────────────────
async function main() {
  console.log(`[${new Date().toISOString()}] backfill-embeddings starting`);
  console.log(`  mode: ${DRY_RUN ? 'DRY RUN' : 'LIVE'}`);
  console.log(`  limit: ${LIMIT === Infinity ? 'unlimited' : LIMIT}`);
  console.log(`  batch size: ${BATCH_SIZE}`);
  console.log(`  model: ${EMBEDDING_MODEL} (${EMBEDDING_DIM} dim)`);

  // Fetch all NULL-embedding sections with non-empty content
  // We page through because Supabase REST caps at 1000 rows per call
  const pageSize = 1000;
  let offset = 0;
  const allRows = [];
  while (true) {
    const { data, error } = await supabase
      .from('episode_sections')
      .select('id, content')
      .is('embedding', null)
      .not('content', 'is', null)
      .neq('content', '')
      .range(offset, offset + pageSize - 1);
    if (error) {
      console.error('Fetch error:', error);
      process.exit(1);
    }
    if (!data || data.length === 0) break;
    allRows.push(...data);
    if (data.length < pageSize) break;
    offset += pageSize;
  }

  // Filter out any rows where content is whitespace-only
  const rows = allRows.filter((r) => (r.content || '').trim().length > 0);
  const skipped = allRows.length - rows.length;
  console.log(`  candidate rows: ${rows.length} (skipped ${skipped} whitespace-only)`);

  const toProcess = rows.slice(0, Math.min(rows.length, LIMIT));
  console.log(`  to process: ${toProcess.length}`);

  if (DRY_RUN) {
    console.log('[dry-run] exiting without writing');
    return;
  }

  if (toProcess.length === 0) {
    console.log('Nothing to do.');
    return;
  }

  let totalTokens = 0;
  let successCount = 0;
  let failureCount = 0;

  for (let i = 0; i < toProcess.length; i += BATCH_SIZE) {
    const batch = toProcess.slice(i, i + BATCH_SIZE);
    const inputs = batch.map((r) => r.content);

    const started = Date.now();
    let embeddings;
    try {
      const result = await embedBatch(inputs);
      embeddings = result.embeddings;
      totalTokens += result.usage?.total_tokens || 0;
    } catch (err) {
      failureCount += batch.length;
      console.error(
        `  batch ${i / BATCH_SIZE + 1} embed error:`,
        err.message
      );
      continue;
    }

    // Parallel UPDATEs for this batch
    const updates = batch.map((row, idx) =>
      supabase
        .from('episode_sections')
        .update({ embedding: embeddings[idx] })
        .eq('id', row.id)
    );
    const results = await Promise.allSettled(updates);
    let batchSuccess = 0;
    let batchFailure = 0;
    for (const r of results) {
      if (r.status === 'fulfilled' && !r.value.error) {
        batchSuccess += 1;
      } else {
        batchFailure += 1;
        if (r.status === 'fulfilled' && r.value.error) {
          console.error('    update error:', r.value.error.message);
        }
      }
    }
    successCount += batchSuccess;
    failureCount += batchFailure;

    const elapsed = Date.now() - started;
    console.log(
      `  batch ${i / BATCH_SIZE + 1}/${Math.ceil(toProcess.length / BATCH_SIZE)}: ` +
        `${batchSuccess} ok, ${batchFailure} failed (${elapsed}ms)`
    );
  }

  // Verify final state
  const { count: remainingNull } = await supabase
    .from('episode_sections')
    .select('id', { count: 'exact', head: true })
    .is('embedding', null)
    .not('content', 'is', null)
    .neq('content', '');

  console.log('');
  console.log('─── Summary ─────────────────────────────');
  console.log(`  processed:        ${toProcess.length}`);
  console.log(`  successful:       ${successCount}`);
  console.log(`  failed:           ${failureCount}`);
  console.log(`  total tokens:     ${totalTokens}`);
  console.log(`  approx cost:      $${((totalTokens / 1_000_000) * 0.02).toFixed(6)}`);
  console.log(`  null remaining:   ${remainingNull ?? '?'}`);
  console.log(`[${new Date().toISOString()}] backfill-embeddings done`);
}

main().catch((err) => {
  console.error('Unhandled error:', err);
  process.exit(1);
});
