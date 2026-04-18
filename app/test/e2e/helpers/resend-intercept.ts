/**
 * Resend Interception
 *
 * The core-paid-flow tests MUST NOT send real email. This helper
 * installs a page-level network block on `api.resend.com` so that
 * any outbound request from the server-rendered page (or any call
 * the browser makes directly) is aborted.
 *
 * The server-side `sendGuestPackageEmail()` runs inside the Next.js
 * process, NOT the Playwright browser, so this network-route block
 * only catches client-side calls. Server-side calls are gated
 * separately by the `RESEND_API_KEY` env var — when the key is
 * absent or stubbed to a known-bad value, the Resend SDK will fail
 * at import time and `sendGuestPackageEmail` raises EmailConfigurationError,
 * which the API route translates to 503 "Email service is not configured".
 *
 * Tests accept BOTH outcomes (200 "sent" via mock OR 503 "not configured")
 * as long as no real POST ever reaches the Resend domain.
 */
import type { Page, Request as PwRequest } from '@playwright/test'

export interface ResendInterceptorHandle {
  /** Number of intercepted requests (should remain 0 for a passing test). */
  interceptedCount: () => number
  /** The raw list of aborted request URLs, for debugging. */
  interceptedUrls: () => string[]
  /** Uninstall the route block. */
  dispose: () => Promise<void>
}

/**
 * Install a network-level block on the Resend API. Returns a handle
 * the test can use to assert nothing was sent and to clean up.
 *
 * Catches:
 *   https://api.resend.com/**
 *   https://*.resend.com/** (covers any future subdomains)
 */
export async function installResendBlock(page: Page): Promise<ResendInterceptorHandle> {
  const captured: string[] = []

  const handler = async (route: Parameters<Parameters<Page['route']>[1]>[0]) => {
    const url = route.request().url()
    captured.push(url)
    // Abort forcefully — aborting signals a network failure, which is the
    // desired test outcome (no email actually sent). Do NOT fulfill with
    // a 200 because that would mask a genuine accidental send.
    await route.abort('failed')
  }

  await page.route('**/api.resend.com/**', handler)
  await page.route('**://*.resend.com/**', handler)

  // Also log any request that reached the Resend domain via page.on('request')
  // so a debug printout shows it even if route matching didn't catch it.
  const requestListener = (req: PwRequest) => {
    if (/resend\.com/i.test(req.url())) {
      console.warn('[resend-intercept] request saw resend.com hit:', req.url())
    }
  }
  page.on('request', requestListener)

  return {
    interceptedCount: () => captured.length,
    interceptedUrls: () => [...captured],
    dispose: async () => {
      await page.unroute('**/api.resend.com/**', handler)
      await page.unroute('**://*.resend.com/**', handler)
      page.off('request', requestListener)
    },
  }
}
