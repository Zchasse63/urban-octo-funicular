import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center px-2 py-1 text-[11px] font-semibold rounded border",
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
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
