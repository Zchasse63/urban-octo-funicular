import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import {
  getUserTier,
  getTierLimits,
  getEpisodeCount,
  getShowCount,
  getBillingPeriod,
} from '@/lib/tier-limits'
import type { ApiResponse } from '@/types/database'

interface UsageData {
  tier: string
  billingPeriod: {
    start: string
    end: string
  }
  episodes: {
    used: number
    limit: number
    percentage: number
  }
  shows: {
    used: number
    limit: number
    percentage: number
  }
}

export async function GET() {
  try {
    const { userId } = await requireAuth()

    const [tier, episodeCount, showCount, billingPeriod] = await Promise.all([
      getUserTier(userId),
      getEpisodeCount(userId),
      getShowCount(userId),
      getBillingPeriod(userId),
    ])

    const limits = getTierLimits(tier)

    const usage: UsageData = {
      tier,
      billingPeriod: {
        start: billingPeriod.start.toISOString(),
        end: billingPeriod.end.toISOString(),
      },
      episodes: {
        used: episodeCount,
        limit: limits.episodesPerMonth,
        percentage: Math.round((episodeCount / limits.episodesPerMonth) * 100),
      },
      shows: {
        used: showCount,
        limit: limits.maxShows,
        percentage: Math.round((showCount / limits.maxShows) * 100),
      },
    }

    return NextResponse.json<ApiResponse<UsageData>>({
      data: usage,
      error: null,
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: 'Unauthorized' },
        { status: 401 }
      )
    }
    console.error('Error fetching usage:', error)
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
