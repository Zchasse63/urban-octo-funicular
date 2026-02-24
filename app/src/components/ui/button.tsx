import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { forwardRef } from "react"

const buttonVariants = cva(
  [
    "inline-flex items-center justify-center gap-2",
    "font-[family-name:var(--font-display)] font-medium",
    "rounded-[var(--radius-sm)] transition-all",
    "duration-[var(--duration-fast)]",
    "focus-visible:outline-none focus-visible:shadow-[var(--shadow-focus)]",
    "disabled:pointer-events-none disabled:opacity-50",
    "cursor-pointer select-none",
  ].join(" "),
  {
    variants: {
      variant: {
        primary: [
          "bg-[var(--color-text-ink)] text-[var(--color-text-on-accent)]",
          "shadow-[var(--shadow-button)]",
          "hover:bg-[var(--color-text-ink)]/90",
          "active:shadow-[var(--shadow-button-active)]",
        ].join(" "),
        secondary: [
          "bg-[var(--color-bg-surface)] text-[var(--color-text-ink)]",
          "border border-[var(--color-border-strong)]",
          "shadow-[var(--shadow-button)]",
          "hover:bg-[var(--color-bg-hover)]",
          "active:shadow-[var(--shadow-button-active)]",
        ].join(" "),
        ghost: [
          "text-[var(--color-text-secondary)]",
          "hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text-ink)]",
        ].join(" "),
        warm: [
          "bg-[var(--color-accent-warm)] text-[var(--color-text-on-accent)]",
          "shadow-[var(--shadow-button)]",
          "hover:bg-[var(--color-accent-warm-hover)]",
          "active:shadow-[var(--shadow-button-active)]",
        ].join(" "),
        danger: [
          "bg-[var(--color-status-error)] text-[var(--color-text-on-accent)]",
          "shadow-[var(--shadow-button)]",
          "hover:bg-[var(--color-status-error)]/90",
          "active:shadow-[var(--shadow-button-active)]",
        ].join(" "),
        link: [
          "text-[var(--color-accent-blue)] underline-offset-4",
          "hover:underline",
          "p-0 h-auto",
        ].join(" "),
      },
      size: {
        sm: "h-8 px-3 text-[var(--text-caption)]",
        md: "h-9 px-4 text-[var(--text-body-sm)]",
        lg: "h-10 px-5 text-[var(--text-body)]",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
)

interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
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
export type { ButtonProps }
