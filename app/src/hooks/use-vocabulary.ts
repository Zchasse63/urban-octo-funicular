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
    return true
  }, [showId])

  return { terms, isLoading, error, refetch: fetchTerms, addTerm, deleteTerm }
}
