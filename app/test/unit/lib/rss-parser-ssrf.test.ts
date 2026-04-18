/**
 * RSS Parser — SSRF Guard + Podcasting 2.0 namespace safety
 *
 * The `parseRSSFeed` helper takes a user-supplied URL and fetches it.
 * Without an SSRF guard a user could point it at internal services
 * (`http://localhost:3001/api/…`, `http://169.254.169.254/…`) and
 * harvest private responses through the returned error messages.
 *
 * These tests verify that parseRSSFeed rejects unsafe URLs BEFORE
 * issuing a fetch. If the guard is missing, `fetch` will be invoked
 * (the test will fail).
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { parseRSSFeed } from '@/lib/rss/parser';

const P2_FEED = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
     xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd"
     xmlns:podcast="https://podcastindex.org/namespace/1.0">
  <channel>
    <title>P2.0 Podcast</title>
    <description>With podcast namespace extensions</description>
    <itunes:image href="https://example.com/cover.jpg"/>
    <podcast:value type="lightning" method="keysend" suggested="0.00000005000">
      <podcast:valueRecipient name="host" type="node" address="02abc" split="100"/>
    </podcast:value>
    <podcast:location osm="R6930953">London, UK</podcast:location>
    <item>
      <title>Ep 1</title>
      <description>Body</description>
      <enclosure url="https://cdn.example.com/ep1.mp3" type="audio/mpeg" length="1000"/>
      <guid>ep-1</guid>
      <pubDate>Mon, 01 Jan 2024 00:00:00 GMT</pubDate>
      <itunes:duration>00:32:11</itunes:duration>
      <podcast:transcript url="https://example.com/ep1.vtt" type="text/vtt"/>
    </item>
  </channel>
</rss>`;

function mockFetchOk(body: string) {
  return vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    text: () => Promise.resolve(body),
  });
}

describe('parseRSSFeed — SSRF guard', () => {
  let fetchSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('T-043a: rejects http://localhost/… before fetching', async () => {
    await expect(parseRSSFeed('http://localhost:3001/api/health')).rejects.toThrow(
      /internal|not allowed|safe|ssrf/i
    );
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('T-043b: rejects http://127.0.0.1/…', async () => {
    await expect(parseRSSFeed('http://127.0.0.1/feed.xml')).rejects.toThrow();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('T-043c: rejects 169.254.169.254 (AWS IMDS)', async () => {
    await expect(
      parseRSSFeed('http://169.254.169.254/latest/meta-data/')
    ).rejects.toThrow();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('T-043d: rejects 10.0.0.0/8 private address', async () => {
    await expect(parseRSSFeed('http://10.0.0.5/feed')).rejects.toThrow();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('T-043e: rejects 192.168.0.0/16 private address', async () => {
    await expect(parseRSSFeed('http://192.168.1.1/feed')).rejects.toThrow();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('T-043f: rejects non-http(s) schemes', async () => {
    await expect(parseRSSFeed('file:///etc/passwd')).rejects.toThrow();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('allows ordinary public URLs', async () => {
    fetchSpy.mockResolvedValueOnce({
      ok: true,
      status: 200,
      text: () =>
        Promise.resolve(
          `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>OK</title><description>x</description></channel></rss>`
        ),
    });
    const feed = await parseRSSFeed('https://example.com/feed.xml');
    expect(feed.title).toBe('OK');
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });
});

describe('parseRSSFeed — Podcasting 2.0 namespace safety', () => {
  let fetchSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchSpy = mockFetchOk(P2_FEED);
    vi.stubGlobal('fetch', fetchSpy);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('T-045: parses core fields from a feed with podcast: namespace tags (does not crash)', async () => {
    const feed = await parseRSSFeed('https://example.com/feed.xml');
    expect(feed.title).toBe('P2.0 Podcast');
    expect(feed.episodes).toHaveLength(1);
    expect(feed.episodes[0].title).toBe('Ep 1');
    expect(feed.episodes[0].audioUrl).toBe('https://cdn.example.com/ep1.mp3');
  });

  it('T-045b: itunes:image is extracted', async () => {
    const feed = await parseRSSFeed('https://example.com/feed.xml');
    expect(feed.imageUrl).toBe('https://example.com/cover.jpg');
  });
});
