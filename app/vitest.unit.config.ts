import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

/**
 * Unit tests configuration
 * For pure functions and isolated component logic
 * NO database setup - unit tests should be isolated
 */
export default defineConfig({
  plugins: [react()],
  test: {
    // Setup file for testing-library matchers
    setupFiles: ['./test/setup/component-setup.ts'],

    // Environment for component tests
    environment: 'happy-dom',

    // Only run unit tests
    include: ['test/unit/**/*.test.{ts,tsx}'],

    // Shorter timeouts for unit tests (no network)
    testTimeout: 10000,
    hookTimeout: 10000,

    // Parallel execution is safe for unit tests
    pool: 'threads',

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
