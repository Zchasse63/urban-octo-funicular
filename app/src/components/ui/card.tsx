import { cn } from "@/lib/utils"
import { forwardRef } from "react"

const Card = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "rounded-[var(--radius-md)] border border-[var(--color-border-strong)]",
        "bg-[var(--color-bg-surface)] shadow-[var(--shadow-card)]",
        "ring-1 ring-white/60",
        className
      )}
      {...props}
    />
  )
)
Card.displayName = "Card"

const CardHeader = forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col gap-1.5 p-5", className)}
    {...props}
  />
))
CardHeader.displayName = "CardHeader"

const CardTitle = forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "font-[family-name:var(--font-display)] text-[var(--text-h2)] font-semibold leading-tight",
      "text-[var(--color-text-ink)]",
      className
    )}
    {...props}
  />
))
CardTitle.displayName = "CardTitle"

const CardContent = forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("px-5 pb-5", className)} {...props} />
))
CardContent.displayName = "CardContent"

const CardFooter = forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex items-center px-5 pb-5 pt-0",
      className
    )}
    {...props}
  />
))
CardFooter.displayName = "CardFooter"

interface CardPremiumProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "blue" | "warm"
}

const CardFeatured = forwardRef<HTMLDivElement, CardPremiumProps>(
  ({ className, variant = "blue", ...props }, ref) => {
    const accentStyles =
      variant === "blue"
        ? "border-[var(--color-accent-blue)]/30 shadow-[0_0_20px_rgba(37,99,235,0.08)]"
        : "border-[var(--color-accent-warm)]/30 shadow-[0_0_20px_rgba(194,105,61,0.08)]"

    return (
      <div
        ref={ref}
        className={cn(
          "rounded-[var(--radius-md)] border",
          "bg-[var(--color-bg-surface)]",
          "ring-1 ring-white/60",
          accentStyles,
          className
        )}
        {...props}
      />
    )
  }
)
CardFeatured.displayName = "CardFeatured"

export { Card, CardHeader, CardTitle, CardContent, CardFooter, CardFeatured }
