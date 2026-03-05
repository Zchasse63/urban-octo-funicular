import { requireAuth } from '@/lib/auth'
import { successResponse, handleApiError } from '@/lib/api/helpers'
import {
  getUserTier,
  getTierLimits,
  getAudioHoursUsed,
  getShowCount,
  getBillingPeriod,
} from '@/lib/tier-limits'

interface UsageData {
  tier: string
  billingPeriod: {
    start: string
    end: string
  }
  audioHours: {
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

    const [tier, audioHoursUsed, showCount, billingPeriod] = await Promise.all([
      getUserTier(userId),
      getAudioHoursUsed(userId),
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
      audioHours: {
        used: audioHoursUsed,
        limit: limits.audioHoursPerMonth,
        percentage: Math.round((audioHoursUsed / limits.audioHoursPerMonth) * 100),
      },
      shows: {
        used: showCount,
        limit: limits.maxShows,
        percentage: Math.round((showCount / limits.maxShows) * 100),
      },
    }

    return successResponse(usage)
  } catch (error) {
    return handleApiError(error, 'fetching usage')
  }
}
