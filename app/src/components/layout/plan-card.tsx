"use client"

import { cn } from "@/lib/utils"
import { TrendingUp, Zap } from "lucide-react"
import { LinearProgress } from "@/components/ui/progress"
import type { PricingTier } from "@/lib/stripe/products"

interface PlanCardProps {
  tier: PricingTier
  usagePercent?: number
  collapsed?: boolean
}

const tierLabels: Record<PricingTier, string> = {
  free: "Free",
  pro: "Pro",
  agency: "Agency",
}

function PlanCard({ tier, usagePercent = 0, collapsed }: PlanCardProps) {
  if (collapsed) {
    return (
      <div className="flex justify-center px-2 py-1">
        <div
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)]",
            "bg-[var(--color-accent-blue-light)]"
          )}
        >
          <Zap className="h-3.5 w-3.5 text-[var(--color-accent-blue)]" />
        </div>
      </div>
    )
  }

  const color =
    usagePercent >= 80
      ? "warning"
      : usagePercent >= 60
      ? "blue"
      : "success"

  return (
    <div
      className={cn(
        "mx-2 rounded-[var(--radius-md)] border border-[var(--color-border)]",
        "bg-[var(--color-bg-surface)] p-3"
      )}
    >
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <TrendingUp className="h-3.5 w-3.5 text-[var(--color-accent-blue)]" />
          <span className="font-[family-name:var(--font-display)] text-[var(--text-caption)] font-semibold text-[var(--color-text-ink)]">
            {tierLabels[tier]} Plan
          </span>
        </div>
        <span className="text-label text-[var(--color-status-success)]">
          ACTIVE
        </span>
      </div>

      <LinearProgress value={usagePercent} color={color} />

      <div className="mt-1.5 flex items-center justify-between">
        <span className="font-[family-name:var(--font-mono)] text-[10px] text-[var(--color-text-secondary)]">
          {usagePercent}% monthly usage
        </span>
        {tier === "free" && (
          <button className="font-[family-name:var(--font-display)] text-[10px] font-semibold text-[var(--color-accent-blue)] hover:underline">
            Upgrade
          </button>
        )}
      </div>
    </div>
  )
}

export { PlanCard }
