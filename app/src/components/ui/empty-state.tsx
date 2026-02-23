import { cn } from "@/lib/utils"
import type { LucideIcon } from "lucide-react"

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  action?: React.ReactNode
  className?: string
}

function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "relative flex flex-col items-center justify-center text-center",
        "py-16 px-6",
        "rounded-[var(--radius-lg)]",
        "border border-dashed border-[var(--color-border)]",
        "bg-[var(--color-bg-surface)]/50",
        className
      )}
    >
      {/* Decorative grid inside empty state */}
      <div
        className="absolute inset-0 pointer-events-none rounded-[var(--radius-lg)] overflow-hidden opacity-[0.03]"
        style={{
          backgroundImage: [
            'linear-gradient(to bottom, var(--color-text-ink) 1px, transparent 1px)',
            'linear-gradient(to right, var(--color-text-ink) 1px, transparent 1px)',
          ].join(', '),
          backgroundSize: '32px 32px',
        }}
      />

      <div className="relative">
        <div className="w-14 h-14 rounded-[var(--radius-lg)] bg-[var(--color-bg-hover)] border border-[var(--color-border)] flex items-center justify-center mb-4 mx-auto shadow-[var(--shadow-button)]">
          <Icon className="w-6 h-6 text-[var(--color-text-tertiary)]" />
        </div>
        <h3 className="font-[family-name:var(--font-display)] font-semibold text-[var(--text-h3)] text-[var(--color-text-ink)] mb-1">
          {title}
        </h3>
        <p className="text-[var(--text-body-sm)] text-[var(--color-text-secondary)] max-w-sm mb-6">
          {description}
        </p>
        {action}
      </div>
    </div>
  )
}

export { EmptyState }
