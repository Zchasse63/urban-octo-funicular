"use client"

import { useState, useCallback } from 'react'
import type { TaddyPodcast, TaddyEpisode } from '@/lib/taddy/types'

type SearchType = 'PODCASTSERIES' | 'PODCASTEPISODE'

interface PodcastSearchState {
  query: string
  type: SearchType
  page: number
  results: TaddyPodcast[] | TaddyEpisode[]
  resultCount: number
  isLoading: boolean
  error: string | null
  hasSearched: boolean
}

interface UsePodcastSearchReturn extends PodcastSearchState {
  setQuery: (query: string) => void
  setType: (type: SearchType) => void
  search: (term?: string, searchType?: SearchType) => Promise<void>
  nextPage: () => void
  prevPage: () => void
  reset: () => void
}

export default function usePodcastSearch(): UsePodcastSearchReturn {
  const [state, setState] = useState<PodcastSearchState>({
    query: '',
    type: 'PODCASTSERIES',
    page: 1,
    results: [],
    resultCount: 0,
    isLoading: false,
    error: null,
    hasSearched: false,
  })

  const fetchResults = useCallback(
    async (term: string, type: SearchType, page: number) => {
      if (!term.trim()) return

      setState((prev) => ({ ...prev, isLoading: true, error: null }))

      try {
        const params = new URLSearchParams({
          term: term.trim(),
          type,
          page: String(page),
        })

        const response = await fetch(`/api/taddy/search?${params}`)

        if (!response.ok) {
          const data = await response.json().catch(() => ({}))
          throw new Error(data.error || `Search failed (${response.status})`)
        }

        const data = await response.json()

        const results =
          type === 'PODCASTSERIES'
            ? (data.podcasts as TaddyPodcast[]) || []
            : (data.episodes as TaddyEpisode[]) || []

        setState((prev) => ({
          ...prev,
          results,
          resultCount: data.count || results.length,
          page,
          isLoading: false,
          hasSearched: true,
        }))
      } catch (err) {
        setState((prev) => ({
          ...prev,
          results: [],
          resultCount: 0,
          isLoading: false,
          error: err instanceof Error ? err.message : 'Search failed',
          hasSearched: true,
        }))
      }
    },
    []
  )

  const search = useCallback(
    async (term?: string, searchType?: SearchType) => {
      const finalTerm = term ?? state.query
      const finalType = searchType ?? state.type

      setState((prev) => ({
        ...prev,
        query: finalTerm,
        type: finalType,
        page: 1,
      }))

      await fetchResults(finalTerm, finalType, 1)
    },
    [state.query, state.type, fetchResults]
  )

  const setQuery = useCallback((query: string) => {
    setState((prev) => ({ ...prev, query }))
  }, [])

  const setType = useCallback(
    (type: SearchType) => {
      setState((prev) => ({ ...prev, type, page: 1, results: [], hasSearched: false }))
    },
    []
  )

  const nextPage = useCallback(() => {
    const next = state.page + 1
    setState((prev) => ({ ...prev, page: next }))
    fetchResults(state.query, state.type, next)
  }, [state.page, state.query, state.type, fetchResults])

  const prevPage = useCallback(() => {
    if (state.page <= 1) return
    const prev = state.page - 1
    setState((s) => ({ ...s, page: prev }))
    fetchResults(state.query, state.type, prev)
  }, [state.page, state.query, state.type, fetchResults])

  const reset = useCallback(() => {
    setState({
      query: '',
      type: 'PODCASTSERIES',
      page: 1,
      results: [],
      resultCount: 0,
      isLoading: false,
      error: null,
      hasSearched: false,
    })
  }, [])

  return {
    ...state,
    setQuery,
    setType,
    search,
    nextPage,
    prevPage,
    reset,
  }
}
