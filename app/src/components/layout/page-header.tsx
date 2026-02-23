import { cn } from "@/lib/utils"

interface PageHeaderProps {
  title: string
  description?: string
  actions?: React.ReactNode
  children?: React.ReactNode
  className?: string
}

function PageHeader({ title, description, actions, children, className }: PageHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between",
        "pb-6",
        "animate-enter",
        className
      )}
    >
      <div>
        <h1 className="text-[var(--text-display)] font-[family-name:var(--font-display)] font-bold text-[var(--color-text-ink)]">
          {title}
        </h1>
        {description && (
          <p className="text-[var(--text-body)] text-[var(--color-text-secondary)] mt-1">
            {description}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex items-center gap-3 flex-shrink-0">
          {actions}
        </div>
      )}
      {children}
    </div>
  )
}

export { PageHeader }
