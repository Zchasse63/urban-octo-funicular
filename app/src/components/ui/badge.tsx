import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  [
    "inline-flex items-center gap-1",
    "rounded-[var(--radius-full)]",
    "px-2 py-0.5",
    "font-[family-name:var(--font-mono)] text-[var(--text-label)] font-medium",
    "uppercase tracking-[0.06em]",
    "border",
  ].join(" "),
  {
    variants: {
      variant: {
        default: [
          "bg-[var(--color-bg-hover)] text-[var(--color-text-secondary)]",
          "border-[var(--color-border)]",
        ].join(" "),
        success: [
          "bg-[var(--color-status-success-light)] text-[var(--color-status-success)]",
          "border-[var(--color-status-success)]/20",
        ].join(" "),
        error: [
          "bg-[var(--color-status-error-light)] text-[var(--color-status-error)]",
          "border-[var(--color-status-error)]/20",
        ].join(" "),
        processing: [
          "bg-[var(--color-status-processing-light)] text-[var(--color-status-processing)]",
          "border-[var(--color-status-processing)]/20",
        ].join(" "),
        warning: [
          "bg-[var(--color-status-warning-light)] text-[var(--color-status-warning)]",
          "border-[var(--color-status-warning)]/20",
        ].join(" "),
        warm: [
          "bg-[var(--color-accent-warm-light)] text-[var(--color-accent-warm)]",
          "border-[var(--color-accent-warm)]/20",
        ].join(" "),
        blue: [
          "bg-[var(--color-accent-blue-light)] text-[var(--color-accent-blue)]",
          "border-[var(--color-accent-blue)]/20",
        ].join(" "),
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
export type { BadgeProps }
