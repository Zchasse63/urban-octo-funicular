/**
 * Test Environment Setup
 *
 * Runs before each test file in the worker process.
 * Loads environment variables and sets up test utilities.
 *
 * NOTE: vitest's globalSetup runs in a separate process, so env vars
 * loaded there don't propagate to test workers. We must load .env.local
 * here in the setupFiles hook which runs inside the worker process.
 */

import { config } from 'dotenv'
import { resolve } from 'path'

// Load .env.local into the worker process BEFORE any other imports.
// vitest's globalSetup runs in a separate process, so env vars loaded
// there don't propagate to test workers. We must load them here.
//
// IMPORTANT: Do NOT import modules that read process.env at top level
// (like ./database) because ES import hoisting would evaluate them
// before this config() call runs.
config({ path: resolve(__dirname, '../../.env.local') })

import { beforeAll, vi } from 'vitest'

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  console.warn('Warning: NEXT_PUBLIC_SUPABASE_URL not set. Tests requiring database will fail.')
}

// Note: Cleanup is handled by individual test files via afterAll
// Don't use afterEach cleanup here as it interferes with tests that
// share data across describe blocks

/**
 * Mock external AI services by default
 * These can be overridden in individual tests when needed
 */
beforeAll(() => {
  // Mock AssemblyAI to avoid costs in unit tests
  // Integration tests can override this
  vi.mock('@/lib/assemblyai/client', async () => {
    return {
      transcribeAudio: vi.fn().mockResolvedValue({
        text: 'Mock transcript for testing',
        segments: [],
        audioDurationSeconds: 60,
      }),
    }
  })

  // Mock xAI to avoid costs in unit tests
  vi.mock('@/lib/xai/client', async () => {
    return {
      generateContent: vi.fn().mockResolvedValue({
        content: 'Mock generated content',
      }),
    }
  })
})

// Export test utilities for convenience
export { vi }
