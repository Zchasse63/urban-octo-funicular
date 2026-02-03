import { defineConfig } from 'vitest/config'
import path from 'path'

/**
 * Integration tests configuration
 * These tests hit REAL APIs and REAL database
 */
export default defineConfig({
  test: {
    // Global setup for test database
    globalSetup: ['./test/setup/global-setup.ts'],

    // Setup file for each test
    setupFiles: ['./test/setup/test-env.ts'],

    // Node environment for API tests (no DOM needed)
    environment: 'node',

    // Only run DB integration tests (no server required)
    // API tests are in a separate config that requires a running server
    include: ['test/integration/db/**/*.test.ts'],

    // Longer timeouts for real network calls
    testTimeout: 60000,
    hookTimeout: 60000,

    // Serial execution to avoid DB conflicts
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true,
      },
    },

    env: {
      NODE_ENV: 'test',
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
