/**
 * PodBrain Pricing — Single Source of Truth
 *
 * This module is the canonical source for all tier configuration, subscription
 * state logic, and feature flags. Every other file that needs pricing data
 * imports from here — never duplicate these values elsewhere.
 *
 * Tier model: 3 paid tiers (pro, creator, agency). No free tier.
 * Access model: 5-state machine (trialing, active, past_due, trial_expired, canceled).
 * Metering: minutes of audio per month (never hours).
 *
 * Changing pricing:
 *   1. Update TIER_CONFIGS below
 *   2. Update Stripe products in the dashboard (test + live modes)
 *   3. Update env vars with new price IDs
 *   4. Run tests to verify nothing depends on old values
 */

// ─── Core types ────────────────────────────────────────────────────────────

export type SubscriptionTier = 'pro' | 'creator' | 'agency'

export type SubscriptionStatus =
  | 'trialing'
  | 'active'
  | 'past_due'
  | 'trial_expired'
  | 'canceled'

/**
 * Feature flags that differ between tiers. Core AI features (show notes,
 * assets, SEO, etc.) are available on every paid tier and are not represented
 * here — they're always enabled because every user is always on a paid tier.
 *
 * This interface represents the *upgradeable* features: things Pro doesn't get
 * but Creator+ does. Used by canAccessFeature() to gate UI and API routes.
 */
export interface TierFeatureFlags {
  hostingPush: boolean
  preInterviewIntel: boolean
  expertDiscovery: boolean
  crossEpisodeLinking: boolean
  abTesting: boolean
  episodeScheduling: boolean
  webhooks: boolean
  bulkUpload: boolean
}

export interface TierConfig {
  id: SubscriptionTier
  name: string
  audioMinutesPerMonth: number
  maxShows: number
  teamSeats: number
  priceMonthly: number
  priceAnnual: number
  features: TierFeatureFlags
  /** Marketing bullets shown on pricing cards */
  displayFeatures: string[]
}

// ─── Constants ─────────────────────────────────────────────────────────────

/** Trigger upgrade prompt at this percentage of the monthly limit */
export const SOFT_LIMIT_THRESHOLD = 0.8

/** Days after past_due before subscription flips to canceled */
export const GRACE_PERIOD_DAYS = 3

/** Trial length in days for new signups */
export const TRIAL_LENGTH_DAYS = 14

/** Sentinel value used in maxShows to represent "unlimited" */
export const UNLIMITED_SHOWS_SENTINEL = 999

/** Average episode duration used for minutesToEpisodes marketing display */
export const AVERAGE_EPISODE_MINUTES = 45

// ─── Tier configurations ──────────────────────────────────────────────────
// These are THE numbers. Nothing else in the codebase should define pricing.

export const TIER_CONFIGS: Record<SubscriptionTier, TierConfig> = {
  pro: {
    id: 'pro',
    name: 'Pro',
    audioMinutesPerMonth: 300,
    maxShows: 2,
    teamSeats: 1,
    priceMonthly: 29,
    priceAnnual: 290,
    features: {
      hostingPush: false,
      preInterviewIntel: false,
      expertDiscovery: false,
      crossEpisodeLinking: false,
      abTesting: false,
      episodeScheduling: false,
      webhooks: false,
      bulkUpload: false,
    },
    displayFeatures: [
      '300 minutes of audio/month',
      '2 podcast shows',
      'AI show notes & chapters',
      '12+ content assets',
      'SEO analysis',
      'Guest promotion packages',
      'Podcasting 2.0 enrichment',
      'Viral moment detection',
      'Custom vocabulary learning',
    ],
  },
  creator: {
    id: 'creator',
    name: 'Creator',
    audioMinutesPerMonth: 1200,
    maxShows: 10,
    teamSeats: 1,
    priceMonthly: 59,
    priceAnnual: 590,
    features: {
      hostingPush: true,
      preInterviewIntel: true,
      expertDiscovery: true,
      crossEpisodeLinking: true,
      abTesting: true,
      episodeScheduling: true,
      webhooks: true,
      bulkUpload: true,
    },
    displayFeatures: [
      '1,200 minutes of audio/month',
      '10 podcast shows',
      'Everything in Pro',
      'Hosting push (Buzzsprout, Transistor)',
      'Pre-interview intelligence',
      'Expert & guest discovery',
      'Cross-episode linking',
      'A/B testing & scheduling',
      'Outbound webhooks',
      'Bulk upload',
    ],
  },
  agency: {
    id: 'agency',
    name: 'Agency',
    audioMinutesPerMonth: 3600,
    maxShows: UNLIMITED_SHOWS_SENTINEL,
    teamSeats: 1,
    priceMonthly: 149,
    priceAnnual: 1490,
    features: {
      hostingPush: true,
      preInterviewIntel: true,
      expertDiscovery: true,
      crossEpisodeLinking: true,
      abTesting: true,
      episodeScheduling: true,
      webhooks: true,
      bulkUpload: true,
    },
    displayFeatures: [
      '3,600 minutes of audio/month',
      'Unlimited podcast shows',
      'Everything in Creator',
      'Agency-scale processing',
      'Priority support',
    ],
  },
}

// ─── Tier lookup ───────────────────────────────────────────────────────────

/**
 * Returns the TierConfig for a given tier ID.
 * @throws TypeError if the tier ID is not one of the valid SubscriptionTier values.
 */
export function getTierConfig(tier: SubscriptionTier): TierConfig {
  const config = TIER_CONFIGS[tier]
  if (!config) {
    throw new TypeError(
      `Unknown subscription tier: "${tier}". Valid tiers are: pro, creator, agency.`
    )
  }
  return config
}

/**
 * Returns the human-readable name for a tier (e.g. "Pro", "Creator", "Agency").
 */
export function getTierLabel(tier: SubscriptionTier): string {
  return TIER_CONFIGS[tier].name
}

/**
 * Returns true if the given show limit represents "unlimited".
 */
export function isUnlimitedShows(maxShows: number): boolean {
  return maxShows >= UNLIMITED_SHOWS_SENTINEL
}

// ─── Status helpers ────────────────────────────────────────────────────────

/** True only when the user is in their initial 14-day Pro trial. */
export function isInTrial(status: SubscriptionStatus): boolean {
  return status === 'trialing'
}

/** True when the user has active access (trial or paid, not blocked). */
export function hasActiveAccess(status: SubscriptionStatus): boolean {
  return status === 'trialing' || status === 'active' || status === 'past_due'
}

/** True when the user's access is blocked and they must upgrade to continue. */
export function isAccessBlocked(status: SubscriptionStatus): boolean {
  return status === 'trial_expired' || status === 'canceled'
}

/** True when the user is in the 3-day grace period after a failed payment. */
export function isInGracePeriod(status: SubscriptionStatus): boolean {
  return status === 'past_due'
}

/** Calculates when the 3-day grace period ends, given when past_due started. */
export function getGracePeriodEnd(pastDueSince: Date): Date {
  const end = new Date(pastDueSince)
  end.setDate(end.getDate() + GRACE_PERIOD_DAYS)
  return end
}

/** Returns the number of days remaining until trialEndsAt (never negative). */
export function getTrialDaysRemaining(trialEndsAt: Date): number {
  const now = new Date()
  const msRemaining = trialEndsAt.getTime() - now.getTime()
  return Math.max(0, Math.ceil(msRemaining / (1000 * 60 * 60 * 24)))
}

// ─── Feature access ───────────────────────────────────────────────────────

/**
 * Determines whether a user can access a given feature based on both their
 * tier (what they paid for) and their status (whether they have access).
 *
 * Access-blocked users (trial_expired, canceled) cannot access any features,
 * regardless of tier.
 *
 * @example
 *   canAccessFeature('pro', 'active', 'bulkUpload') // false (Pro doesn't include bulk upload)
 *   canAccessFeature('creator', 'active', 'bulkUpload') // true
 *   canAccessFeature('agency', 'canceled', 'bulkUpload') // false (blocked overrides tier)
 */
export function canAccessFeature(
  tier: SubscriptionTier,
  status: SubscriptionStatus,
  feature: keyof TierFeatureFlags
): boolean {
  if (isAccessBlocked(status)) return false
  return TIER_CONFIGS[tier].features[feature]
}

// ─── Limit helpers ────────────────────────────────────────────────────────

/**
 * Calculates usage as a percentage (0–100+) of a monthly limit.
 * Returns 100 if the limit is 0 (divide-by-zero guard).
 */
export function getUsagePercentage(used: number, limit: number): number {
  if (limit === 0) return 100
  return Math.round((used / limit) * 100)
}

/** True when usage is at or above the soft-limit threshold (80% by default). */
export function isOverSoftLimit(used: number, limit: number): boolean {
  if (limit === 0) return true
  return used / limit >= SOFT_LIMIT_THRESHOLD
}

/** True when usage has reached the hard cap. */
export function isAtHardLimit(used: number, limit: number): boolean {
  return used >= limit
}

// ─── Marketing display helpers ────────────────────────────────────────────

/**
 * Converts audio minutes to a rounded episode count for marketing display.
 * Uses AVERAGE_EPISODE_MINUTES (45) as the assumed episode length.
 *
 * @example
 *   minutesToEpisodes(300)  // '~7 episodes'
 *   minutesToEpisodes(1200) // '~27 episodes'
 *   minutesToEpisodes(3600) // '~80 episodes'
 */
export function minutesToEpisodes(minutes: number): string {
  const count = Math.round(minutes / AVERAGE_EPISODE_MINUTES)
  return `~${count} episodes`
}
