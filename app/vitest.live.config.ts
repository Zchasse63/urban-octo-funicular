/**
 * Vitest config for LIVE integration tests.
 *
 * These tests hit real external services (AssemblyAI, xAI Grok, Taddy, Supabase)
 * with real API keys from .env.local. They are NOT run in CI — only locally before
 * a production deploy.
 *
 * Run: npm run test:live
 */
import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@/test': path.resolve(__dirname, 'test'),
    },
  },
  test: {
    include: ['test/live/**/*.test.ts'],
    globals: true,
    environment: 'node',
    testTimeout: 300_000,   // 5 min per test (transcription + generation)
    hookTimeout: 120_000,   // 2 min for setup/teardown
    pool: 'forks',
    poolOptions: { forks: { singleFork: true } },
    setupFiles: ['./test/live/setup.ts'],
    // Sequence matters — pipeline first, then quality, then integrations
    sequence: { concurrent: false },
    env: {
      LIVE_TEST: 'true',
    },
  },
});
