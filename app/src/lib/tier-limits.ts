/**
 * Tier Limits — Enforcement Layer
 *
 * Thin layer over src/lib/pricing.ts that handles database queries and
 * enforcement logic for subscription tiers and the 5-state access machine.
 *
 * For pricing *configuration* (tier definitions, prices, minute limits),
 * see src/lib/pricing.ts. This file should not define any pricing values —
 * it only enforces the values defined there.
 */

import { createClient } from './supabase/server'
import {
  TIER_CONFIGS,
  type SubscriptionTier,
  type SubscriptionStatus,
  type TierFeatureFlags,
  isAccessBlocked,
  isOverSoftLimit as isOverSoftLimitPure,
  getUsagePercentage as getUsagePercentagePure,
} from './pricing'

// ─── Re-exports ───────────────────────────────────────────────────────────
// Keep existing import paths working for code that imports types from here.
export type { SubscriptionTier, SubscriptionStatus, TierFeatureFlags }

// ─── Interfaces ───────────────────────────────────────────────────────────

export interface TierLimits {
  audioMinutesPerMonth: number
  maxShows: number
  teamSeats: number
  features: TierFeatureFlags
}

export interface UserTierState {
  tier: SubscriptionTier
  status: SubscriptionStatus
  trialEndsAt: Date
  pastDueSince: Date | null
}

export interface CanProcessResult {
  allowed: boolean
  reason?: string
  minutesUsed: number
  minutesLimit: number
  status: SubscriptionStatus
}

export interface CanCreateShowResult {
  allowed: boolean
  reason?: string
  current: number
  limit: number
}

// ─── Tier lookup ──────────────────────────────────────────────────────────

/**
 * Returns the enforcement limits for a given tier.
 * @throws TypeError if tier is not a valid SubscriptionTier.
 */
export function getTierLimits(tier: SubscriptionTier): TierLimits {
  const config = TIER_CONFIGS[tier]
  if (!config) {
    throw new TypeError(
      `Unknown subscription tier: "${tier}". Valid tiers are: pro, creator, agency.`
    )
  }
  return {
    audioMinutesPerMonth: config.audioMinutesPerMonth,
    maxShows: config.maxShows,
    teamSeats: config.teamSeats,
    features: config.features,
  }
}

// ─── Asset types ──────────────────────────────────────────────────────────
// All asset types are available on all paid tiers. The CORE_ASSET_TYPES set
// is retained as documentary — which assets are considered "core" content
// vs. advanced — but canGenerateAssetType always returns true for any
// non-blocked user now that there's no free tier.

export const CORE_ASSET_TYPES = new Set([
  'show_notes',
  'episode_titles',
  'key_takeaways',
  'chapter_markers',
  'transcript_summary',
  'seo_description',
])

/**
 * Returns true if a user on the given tier can generate the given asset type.
 * After the pricing refactor, all tiers can generate all asset types
 * (there's no free tier), so this always returns true. Retained for API
 * compatibility and future use.
 */
export function canGenerateAssetType(_tier: SubscriptionTier, _assetType: string): boolean {
  return true
}

// ─── User tier state ──────────────────────────────────────────────────────

/**
 * Fetches the current subscription state for a user.
 * Returns the tier, status, trial expiration, and past-due timestamp (if any).
 *
 * @throws Error if the user doesn't exist (should never happen for authenticated users)
 */
export async function getUserTier(userId: string): Promise<UserTierState> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('users')
    .select('subscription_tier, subscription_status, trial_ends_at, past_due_since')
    .eq('id', userId)
    .single()

  if (error || !data) {
    throw new Error(`Failed to load user tier state for user ${userId}: ${error?.message ?? 'not found'}`)
  }

  return {
    tier: (data.subscription_tier as SubscriptionTier) ?? 'pro',
    status: (data.subscription_status as SubscriptionStatus) ?? 'trialing',
    trialEndsAt: data.trial_ends_at ? new Date(data.trial_ends_at) : new Date(),
    pastDueSince: data.past_due_since ? new Date(data.past_due_since) : null,
  }
}

// ─── Billing period ───────────────────────────────────────────────────────

/**
 * Get the current billing period for the user.
 * Returns the Stripe subscription's current period when one is active;
 * otherwise falls back to the calendar month (for users on trial or without
 * an active Stripe subscription row).
 */
export async function getBillingPeriod(userId: string): Promise<{ start: Date; end: Date }> {
  const supabase = await createClient()
  // Include past_due so users in the grace period keep their original billing
  // window — otherwise a payment failure would reset their minute cap to
  // the start of the calendar month, which is a free grant of extra usage.
  const { data: sub } = await supabase
    .from('subscriptions')
    .select('current_period_start, current_period_end')
    .eq('user_id', userId)
    .in('status', ['active', 'past_due'])
    .maybeSingle()

  if (sub?.current_period_start && sub?.current_period_end) {
    return {
      start: new Date(sub.current_period_start),
      end: new Date(sub.current_period_end),
    }
  }

  // Trial / no active Stripe subscription: use calendar month
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), 1)
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)
  return { start, end }
}

// ─── Usage tracking ───────────────────────────────────────────────────────

/**
 * Get total audio minutes used in the current billing period.
 * Sums audio_duration_seconds from all episodes belonging to the user's shows
 * and divides by 60. Returns a value rounded to 1 decimal place.
 */
export async function getAudioMinutesUsed(userId: string): Promise<number> {
  const supabase = await createClient()
  const { start } = await getBillingPeriod(userId)

  const { data, error } = await supabase
    .from('episodes')
    .select('audio_duration_seconds, shows!inner(user_id)')
    .eq('shows.user_id', userId)
    .gte('created_at', start.toISOString())

  if (error) {
    console.error('Error summing audio minutes:', error)
    return 0
  }

  const totalSeconds = (data || []).reduce(
    (sum, ep) => sum + (ep.audio_duration_seconds || 0),
    0
  )

  // Return minutes rounded to 1 decimal place (sufficient precision for display)
  return Math.round((totalSeconds / 60) * 10) / 10
}

/**
 * Count total shows for a user.
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

// ─── Usage helpers (pure, re-exported for convenience) ───────────────────

export function getUsagePercentage(used: number, limit: number): number {
  return getUsagePercentagePure(used, limit)
}

/**
 * Async wrapper that fetches current audio usage and returns whether the
 * user is at or above the 80% soft limit threshold.
 */
export async function isOverSoftLimit(userId: string): Promise<boolean> {
  const { tier } = await getUserTier(userId)
  const minutesUsed = await getAudioMinutesUsed(userId)
  const minutesLimit = TIER_CONFIGS[tier].audioMinutesPerMonth
  return isOverSoftLimitPure(minutesUsed, minutesLimit)
}

// ─── Access enforcement ──────────────────────────────────────────────────

/**
 * Checks whether a user can process a new episode.
 *
 * Returns `allowed: false` if:
 *   - User is access-blocked (trial_expired, canceled)
 *   - User has already reached their monthly minute cap
 *   - Adding the estimated duration would exceed the cap
 *
 * Otherwise returns `allowed: true` with current usage stats.
 */
export async function canProcessEpisode(
  userId: string,
  estimatedDurationSeconds?: number
): Promise<CanProcessResult> {
  const { tier, status } = await getUserTier(userId)
  const minutesLimit = TIER_CONFIGS[tier].audioMinutesPerMonth
  const minutesUsed = await getAudioMinutesUsed(userId)

  // Blocked statuses cannot process new episodes
  if (isAccessBlocked(status)) {
    const reason =
      status === 'trial_expired'
        ? 'Your trial has ended. Upgrade to continue processing episodes.'
        : 'Your subscription has been canceled. Reactivate to continue processing episodes.'
    return {
      allowed: false,
      reason,
      minutesUsed,
      minutesLimit,
      status,
    }
  }

  // At or over monthly cap
  if (minutesUsed >= minutesLimit) {
    return {
      allowed: false,
      reason: `You've used all ${minutesLimit} minutes this month on the ${tier} plan. Upgrade for more audio processing time.`,
      minutesUsed,
      minutesLimit,
      status,
    }
  }

  // Would the new episode push us over?
  if (estimatedDurationSeconds) {
    const estimatedMinutes = estimatedDurationSeconds / 60
    if (minutesUsed + estimatedMinutes > minutesLimit) {
      const remaining = Math.round((minutesLimit - minutesUsed) * 10) / 10
      return {
        allowed: false,
        reason: `This episode (~${Math.round(estimatedMinutes)} min) would exceed your ${minutesLimit}-minute monthly limit. You have ${remaining} minutes remaining. Upgrade for more capacity.`,
        minutesUsed,
        minutesLimit,
        status,
      }
    }
  }

  return {
    allowed: true,
    minutesUsed,
    minutesLimit,
    status,
  }
}

/**
 * Checks whether a user can create a new show.
 * Blocked users cannot create shows. Other users check against tier maxShows.
 */
export async function canCreateShow(userId: string): Promise<CanCreateShowResult> {
  const { tier, status } = await getUserTier(userId)
  const limit = TIER_CONFIGS[tier].maxShows
  const current = await getShowCount(userId)

  if (isAccessBlocked(status)) {
    return {
      allowed: false,
      reason:
        status === 'trial_expired'
          ? 'Your trial has ended. Upgrade to continue managing shows.'
          : 'Your subscription has been canceled. Reactivate to continue managing shows.',
      current,
      limit,
    }
  }

  if (current >= limit) {
    return {
      allowed: false,
      reason: `You've reached your ${limit} show limit on the ${tier} plan. Upgrade to add more shows.`,
      current,
      limit,
    }
  }
  return { allowed: true, current, limit }
}
