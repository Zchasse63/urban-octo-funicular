import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-blue)] focus-visible:ring-offset-2 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-[var(--text-primary)] text-white shadow-[0_1px_2px_rgba(0,0,0,0.1)] hover:-translate-y-px hover:shadow-[0_2px_4px_rgba(0,0,0,0.12)] active:translate-y-0",
        secondary:
          "bg-white text-[var(--text-primary)] border border-[var(--border-soft)] hover:bg-[var(--bg-subtle)] hover:border-[var(--text-secondary)]/20 hover:shadow-[0_1px_2px_rgba(0,0,0,0.05)]",
        ghost:
          "text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)] active:bg-[var(--border-soft)]",
        link:
          "text-[var(--accent-blue)] underline-offset-4 hover:underline hover:text-[#0051D5]",
        destructive:
          "bg-[var(--accent-red)] text-white shadow-[0_1px_2px_rgba(239,68,68,0.3)] hover:-translate-y-px hover:shadow-[0_2px_4px_rgba(239,68,68,0.4)]",
        accent:
          "bg-gradient-to-r from-[var(--accent-blue)] to-[#5856D6] text-white shadow-[0_2px_8px_rgba(0,122,255,0.3)] hover:-translate-y-px hover:shadow-[0_4px_12px_rgba(0,122,255,0.4)]",
      },
      size: {
        default: "h-10 px-5 py-2.5",
        sm: "h-8 px-3 text-xs",
        lg: "h-12 px-8 text-base",
        icon: "h-10 w-10",
        xl: "h-14 px-10 text-base font-semibold",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
