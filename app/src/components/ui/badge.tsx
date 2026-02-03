import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 px-2 py-1 text-[11px] font-semibold rounded border",
  {
    variants: {
      variant: {
        default:
          "bg-[var(--bg-subtle)] border-[var(--border-soft)] text-[var(--text-primary)]",
        new:
          "bg-[rgba(0,122,255,0.08)] border-[rgba(0,122,255,0.2)] text-[var(--accent-blue)]",
        success:
          "bg-[rgba(52,199,89,0.08)] border-[rgba(52,199,89,0.2)] text-[var(--accent-green)]",
        warning:
          "bg-[rgba(245,158,11,0.08)] border-[rgba(245,158,11,0.2)] text-[var(--accent-amber)]",
        error:
          "bg-[rgba(239,68,68,0.08)] border-[rgba(239,68,68,0.2)] text-[var(--accent-red)]",
        outline:
          "bg-transparent border-[var(--border-soft)] text-[var(--text-secondary)]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  dot?: boolean
  pulse?: boolean
}

function Badge({ className, variant, dot = false, pulse = false, children, ...props }: BadgeProps) {
  const dotColors = {
    default: 'bg-[var(--text-secondary)]',
    new: 'bg-[var(--accent-blue)]',
    success: 'bg-[var(--accent-green)]',
    warning: 'bg-[var(--accent-amber)]',
    error: 'bg-[var(--accent-red)]',
    outline: 'bg-[var(--text-secondary)]',
  }

  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props}>
      {dot && (
        <span className="relative flex h-2 w-2">
          {pulse && (
            <span className={cn(
              "animate-ping absolute inline-flex h-full w-full rounded-full opacity-75",
              dotColors[variant || 'default']
            )} />
          )}
          <span className={cn(
            "relative inline-flex rounded-full h-2 w-2",
            dotColors[variant || 'default']
          )} />
        </span>
      )}
      {children}
    </div>
  )
}

// Status Badge Component
interface StatusBadgeProps extends Omit<BadgeProps, 'variant' | 'children'> {
  status: 'pending' | 'processing' | 'completed' | 'error'
}

function StatusBadge({ status, ...props }: StatusBadgeProps) {
  const statusConfig = {
    pending: { variant: 'default' as const, label: 'Pending', dot: true, pulse: false },
    processing: { variant: 'new' as const, label: 'Processing', dot: true, pulse: true },
    completed: { variant: 'success' as const, label: 'Completed', dot: true, pulse: false },
    error: { variant: 'error' as const, label: 'Error', dot: true, pulse: false },
  }

  const config = statusConfig[status]

  return (
    <Badge variant={config.variant} dot={config.dot} pulse={config.pulse} {...props}>
      {config.label}
    </Badge>
  )
}

// Count Badge Component
interface CountBadgeProps extends Omit<BadgeProps, 'children'> {
  count: number
  max?: number
}

function CountBadge({ count, max = 99, ...props }: CountBadgeProps) {
  const displayCount = count > max ? `${max}+` : count.toString()

  return (
    <Badge variant="new" {...props}>
      {displayCount}
    </Badge>
  )
}

export { Badge, StatusBadge, CountBadge, badgeVariants }
