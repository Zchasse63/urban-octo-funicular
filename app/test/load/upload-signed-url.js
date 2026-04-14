/**
 * Load test: POST /api/upload (signed URL endpoint)
 *
 * Simulates N concurrent users requesting pre-signed upload URLs from
 * the lightweight /api/upload endpoint. This is NOT a test of the
 * actual Supabase Storage upload — it tests our own rate limiter and
 * signed-URL minting throughput.
 *
 * Requires k6 (https://k6.io/docs/get-started/installation/):
 *   brew install k6
 *
 * Run:
 *   API_BASE=http://localhost:3100 AUTH_COOKIE="<session cookie>" k6 run test/load/upload-signed-url.js
 *
 * Getting the AUTH_COOKIE: log in via the UI, open DevTools → Application
 * → Cookies, copy the `sb-<project>-auth-token` cookie value.
 *
 * Stages:
 *   0–30s:  ramp up to 10 VUs
 *   30–60s: hold at 10 VUs
 *   60–120s: ramp up to 50 VUs
 *   120–180s: hold at 50 VUs
 *   180–210s: ramp down to 0
 *
 * Thresholds:
 *   - http_req_failed < 1% (99% of requests should succeed or be
 *     intentionally rate-limited)
 *   - http_req_duration p(95) < 500ms (signed URL minting is cheap)
 *   - rate_limited < 5% (the rate limiter should kick in but not dominate)
 */
import http from 'k6/http'
import { check, sleep } from 'k6'
import { Counter } from 'k6/metrics'

const rateLimited = new Counter('rate_limited')
const unauthorized = new Counter('unauthorized')

export const options = {
  stages: [
    { duration: '30s', target: 10 },
    { duration: '30s', target: 10 },
    { duration: '60s', target: 50 },
    { duration: '60s', target: 50 },
    { duration: '30s', target: 0 },
  ],
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<500'],
    rate_limited: ['count<1000'],
  },
}

const API_BASE = __ENV.API_BASE || 'http://localhost:3100'
const AUTH_COOKIE = __ENV.AUTH_COOKIE || ''

if (!AUTH_COOKIE) {
  throw new Error(
    'AUTH_COOKIE environment variable required. Get it from DevTools > Application > Cookies > sb-<project>-auth-token after signing in.'
  )
}

export default function () {
  const payload = JSON.stringify({
    fileName: `loadtest-${__VU}-${__ITER}.mp3`,
    fileSize: 5 * 1024 * 1024, // 5 MB
    mimeType: 'audio/mpeg',
  })

  const res = http.post(`${API_BASE}/api/upload`, payload, {
    headers: {
      'Content-Type': 'application/json',
      Cookie: `sb-auth-token=${AUTH_COOKIE}`,
    },
  })

  const ok = check(res, {
    'status is 200 or 429 (rate limited)': (r) => r.status === 200 || r.status === 429,
    'has filePath on 200': (r) => {
      if (r.status !== 200) return true
      try {
        const body = JSON.parse(r.body)
        return typeof body.filePath === 'string' && typeof body.token === 'string'
      } catch {
        return false
      }
    },
  })

  if (res.status === 429) rateLimited.add(1)
  if (res.status === 401) unauthorized.add(1)

  if (!ok && res.status !== 429) {
    console.error(`unexpected response: ${res.status} ${res.body}`)
  }

  sleep(1)
}
