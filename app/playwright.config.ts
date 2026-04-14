// Load environment variables FIRST, before any other imports
// eslint-disable-next-line @typescript-eslint/no-require-imports
require('dotenv').config({ path: require('path').resolve(__dirname, '.env.local') })

import { defineConfig, devices } from '@playwright/test'

/**
 * Playwright E2E test configuration
 * Tests run against REAL server with REAL database
 */
// Resolve the base URL. PLAYWRIGHT_BASE_URL takes precedence so local runs
// can point to a dedicated PodBrain dev server on a non-default port (useful
// when the default 3000 is already occupied by another local project).
const BASE_URL =
  process.env.PLAYWRIGHT_BASE_URL || process.env.TEST_API_URL || 'http://localhost:3000'

// Workers default to 1 for database consistency. Even though each test
// creates its own user (so there's no direct data collision), some specs
// share a user across tests in a describe block, and an `afterAll` from
// one worker can delete a show mid-flight in another worker. Parallelism
// is safe to enable per-file with `test.describe.configure({ mode: 'parallel' })`
// — see episode-detail for an example — but the global default stays at 1.
// Override with PLAYWRIGHT_WORKERS=N for experimentation.
const WORKERS = process.env.PLAYWRIGHT_WORKERS
  ? Number(process.env.PLAYWRIGHT_WORKERS)
  : 1

// Expand the browser matrix when PLAYWRIGHT_FULL_MATRIX=true. Default to
// chromium-only for fast local runs. CI should set this env var for the
// nightly full-matrix run.
const FULL_MATRIX = process.env.PLAYWRIGHT_FULL_MATRIX === 'true'

export default defineConfig({
  testDir: './test/e2e',

  // Leave fullyParallel off at the project level. Individual files can
  // opt in via `test.describe.configure({ mode: 'parallel' })` once they
  // scope their fixtures per-test instead of per-describe.
  fullyParallel: false,

  // Fail the build on test.only() in CI
  forbidOnly: !!process.env.CI,

  // Retry on CI to absorb transient API hiccups in the live-API tests.
  // Local runs don't retry — flakes should fail loudly so the dev can fix them.
  retries: process.env.CI ? 2 : 0,

  // Parallelize across workers. Per-test-user isolation makes this safe.
  workers: WORKERS,

  // Reporter configuration
  reporter: [
    ['html', { open: 'never' }],
    ['list'],
  ],

  // Global setup and teardown
  globalSetup: './test/e2e/global-setup.ts',
  globalTeardown: './test/e2e/global-teardown.ts',

  use: {
    // Base URL for tests
    baseURL: BASE_URL,

    // Capture traces on failure
    trace: 'on-first-retry',

    // Screenshot on failure
    screenshot: 'only-on-failure',

    // Video on failure
    video: 'on-first-retry',
  },

  // Project configurations
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    // Cross-browser matrix — enabled via PLAYWRIGHT_FULL_MATRIX=true.
    // Default to chromium-only for fast local runs; CI nightly should
    // set the env var to run the full matrix.
    ...(FULL_MATRIX
      ? [
          {
            name: 'firefox',
            use: { ...devices['Desktop Firefox'] },
          },
          {
            name: 'webkit',
            use: { ...devices['Desktop Safari'] },
          },
          {
            name: 'mobile-chrome',
            use: { ...devices['Pixel 5'] },
          },
        ]
      : []),
  ],

  // Run local dev server before tests (if not already running).
  // Skip auto-start entirely when PLAYWRIGHT_BASE_URL is set — the caller is
  // responsible for having a dev server running at that URL. This avoids
  // accidentally reusing a different project's dev server that happens to
  // respond on the configured port.
  webServer: process.env.PLAYWRIGHT_BASE_URL
    ? undefined
    : {
        command: 'npm run dev',
        url: BASE_URL,
        reuseExistingServer: !process.env.CI,
        timeout: 120000,
      },
})
