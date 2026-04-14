# Load Testing

Scripts for running k6 load tests against PodBrain endpoints.

## Prerequisites

Install k6:
```bash
brew install k6           # macOS
# or see https://k6.io/docs/get-started/installation/
```

## Getting an auth cookie

The load scripts need a valid Supabase session cookie:

1. Start the dev server: `npm run dev`
2. Sign in via the UI at `http://localhost:3000/login`
3. Open DevTools → Application → Cookies → `localhost`
4. Find the cookie starting with `sb-` (e.g. `sb-itnzbdojxvbhuxnwqgzg-auth-token`)
5. Copy the value (it's a long base64-encoded string)
6. Export it as `AUTH_COOKIE`:
   ```bash
   export AUTH_COOKIE='<paste here>'
   ```

## Available scripts

### upload-signed-url.js

Load-tests the `/api/upload` endpoint that mints pre-signed Supabase Storage URLs.

```bash
API_BASE=http://localhost:3100 AUTH_COOKIE="$AUTH_COOKIE" k6 run test/load/upload-signed-url.js
```

Stages:
- Ramp up to 10 virtual users over 30s
- Hold at 10 VUs for 30s
- Ramp up to 50 VUs over 60s
- Hold at 50 VUs for 60s
- Ramp down to 0 over 30s

Thresholds:
- HTTP error rate < 1%
- p(95) latency < 500ms
- Rate-limited responses < 1000

## Interpreting results

**Healthy:** All thresholds pass; rate-limited count grows as VUs increase
(confirming the rate limiter is working).

**Unhealthy:**
- p(95) spikes above 500ms → Supabase signed URL minting is slow
- Error rate > 1% → real failures (check the dev server logs)
- Zero rate limits at 50 VUs → the rate limiter isn't wired correctly

## CI integration

Load tests should run on a dedicated staging environment, not local dev.
Add to the GitHub Actions nightly workflow when the staging env is ready:

```yaml
- name: Load test
  run: k6 run test/load/upload-signed-url.js
  env:
    API_BASE: ${{ secrets.STAGING_URL }}
    AUTH_COOKIE: ${{ secrets.STAGING_LOADTEST_COOKIE }}
```
