import { requireAuth } from '@/lib/auth'
import { successResponse, handleApiError } from '@/lib/api/helpers'
import {
  getUserTier,
  getTierLimits,
  getAudioMinutesUsed,
  getShowCount,
  getBillingPeriod,
  type SubscriptionTier,
  type SubscriptionStatus,
} from '@/lib/tier-limits'
import { getUsagePercentage } from '@/lib/pricing'

interface UsageData {
  tier: SubscriptionTier
  status: SubscriptionStatus
  trialEndsAt: string
  pastDueSince: string | null
  billingPeriod: {
    start: string
    end: string
  }
  audioMinutes: {
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

    const [userTierState, audioMinutesUsed, showCount, billingPeriod] = await Promise.all([
      getUserTier(userId),
      getAudioMinutesUsed(userId),
      getShowCount(userId),
      getBillingPeriod(userId),
    ])

    const limits = getTierLimits(userTierState.tier)

    const usage: UsageData = {
      tier: userTierState.tier,
      status: userTierState.status,
      trialEndsAt: userTierState.trialEndsAt.toISOString(),
      pastDueSince: userTierState.pastDueSince?.toISOString() ?? null,
      billingPeriod: {
        start: billingPeriod.start.toISOString(),
        end: billingPeriod.end.toISOString(),
      },
      audioMinutes: {
        used: audioMinutesUsed,
        limit: limits.audioMinutesPerMonth,
        percentage: getUsagePercentage(audioMinutesUsed, limits.audioMinutesPerMonth),
      },
      shows: {
        used: showCount,
        limit: limits.maxShows,
        percentage: getUsagePercentage(showCount, limits.maxShows),
      },
    }

    return successResponse(usage)
  } catch (error) {
    return handleApiError(error, 'fetching usage')
  }
}
