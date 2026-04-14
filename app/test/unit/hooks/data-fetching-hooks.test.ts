/**
 * Unit tests for data-fetching hooks:
 * - useEpisodes
 * - useShows
 * - useEpisode
 * - useEpisodeAssets
 * - useEpisodeSeo
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'

// ─────────────────────────────────────────────────
// Global fetch mock
// ─────────────────────────────────────────────────

const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

// Mock supabase client (used by useEpisode)
const mockSupabaseSelect = vi.fn()
const mockSupabaseEq = vi.fn()
const mockSupabaseSingle = vi.fn()
const mockSupabaseFrom = vi.fn(() => ({
  select: mockSupabaseSelect,
}))

mockSupabaseSelect.mockReturnValue({ eq: mockSupabaseEq })
mockSupabaseEq.mockReturnValue({ single: mockSupabaseSingle })

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    from: mockSupabaseFrom,
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: null } }),
      onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
      signOut: vi.fn(),
    },
  }),
}))

beforeEach(() => {
  mockFetch.mockReset()
  mockSupabaseFrom.mockClear()
  mockSupabaseSelect.mockClear()
  mockSupabaseEq.mockClear()
  mockSupabaseSingle.mockClear()

  // Reset the chain
  mockSupabaseFrom.mockReturnValue({ select: mockSupabaseSelect })
  mockSupabaseSelect.mockReturnValue({ eq: mockSupabaseEq })
  mockSupabaseEq.mockReturnValue({ single: mockSupabaseSingle })
})

// ─────────────────────────────────────────────────
// useEpisodes
// ─────────────────────────────────────────────────

import useEpisodes from '@/hooks/use-episodes'

describe('useEpisodes', () => {
  it('starts with loading=true and empty episodes', () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ data: [], total: 0, page: 1, per_page: 20 }),
    })

    const { result } = renderHook(() => useEpisodes())

    expect(result.current.isLoading).toBe(true)
    expect(result.current.episodes).toEqual([])
    expect(result.current.error).toBeNull()
  })

  it('fetches episodes successfully', async () => {
    const mockEpisodes = [
      { id: '1', title: 'Episode 1', status: 'completed', guest_name: null, description: null },
      { id: '2', title: 'Episode 2', status: 'processing', guest_name: 'John', description: 'test' },
    ]

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({ data: mockEpisodes, total: 2, page: 1, per_page: 20 }),
    })

    const { result } = renderHook(() => useEpisodes())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.episodes).toEqual(mockEpisodes)
    expect(result.current.total).toBe(2)
    expect(result.current.error).toBeNull()
  })

  it('passes showId and status as query params', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ data: [], total: 0, page: 1, per_page: 20 }),
    })

    renderHook(() =>
      useEpisodes({ showId: 'show-1', status: 'completed', page: 2, perPage: 10 })
    )

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalled()
    })

    const calledUrl = mockFetch.mock.calls[0][0] as string
    expect(calledUrl).toContain('show_id=show-1')
    expect(calledUrl).toContain('status=completed')
    expect(calledUrl).toContain('page=2')
    expect(calledUrl).toContain('per_page=10')
  })

  it('handles fetch error', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      statusText: 'Internal Server Error',
    })

    const { result } = renderHook(() => useEpisodes())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.error).toBe(
      'Failed to fetch episodes: Internal Server Error'
    )
    expect(result.current.episodes).toEqual([])
  })

  it('handles network error', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network failed'))

    const { result } = renderHook(() => useEpisodes())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.error).toBe('Network failed')
  })

  it('applies client-side search filter', async () => {
    const mockEpisodes = [
      { id: '1', title: 'React Patterns', guest_name: null, description: null },
      { id: '2', title: 'Vue Basics', guest_name: null, description: null },
      { id: '3', title: 'Node.js Tips', guest_name: 'React Expert', description: null },
    ]

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({ data: mockEpisodes, total: 3, page: 1, per_page: 20 }),
    })

    const { result } = renderHook(() =>
      useEpisodes({ search: 'react' })
    )

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.episodes).toHaveLength(2)
    expect(result.current.episodes[0].id).toBe('1')
    expect(result.current.episodes[1].id).toBe('3')
    // Total is filtered length when searching
    expect(result.current.total).toBe(2)
  })

  it('refetch function re-fetches episodes', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({ data: [{ id: '1', title: 'Ep1', guest_name: null, description: null }], total: 1, page: 1, per_page: 20 }),
    })

    const { result } = renderHook(() => useEpisodes())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({ data: [{ id: '1' }, { id: '2' }], total: 2, page: 1, per_page: 20 }),
    })

    await act(async () => {
      await result.current.refetch()
    })

    await waitFor(() => {
      expect(result.current.episodes).toHaveLength(2)
    })
  })
})

// ─────────────────────────────────────────────────
// useShows
// ─────────────────────────────────────────────────

import useShows from '@/hooks/use-shows'

describe('useShows', () => {
  it('starts with loading=true and empty shows', () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ data: [] }),
    })

    const { result } = renderHook(() => useShows())

    expect(result.current.isLoading).toBe(true)
    expect(result.current.shows).toEqual([])
    expect(result.current.error).toBeNull()
  })

  it('fetches shows successfully', async () => {
    const mockShowsData = [
      { id: 's1', name: 'My Podcast', description: 'A great show' },
      { id: 's2', name: 'Another Show', description: null },
    ]

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ data: mockShowsData }),
    })

    const { result } = renderHook(() => useShows())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.shows).toEqual(mockShowsData)
    expect(result.current.total).toBe(2)
    expect(result.current.error).toBeNull()
  })

  it('handles non-array response gracefully', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ data: null }),
    })

    const { result } = renderHook(() => useShows())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.shows).toEqual([])
    expect(result.current.total).toBe(0)
  })

  it('handles result without data wrapper', async () => {
    const shows = [{ id: 's1', name: 'Show 1' }]
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(shows),
    })

    const { result } = renderHook(() => useShows())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    // When result.data is undefined, fallback is result itself
    expect(result.current.shows).toEqual(shows)
  })

  it('handles fetch error', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      statusText: 'Server Error',
    })

    const { result } = renderHook(() => useShows())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.error).toBe('Failed to fetch shows: Server Error')
  })

  it('createShow sends POST and refreshes list', async () => {
    // Initial fetch
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ data: [] }),
    })

    const { result } = renderHook(() => useShows())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    const newShow = { id: 's-new', name: 'New Show', description: 'Fresh' }

    // POST response
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ data: newShow }),
    })

    // Refetch response after create
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ data: [newShow] }),
    })

    let createdShow: unknown
    await act(async () => {
      createdShow = await result.current.createShow({ name: 'New Show', description: 'Fresh' })
    })

    expect(createdShow).toEqual(newShow)

    // Verify the POST call
    const postCall = mockFetch.mock.calls[1]
    expect(postCall[0]).toBe('/api/shows')
    expect(postCall[1]).toEqual(
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
    )
  })

  it('createShow throws and sets error on failure', async () => {
    // Initial fetch
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ data: [] }),
    })

    const { result } = renderHook(() => useShows())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    mockFetch.mockResolvedValueOnce({
      ok: false,
      statusText: 'Bad Request',
      json: () => Promise.resolve({}),
    })

    let thrown: unknown = null
    await act(async () => {
      try {
        await result.current.createShow({ name: '' })
      } catch (err) {
        thrown = err
      }
    })

    // Re-thrown so dialog/wizard callers can show the specific message
    expect(thrown).toBeInstanceOf(Error)
    expect(result.current.error).toBe('Failed to create show')
  })
})

// ─────────────────────────────────────────────────
// useEpisode
// ─────────────────────────────────────────────────

import useEpisode from '@/hooks/use-episode'

describe('useEpisode', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('starts with loading=true and null episode', () => {
    mockSupabaseSingle.mockResolvedValueOnce({ data: null, error: null })

    const { result } = renderHook(() => useEpisode('ep-1'))

    expect(result.current.isLoading).toBe(true)
    expect(result.current.episode).toBeNull()
    expect(result.current.error).toBeNull()
    expect(result.current.processingStep).toBeNull()
    expect(result.current.processingProgress).toBeNull()
  })

  it('fetches episode from supabase', async () => {
    const mockEpisode = {
      id: 'ep-1',
      title: 'Test Episode',
      status: 'completed',
      show_id: 'show-1',
    }

    mockSupabaseSingle.mockResolvedValueOnce({
      data: mockEpisode,
      error: null,
    })

    const { result } = renderHook(() => useEpisode('ep-1'))

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.episode).toEqual(mockEpisode)
    expect(result.current.error).toBeNull()
    expect(mockSupabaseFrom).toHaveBeenCalledWith('episodes')
    expect(mockSupabaseSelect).toHaveBeenCalledWith('*')
    expect(mockSupabaseEq).toHaveBeenCalledWith('id', 'ep-1')
  })

  it('handles supabase error', async () => {
    mockSupabaseSingle.mockResolvedValueOnce({
      data: null,
      error: new Error('DB error'),
    })

    const { result } = renderHook(() => useEpisode('ep-1'))

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.error).toBe('DB error')
    expect(result.current.episode).toBeNull()
  })

  it('does not fetch when id is empty', async () => {
    const { result } = renderHook(() => useEpisode(''))

    // Give it time to settle
    await act(async () => {
      await vi.advanceTimersByTimeAsync(100)
    })

    // Should never have called supabase
    expect(mockSupabaseFrom).not.toHaveBeenCalled()
    expect(result.current.isLoading).toBe(true) // stays true since fetch never runs
  })

  it('polls processing status when episode is processing', async () => {
    const processingEpisode = {
      id: 'ep-1',
      title: 'Test',
      status: 'processing',
      show_id: 'show-1',
    }

    // Initial supabase fetch
    mockSupabaseSingle.mockResolvedValueOnce({
      data: processingEpisode,
      error: null,
    })

    // First poll response
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          data: {
            status: 'processing',
            processingStep: 'transcribing',
            processingProgress: 45,
          },
        }),
    })

    const { result } = renderHook(() => useEpisode('ep-1'))

    await waitFor(() => {
      expect(result.current.episode?.status).toBe('processing')
    })

    // Wait for poll to execute
    await act(async () => {
      await vi.advanceTimersByTimeAsync(100)
    })

    await waitFor(() => {
      expect(result.current.processingStep).toBe('transcribing')
      expect(result.current.processingProgress).toBe(45)
    })
  })

  it('stops polling when episode completes', async () => {
    const processingEpisode = {
      id: 'ep-1',
      title: 'Test',
      status: 'processing',
      show_id: 'show-1',
    }

    // Initial supabase fetch returns processing
    mockSupabaseSingle.mockResolvedValueOnce({
      data: processingEpisode,
      error: null,
    })

    // Polling response: completed
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          data: {
            status: 'completed',
            processingStep: 'completed',
            processingProgress: 100,
          },
        }),
    })

    // Refetch after completion returns completed episode
    const completedEpisode = { ...processingEpisode, status: 'completed' }
    mockSupabaseSingle.mockResolvedValueOnce({
      data: completedEpisode,
      error: null,
    })

    const { result } = renderHook(() => useEpisode('ep-1'))

    // The flow: initial fetch (processing) -> poll fires -> gets completed status -> refetches episode
    // Just wait for the final state
    await waitFor(() => {
      expect(result.current.episode?.status).toBe('completed')
    })

    expect(result.current.error).toBeNull()
  })
})

// ─────────────────────────────────────────────────
// useEpisodeAssets
// ─────────────────────────────────────────────────

import useEpisodeAssets from '@/hooks/use-episode-assets'

describe('useEpisodeAssets', () => {
  it('starts with loading=true and empty assets', () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ data: { assets: [] } }),
    })

    const { result } = renderHook(() => useEpisodeAssets('ep-1'))

    expect(result.current.isLoading).toBe(true)
    expect(result.current.assets).toEqual([])
    expect(result.current.error).toBeNull()
  })

  it('fetches assets successfully', async () => {
    const mockAssets = [
      { id: 'a1', asset_type: 'show_notes', content: 'Show notes content' },
      { id: 'a2', asset_type: 'blog_post', content: 'Blog post content' },
    ]

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ data: { assets: mockAssets } }),
    })

    const { result } = renderHook(() => useEpisodeAssets('ep-1'))

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.assets).toEqual(mockAssets)
    expect(result.current.error).toBeNull()
    expect(mockFetch).toHaveBeenCalledWith('/api/episodes/ep-1/assets')
  })

  it('handles fetch error', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      statusText: 'Not Found',
    })

    const { result } = renderHook(() => useEpisodeAssets('ep-1'))

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.error).toBe('Failed to fetch assets')
    expect(result.current.assets).toEqual([])
  })

  it('handles missing data.assets gracefully', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ data: {} }),
    })

    const { result } = renderHook(() => useEpisodeAssets('ep-1'))

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.assets).toEqual([])
  })

  it('does not fetch when episodeId is empty', async () => {
    const { result } = renderHook(() => useEpisodeAssets(''))

    // Let it settle
    await act(async () => {
      await new Promise((r) => setTimeout(r, 50))
    })

    // fetch should not have been called for assets
    const assetCalls = mockFetch.mock.calls.filter(
      (c) => typeof c[0] === 'string' && c[0].includes('/assets')
    )
    expect(assetCalls).toHaveLength(0)
  })

  it('regenerateAsset sends POST and refetches', async () => {
    const mockAssets = [
      { id: 'a1', asset_type: 'show_notes', content: 'Old content' },
    ]

    // Initial fetch
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ data: { assets: mockAssets } }),
    })

    const { result } = renderHook(() => useEpisodeAssets('ep-1'))

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    const updatedAssets = [
      { id: 'a1', asset_type: 'show_notes', content: 'Regenerated content' },
    ]

    // POST response
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ data: { asset: updatedAssets[0] } }),
    })

    // Refetch after regenerate
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ data: { assets: updatedAssets } }),
    })

    await act(async () => {
      await result.current.regenerateAsset('show_notes')
    })

    // Verify POST was called with correct body
    const postCall = mockFetch.mock.calls.find(
      (c) => c[1]?.method === 'POST' && typeof c[0] === 'string' && c[0].includes('/assets')
    )
    expect(postCall).toBeDefined()
    expect(JSON.parse(postCall![1].body)).toEqual({
      assetType: 'show_notes',
      regenerate: true,
    })
  })

  it('regenerateAsset sets error on failure', async () => {
    // Initial fetch
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ data: { assets: [] } }),
    })

    const { result } = renderHook(() => useEpisodeAssets('ep-1'))

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    // POST failure
    mockFetch.mockResolvedValueOnce({
      ok: false,
      statusText: 'Error',
    })

    await act(async () => {
      await result.current.regenerateAsset('blog_post')
    })

    expect(result.current.error).toBe('Failed to regenerate asset')
  })
})

// ─────────────────────────────────────────────────
// useEpisodeSeo
// ─────────────────────────────────────────────────

import useEpisodeSeo from '@/hooks/use-episode-seo'

describe('useEpisodeSeo', () => {
  it('starts with loading=true and null seoData', () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ data: null }),
    })

    const { result } = renderHook(() => useEpisodeSeo('ep-1'))

    expect(result.current.isLoading).toBe(true)
    expect(result.current.seoData).toBeNull()
    expect(result.current.error).toBeNull()
  })

  it('fetches SEO data successfully', async () => {
    const mockSeoResult = {
      data: {
        episode: { seo_score: 85 },
        analysis: {
          keyword_density: { podcast: 0.05 },
          readability_score: 72,
          header_structure: true,
          suggestions: ['Add more keywords'],
          estimated_position: 3,
        },
        schema: { '@type': 'PodcastEpisode' },
      },
    }

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockSeoResult),
    })

    const { result } = renderHook(() => useEpisodeSeo('ep-1'))

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.seoData).toEqual({
      seo_score: 85,
      seo_analysis: {
        keyword_density: { podcast: 0.05 },
        readability_score: 72,
        header_structure: true,
        suggestions: ['Add more keywords'],
        estimated_position: 3,
      },
      schema_markup: { '@type': 'PodcastEpisode' },
    })
    expect(result.current.error).toBeNull()
    expect(mockFetch).toHaveBeenCalledWith('/api/episodes/ep-1/seo')
  })

  it('normalizes camelCase API format to flat SEOAnalysis', async () => {
    const mockSeoResult = {
      data: {
        episode: { seo_score: 70 },
        analysis: {
          keywordDensityMap: { ai: 0.03 },
          factors: {
            readability: { score: 60 },
            headerStructure: { score: 5 },
          },
          suggestions: [
            { title: 'Improve headers' },
            { text: 'Add keywords' },
            'Raw suggestion',
          ],
        },
        schema: null,
      },
    }

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockSeoResult),
    })

    const { result } = renderHook(() => useEpisodeSeo('ep-1'))

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.seoData?.seo_analysis).toEqual({
      keyword_density: { ai: 0.03 },
      readability_score: 60,
      header_structure: true, // score 5 > 0 => true
      suggestions: ['Improve headers', 'Add keywords', 'Raw suggestion'],
      estimated_position: null,
    })
  })

  it('sets seoData to null when result.data is missing', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({}),
    })

    const { result } = renderHook(() => useEpisodeSeo('ep-1'))

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.seoData).toBeNull()
  })

  it('handles fetch error', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      statusText: 'Error',
    })

    const { result } = renderHook(() => useEpisodeSeo('ep-1'))

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.error).toBe('Failed to fetch SEO data')
  })

  it('does not fetch when episodeId is empty', async () => {
    const { result } = renderHook(() => useEpisodeSeo(''))

    await act(async () => {
      await new Promise((r) => setTimeout(r, 50))
    })

    const seoCalls = mockFetch.mock.calls.filter(
      (c) => typeof c[0] === 'string' && c[0].includes('/seo')
    )
    expect(seoCalls).toHaveLength(0)
  })

  it('refetch function refetches SEO data', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          data: {
            episode: { seo_score: 50 },
            analysis: {
              keyword_density: {},
              readability_score: 40,
              header_structure: false,
              suggestions: [],
              estimated_position: null,
            },
            schema: null,
          },
        }),
    })

    const { result } = renderHook(() => useEpisodeSeo('ep-1'))

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.seoData?.seo_score).toBe(50)

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          data: {
            episode: { seo_score: 90 },
            analysis: {
              keyword_density: { new: 0.1 },
              readability_score: 80,
              header_structure: true,
              suggestions: [],
              estimated_position: 1,
            },
            schema: { '@type': 'Episode' },
          },
        }),
    })

    await act(async () => {
      await result.current.refetch()
    })

    await waitFor(() => {
      expect(result.current.seoData?.seo_score).toBe(90)
    })
  })
})
