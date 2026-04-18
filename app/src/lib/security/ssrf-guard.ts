/**
 * SSRF Guard — validates outbound URLs before we `fetch` them.
 *
 * Two API surfaces in PodBrain accept user-supplied URLs and issue
 * server-side fetches:
 *
 *   1. Outbound webhooks (`lib/webhooks/dispatcher.ts`) — URL chosen
 *      at webhook-registration time, delivered on event.
 *   2. RSS import (`lib/rss/parser.ts`) — URL submitted at import time,
 *      fetched once.
 *
 * Without a guard, a user can point the URL at an internal host
 * (`http://localhost:3001/api/admin`, `http://169.254.169.254/...`) and
 * trick the server into returning internal responses through error
 * messages or webhook payload transcripts.
 *
 * This module provides a strict allowlist-by-exclusion check:
 *
 *   - Only `http:` and `https:` schemes
 *   - Host must be a valid, IP-shaped string OR a non-numeric hostname
 *   - IP literals (v4) are blocked if they fall into:
 *       * 0.0.0.0/8               (wildcard / "current network")
 *       * 10.0.0.0/8              (RFC 1918)
 *       * 127.0.0.0/8             (loopback)
 *       * 169.254.0.0/16          (link-local, incl. AWS IMDS)
 *       * 172.16.0.0/12           (RFC 1918)
 *       * 192.168.0.0/16          (RFC 1918)
 *   - IP literals (v6) are blocked for the loopback range (`::1`)
 *   - Hostnames that normalize to `localhost` are blocked
 *   - Numeric-only hostnames that are not valid IPv4 (e.g. decimal-
 *     encoded, hex-encoded) are blocked conservatively. We refuse to
 *     guess at clever encodings.
 *
 * This check runs BEFORE the outbound request. Callers MUST NOT follow
 * 3xx redirects that land on an unsafe URL; the dispatcher and RSS
 * parser today use `fetch` with its default redirect behavior — see
 * `NOTES.md` below. Adding a manual redirect walker is tracked as a
 * follow-up.
 */

const BLOCKED_HOSTNAMES = new Set(['localhost', 'ip6-localhost', 'ip6-loopback', 'broadcasthost']);

/**
 * Return true iff the URL string is syntactically a URL AND its host
 * passes the SSRF allowlist. Callers should reject with HTTP 400 on false.
 */
export function isSafeExternalUrl(input: unknown): boolean {
  if (typeof input !== 'string' || input.length === 0) return false;

  let url: URL;
  try {
    url = new URL(input);
  } catch {
    return false;
  }

  // Scheme must be http or https.
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return false;

  // Host must exist and not be the empty string ("http://").
  const host = url.hostname;
  if (!host) return false;

  // Hostnames we hard-block by name.
  if (BLOCKED_HOSTNAMES.has(host.toLowerCase())) return false;

  // IPv6 literal handling. Node's URL parser preserves the surrounding
  // brackets (e.g. `http://[::1]/` → `.hostname === '[::1]'`). Strip them
  // before comparing.
  if (host.startsWith('[') && host.endsWith(']')) {
    const inner = host.slice(1, -1).toLowerCase();
    // Block IPv6 loopback, link-local, and unique-local ranges.
    // Conservative: we don't try to handle every address type — these
    // three ranges cover the SSRF attack surface in our deploy target.
    if (
      inner === '::1' ||
      inner === '0:0:0:0:0:0:0:1' ||
      inner.startsWith('fe80:') || // link-local fe80::/10
      inner.startsWith('fc') || // unique local fc00::/7
      inner.startsWith('fd')
    ) {
      return false;
    }
    // Block IPv4-mapped IPv6 loopback (e.g. ::ffff:127.0.0.1)
    if (inner.includes('::ffff:127.') || inner.includes('::ffff:10.') || inner.includes('::ffff:192.168.')) {
      return false;
    }
    return true;
  }

  // IPv4 literal detection. A "dotted-quad" string is 4 decimal octets.
  const quad = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (quad) {
    const octets = quad.slice(1, 5).map((s) => parseInt(s, 10));
    if (octets.some((o) => o > 255)) return false;
    const [a, b] = octets;
    // 0.0.0.0/8
    if (a === 0) return false;
    // 10.0.0.0/8
    if (a === 10) return false;
    // 127.0.0.0/8 (loopback)
    if (a === 127) return false;
    // 169.254.0.0/16 (link-local, incl. AWS IMDS)
    if (a === 169 && b === 254) return false;
    // 172.16.0.0/12 — i.e. 172.16.0.0 through 172.31.255.255
    if (a === 172 && b >= 16 && b <= 31) return false;
    // 192.168.0.0/16
    if (a === 192 && b === 168) return false;
    return true;
  }

  // Numeric-only hostnames that aren't dotted-quad IPv4 (e.g. decimal
  // or hex-encoded 127.0.0.1 tricks). Refuse conservatively.
  if (/^\d+$/.test(host) || /^0x/i.test(host)) return false;

  // Ordinary hostname (e.g. example.com). Allow.
  return true;
}

/**
 * Zod refinement helper — throws a consistent message when used inside
 * a zod schema. Callers:
 *
 *   z.string().url().refine(isSafeExternalUrl, { message: SSRF_GUARD_REFINE_MESSAGE })
 */
export const SSRF_GUARD_REFINE_MESSAGE =
  'URL must be publicly reachable (internal / loopback / private-range addresses are not allowed)';
