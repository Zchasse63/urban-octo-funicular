'use client'

import { useState, useEffect, useCallback } from 'react'
import { extractErrorMessage } from '@/lib/errors'

interface UsageData {
  tier: string
  billingPeriod: { start: string; end: string }
  audioHours: { used: number; limit: number; percentage: number }
  shows: { used: number; limit: number; percentage: number }
}

interface UseUsageReturn {
  usage: UsageData | null
  isLoading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export function useUsage(): UseUsageReturn {
  const [usage, setUsage] = useState<UsageData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchUsage = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      const res = await fetch('/api/usage')
      const json = await res.json()
      if (!res.ok) {
        setError(json.error || 'Failed to fetch usage')
        return
      }
      setUsage(json.data)
    } catch (err) {
      setError(extractErrorMessage(err, 'Failed to fetch usage'))
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchUsage()
  }, [fetchUsage])

  return { usage, isLoading, error, refetch: fetchUsage }
}
