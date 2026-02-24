import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import type { ReactNode } from "react"

interface PageHeaderProps {
  title: string
  description?: string
  badge?: {
    label: string
    variant?: "default" | "success" | "processing" | "warm" | "blue"
  }
  actions?: ReactNode
  className?: string
}

function PageHeader({
  title,
  description,
  badge,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between",
        className
      )}
    >
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-3">
          <h1 className="font-[family-name:var(--font-display)] text-[var(--text-display)] font-bold text-[var(--color-text-ink)]">
            {title}
          </h1>
          {badge && (
            <Badge variant={badge.variant || "default"}>{badge.label}</Badge>
          )}
        </div>
        {description && (
          <p className="text-[var(--text-body-sm)] text-[var(--color-text-secondary)]">
            {description}
          </p>
        )}
      </div>

      {actions && (
        <div className="flex items-center gap-2">{actions}</div>
      )}
    </div>
  )
}

export { PageHeader }
