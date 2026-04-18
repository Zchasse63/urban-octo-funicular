/**
 * POST /api/webhooks — validation + SSRF guard
 *
 * These tests bypass Supabase/auth entirely via mocks and focus on the
 * request-body validation layer.
 *
 * Critically: a webhook URL pointing at an internal host (localhost,
 * 127.0.0.1, AWS IMDS, RFC1918) must be REJECTED at registration time
 * with a 400 — otherwise the dispatcher will eventually attempt to POST
 * to it and leak internal responses.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';

const USER_ID = '11111111-1111-1111-1111-111111111111';

// Mock auth — always return an authenticated user.
vi.mock('@/lib/auth', () => ({
  requireAuth: vi.fn().mockResolvedValue({ userId: USER_ID, email: 'qa@example.com' }),
  isValidUUID: (s: string) =>
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s),
}));

// Mock rate-limit — always allow, unless a test overrides.
const rateLimitMock = vi.fn().mockResolvedValue({ success: true, remaining: 10 });
vi.mock('@/lib/rate-limit', () => ({
  checkRateLimit: rateLimitMock,
}));

// Mock Supabase server-side client — minimal chainable insert → returns row.
const insertedRow = {
  id: 'wh-uuid',
  user_id: USER_ID,
  url: 'https://hooks.example.com/a',
  events: ['episode.completed'],
  secret: null,
  active: true,
  created_at: '2026-04-18T00:00:00Z',
  updated_at: '2026-04-18T00:00:00Z',
};
vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({
    from: () => ({
      insert: () => ({
        select: () => ({
          single: async () => ({ data: insertedRow, error: null }),
        }),
      }),
    }),
  }),
}));

// Set an encryption secret before the route imports the encryption module.
process.env.ENCRYPTION_SECRET =
  'test-secret-with-high-entropy-0123456789ABCDEF!@#$%^&*()';

function makeRequest(body: unknown) {
  return new NextRequest('http://localhost:3000/api/webhooks', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('POST /api/webhooks — validation', () => {
  beforeEach(() => {
    vi.resetModules();
    rateLimitMock.mockResolvedValue({ success: true, remaining: 10 });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('T-031a: rejects malformed URL', async () => {
    const { POST } = await import('@/app/api/webhooks/route');
    const res = await POST(makeRequest({ url: 'not-a-url', events: ['episode.completed'] }));
    expect(res.status).toBe(400);
  });

  it('T-031b: rejects non-http(s) scheme', async () => {
    const { POST } = await import('@/app/api/webhooks/route');
    const res = await POST(makeRequest({ url: 'ftp://example.com/', events: ['episode.completed'] }));
    expect(res.status).toBe(400);
  });

  it('T-032: rejects unknown event name', async () => {
    const { POST } = await import('@/app/api/webhooks/route');
    const res = await POST(makeRequest({ url: 'https://ok.example.com/', events: ['unknown.event'] }));
    expect(res.status).toBe(400);
  });

  it('T-032b: rejects empty events list', async () => {
    const { POST } = await import('@/app/api/webhooks/route');
    const res = await POST(makeRequest({ url: 'https://ok.example.com/', events: [] }));
    expect(res.status).toBe(400);
  });

  it('T-030: happy path — response omits raw secret, sets has_secret', async () => {
    const { POST } = await import('@/app/api/webhooks/route');
    const res = await POST(
      makeRequest({
        url: 'https://ok.example.com/',
        events: ['episode.completed'],
        secret: 'hunter2',
      })
    );
    expect(res.status).toBe(201);
    // successResponse wraps in { data, error: null }
    const body = (await res.json()) as { data: Record<string, unknown>; error: null };
    expect(body.error).toBeNull();
    expect(body.data).toHaveProperty('has_secret');
    expect(body.data).not.toHaveProperty('secret');
  });

  it('T-038d: rejects webhook URLs pointing at localhost (SSRF guard)', async () => {
    const { POST } = await import('@/app/api/webhooks/route');
    const res = await POST(
      makeRequest({ url: 'http://localhost:3001/api/admin', events: ['episode.completed'] })
    );
    expect(res.status).toBe(400);
  });

  it('T-038e: rejects webhook URLs pointing at 127.0.0.1', async () => {
    const { POST } = await import('@/app/api/webhooks/route');
    const res = await POST(
      makeRequest({ url: 'http://127.0.0.1:3001/', events: ['episode.completed'] })
    );
    expect(res.status).toBe(400);
  });

  it('T-038f: rejects webhook URLs pointing at AWS IMDS', async () => {
    const { POST } = await import('@/app/api/webhooks/route');
    const res = await POST(
      makeRequest({ url: 'http://169.254.169.254/latest/meta-data/', events: ['episode.completed'] })
    );
    expect(res.status).toBe(400);
  });

  it('T-038g: rejects webhook URLs pointing at RFC1918 private space (10.0.0.1)', async () => {
    const { POST } = await import('@/app/api/webhooks/route');
    const res = await POST(
      makeRequest({ url: 'http://10.0.0.1/', events: ['episode.completed'] })
    );
    expect(res.status).toBe(400);
  });
});
