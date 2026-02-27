import { createClient } from './supabase/server'

export interface TierLimits {
  episodesPerMonth: number
  maxShows: number
  teamSeats: number
  features: {
    advancedAssets: boolean
    buzzsproutIntegration: boolean
    customTemplates: boolean
    whiteLabel: boolean
    apiAccess: boolean
  }
}

const TIER_LIMITS: Record<string, TierLimits> = {
  free: {
    episodesPerMonth: 3,
    maxShows: 1,
    teamSeats: 1,
    features: {
      advancedAssets: false,
      buzzsproutIntegration: false,
      customTemplates: false,
      whiteLabel: false,
      apiAccess: false,
    },
  },
  pro: {
    episodesPerMonth: 50,
    maxShows: 5,
    teamSeats: 1,
    features: {
      advancedAssets: true,
      buzzsproutIntegration: true,
      customTemplates: true,
      whiteLabel: false,
      apiAccess: false,
    },
  },
  agency: {
    episodesPerMonth: 200,
    maxShows: 999,
    teamSeats: 5,
    features: {
      advancedAssets: true,
      buzzsproutIntegration: true,
      customTemplates: true,
      whiteLabel: true,
      apiAccess: true,
    },
  },
}

export function getTierLimits(tier: string): TierLimits {
  return TIER_LIMITS[tier] || TIER_LIMITS.free
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
 * Count episodes created in the current billing period
 */
export async function getEpisodeCount(userId: string): Promise<number> {
  const supabase = await createClient()
  const { start } = await getBillingPeriod(userId)

  const { count, error } = await supabase
    .from('episodes')
    .select('id, shows!inner(user_id)', { count: 'exact', head: true })
    .eq('shows.user_id', userId)
    .gte('created_at', start.toISOString())

  if (error) {
    console.error('Error counting episodes:', error)
    return 0
  }
  return count || 0
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
 * Check if user can create a new episode
 */
export async function canCreateEpisode(userId: string): Promise<{
  allowed: boolean
  reason?: string
  current: number
  limit: number
}> {
  const tier = await getUserTier(userId)
  const limits = getTierLimits(tier)
  const current = await getEpisodeCount(userId)

  if (current >= limits.episodesPerMonth) {
    return {
      allowed: false,
      reason: `You've reached your ${limits.episodesPerMonth} episodes/month limit on the ${tier} plan. Upgrade to process more episodes.`,
      current,
      limit: limits.episodesPerMonth,
    }
  }
  return { allowed: true, current, limit: limits.episodesPerMonth }
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
