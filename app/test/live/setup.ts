/**
 * Live test setup file.
 *
 * Unlike the standard test-env.ts which mocks AssemblyAI and xAI,
 * this setup loads real credentials from .env.local and does NOT mock anything.
 * Live tests hit real external services.
 */
import { config } from 'dotenv';
import { resolve } from 'path';
import { beforeAll, afterAll } from 'vitest';

// Load real env vars
config({ path: resolve(__dirname, '../../.env.local') });

// Verify required env vars are present
const requiredVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'XAI_API_KEY',
  'ASSEMBLYAI_API_KEY',
];

beforeAll(() => {
  const missing = requiredVars.filter(v => !process.env[v]);
  if (missing.length > 0) {
    throw new Error(
      `Live tests require real API keys. Missing env vars:\n  ${missing.join('\n  ')}\n\n` +
      `Ensure these are set in app/.env.local`
    );
  }

  console.log('\n');
  console.log('='.repeat(60));
  console.log('  LIVE INTEGRATION TESTS — REAL APIs, REAL DATA');
  console.log('='.repeat(60));
  console.log(`  Supabase:    ${process.env.NEXT_PUBLIC_SUPABASE_URL?.slice(0, 30)}...`);
  console.log(`  AssemblyAI:  ${process.env.ASSEMBLYAI_API_KEY ? 'configured' : 'MISSING'}`);
  console.log(`  xAI Grok:    ${process.env.XAI_API_KEY ? 'configured' : 'MISSING'}`);
  console.log(`  Taddy:       ${process.env.TADDY_API_KEY ? 'configured' : 'not configured (optional)'}`);
  console.log(`  Stripe:      ${process.env.STRIPE_SECRET_KEY ? 'configured' : 'not configured (optional)'}`);
  console.log('='.repeat(60));
  console.log('\n');
});
