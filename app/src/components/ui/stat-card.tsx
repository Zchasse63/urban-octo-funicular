import { cn } from "@/lib/utils"
import type { LucideIcon } from "lucide-react"

interface StatCardProps {
  icon?: LucideIcon
  label: string
  value: string | number
  trend?: string
  trendColor?: "success" | "error" | "warning"
  className?: string
}

const trendColors: Record<string, string> = {
  success: "text-[var(--color-status-success)]",
  error: "text-[var(--color-status-error)]",
  warning: "text-[var(--color-status-warning)]",
}

function StatCard({
  icon: Icon,
  label,
  value,
  trend,
  trendColor = "success",
  className,
}: StatCardProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 px-4 py-3",
        "rounded-[var(--radius-md)] border border-[var(--color-border)]",
        "bg-[var(--color-bg-surface)]",
        className
      )}
    >
      {Icon && (
        <div className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--color-bg-hover)] text-[var(--color-text-secondary)]">
          <Icon className="h-4 w-4" />
        </div>
      )}
      <div className="flex flex-col">
        <span className="font-[family-name:var(--font-mono)] text-[var(--text-h2)] font-semibold text-[var(--color-text-ink)]">
          {value}
        </span>
        <span className="text-label">{label}</span>
      </div>
      {trend && (
        <span
          className={cn(
            "ml-auto font-[family-name:var(--font-mono)] text-[var(--text-caption)] font-medium",
            trendColors[trendColor]
          )}
        >
          {trend}
        </span>
      )}
    </div>
  )
}

export { StatCard }
