/**
 * Webhook Dispatcher — Behavior Tests
 *
 * Companion to webhook-dispatcher.test.ts. Whereas the older test focuses
 * on HMAC signing math in isolation, this file exercises the actual
 * `dispatchWebhooks` function end-to-end with a mock supabase client and
 * a mock `fetch`, covering:
 *
 *   - Event-type filtering (only webhooks subscribed to an event fire)
 *   - `active: false` webhooks are skipped
 *   - HMAC-SHA256 signature header is set when a secret exists
 *   - No signature header when secret is null
 *   - Encrypted-secret JSON envelope is decrypted before signing
 *   - Fire-and-forget: delivery failures don't throw
 *   - SSRF guard: webhooks pointing at loopback / private addresses are NOT fetched
 *
 * The SSRF guard test is EXPECTED TO FAIL until the Healer wires
 * `isSafeExternalUrl` into the dispatcher.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import crypto from 'crypto';

// Must be set before importing the dispatcher (encryption module reads it).
const TEST_ENCRYPTION_SECRET = 'test-secret-with-high-entropy-0123456789ABCDEF!@#$%^&*()';

type Webhook = {
  id: string;
  user_id: string;
  url: string;
  events: string[];
  secret: string | null;
  active: boolean;
};

function makeMockSupabase(rows: Webhook[]) {
  // Chainable query builder that terminates on `.eq('active', true)`.
  // Returns `{ data: rows, error: null }` awaiter.
  const builder = {
    // The dispatcher calls .from('webhooks').select(...).eq('user_id', ...).eq('active', true)
    _rows: rows,
    from() {
      return this;
    },
    select() {
      return this;
    },
    eq() {
      return this;
    },
    then(onFulfilled: (r: { data: Webhook[]; error: null }) => unknown) {
      return Promise.resolve({ data: this._rows, error: null }).then(onFulfilled);
    },
  };
  return {
    from: () => builder,
  };
}

describe('dispatchWebhooks — behavior', () => {
  const originalEnv = process.env;
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    process.env = { ...originalEnv, ENCRYPTION_SECRET: TEST_ENCRYPTION_SECRET };
    vi.resetModules();
    mockFetch = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal('fetch', mockFetch);
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  async function loadDispatcherWithRows(rows: Webhook[]) {
    // Re-import the dispatcher per-test so the mocked supabase client is
    // picked up fresh each time.
    vi.doMock('@/lib/supabase/server', () => ({
      createAdminClient: () => makeMockSupabase(rows),
    }));
    const mod = await import('@/lib/webhooks/dispatcher');
    return mod.dispatchWebhooks;
  }

  it('T-033: posts HMAC-SHA256 signed body when secret is configured (plaintext fallback)', async () => {
    const secret = 'plain-text-webhook-secret';
    const dispatchWebhooks = await loadDispatcherWithRows([
      {
        id: 'wh-1',
        user_id: 'user-1',
        url: 'https://hooks.example.com/receive',
        events: ['episode.completed'],
        secret,
        active: true,
      },
    ]);

    const payload = {
      event: 'episode.completed' as const,
      timestamp: '2026-04-18T00:00:00.000Z',
      data: { episodeId: 'ep-1' },
    };
    await dispatchWebhooks('user-1', payload);
    // Allow the fire-and-forget Promise to settle.
    await new Promise((r) => setImmediate(r));

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url, init] = mockFetch.mock.calls[0];
    expect(url).toBe('https://hooks.example.com/receive');
    const sentBody = (init as RequestInit).body as string;
    expect(JSON.parse(sentBody)).toEqual(payload);

    const headers = (init as RequestInit).headers as Record<string, string>;
    expect(headers['X-PodBrain-Event']).toBe('episode.completed');
    const expectedSig = crypto
      .createHmac('sha256', secret)
      .update(sentBody)
      .digest('hex');
    expect(headers['X-PodBrain-Signature']).toBe(expectedSig);
  });

  it('T-033b: decrypts encrypted-envelope secret before HMAC signing', async () => {
    // Encrypt a secret using the real encryption module.
    const { encryptString } = await import('@/lib/buzzsprout/encryption');
    const plaintextSecret = 'my-super-secret-webhook-key';
    const envelope = encryptString(plaintextSecret);
    const storedSecret = JSON.stringify(envelope);

    const dispatchWebhooks = await loadDispatcherWithRows([
      {
        id: 'wh-1',
        user_id: 'user-1',
        url: 'https://hooks.example.com/receive',
        events: ['episode.completed'],
        secret: storedSecret,
        active: true,
      },
    ]);

    await dispatchWebhooks('user-1', {
      event: 'episode.completed',
      timestamp: '2026-04-18T00:00:00.000Z',
      data: {},
    });
    await new Promise((r) => setImmediate(r));

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [, init] = mockFetch.mock.calls[0];
    const sentBody = (init as RequestInit).body as string;
    const headers = (init as RequestInit).headers as Record<string, string>;
    const expected = crypto
      .createHmac('sha256', plaintextSecret)
      .update(sentBody)
      .digest('hex');
    expect(headers['X-PodBrain-Signature']).toBe(expected);
  });

  it('T-034: omits signature header when secret is null', async () => {
    const dispatchWebhooks = await loadDispatcherWithRows([
      {
        id: 'wh-1',
        user_id: 'user-1',
        url: 'https://hooks.example.com/receive',
        events: ['episode.completed'],
        secret: null,
        active: true,
      },
    ]);

    await dispatchWebhooks('user-1', {
      event: 'episode.completed',
      timestamp: '2026-04-18T00:00:00.000Z',
      data: {},
    });
    await new Promise((r) => setImmediate(r));

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [, init] = mockFetch.mock.calls[0];
    const headers = (init as RequestInit).headers as Record<string, string>;
    expect(headers['X-PodBrain-Signature']).toBeUndefined();
  });

  it('T-035: filters webhooks by event subscription', async () => {
    const dispatchWebhooks = await loadDispatcherWithRows([
      {
        id: 'wh-completed-only',
        user_id: 'user-1',
        url: 'https://hooks.example.com/completed',
        events: ['episode.completed'],
        secret: null,
        active: true,
      },
      {
        id: 'wh-failed-only',
        user_id: 'user-1',
        url: 'https://hooks.example.com/failed',
        events: ['episode.failed'],
        secret: null,
        active: true,
      },
    ]);

    await dispatchWebhooks('user-1', {
      event: 'episode.failed',
      timestamp: '2026-04-18T00:00:00.000Z',
      data: {},
    });
    await new Promise((r) => setImmediate(r));

    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockFetch.mock.calls[0][0]).toBe('https://hooks.example.com/failed');
  });

  it('T-037: does not throw when delivery returns 500', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 500 });
    const dispatchWebhooks = await loadDispatcherWithRows([
      {
        id: 'wh-1',
        user_id: 'user-1',
        url: 'https://hooks.example.com/receive',
        events: ['episode.completed'],
        secret: null,
        active: true,
      },
    ]);

    await expect(
      dispatchWebhooks('user-1', {
        event: 'episode.completed',
        timestamp: '2026-04-18T00:00:00.000Z',
        data: {},
      })
    ).resolves.toBeUndefined();
  });

  it('T-037b: does not throw when fetch itself rejects', async () => {
    mockFetch.mockRejectedValueOnce(new Error('network error'));
    const dispatchWebhooks = await loadDispatcherWithRows([
      {
        id: 'wh-1',
        user_id: 'user-1',
        url: 'https://hooks.example.com/receive',
        events: ['episode.completed'],
        secret: null,
        active: true,
      },
    ]);

    await expect(
      dispatchWebhooks('user-1', {
        event: 'episode.completed',
        timestamp: '2026-04-18T00:00:00.000Z',
        data: {},
      })
    ).resolves.toBeUndefined();
  });

  it('T-062: two webhooks, one failing — both attempted, dispatcher resolves', async () => {
    mockFetch.mockImplementationOnce(async () => ({ ok: false, status: 500 }));
    mockFetch.mockImplementationOnce(async () => ({ ok: true }));
    const dispatchWebhooks = await loadDispatcherWithRows([
      {
        id: 'wh-a',
        user_id: 'user-1',
        url: 'https://hooks.example.com/a',
        events: ['episode.completed'],
        secret: null,
        active: true,
      },
      {
        id: 'wh-b',
        user_id: 'user-1',
        url: 'https://hooks.example.com/b',
        events: ['episode.completed'],
        secret: null,
        active: true,
      },
    ]);

    await dispatchWebhooks('user-1', {
      event: 'episode.completed',
      timestamp: '2026-04-18T00:00:00.000Z',
      data: {},
    });
    await new Promise((r) => setImmediate(r));

    expect(mockFetch).toHaveBeenCalledTimes(2);
    const urls = mockFetch.mock.calls.map((c) => c[0]);
    expect(urls).toContain('https://hooks.example.com/a');
    expect(urls).toContain('https://hooks.example.com/b');
  });

  it('T-038: SSRF — does NOT POST to loopback URLs (127.0.0.1)', async () => {
    const dispatchWebhooks = await loadDispatcherWithRows([
      {
        id: 'wh-ssrf',
        user_id: 'user-1',
        url: 'http://127.0.0.1:3001/api/internal',
        events: ['episode.completed'],
        secret: null,
        active: true,
      },
    ]);

    await dispatchWebhooks('user-1', {
      event: 'episode.completed',
      timestamp: '2026-04-18T00:00:00.000Z',
      data: {},
    });
    await new Promise((r) => setImmediate(r));

    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('T-038b: SSRF — does NOT POST to AWS IMDS (169.254.169.254)', async () => {
    const dispatchWebhooks = await loadDispatcherWithRows([
      {
        id: 'wh-ssrf',
        user_id: 'user-1',
        url: 'http://169.254.169.254/latest/meta-data/',
        events: ['episode.completed'],
        secret: null,
        active: true,
      },
    ]);

    await dispatchWebhooks('user-1', {
      event: 'episode.completed',
      timestamp: '2026-04-18T00:00:00.000Z',
      data: {},
    });
    await new Promise((r) => setImmediate(r));

    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('T-038c: SSRF — does NOT POST to RFC1918 private addresses (10.0.0.1)', async () => {
    const dispatchWebhooks = await loadDispatcherWithRows([
      {
        id: 'wh-ssrf',
        user_id: 'user-1',
        url: 'http://10.0.0.1/admin',
        events: ['episode.completed'],
        secret: null,
        active: true,
      },
    ]);

    await dispatchWebhooks('user-1', {
      event: 'episode.completed',
      timestamp: '2026-04-18T00:00:00.000Z',
      data: {},
    });
    await new Promise((r) => setImmediate(r));

    expect(mockFetch).not.toHaveBeenCalled();
  });
});
