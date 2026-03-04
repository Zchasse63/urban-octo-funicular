/**
 * Unit tests for remaining data-fetching hooks:
 * - useExperts
 * - useVocabulary
 * - useSubscription
 * - useGuestPackage
 * - useAuth
 * - useUsage
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'

// ─────────────────────────────────────────────────
// Global mocks
// ─────────────────────────────────────────────────

const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

// Mock next/navigation
const mockPush = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}))

// Mock supabase client
const mockGetUser = vi.fn()
const mockOnAuthStateChange = vi.fn()
const mockSignOut = vi.fn()

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    from: vi.fn(),
    auth: {
      getUser: mockGetUser,
      onAuthStateChange: mockOnAuthStateChange,
      signOut: mockSignOut,
    },
  }),
}))

// Preserve original location for restoration
const originalLocation = window.location

beforeEach(() => {
  mockFetch.mockReset()
  mockGetUser.mockReset()
  mockOnAuthStateChange.mockReset()
  mockSignOut.mockReset()

  // Default supabase auth mocks
  mockGetUser.mockResolvedValue({ data: { user: null } })
  mockOnAuthStateChange.mockReturnValue({
    data: { subscription: { unsubscribe: vi.fn() } },
  })
  mockSignOut.mockResolvedValue({ error: null })
})

// ─────────────────────────────────────────────────
// useExperts
// ─────────────────────────────────────────────────

import useExperts from '@/hooks/use-experts'

describe('useExperts', () => {
  it('starts with empty state and isLoading=false', () => {
    const { result } = renderHook(() => useExperts({ showId: 'show-1' }))

    expect(result.current.experts).toEqual([])
    expect(result.current.topic).toBe('')
    expect(result.current.isLoading).toBe(false)
    expect(result.current.error).toBeNull()
  })

  it('does not search without showId', async () => {
    const { result } = renderHook(() => useExperts())

    await act(async () => {
      await result.current.search('AI')
    })

    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('does not search with empty topic', async () => {
    const { result } = renderHook(() => useExperts({ showId: 'show-1' }))

    await act(async () => {
      await result.current.search('   ')
    })

    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('searches for experts successfully', async () => {
    const mockExperts = [
      {
        id: 'e1',
        name: 'Dr. Smith',
        category: 'fresh',
        freshnessScore: 0.9,
        expertise: ['AI'],
        appearanceCount: 2,
        recentAppearances: 1,
        contactHints: {},
        metadata: {},
      },
    ]

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ experts: mockExperts }),
    })

    const { result } = renderHook(() => useExperts({ showId: 'show-1' }))

    await act(async () => {
      await result.current.search('artificial intelligence')
    })

    expect(result.current.experts).toEqual(mockExperts)
    expect(result.current.topic).toBe('artificial intelligence')
    expect(result.current.isLoading).toBe(false)
    expect(result.current.error).toBeNull()

    const calledUrl = mockFetch.mock.calls[0][0] as string
    expect(calledUrl).toContain('/api/shows/show-1/experts')
    expect(calledUrl).toContain('topic=artificial+intelligence')
  })

  it('handles rate limit (429) error', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 429,
      statusText: 'Too Many Requests',
    })

    const { result } = renderHook(() => useExperts({ showId: 'show-1' }))

    await act(async () => {
      await result.current.search('AI')
    })

    expect(result.current.error).toBe(
      'Rate limit exceeded. Please wait a moment and try again.'
    )
    expect(result.current.experts).toEqual([])
  })

  it('handles general fetch error', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    })

    const { result } = renderHook(() => useExperts({ showId: 'show-1' }))

    await act(async () => {
      await result.current.search('AI')
    })

    expect(result.current.error).toBe(
      'Failed to search experts: Internal Server Error'
    )
    expect(result.current.experts).toEqual([])
  })

  it('handles network failure', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'))

    const { result } = renderHook(() => useExperts({ showId: 'show-1' }))

    await act(async () => {
      await result.current.search('AI')
    })

    expect(result.current.error).toBe('Network error')
    expect(result.current.experts).toEqual([])
  })

  it('handles empty experts array in response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ experts: [] }),
    })

    const { result } = renderHook(() => useExperts({ showId: 'show-1' }))

    await act(async () => {
      await result.current.search('Obscure topic')
    })

    expect(result.current.experts).toEqual([])
  })

  it('handles missing experts key in response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({}),
    })

    const { result } = renderHook(() => useExperts({ showId: 'show-1' }))

    await act(async () => {
      await result.current.search('AI')
    })

    expect(result.current.experts).toEqual([])
  })
})

// ─────────────────────────────────────────────────
// useVocabulary
// ─────────────────────────────────────────────────

import useVocabulary from '@/hooks/use-vocabulary'

describe('useVocabulary', () => {
  it('starts with empty terms and isLoading=false without showId', () => {
    const { result } = renderHook(() => useVocabulary())

    expect(result.current.terms).toEqual([])
    expect(result.current.isLoading).toBe(false)
    expect(result.current.error).toBeNull()
  })

  it('fetches vocabulary when showId provided', async () => {
    const mockTerms = [
      { id: 't1', show_id: 's1', term: 'Kubernetes', alternatives: ['K8s'], occurrence_count: 5 },
      { id: 't2', show_id: 's1', term: 'TypeScript', alternatives: ['TS'], occurrence_count: 3 },
    ]

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ data: mockTerms }),
    })

    const { result } = renderHook(() => useVocabulary({ showId: 'show-1' }))

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.terms).toEqual(mockTerms)
    expect(result.current.error).toBeNull()
    expect(mockFetch).toHaveBeenCalledWith('/api/shows/show-1/vocabulary')
  })

  it('does not fetch without showId', async () => {
    renderHook(() => useVocabulary())

    await act(async () => {
      await new Promise((r) => setTimeout(r, 50))
    })

    const vocabCalls = mockFetch.mock.calls.filter(
      (c) => typeof c[0] === 'string' && c[0].includes('/vocabulary')
    )
    expect(vocabCalls).toHaveLength(0)
  })

  it('handles fetch error', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      statusText: 'Error',
    })

    const { result } = renderHook(() => useVocabulary({ showId: 'show-1' }))

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.error).toBe('Failed to fetch vocabulary')
  })

  it('addTerm sends POST and prepends to terms', async () => {
    // Initial fetch
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ data: [] }),
    })

    const { result } = renderHook(() => useVocabulary({ showId: 'show-1' }))

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    const newTerm = {
      id: 't-new',
      show_id: 'show-1',
      term: 'GraphQL',
      alternatives: ['GQL'],
      occurrence_count: 0,
    }

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ data: newTerm }),
    })

    let addedTerm: unknown
    await act(async () => {
      addedTerm = await result.current.addTerm('GraphQL', ['GQL'])
    })

    expect(addedTerm).toEqual(newTerm)
    expect(result.current.terms).toHaveLength(1)
    expect(result.current.terms[0]).toEqual(newTerm)

    // Verify POST
    const postCall = mockFetch.mock.calls.find((c) => c[1]?.method === 'POST')
    expect(postCall).toBeDefined()
    expect(postCall![0]).toBe('/api/shows/show-1/vocabulary')
    expect(JSON.parse(postCall![1].body)).toEqual({
      term: 'GraphQL',
      alternatives: ['GQL'],
    })
  })

  it('addTerm returns null without showId', async () => {
    const { result } = renderHook(() => useVocabulary())

    let addedTerm: unknown
    await act(async () => {
      addedTerm = await result.current.addTerm('Test')
    })

    expect(addedTerm).toBeNull()
  })

  it('addTerm throws on failure', async () => {
    // Initial fetch
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ data: [] }),
    })

    const { result } = renderHook(() => useVocabulary({ showId: 'show-1' }))

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    mockFetch.mockResolvedValueOnce({
      ok: false,
      statusText: 'Error',
    })

    await expect(
      act(async () => {
        await result.current.addTerm('Bad Term')
      })
    ).rejects.toThrow('Failed to add term')
  })

  it('deleteTerm sends DELETE and removes from state', async () => {
    const mockTerms = [
      { id: 't1', show_id: 's1', term: 'React', alternatives: [], occurrence_count: 2 },
      { id: 't2', show_id: 's1', term: 'Vue', alternatives: [], occurrence_count: 1 },
    ]

    // Initial fetch
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ data: mockTerms }),
    })

    const { result } = renderHook(() => useVocabulary({ showId: 'show-1' }))

    await waitFor(() => {
      expect(result.current.terms).toHaveLength(2)
    })

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    })

    let deleted: boolean | undefined
    await act(async () => {
      deleted = await result.current.deleteTerm('t1')
    })

    expect(deleted).toBe(true)
    expect(result.current.terms).toHaveLength(1)
    expect(result.current.terms[0].id).toBe('t2')

    // Verify DELETE call
    const deleteCall = mockFetch.mock.calls.find((c) => c[1]?.method === 'DELETE')
    expect(deleteCall![0]).toBe('/api/shows/show-1/vocabulary?term_id=t1')
  })

  it('deleteTerm returns false without showId', async () => {
    const { result } = renderHook(() => useVocabulary())

    let deleted: boolean | undefined
    await act(async () => {
      deleted = await result.current.deleteTerm('t1')
    })

    expect(deleted).toBe(false)
  })

  it('deleteTerm throws on failure', async () => {
    // Initial fetch
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ data: [] }),
    })

    const { result } = renderHook(() => useVocabulary({ showId: 'show-1' }))

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    mockFetch.mockResolvedValueOnce({
      ok: false,
      statusText: 'Error',
    })

    await expect(
      act(async () => {
        await result.current.deleteTerm('t1')
      })
    ).rejects.toThrow('Failed to delete term')
  })
})

// ─────────────────────────────────────────────────
// useSubscription
// ─────────────────────────────────────────────────

import useSubscription from '@/hooks/use-subscription'

describe('useSubscription', () => {
  it('starts with loading=true and null subscription', () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ status: 'active', tier: 'free' }),
    })

    const { result } = renderHook(() => useSubscription())

    expect(result.current.isLoading).toBe(true)
    expect(result.current.subscription).toBeNull()
    expect(result.current.error).toBeNull()
  })

  it('fetches subscription data successfully', async () => {
    const mockSub = {
      id: 'sub-1',
      status: 'active',
      tier: 'pro' as const,
      stripe_subscription_id: 'stripe_sub_123',
      current_period_end: '2025-12-01',
    }

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockSub),
    })

    const { result } = renderHook(() => useSubscription())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.subscription).toEqual(mockSub)
    expect(result.current.error).toBeNull()
    expect(mockFetch).toHaveBeenCalledWith('/api/subscriptions')
  })

  it('handles fetch error', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      statusText: 'Error',
    })

    const { result } = renderHook(() => useSubscription())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.error).toBe('Failed to fetch subscription')
  })

  it('checkout sends POST and redirects', async () => {
    // Initial fetch
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ status: null, tier: 'free' }),
    })

    const { result } = renderHook(() => useSubscription())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    // Mock location.href setter
    const hrefSetter = vi.fn()
    Object.defineProperty(window, 'location', {
      value: { ...originalLocation, href: '' },
      writable: true,
      configurable: true,
    })
    Object.defineProperty(window.location, 'href', {
      set: hrefSetter,
      get: () => '',
      configurable: true,
    })

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({ url: 'https://checkout.stripe.com/session_123' }),
    })

    await act(async () => {
      await result.current.checkout('pro')
    })

    // Verify POST body
    const postCall = mockFetch.mock.calls.find(
      (c) => typeof c[0] === 'string' && c[0].includes('/stripe/checkout')
    )
    expect(postCall).toBeDefined()
    expect(JSON.parse(postCall![1].body)).toEqual({ tier: 'pro' })
    expect(hrefSetter).toHaveBeenCalledWith('https://checkout.stripe.com/session_123')

    // Restore
    Object.defineProperty(window, 'location', {
      value: originalLocation,
      writable: true,
      configurable: true,
    })
  })

  it('checkout sets error on failure', async () => {
    // Initial fetch
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ status: null, tier: 'free' }),
    })

    const { result } = renderHook(() => useSubscription())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    mockFetch.mockResolvedValueOnce({
      ok: false,
      statusText: 'Error',
    })

    await act(async () => {
      await result.current.checkout('agency')
    })

    expect(result.current.error).toBe('Failed to create checkout session')
  })

  it('openPortal sends POST and redirects', async () => {
    // Initial fetch
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ status: 'active', tier: 'pro' }),
    })

    const { result } = renderHook(() => useSubscription())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    const hrefSetter = vi.fn()
    Object.defineProperty(window, 'location', {
      value: { ...originalLocation, href: '' },
      writable: true,
      configurable: true,
    })
    Object.defineProperty(window.location, 'href', {
      set: hrefSetter,
      get: () => '',
      configurable: true,
    })

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({ url: 'https://billing.stripe.com/portal_123' }),
    })

    await act(async () => {
      await result.current.openPortal()
    })

    const portalCall = mockFetch.mock.calls.find(
      (c) => typeof c[0] === 'string' && c[0].includes('/stripe/portal')
    )
    expect(portalCall).toBeDefined()
    expect(portalCall![1].method).toBe('POST')
    expect(hrefSetter).toHaveBeenCalledWith('https://billing.stripe.com/portal_123')

    // Restore
    Object.defineProperty(window, 'location', {
      value: originalLocation,
      writable: true,
      configurable: true,
    })
  })

  it('openPortal sets error on failure', async () => {
    // Initial fetch
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ status: 'active', tier: 'pro' }),
    })

    const { result } = renderHook(() => useSubscription())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    mockFetch.mockResolvedValueOnce({
      ok: false,
      statusText: 'Error',
    })

    await act(async () => {
      await result.current.openPortal()
    })

    expect(result.current.error).toBe('Failed to open billing portal')
  })
})

// ─────────────────────────────────────────────────
// useGuestPackage
// ─────────────────────────────────────────────────

import useGuestPackage from '@/hooks/use-guest-package'

describe('useGuestPackage', () => {
  it('starts with loading=true and null package', () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ data: null }),
    })

    const { result } = renderHook(() => useGuestPackage('ep-1'))

    expect(result.current.isLoading).toBe(true)
    expect(result.current.guestPackage).toBeNull()
    expect(result.current.isSending).toBe(false)
    expect(result.current.error).toBeNull()
  })

  it('fetches guest package successfully', async () => {
    const mockPackage = {
      episode: { id: 'ep-1', title: 'Test' },
      show: { id: 's1', name: 'Show' },
      package: {
        socialPosts: [
          { platform: 'twitter', content: 'Check out...', characterCount: 15, maxCharacters: 280 },
        ],
        quoteCards: [{ quote: 'Great quote', attribution: 'Guest' }],
        emailSubject: 'Your episode is live!',
        emailBody: 'Hello...',
      },
    }

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ data: mockPackage }),
    })

    const { result } = renderHook(() => useGuestPackage('ep-1'))

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.guestPackage).toEqual(mockPackage)
    expect(result.current.error).toBeNull()
    expect(mockFetch).toHaveBeenCalledWith('/api/episodes/ep-1/guest-package')
  })

  it('returns null data on 400 (episode not completed)', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      statusText: 'Bad Request',
    })

    const { result } = renderHook(() => useGuestPackage('ep-1'))

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.guestPackage).toBeNull()
    expect(result.current.error).toBeNull()
  })

  it('handles fetch error (non-400)', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Server Error',
    })

    const { result } = renderHook(() => useGuestPackage('ep-1'))

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.error).toBe('Failed to fetch guest package')
  })

  it('does not fetch with empty episodeId', async () => {
    const { result } = renderHook(() => useGuestPackage(''))

    await act(async () => {
      await new Promise((r) => setTimeout(r, 50))
    })

    const guestCalls = mockFetch.mock.calls.filter(
      (c) => typeof c[0] === 'string' && c[0].includes('/guest-package')
    )
    expect(guestCalls).toHaveLength(0)
    // isLoading stays true since fetch never executed
    expect(result.current.isLoading).toBe(true)
  })

  it('sendEmail sends POST and returns true on success', async () => {
    // Initial fetch
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ data: { episode: {}, show: {}, package: {} } }),
    })

    const { result } = renderHook(() => useGuestPackage('ep-1'))

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    })

    let sent: boolean | undefined
    await act(async () => {
      sent = await result.current.sendEmail('guest@example.com', 'Custom note')
    })

    expect(sent).toBe(true)
    expect(result.current.isSending).toBe(false)

    const postCall = mockFetch.mock.calls.find(
      (c) => c[1]?.method === 'POST' && typeof c[0] === 'string' && c[0].includes('/guest-package')
    )
    expect(postCall).toBeDefined()
    expect(JSON.parse(postCall![1].body)).toEqual({
      guestEmail: 'guest@example.com',
      customMessage: 'Custom note',
    })
  })

  it('sendEmail returns false on error', async () => {
    // Initial fetch
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ data: null }),
    })

    const { result } = renderHook(() => useGuestPackage('ep-1'))

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ error: 'Invalid email' }),
    })

    let sent: boolean | undefined
    await act(async () => {
      sent = await result.current.sendEmail('bad-email')
    })

    expect(sent).toBe(false)
    expect(result.current.error).toBe('Invalid email')
    expect(result.current.isSending).toBe(false)
  })

  it('sendEmail returns false with empty episodeId', async () => {
    // Don't need initial fetch for empty episodeId test
    const { result } = renderHook(() => useGuestPackage(''))

    let sent: boolean | undefined
    await act(async () => {
      sent = await result.current.sendEmail('guest@example.com')
    })

    expect(sent).toBe(false)
  })
})

// ─────────────────────────────────────────────────
// useAuth
// ─────────────────────────────────────────────────

import { useAuth } from '@/hooks/use-auth'

describe('useAuth', () => {
  it('starts with isLoading=true and null user', () => {
    mockGetUser.mockReturnValue(new Promise(() => {})) // Never resolves

    const { result } = renderHook(() => useAuth())

    expect(result.current.isLoading).toBe(true)
    expect(result.current.user).toBeNull()
  })

  it('loads user from getUser', async () => {
    const mockUser = { id: 'user-1', email: 'test@example.com' }
    mockGetUser.mockResolvedValueOnce({ data: { user: mockUser } })

    const { result } = renderHook(() => useAuth())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.user).toEqual(mockUser)
  })

  it('loads null user when not authenticated', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null } })

    const { result } = renderHook(() => useAuth())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.user).toBeNull()
  })

  it('listens for auth state changes', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null } })

    let authChangeCallback: (event: string, session: unknown) => void = () => {}
    mockOnAuthStateChange.mockImplementation((cb: (event: string, session: unknown) => void) => {
      authChangeCallback = cb
      return { data: { subscription: { unsubscribe: vi.fn() } } }
    })

    const { result } = renderHook(() => useAuth())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.user).toBeNull()

    // Simulate auth state change
    const newUser = { id: 'user-2', email: 'new@example.com' }
    act(() => {
      authChangeCallback('SIGNED_IN', { user: newUser })
    })

    expect(result.current.user).toEqual(newUser)
  })

  it('sets user to null on sign out event', async () => {
    const mockUser = { id: 'user-1', email: 'test@example.com' }
    mockGetUser.mockResolvedValueOnce({ data: { user: mockUser } })

    let authChangeCallback: (event: string, session: unknown) => void = () => {}
    mockOnAuthStateChange.mockImplementation((cb: (event: string, session: unknown) => void) => {
      authChangeCallback = cb
      return { data: { subscription: { unsubscribe: vi.fn() } } }
    })

    const { result } = renderHook(() => useAuth())

    await waitFor(() => {
      expect(result.current.user).toEqual(mockUser)
    })

    act(() => {
      authChangeCallback('SIGNED_OUT', null)
    })

    expect(result.current.user).toBeNull()
  })

  it('unsubscribes on unmount', async () => {
    const unsubscribe = vi.fn()
    mockGetUser.mockResolvedValueOnce({ data: { user: null } })
    mockOnAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe } },
    })

    const { unmount } = renderHook(() => useAuth())

    await waitFor(() => {
      expect(mockOnAuthStateChange).toHaveBeenCalled()
    })

    unmount()

    expect(unsubscribe).toHaveBeenCalled()
  })

  it('signOut calls supabase signOut and redirects', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: { id: 'user-1' } } })

    const hrefSetter = vi.fn()
    Object.defineProperty(window, 'location', {
      value: { ...originalLocation, href: '' },
      writable: true,
      configurable: true,
    })
    Object.defineProperty(window.location, 'href', {
      set: hrefSetter,
      get: () => '',
      configurable: true,
    })

    const { result } = renderHook(() => useAuth())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    await act(async () => {
      await result.current.signOut()
    })

    expect(mockSignOut).toHaveBeenCalled()
    expect(hrefSetter).toHaveBeenCalledWith('/login')

    // Restore
    Object.defineProperty(window, 'location', {
      value: originalLocation,
      writable: true,
      configurable: true,
    })
  })
})

// ─────────────────────────────────────────────────
// useUsage
// ─────────────────────────────────────────────────

import { useUsage } from '@/hooks/use-usage'

describe('useUsage', () => {
  it('starts with loading=true and null usage', () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          data: {
            tier: 'free',
            billingPeriod: { start: '2025-01-01', end: '2025-02-01' },
            audioHours: { used: 0, limit: 1, percentage: 0 },
            shows: { used: 0, limit: 1, percentage: 0 },
          },
        }),
    })

    const { result } = renderHook(() => useUsage())

    expect(result.current.isLoading).toBe(true)
    expect(result.current.usage).toBeNull()
    expect(result.current.error).toBeNull()
  })

  it('fetches usage data successfully', async () => {
    const mockUsage = {
      tier: 'pro',
      billingPeriod: { start: '2025-01-01', end: '2025-02-01' },
      audioHours: { used: 4, limit: 10, percentage: 40 },
      shows: { used: 2, limit: 5, percentage: 40 },
    }

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ data: mockUsage }),
    })

    const { result } = renderHook(() => useUsage())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.usage).toEqual(mockUsage)
    expect(result.current.error).toBeNull()
    expect(mockFetch).toHaveBeenCalledWith('/api/usage')
  })

  it('handles error from API response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ error: 'Unauthorized' }),
    })

    const { result } = renderHook(() => useUsage())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.error).toBe('Unauthorized')
    expect(result.current.usage).toBeNull()
  })

  it('handles error with fallback message', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({}),
    })

    const { result } = renderHook(() => useUsage())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.error).toBe('Failed to fetch usage')
  })

  it('handles network error', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network failed'))

    const { result } = renderHook(() => useUsage())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.error).toBe('Network failed')
  })

  it('refetch function re-fetches usage data', async () => {
    const initialUsage = {
      tier: 'free',
      billingPeriod: { start: '2025-01-01', end: '2025-02-01' },
      audioHours: { used: 0.5, limit: 1, percentage: 50 },
      shows: { used: 1, limit: 1, percentage: 100 },
    }

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ data: initialUsage }),
    })

    const { result } = renderHook(() => useUsage())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.usage?.audioHours.used).toBe(0.5)

    const updatedUsage = {
      ...initialUsage,
      audioHours: { used: 0.8, limit: 1, percentage: 80 },
    }

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ data: updatedUsage }),
    })

    await act(async () => {
      await result.current.refetch()
    })

    await waitFor(() => {
      expect(result.current.usage?.audioHours.used).toBe(0.8)
    })
  })
})
