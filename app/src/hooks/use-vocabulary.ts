"use client"

import { useState, useEffect, useCallback } from 'react'
import { extractErrorMessage } from '@/lib/errors'
import type { VocabularyTerm } from '@/types/database'

interface UseVocabularyOptions {
  showId?: string
}

interface UseVocabularyResult {
  terms: VocabularyTerm[]
  isLoading: boolean
  error: string | null
  refetch: () => void
  addTerm: (term: string, alternatives?: string[]) => Promise<VocabularyTerm | null>
  deleteTerm: (termId: string) => Promise<boolean>
}

// ─── Cross-instance sync ─────────────────────────────────────────────────────
// Multiple components (e.g. Sidebar + Vocabulary page) can mount this hook
// independently. When one mutates, broadcast a custom event so the other
// instances refetch and stay consistent.
const VOCAB_CHANGE_EVENT = 'podbrain:vocabulary-changed'

function broadcastVocabularyChange(showId: string) {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent(VOCAB_CHANGE_EVENT, { detail: { showId } }))
}

export default function useVocabulary(
  options: UseVocabularyOptions = {}
): UseVocabularyResult {
  const { showId } = options
  const [terms, setTerms] = useState<VocabularyTerm[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchTerms = useCallback(async () => {
    if (!showId) return
    try {
      setIsLoading(true)
      setError(null)
      const res = await fetch(`/api/shows/${showId}/vocabulary`)
      if (!res.ok) throw new Error('Failed to fetch vocabulary')
      const result = await res.json()
      setTerms(result.data || [])
    } catch (err) {
      setError(extractErrorMessage(err, 'Failed to fetch vocabulary'))
    } finally {
      setIsLoading(false)
    }
  }, [showId])

  useEffect(() => {
    fetchTerms()
  }, [fetchTerms])

  // Listen for cross-instance changes and refetch
  useEffect(() => {
    if (!showId) return
    const handler = (event: Event) => {
      const customEvent = event as CustomEvent<{ showId: string }>
      if (customEvent.detail?.showId === showId) {
        fetchTerms()
      }
    }
    window.addEventListener(VOCAB_CHANGE_EVENT, handler)
    return () => window.removeEventListener(VOCAB_CHANGE_EVENT, handler)
  }, [showId, fetchTerms])

  const addTerm = useCallback(async (term: string, alternatives: string[] = []): Promise<VocabularyTerm | null> => {
    if (!showId) return null
    const res = await fetch(`/api/shows/${showId}/vocabulary`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ term, alternatives }),
    })
    if (!res.ok) throw new Error('Failed to add term')
    const result = await res.json()
    if (result.data) {
      setTerms(prev => [result.data, ...prev])
      broadcastVocabularyChange(showId)
    }
    return result.data
  }, [showId])

  const deleteTerm = useCallback(async (termId: string): Promise<boolean> => {
    if (!showId) return false
    const res = await fetch(`/api/shows/${showId}/vocabulary?term_id=${termId}`, {
      method: 'DELETE',
    })
    if (!res.ok) throw new Error('Failed to delete term')
    setTerms(prev => prev.filter(t => t.id !== termId))
    broadcastVocabularyChange(showId)
    return true
  }, [showId])

  return { terms, isLoading, error, refetch: fetchTerms, addTerm, deleteTerm }
}
