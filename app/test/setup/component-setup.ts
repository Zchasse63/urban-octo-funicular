/**
 * Component Test Setup
 *
 * Sets up @testing-library/react and custom matchers
 */

import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

// Cleanup after each test to prevent DOM pollution
afterEach(() => {
  cleanup()
})
