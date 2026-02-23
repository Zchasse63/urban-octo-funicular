import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { forwardRef } from "react"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  [
    "inline-flex items-center justify-center gap-2",
    "font-[family-name:var(--font-display)] font-medium",
    "transition-all duration-[var(--duration-fast)]",
    "cursor-pointer select-none",
    "disabled:opacity-50 disabled:pointer-events-none",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg-base)]",
  ].join(" "),
  {
    variants: {
      variant: {
        primary: [
          "bg-[var(--color-accent-blue)] text-[var(--color-text-on-accent)]",
          // Zed-style: top highlight + bottom shadow + outer glow
          "shadow-[inset_0_1px_0_0_rgba(255,255,255,0.15),inset_0_-2px_0_0_rgba(0,0,0,0.15),0_1px_3px_0_rgba(37,99,235,0.25),0_2px_8px_-2px_rgba(37,99,235,0.2)]",
          "hover:bg-[var(--color-accent-blue-hover)]",
          "hover:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.2),inset_0_-2px_0_0_rgba(0,0,0,0.2),0_2px_6px_0_rgba(37,99,235,0.35),0_4px_12px_-2px_rgba(37,99,235,0.25)]",
          "active:shadow-[inset_0_2px_4px_0_rgba(0,0,0,0.25)] active:translate-y-[0.5px]",
        ].join(" "),
        secondary: [
          "bg-[var(--color-bg-surface)] text-[var(--color-text-ink)]",
          "border border-[var(--color-border)]",
          "ring-1 ring-inset ring-white/40",
          "shadow-[var(--shadow-button)]",
          "hover:bg-[var(--color-bg-hover)] hover:border-[var(--color-border-strong)]",
          "hover:shadow-[0_2px_4px_rgba(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,0.2)]",
          "active:bg-[var(--color-bg-active)] active:shadow-[var(--shadow-button-active)]",
        ].join(" "),
        ghost: [
          "text-[var(--color-text-secondary)]",
          "hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text-ink)]",
          "active:bg-[var(--color-bg-active)]",
        ].join(" "),
        warm: [
          "bg-[var(--color-accent-warm)] text-[var(--color-text-on-accent)]",
          "shadow-[inset_0_1px_0_0_rgba(255,255,255,0.15),inset_0_-2px_0_0_rgba(0,0,0,0.15),0_1px_3px_0_rgba(194,105,61,0.25)]",
          "hover:bg-[var(--color-accent-warm-hover)]",
          "hover:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.2),inset_0_-2px_0_0_rgba(0,0,0,0.2),0_2px_6px_0_rgba(194,105,61,0.35)]",
          "active:shadow-[inset_0_2px_4px_0_rgba(0,0,0,0.25)] active:translate-y-[0.5px]",
        ].join(" "),
        danger: [
          "bg-[var(--color-status-error)] text-[var(--color-text-on-accent)]",
          "shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1),inset_0_-2px_0_0_rgba(0,0,0,0.15),0_1px_3px_0_rgba(220,38,38,0.25)]",
          "hover:bg-[#B91C1C]",
          "active:shadow-[inset_0_2px_4px_0_rgba(0,0,0,0.25)]",
        ].join(" "),
        link: [
          "text-[var(--color-accent-blue)] underline-offset-4",
          "hover:underline",
          "p-0 h-auto",
        ].join(" "),
      },
      size: {
        sm: "text-[var(--text-caption)] px-3 py-1.5 rounded-[var(--radius-sm)]",
        md: "text-[var(--text-body-sm)] px-4 py-2 rounded-[var(--radius-md)]",
        lg: "text-[var(--text-body)] px-5 py-2.5 rounded-[var(--radius-md)]",
        icon: "p-2 rounded-[var(--radius-sm)]",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
)

export interface ButtonProps
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
