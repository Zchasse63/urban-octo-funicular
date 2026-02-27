import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    // Global setup/teardown for test database
    globalSetup: ['./test/setup/global-setup.ts'],

    // Setup files for each test file
    setupFiles: ['./test/setup/test-env.ts', './test/setup/component-setup.ts'],

    // Environment for component tests
    environment: 'happy-dom',

    // Include patterns
    include: [
      'test/**/*.test.{ts,tsx}',
      'src/**/*.test.{ts,tsx}',
    ],

    // Exclude patterns
    exclude: [
      'node_modules',
      'test/e2e/**', // E2E tests run with Playwright
      'test/integration/api/**', // API tests need a running dev server (use npm run test:api)
    ],

    // Increased timeouts for live tests (real network calls)
    testTimeout: 30000,
    hookTimeout: 30000,

    // Run tests serially to avoid database conflicts
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true, // Run all tests in single process for shared DB state
      },
    },

    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/**/*.test.{ts,tsx}',
        'src/**/types.ts',
        'src/**/*.d.ts',
      ],
      thresholds: {
        statements: 60,
        branches: 60,
        functions: 60,
        lines: 60,
      },
    },

    // Environment variables
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
