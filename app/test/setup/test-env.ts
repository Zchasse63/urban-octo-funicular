/**
 * Test Environment Setup
 *
 * Runs before each test file.
 * Loads environment variables and sets up test utilities.
 */

import { afterEach, beforeAll, vi } from 'vitest'
import { cleanupAllTestData } from './database'

// Load environment variables from .env.test or .env.local
// The real values should be in your .env.local file
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
