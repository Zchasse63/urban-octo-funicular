import { defineConfig } from 'vitest/config'
import path from 'path'

/**
 * API Integration Tests Configuration
 *
 * IMPORTANT: These tests require a running dev server!
 * Start the server before running: npm run dev
 *
 * Run with: npm run test:api
 */
export default defineConfig({
  test: {
    // Global setup for test database
    globalSetup: ['./test/setup/global-setup.ts'],

    // Setup file for each test
    setupFiles: ['./test/setup/test-env.ts'],

    // Node environment for API tests (no DOM needed)
    environment: 'node',

    // Only run API integration tests
    include: ['test/integration/api/**/*.test.ts'],

    // Longer timeouts for real network calls
    testTimeout: 60000,
    hookTimeout: 60000,

    // Serial execution to avoid conflicts
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
