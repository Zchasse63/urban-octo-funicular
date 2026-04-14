# Security Testing

Security scanning for PodBrain using OWASP ZAP and `npm audit`.

## Layers

### 1. `npm audit` (automatic)

Runs on every `npm install` and in CI. Catches known CVEs in npm
dependencies. Configure severity threshold in package.json if needed.

```bash
npm audit
npm audit --audit-level=high   # fail only on high+
```

### 2. OWASP ZAP baseline scan (manual / nightly)

Passive scanner that observes traffic and flags common vulnerabilities
without performing active attacks. Safe to run against any environment.

**Prerequisites:**
- Docker installed
- PodBrain dev server running on port 3100
- Optional: a signed-in session cookie for authenticated scans

**Run a baseline scan:**
```bash
docker run -v $(pwd)/test/security:/zap/wrk/:rw \
  -t ghcr.io/zaproxy/zaproxy:stable \
  zap-baseline.py \
  -t http://host.docker.internal:3100 \
  -c zap-baseline.yml \
  -r zap-report.html
```

The scan produces `zap-report.html` in this directory — open it in a browser.

**What it catches:**
- Missing security headers (CSP, X-Frame-Options, HSTS, etc.)
- Cookie flags (HttpOnly, Secure, SameSite)
- Open redirects
- CORS misconfigurations
- Directory listing
- Sensitive information in URLs
- Insecure JWT configurations
- SQL injection (passive pattern matching only)
- XSS (reflected only; stored XSS needs an authenticated active scan)

**What it DOESN'T catch:**
- Business logic flaws
- Authorization bugs (use `verifyShowOwnership` tests for this)
- Race conditions
- Second-order SQL injection

### 3. Full ZAP active scan (pre-launch only)

Performs real attack attempts against the application. **Only run
against staging environments with test data.** Not safe for production
or shared dev environments.

```bash
docker run -v $(pwd)/test/security:/zap/wrk/:rw \
  -t ghcr.io/zaproxy/zaproxy:stable \
  zap-full-scan.py \
  -t https://staging.getpodbrain.ai \
  -c zap-baseline.yml \
  -r zap-full-report.html
```

## CI integration

Add to nightly GitHub Actions workflow:

```yaml
- name: ZAP baseline scan
  uses: zaproxy/action-baseline@v0.10.0
  with:
    target: ${{ secrets.STAGING_URL }}
    rules_file_name: 'test/security/zap-baseline.yml'
    cmd_options: '-a'
```

## Results triage

All findings get a severity: Informational / Low / Medium / High.
- **High / Medium:** Fix before launch
- **Low:** Triage — usually informational
- **Informational:** Review but often noise

Ignore rules that are truly non-applicable by adding them to
`zap-baseline.yml`. Do NOT ignore real findings.
