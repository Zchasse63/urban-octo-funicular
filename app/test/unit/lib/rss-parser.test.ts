/**
 * RSS Feed Parser Tests
 *
 * Tests the zero-dependency RSS 2.0 parser with real RSS feed formats,
 * edge cases (CDATA, missing fields, iTunes namespace), duration parsing,
 * and XML entity decoding.
 */

import { describe, it, expect, vi, afterEach } from 'vitest'
import { parseRSSFeed } from '@/lib/rss/parser'

// Helper to create a mock fetch that returns an RSS XML string
function mockFetchWithXml(xml: string) {
  return vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    text: () => Promise.resolve(xml),
  })
}

afterEach(() => {
  vi.restoreAllMocks()
})

// ─── Valid RSS Feeds ────────────────────────────────────────────────────────

describe('parseRSSFeed - valid feeds', () => {
  it('parses a minimal valid RSS 2.0 feed', async () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd">
  <channel>
    <title>Test Podcast</title>
    <description>A test podcast about testing.</description>
    <language>en</language>
    <link>https://example.com</link>
    <item>
      <title>Episode 1</title>
      <description>First episode description.</description>
      <enclosure url="https://example.com/ep1.mp3" type="audio/mpeg" length="12345678"/>
      <guid>ep-guid-1</guid>
      <pubDate>Mon, 01 Jan 2024 00:00:00 GMT</pubDate>
    </item>
  </channel>
</rss>`
    vi.stubGlobal('fetch', mockFetchWithXml(xml))

    const feed = await parseRSSFeed('https://example.com/feed.xml')
    expect(feed.title).toBe('Test Podcast')
    expect(feed.description).toBe('A test podcast about testing.')
    expect(feed.language).toBe('en')
    expect(feed.websiteUrl).toBe('https://example.com')
    expect(feed.episodes).toHaveLength(1)
    expect(feed.episodes[0].title).toBe('Episode 1')
    expect(feed.episodes[0].audioUrl).toBe('https://example.com/ep1.mp3')
    expect(feed.episodes[0].guid).toBe('ep-guid-1')
  })

  it('parses feed with CDATA descriptions', async () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>CDATA Test</title>
    <description><![CDATA[A podcast with <strong>HTML</strong> in description.]]></description>
    <item>
      <title>CDATA Episode</title>
      <description><![CDATA[Episode with <em>bold</em> and <a href="#">links</a>.]]></description>
      <enclosure url="https://example.com/ep.mp3" type="audio/mpeg"/>
      <guid>cdata-ep-1</guid>
    </item>
  </channel>
</rss>`
    vi.stubGlobal('fetch', mockFetchWithXml(xml))

    const feed = await parseRSSFeed('https://example.com/feed.xml')
    expect(feed.title).toBe('CDATA Test')
    // Description should have HTML stripped
    expect(feed.episodes[0].description).not.toContain('<em>')
    expect(feed.episodes[0].description).not.toContain('<a ')
  })

  it('parses feed with iTunes namespace extensions', async () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd">
  <channel>
    <title>iTunes Podcast</title>
    <description>Has iTunes tags.</description>
    <itunes:author>Author Name</itunes:author>
    <itunes:image href="https://example.com/artwork.jpg"/>
    <item>
      <title>Episode with iTunes</title>
      <description>Standard description</description>
      <itunes:summary>iTunes summary takes priority</itunes:summary>
      <itunes:duration>01:23:45</itunes:duration>
      <itunes:episode>5</itunes:episode>
      <itunes:season>2</itunes:season>
      <itunes:image href="https://example.com/ep-art.jpg"/>
      <enclosure url="https://example.com/ep.mp3" type="audio/mpeg"/>
      <guid>itunes-ep-1</guid>
    </item>
  </channel>
</rss>`
    vi.stubGlobal('fetch', mockFetchWithXml(xml))

    const feed = await parseRSSFeed('https://example.com/feed.xml')
    expect(feed.author).toBe('Author Name')
    expect(feed.imageUrl).toBe('https://example.com/artwork.jpg')
    expect(feed.episodes[0].description).toBe('iTunes summary takes priority')
    expect(feed.episodes[0].duration).toBe(5025) // 1*3600 + 23*60 + 45
    expect(feed.episodes[0].episodeNumber).toBe(5)
    expect(feed.episodes[0].seasonNumber).toBe(2)
    expect(feed.episodes[0].imageUrl).toBe('https://example.com/ep-art.jpg')
  })

  it('parses feed with multiple episodes', async () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Multi Episode</title>
    <description>Multiple episodes.</description>
    <item>
      <title>Episode 3</title>
      <enclosure url="https://example.com/ep3.mp3" type="audio/mpeg"/>
      <guid>ep3</guid>
    </item>
    <item>
      <title>Episode 2</title>
      <enclosure url="https://example.com/ep2.mp3" type="audio/mpeg"/>
      <guid>ep2</guid>
    </item>
    <item>
      <title>Episode 1</title>
      <enclosure url="https://example.com/ep1.mp3" type="audio/mpeg"/>
      <guid>ep1</guid>
    </item>
  </channel>
</rss>`
    vi.stubGlobal('fetch', mockFetchWithXml(xml))

    const feed = await parseRSSFeed('https://example.com/feed.xml')
    expect(feed.episodes).toHaveLength(3)
    expect(feed.episodes[0].title).toBe('Episode 3')
    expect(feed.episodes[2].title).toBe('Episode 1')
  })

  it('handles XML entities in content', async () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>O&apos;Brien &amp; Friends</title>
    <description>A &quot;great&quot; show.</description>
    <item>
      <title>Episode &lt;1&gt;</title>
      <enclosure url="https://example.com/ep.mp3" type="audio/mpeg"/>
      <guid>entity-ep</guid>
    </item>
  </channel>
</rss>`
    vi.stubGlobal('fetch', mockFetchWithXml(xml))

    const feed = await parseRSSFeed('https://example.com/feed.xml')
    expect(feed.title).toBe("O'Brien & Friends")
    expect(feed.description).toBe('A "great" show.')
    expect(feed.episodes[0].title).toBe('Episode <1>')
  })
})

// ─── Duration Parsing ───────────────────────────────────────────────────────

describe('parseRSSFeed - duration formats', () => {
  async function feedWithDuration(durationStr: string) {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd">
  <channel>
    <title>Duration Test</title>
    <description>Test</description>
    <item>
      <title>Episode</title>
      <enclosure url="https://example.com/ep.mp3" type="audio/mpeg"/>
      <guid>dur-ep</guid>
      <itunes:duration>${durationStr}</itunes:duration>
    </item>
  </channel>
</rss>`
    vi.stubGlobal('fetch', mockFetchWithXml(xml))
    return parseRSSFeed('https://example.com/feed.xml')
  }

  it('parses HH:MM:SS format', async () => {
    const feed = await feedWithDuration('01:30:45')
    expect(feed.episodes[0].duration).toBe(5445) // 1*3600 + 30*60 + 45
  })

  it('parses MM:SS format', async () => {
    const feed = await feedWithDuration('45:30')
    expect(feed.episodes[0].duration).toBe(2730) // 45*60 + 30
  })

  it('parses plain seconds format', async () => {
    const feed = await feedWithDuration('3600')
    expect(feed.episodes[0].duration).toBe(3600)
  })

  it('returns null for empty duration', async () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>No Duration</title>
    <description>Test</description>
    <item>
      <title>Episode</title>
      <enclosure url="https://example.com/ep.mp3" type="audio/mpeg"/>
      <guid>no-dur</guid>
    </item>
  </channel>
</rss>`
    vi.stubGlobal('fetch', mockFetchWithXml(xml))
    const feed = await parseRSSFeed('https://example.com/feed.xml')
    expect(feed.episodes[0].duration).toBeNull()
  })
})

// ─── Edge Cases ─────────────────────────────────────────────────────────────

describe('parseRSSFeed - edge cases', () => {
  it('uses audio URL as guid when guid tag missing', async () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>No GUID</title>
    <description>Test</description>
    <item>
      <title>Episode No GUID</title>
      <enclosure url="https://example.com/episode.mp3" type="audio/mpeg"/>
    </item>
  </channel>
</rss>`
    vi.stubGlobal('fetch', mockFetchWithXml(xml))

    const feed = await parseRSSFeed('https://example.com/feed.xml')
    expect(feed.episodes[0].guid).toBe('https://example.com/episode.mp3')
  })

  it('skips items without title', async () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Skip No Title</title>
    <description>Test</description>
    <item>
      <enclosure url="https://example.com/ep.mp3" type="audio/mpeg"/>
      <guid>no-title</guid>
    </item>
    <item>
      <title>Has Title</title>
      <enclosure url="https://example.com/ep2.mp3" type="audio/mpeg"/>
      <guid>has-title</guid>
    </item>
  </channel>
</rss>`
    vi.stubGlobal('fetch', mockFetchWithXml(xml))

    const feed = await parseRSSFeed('https://example.com/feed.xml')
    expect(feed.episodes).toHaveLength(1)
    expect(feed.episodes[0].title).toBe('Has Title')
  })

  it('skips items without enclosure (audio URL)', async () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Skip No Audio</title>
    <description>Test</description>
    <item>
      <title>No Audio</title>
      <guid>no-audio</guid>
    </item>
    <item>
      <title>Has Audio</title>
      <enclosure url="https://example.com/ep.mp3" type="audio/mpeg"/>
      <guid>has-audio</guid>
    </item>
  </channel>
</rss>`
    vi.stubGlobal('fetch', mockFetchWithXml(xml))

    const feed = await parseRSSFeed('https://example.com/feed.xml')
    expect(feed.episodes).toHaveLength(1)
    expect(feed.episodes[0].title).toBe('Has Audio')
  })

  it('handles feed with no episodes', async () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Empty Feed</title>
    <description>No episodes yet.</description>
  </channel>
</rss>`
    vi.stubGlobal('fetch', mockFetchWithXml(xml))

    const feed = await parseRSSFeed('https://example.com/feed.xml')
    expect(feed.title).toBe('Empty Feed')
    expect(feed.episodes).toEqual([])
  })

  it('handles missing optional channel fields', async () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Minimal Channel</title>
    <description></description>
    <item>
      <title>Ep</title>
      <enclosure url="https://example.com/ep.mp3" type="audio/mpeg"/>
      <guid>min-ep</guid>
    </item>
  </channel>
</rss>`
    vi.stubGlobal('fetch', mockFetchWithXml(xml))

    const feed = await parseRSSFeed('https://example.com/feed.xml')
    expect(feed.language).toBeNull()
    expect(feed.author).toBeNull()
    expect(feed.imageUrl).toBeNull()
    expect(feed.websiteUrl).toBeNull()
  })
})

// ─── Error Handling ─────────────────────────────────────────────────────────

describe('parseRSSFeed - error handling', () => {
  it('rejects invalid URL', async () => {
    await expect(parseRSSFeed('not-a-url')).rejects.toThrow('Invalid feed URL')
  })

  it('rejects non-http URL', async () => {
    await expect(parseRSSFeed('ftp://example.com/feed.xml')).rejects.toThrow('Invalid feed URL')
  })

  it('handles HTTP error responses', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      statusText: 'Not Found',
    }))

    await expect(parseRSSFeed('https://example.com/missing.xml'))
      .rejects.toThrow('HTTP 404')
  })

  it('handles network failures', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('DNS resolution failed')))

    await expect(parseRSSFeed('https://example.com/feed.xml'))
      .rejects.toThrow('Failed to fetch feed')
  })

  it('rejects non-RSS responses', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: () => Promise.resolve('<html><body>Not an RSS feed</body></html>'),
    }))

    await expect(parseRSSFeed('https://example.com/page.html'))
      .rejects.toThrow('does not appear to be a valid RSS feed')
  })

  it('rejects feed without title', async () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <description>No title here.</description>
  </channel>
</rss>`
    vi.stubGlobal('fetch', mockFetchWithXml(xml))

    await expect(parseRSSFeed('https://example.com/feed.xml'))
      .rejects.toThrow('missing a <title> element')
  })
})
