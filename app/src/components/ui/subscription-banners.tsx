"use client"

/**
 * Subscription Status Banners
 *
 * Three banners shown at the top of authenticated pages based on the user's
 * subscription_status. Reads usage data via the useUsage hook and displays
 * the appropriate banner (trialing → countdown; past_due → payment warning;
 * trial_expired/canceled → access blocked).
 *
 * Non-blocked banners are dismissible per session. The blocked banner is
 * persistent — the user must upgrade to dismiss it.
 */

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { AlertTriangle, Clock, XCircle, X } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  getTrialDaysRemaining,
  getGracePeriodEnd,
  type SubscriptionStatus,
} from "@/lib/pricing"

// ─── Shared props ──────────────────────────────────────────────────────────

interface BannerBaseProps {
  onUpgradeClick: () => void
  onDismiss?: () => void
}

// ─── TrialCountdownBanner ──────────────────────────────────────────────────

interface TrialCountdownBannerProps extends BannerBaseProps {
  daysRemaining: number
}

export function TrialCountdownBanner({
  daysRemaining,
  onUpgradeClick,
  onDismiss,
}: TrialCountdownBannerProps) {
  const urgent = daysRemaining <= 3
  return (
    <div
      data-testid="subscription-banner-trial"
      className={cn(
        "flex items-center gap-3 border-b px-4 sm:px-6 py-3",
        urgent
          ? "bg-amber-50 border-amber-200/60 text-amber-900"
          : "bg-blue-50 border-blue-200/60 text-blue-900"
      )}
      role="status"
    >
      <Clock
        className={cn("w-4 h-4 shrink-0", urgent ? "text-amber-600" : "text-blue-600")}
      />
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-sans font-medium">
          {daysRemaining === 0
            ? "Your trial ends today."
            : daysRemaining === 1
            ? "1 day left in your Pro trial."
            : `${daysRemaining} days left in your Pro trial.`}{" "}
          <span className="font-semibold">Upgrade to keep your access.</span>
        </p>
      </div>
      <button
        type="button"
        data-testid="banner-upgrade-button"
        onClick={onUpgradeClick}
        className={cn(
          "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] font-sans font-semibold transition-colors shrink-0",
          urgent
            ? "bg-amber-600 text-white hover:bg-amber-700"
            : "bg-blue-600 text-white hover:bg-blue-700"
        )}
      >
        Upgrade
      </button>
      {onDismiss && (
        <button
          type="button"
          data-testid="banner-dismiss-button"
          onClick={onDismiss}
          className="p-1 rounded-md text-current/60 hover:text-current transition-colors shrink-0"
          aria-label="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  )
}

// ─── PastDueBanner ─────────────────────────────────────────────────────────

interface PastDueBannerProps extends BannerBaseProps {
  gracePeriodEnd: Date
}

export function PastDueBanner({ gracePeriodEnd, onUpgradeClick }: PastDueBannerProps) {
  const endStr = gracePeriodEnd.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  })
  return (
    <div
      data-testid="subscription-banner-past-due"
      className="flex items-center gap-3 bg-amber-50 border-b border-amber-200/60 text-amber-900 px-4 sm:px-6 py-3"
      role="alert"
    >
      <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-sans font-medium">
          Payment failed. Update your payment method by <strong>{endStr}</strong> to avoid service interruption.
        </p>
      </div>
      <button
        type="button"
        data-testid="banner-upgrade-button"
        onClick={onUpgradeClick}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-amber-600 text-white text-[12px] font-sans font-semibold hover:bg-amber-700 transition-colors shrink-0"
      >
        Update Payment
      </button>
    </div>
  )
}

// ─── AccessBlockedBanner ───────────────────────────────────────────────────

interface AccessBlockedBannerProps extends BannerBaseProps {
  reason: "trial_expired" | "canceled"
}

export function AccessBlockedBanner({ reason, onUpgradeClick }: AccessBlockedBannerProps) {
  const message =
    reason === "trial_expired"
      ? "Your trial has ended."
      : "Your subscription has been canceled."
  return (
    <div
      data-testid="subscription-banner-blocked"
      className="flex items-center gap-3 bg-red-50 border-b border-red-200/60 text-red-900 px-4 sm:px-6 py-3"
      role="alert"
    >
      <XCircle className="w-4 h-4 shrink-0 text-red-600" />
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-sans font-medium">
          <strong>{message}</strong>{" "}
          {reason === "trial_expired"
            ? "Upgrade to continue processing episodes."
            : "Reactivate to continue processing episodes."}
        </p>
      </div>
      <button
        type="button"
        data-testid="banner-upgrade-button"
        onClick={onUpgradeClick}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-red-600 text-white text-[12px] font-sans font-semibold hover:bg-red-700 transition-colors shrink-0"
      >
        {reason === "trial_expired" ? "Upgrade" : "Reactivate"}
      </button>
    </div>
  )
}

// ─── Container ─────────────────────────────────────────────────────────────

interface SubscriptionBannersProps {
  status: SubscriptionStatus | null
  trialEndsAt: string | null
  pastDueSince: string | null
}

const TRIAL_DISMISS_KEY = "podbrain-trial-banner-dismissed"

/**
 * Renders the appropriate subscription banner based on the user's status.
 * Returns null when there's nothing to display (active users or loading state).
 */
export function SubscriptionBanners({
  status,
  trialEndsAt,
  pastDueSince,
}: SubscriptionBannersProps) {
  const router = useRouter()
  const [trialDismissed, setTrialDismissed] = useState(false)

  // Restore per-session dismissal from sessionStorage
  useEffect(() => {
    if (typeof window === "undefined") return
    if (sessionStorage.getItem(TRIAL_DISMISS_KEY) === "true") {
      setTrialDismissed(true)
    }
  }, [])

  const handleUpgradeClick = () => {
    router.push("/settings?tab=subscription")
  }

  const handleTrialDismiss = () => {
    setTrialDismissed(true)
    if (typeof window !== "undefined") {
      sessionStorage.setItem(TRIAL_DISMISS_KEY, "true")
    }
  }

  if (!status) return null

  if (status === "trial_expired" || status === "canceled") {
    return (
      <AccessBlockedBanner
        reason={status}
        onUpgradeClick={handleUpgradeClick}
      />
    )
  }

  if (status === "past_due" && pastDueSince) {
    return (
      <PastDueBanner
        gracePeriodEnd={getGracePeriodEnd(new Date(pastDueSince))}
        onUpgradeClick={handleUpgradeClick}
      />
    )
  }

  if (status === "trialing" && trialEndsAt && !trialDismissed) {
    const daysRemaining = getTrialDaysRemaining(new Date(trialEndsAt))
    return (
      <TrialCountdownBanner
        daysRemaining={daysRemaining}
        onUpgradeClick={handleUpgradeClick}
        onDismiss={handleTrialDismiss}
      />
    )
  }

  return null
}
