import { createClient } from './supabase/server'

export interface TierLimits {
  audioHoursPerMonth: number
  maxShows: number
  teamSeats: number
  features: {
    advancedAssets: boolean
  }
}

const TIER_LIMITS: Record<string, TierLimits> = {
  free: {
    audioHoursPerMonth: 1,
    maxShows: 1,
    teamSeats: 1,
    features: {
      advancedAssets: false,
    },
  },
  pro: {
    audioHoursPerMonth: 10,
    maxShows: 3,
    teamSeats: 1,
    features: {
      advancedAssets: true,
    },
  },
  creator: {
    audioHoursPerMonth: 25,
    maxShows: 10,
    teamSeats: 3,
    features: {
      advancedAssets: true,
    },
  },
  agency: {
    audioHoursPerMonth: 100,
    maxShows: 999,
    teamSeats: 10,
    features: {
      advancedAssets: true,
    },
  },
}

export function getTierLimits(tier: string): TierLimits {
  return TIER_LIMITS[tier] || TIER_LIMITS.free
}

/**
 * Core asset types available on ALL tiers (including free).
 * Everything not listed here requires the `advancedAssets` feature flag.
 */
export const CORE_ASSET_TYPES = new Set([
  'show_notes',
  'episode_titles',
  'key_takeaways',
  'chapter_markers',
  'transcript_summary',
  'seo_description',
])

/**
 * Check if a user's tier allows generating a specific asset type.
 * Core assets are available to all tiers. Advanced assets require a paid plan.
 */
export function canGenerateAssetType(tier: string, assetType: string): boolean {
  if (CORE_ASSET_TYPES.has(assetType)) return true
  const limits = getTierLimits(tier)
  return limits.features.advancedAssets
}

/**
 * Get the user's current tier from the database
 */
export async function getUserTier(userId: string): Promise<string> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('users')
    .select('subscription_tier')
    .eq('id', userId)
    .single()

  return data?.subscription_tier || 'free'
}

/**
 * Get the current billing period for the user.
 * Falls back to calendar month if no subscription exists.
 */
export async function getBillingPeriod(userId: string): Promise<{ start: Date; end: Date }> {
  const supabase = await createClient()
  const { data: sub } = await supabase
    .from('subscriptions')
    .select('current_period_start, current_period_end')
    .eq('user_id', userId)
    .eq('status', 'active')
    .maybeSingle()

  if (sub?.current_period_start && sub?.current_period_end) {
    return {
      start: new Date(sub.current_period_start),
      end: new Date(sub.current_period_end),
    }
  }

  // For free tier: use calendar month
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), 1)
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)
  return { start, end }
}

/**
 * Get total audio hours used in the current billing period.
 * Sums audio_duration_seconds from all episodes belonging to the user's shows.
 */
export async function getAudioHoursUsed(userId: string): Promise<number> {
  const supabase = await createClient()
  const { start } = await getBillingPeriod(userId)

  const { data, error } = await supabase
    .from('episodes')
    .select('audio_duration_seconds, shows!inner(user_id)')
    .eq('shows.user_id', userId)
    .gte('created_at', start.toISOString())

  if (error) {
    console.error('Error summing audio hours:', error)
    return 0
  }

  const totalSeconds = (data || []).reduce(
    (sum, ep) => sum + (ep.audio_duration_seconds || 0),
    0
  )

  // Return hours rounded to 2 decimal places
  return Math.round((totalSeconds / 3600) * 100) / 100
}

/**
 * Count total shows for a user
 */
export async function getShowCount(userId: string): Promise<number> {
  const supabase = await createClient()
  const { count, error } = await supabase
    .from('shows')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)

  if (error) {
    console.error('Error counting shows:', error)
    return 0
  }
  return count || 0
}

/**
 * Check if user can process a new episode based on audio hours used.
 * Optionally accepts estimatedDurationSeconds to check if adding this episode would exceed the limit.
 */
export async function canProcessEpisode(
  userId: string,
  estimatedDurationSeconds?: number
): Promise<{
  allowed: boolean
  reason?: string
  hoursUsed: number
  hoursLimit: number
}> {
  const tier = await getUserTier(userId)
  const limits = getTierLimits(tier)
  const hoursUsed = await getAudioHoursUsed(userId)
  const hoursLimit = limits.audioHoursPerMonth

  // If already at or over limit
  if (hoursUsed >= hoursLimit) {
    return {
      allowed: false,
      reason: `You've used all ${hoursLimit} audio hours this month on the ${tier} plan. Upgrade for more audio processing time.`,
      hoursUsed,
      hoursLimit,
    }
  }

  // If adding this episode would exceed the limit
  if (estimatedDurationSeconds) {
    const estimatedHours = estimatedDurationSeconds / 3600
    if (hoursUsed + estimatedHours > hoursLimit) {
      const remaining = Math.round((hoursLimit - hoursUsed) * 100) / 100
      return {
        allowed: false,
        reason: `This episode (~${Math.round(estimatedHours * 10) / 10} hrs) would exceed your ${hoursLimit} hour/month limit. You have ${remaining} hours remaining. Upgrade for more audio processing time.`,
        hoursUsed,
        hoursLimit,
      }
    }
  }

  return { allowed: true, hoursUsed, hoursLimit }
}

/**
 * Check if user can create a new show
 */
export async function canCreateShow(userId: string): Promise<{
  allowed: boolean
  reason?: string
  current: number
  limit: number
}> {
  const tier = await getUserTier(userId)
  const limits = getTierLimits(tier)
  const current = await getShowCount(userId)

  if (current >= limits.maxShows) {
    return {
      allowed: false,
      reason: `You've reached your ${limits.maxShows} show limit on the ${tier} plan. Upgrade to add more shows.`,
      current,
      limit: limits.maxShows,
    }
  }
  return { allowed: true, current, limit: limits.maxShows }
}
