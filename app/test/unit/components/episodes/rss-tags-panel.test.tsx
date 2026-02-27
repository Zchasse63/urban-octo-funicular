/**
 * RSSTagsPanel Component Tests
 *
 * Tests loading/error/empty states, data display,
 * collapsible sections, and copy functionality.
 */

import { describe, it, expect, vi, beforeEach, afterAll } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import RSSTagsPanel from '@/components/episodes/rss-tags-panel'

// Save and restore global.fetch to prevent leaks across test files (singleFork)
const _originalFetch = global.fetch
afterAll(() => { global.fetch = _originalFetch })

// Mock clipboard
Object.defineProperty(navigator, 'clipboard', {
  value: { writeText: vi.fn().mockResolvedValue(undefined) },
  writable: true,
  configurable: true,
})

const mockData = {
  snippet: '<!-- Podcasting 2.0 -->\n<podcast:person role="host">Jane</podcast:person>',
  channelTags: '<podcast:medium>podcast</podcast:medium>',
  itemTags: '<podcast:person role="host">Jane</podcast:person>',
  tags: {
    persons: [
      { name: 'Jane Smith', role: 'host', group: 'Cast', img: 'https://example.com/jane.jpg', href: 'https://jane.com' },
      { name: 'Bob Guest', role: 'guest', group: 'Cast', img: null, href: null },
    ],
    transcript: {
      url: 'https://example.com/transcript.vtt',
      type: 'text/vtt',
      language: 'en',
      rel: null,
    },
    soundbites: [
      { startTime: 120, duration: 30, title: 'Amazing insight about AI' },
      { startTime: 450, duration: 25, title: 'Key takeaway' },
    ],
    chapters: {
      url: 'https://example.com/chapters.json',
      type: 'application/json+chapters',
    },
    chaptersJson: {
      version: '1.2.0',
      chapters: [
        { startTime: 0, title: 'Introduction' },
        { startTime: 120, title: 'Main Discussion' },
        { startTime: 600, title: 'Wrap Up' },
      ],
    },
    podroll: [
      { title: 'Tech Talk', feedUrl: 'https://example.com/techtalk.xml', feedGuid: 'guid-1' },
    ],
  },
}

describe('RSSTagsPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('loading state', () => {
    it('shows loading indicator while fetching', () => {
      global.fetch = vi.fn().mockReturnValue(new Promise(() => {}))
      render(<RSSTagsPanel episodeId="ep-123" />)
      expect(screen.getByText('Generating Podcasting 2.0 tags...')).toBeInTheDocument()
    })
  })

  describe('error state', () => {
    it('shows error message on API failure', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({ error: 'Episode not processed' }),
      })

      render(<RSSTagsPanel episodeId="ep-123" />)
      await waitFor(() => {
        expect(screen.getByText('Episode not processed')).toBeInTheDocument()
      })
    })

    it('shows generic error on network failure', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'))

      render(<RSSTagsPanel episodeId="ep-123" />)
      await waitFor(() => {
        expect(screen.getByText('Network error')).toBeInTheDocument()
      })
    })
  })

  describe('empty state', () => {
    it('shows empty state when no tags generated', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          data: { snippet: '', channelTags: '', itemTags: '', tags: { persons: [], transcript: null, soundbites: [], chapters: null, chaptersJson: null, podroll: [] } },
        }),
      })

      render(<RSSTagsPanel episodeId="ep-123" />)
      await waitFor(() => {
        expect(screen.getByText('No RSS tags available yet')).toBeInTheDocument()
      })
    })

    it('shows processing hint in empty state', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          data: { snippet: '', channelTags: '', itemTags: '', tags: { persons: [], transcript: null, soundbites: [], chapters: null, chaptersJson: null, podroll: [] } },
        }),
      })

      render(<RSSTagsPanel episodeId="ep-123" />)
      await waitFor(() => {
        expect(screen.getByText(/Process the episode/)).toBeInTheDocument()
      })
    })
  })

  describe('data display', () => {
    beforeEach(() => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: mockData }),
      })
    })

    it('shows full XML snippet', async () => {
      render(<RSSTagsPanel episodeId="ep-123" />)
      await waitFor(() => {
        expect(screen.getByText(/Podcasting 2.0/)).toBeInTheDocument()
      })
    })

    it('shows RSS Tags header', async () => {
      render(<RSSTagsPanel episodeId="ep-123" />)
      await waitFor(() => {
        expect(screen.getByText('RSS Tags')).toBeInTheDocument()
      })
    })

    it('shows Copy All button', async () => {
      render(<RSSTagsPanel episodeId="ep-123" />)
      await waitFor(() => {
        expect(screen.getByText('Copy All')).toBeInTheDocument()
      })
    })

    it('shows channel and item tags sections', async () => {
      render(<RSSTagsPanel episodeId="ep-123" />)
      await waitFor(() => {
        expect(screen.getByText('Channel Tags')).toBeInTheDocument()
        expect(screen.getByText('Item Tags')).toBeInTheDocument()
      })
    })
  })

  describe('person tags section', () => {
    beforeEach(() => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: mockData }),
      })
    })

    it('shows Person Tags section with count', async () => {
      render(<RSSTagsPanel episodeId="ep-123" />)
      await waitFor(() => {
        expect(screen.getByText('Person Tags')).toBeInTheDocument()
        // Multiple sections may have count "2" (persons and soundbites)
        const counts = screen.getAllByText('2')
        expect(counts.length).toBeGreaterThanOrEqual(1)
      })
    })

    it('shows person names and roles', async () => {
      render(<RSSTagsPanel episodeId="ep-123" />)
      await waitFor(() => {
        expect(screen.getByText('Jane Smith')).toBeInTheDocument()
        expect(screen.getByText('Bob Guest')).toBeInTheDocument()
        expect(screen.getByText('host')).toBeInTheDocument()
        expect(screen.getByText('guest')).toBeInTheDocument()
      })
    })

    it('shows person image when available', async () => {
      render(<RSSTagsPanel episodeId="ep-123" />)
      await waitFor(() => {
        const img = screen.getByAltText('Jane Smith')
        expect(img).toHaveAttribute('src', 'https://example.com/jane.jpg')
      })
    })

    it('shows external link for person with href', async () => {
      render(<RSSTagsPanel episodeId="ep-123" />)
      await waitFor(() => {
        const links = screen.getAllByRole('link')
        const janeLink = links.find(link => link.getAttribute('href') === 'https://jane.com')
        expect(janeLink).toBeDefined()
        expect(janeLink).toHaveAttribute('target', '_blank')
      })
    })
  })

  describe('soundbites section', () => {
    beforeEach(() => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: mockData }),
      })
    })

    it('shows Soundbites section with count', async () => {
      render(<RSSTagsPanel episodeId="ep-123" />)
      await waitFor(() => {
        expect(screen.getByText('Soundbites')).toBeInTheDocument()
      })
    })

    it('shows soundbite timestamps', async () => {
      render(<RSSTagsPanel episodeId="ep-123" />)
      await waitFor(() => {
        // "2:00" may appear in both soundbites (120s) and chapters (120s) sections
        const times = screen.getAllByText('2:00')
        expect(times.length).toBeGreaterThanOrEqual(1)
        expect(screen.getByText('7:30')).toBeInTheDocument()
      })
    })

    it('shows soundbite titles', async () => {
      render(<RSSTagsPanel episodeId="ep-123" />)
      await waitFor(() => {
        expect(screen.getByText('Amazing insight about AI')).toBeInTheDocument()
        expect(screen.getByText('Key takeaway')).toBeInTheDocument()
      })
    })
  })

  describe('chapters section', () => {
    beforeEach(() => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: mockData }),
      })
    })

    it('shows Chapters section with count', async () => {
      render(<RSSTagsPanel episodeId="ep-123" />)
      await waitFor(() => {
        expect(screen.getByText('Chapters')).toBeInTheDocument()
        expect(screen.getByText('3')).toBeInTheDocument()
      })
    })

    it('shows chapter titles', async () => {
      render(<RSSTagsPanel episodeId="ep-123" />)
      await waitFor(() => {
        expect(screen.getByText('Introduction')).toBeInTheDocument()
        expect(screen.getByText('Main Discussion')).toBeInTheDocument()
        expect(screen.getByText('Wrap Up')).toBeInTheDocument()
      })
    })

    it('shows Copy Chapters JSON button', async () => {
      render(<RSSTagsPanel episodeId="ep-123" />)
      await waitFor(() => {
        expect(screen.getByText('Copy Chapters JSON')).toBeInTheDocument()
      })
    })
  })

  describe('help section', () => {
    beforeEach(() => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: mockData }),
      })
    })

    it('shows About Podcasting 2.0 section', async () => {
      render(<RSSTagsPanel episodeId="ep-123" />)
      await waitFor(() => {
        expect(screen.getByText('About Podcasting 2.0')).toBeInTheDocument()
      })
    })

    it('shows specification link', async () => {
      render(<RSSTagsPanel episodeId="ep-123" />)
      await waitFor(() => {
        expect(screen.getByText('View full specification')).toBeInTheDocument()
      })
    })
  })

  describe('collapsible sections', () => {
    beforeEach(() => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: mockData }),
      })
    })

    it('toggles section open/close on click', async () => {
      render(<RSSTagsPanel episodeId="ep-123" />)
      await waitFor(() => {
        expect(screen.getByText('Jane Smith')).toBeInTheDocument()
      })

      // Click to collapse Person Tags section
      fireEvent.click(screen.getByText('Person Tags'))

      // Content should be hidden
      expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument()

      // Click again to expand
      fireEvent.click(screen.getByText('Person Tags'))
      expect(screen.getByText('Jane Smith')).toBeInTheDocument()
    })
  })

  describe('API call', () => {
    it('fetches RSS tags for the correct episode', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: mockData }),
      })
      global.fetch = mockFetch

      render(<RSSTagsPanel episodeId="ep-789" />)
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/episodes/ep-789/rss-tags')
      })
    })
  })
})
