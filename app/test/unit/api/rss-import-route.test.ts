/**
 * POST /api/shows/[id]/import — validation + SSRF guard
 *
 * The RSS import endpoint accepts a user-supplied URL and fetches it
 * server-side. Without an SSRF guard, a malicious user could point the
 * URL at an internal service (localhost, AWS metadata endpoint, etc.)
 * and exfiltrate the response through error messages.
 *
 * These tests verify the pre-fetch validation layer. They do NOT require
 * a live RSS server.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';

const USER_ID = '44444444-4444-4444-4444-444444444444';
const SHOW_ID = '55555555-5555-5555-5555-555555555555';

vi.mock('@/lib/auth', () => ({
  requireAuth: vi.fn().mockResolvedValue({ userId: USER_ID, email: 'qa@example.com' }),
  isValidUUID: (s: string) =>
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s),
}));

vi.mock('@/lib/rate-limit', () => ({
  checkRateLimit: vi.fn().mockResolvedValue({ success: true, remaining: 5 }),
}));

vi.mock('@/lib/tier-limits', () => ({
  getTierLimits: () => ({ audioMinutesPerMonth: 100000 }),
  getUserTier: async () => ({ tier: 'agency', status: 'active' }),
  getAudioMinutesUsed: async () => 0,
}));

// Show-exists lookup — return a matching show.
vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({
    from: (table: string) => {
      if (table === 'shows') {
        return {
          select: () => ({
            eq: () => ({
              eq: () => ({
                single: async () => ({ data: { id: SHOW_ID }, error: null }),
              }),
            }),
          }),
        };
      }
      // episodes — minimal chain for existing-rows lookup
      return {
        select: () => ({
          eq: async () => ({ data: [], error: null }),
        }),
        insert: async () => ({ error: null }),
      };
    },
  }),
}));

// Spy on the RSS parser — tests that pass the SSRF gate should reach it.
const parseRSSFeedMock = vi.fn();
vi.mock('@/lib/rss/parser', () => ({
  parseRSSFeed: parseRSSFeedMock,
}));

function makeReq(body: unknown) {
  return new NextRequest(`http://localhost:3000/api/shows/${SHOW_ID}/import`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

async function invokePost(req: NextRequest) {
  const { POST } = await import('@/app/api/shows/[id]/import/route');
  return POST(req, { params: Promise.resolve({ id: SHOW_ID }) });
}

describe('POST /api/shows/[id]/import — validation + SSRF', () => {
  beforeEach(() => {
    vi.resetModules();
    parseRSSFeedMock.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('rejects malformed feedUrl with 400', async () => {
    const res = await invokePost(makeReq({ feedUrl: 'not-a-url' }));
    expect(res.status).toBe(400);
    expect(parseRSSFeedMock).not.toHaveBeenCalled();
  });

  it('T-043-route-a: rejects http://localhost/... (SSRF)', async () => {
    const res = await invokePost(makeReq({ feedUrl: 'http://localhost:3001/api/health' }));
    expect([400, 422]).toContain(res.status);
    expect(parseRSSFeedMock).not.toHaveBeenCalled();
  });

  it('T-043-route-b: rejects http://127.0.0.1/...', async () => {
    const res = await invokePost(makeReq({ feedUrl: 'http://127.0.0.1/feed.xml' }));
    expect([400, 422]).toContain(res.status);
    expect(parseRSSFeedMock).not.toHaveBeenCalled();
  });

  it('T-043-route-c: rejects 169.254.169.254 (AWS IMDS)', async () => {
    const res = await invokePost(makeReq({ feedUrl: 'http://169.254.169.254/latest/meta-data/' }));
    expect([400, 422]).toContain(res.status);
    expect(parseRSSFeedMock).not.toHaveBeenCalled();
  });

  it('T-043-route-d: rejects RFC1918 (10.0.0.0/8)', async () => {
    const res = await invokePost(makeReq({ feedUrl: 'http://10.0.0.1/feed' }));
    expect([400, 422]).toContain(res.status);
    expect(parseRSSFeedMock).not.toHaveBeenCalled();
  });

  it('T-040: happy path — delegates to parseRSSFeed and returns counts', async () => {
    parseRSSFeedMock.mockResolvedValueOnce({
      title: 'Test Feed',
      episodes: [
        {
          title: 'Ep 1',
          description: 'desc',
          audioUrl: 'https://cdn.example.com/ep1.mp3',
          guid: 'ep-1',
          pubDate: 'Mon, 01 Jan 2024 00:00:00 GMT',
          duration: 1800,
          episodeNumber: 1,
          seasonNumber: 1,
          imageUrl: null,
        },
      ],
    });
    const res = await invokePost(makeReq({ feedUrl: 'https://feeds.example.com/show.xml' }));
    expect(res.status).toBe(200);
    expect(parseRSSFeedMock).toHaveBeenCalledTimes(1);
  });
});
