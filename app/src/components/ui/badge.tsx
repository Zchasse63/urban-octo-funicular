import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  [
    "inline-flex items-center gap-1.5",
    "font-[family-name:var(--font-mono)] text-[var(--text-label)] font-medium",
    "uppercase tracking-wider",
    "px-2.5 py-1 rounded-[var(--radius-full)]",
    "select-none",
    // Subtle border for every variant
    "border",
  ].join(" "),
  {
    variants: {
      variant: {
        default: "bg-[var(--color-bg-hover)] text-[var(--color-text-secondary)] border-[var(--color-border)]",
        success: "bg-[var(--color-status-success-light)] text-[var(--color-status-success)] border-[var(--color-status-success)]/15",
        error: "bg-[var(--color-status-error-light)] text-[var(--color-status-error)] border-[var(--color-status-error)]/15",
        processing: "bg-[var(--color-status-processing-light)] text-[var(--color-status-processing)] border-[var(--color-status-processing)]/15",
        warm: "bg-[var(--color-accent-warm-light)] text-[var(--color-accent-warm)] border-[var(--color-accent-warm)]/15",
        blue: "bg-[var(--color-accent-blue-light)] text-[var(--color-accent-blue)] border-[var(--color-accent-blue)]/15",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant, className }))} {...props} />
  )
}

export { Badge, badgeVariants }
