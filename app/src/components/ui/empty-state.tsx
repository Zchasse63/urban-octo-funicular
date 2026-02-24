import { cn } from "@/lib/utils"
import type { LucideIcon } from "lucide-react"

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  action?: React.ReactNode
  className?: string
}

function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-16 px-4",
        "animate-enter",
        className
      )}
    >
      <div
        className={cn(
          "mb-4 flex h-12 w-12 items-center justify-center",
          "rounded-[var(--radius-md)] bg-[var(--color-bg-hover)]",
          "text-[var(--color-text-tertiary)]"
        )}
      >
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="mb-1 font-[family-name:var(--font-display)] text-[var(--text-h3)] font-semibold text-[var(--color-text-ink)]">
        {title}
      </h3>
      <p className="mb-4 max-w-sm text-center text-[var(--text-body-sm)] text-[var(--color-text-secondary)]">
        {description}
      </p>
      {action}
    </div>
  )
}

export { EmptyState }
