/**
 * GET /api/transistor/shows
 *
 * Transistor is a documented-optional hosting integration. If the user
 * doesn't have a Transistor connection yet, the route should return a
 * clean 404 with "No Transistor connection found" — not a 500.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const USER_ID = '33333333-3333-3333-3333-333333333333';

vi.mock('@/lib/auth', () => ({
  requireAuth: vi.fn().mockResolvedValue({ userId: USER_ID, email: 'qa@example.com' }),
}));

const getTransistorClientMock = vi.fn();
vi.mock('@/lib/transistor/helpers', () => ({
  getTransistorClient: getTransistorClientMock,
}));

describe('GET /api/transistor/shows', () => {
  beforeEach(() => {
    vi.resetModules();
    getTransistorClientMock.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('T-020a: returns 404 when no Transistor connection found', async () => {
    getTransistorClientMock.mockRejectedValueOnce(new Error('No Transistor connection found'));
    const { GET } = await import('@/app/api/transistor/shows/route');
    const res = await GET();
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toBe('No Transistor connection found');
  });

  it('T-020b: returns 200 with shows on happy path', async () => {
    getTransistorClientMock.mockResolvedValueOnce({
      getShows: vi.fn().mockResolvedValue([{ id: '1', name: 'Show A' }]),
    });
    const { GET } = await import('@/app/api/transistor/shows/route');
    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
    expect(body[0].name).toBe('Show A');
  });

  it('T-060-transistor: upstream throws unexpected error → 500 (not crash)', async () => {
    getTransistorClientMock.mockRejectedValueOnce(new Error('Transistor 503'));
    const { GET } = await import('@/app/api/transistor/shows/route');
    const res = await GET();
    // handleApiError path returns 500 for unknown errors
    expect(res.status).toBe(500);
  });
});
