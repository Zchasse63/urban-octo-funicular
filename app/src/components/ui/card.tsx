import { forwardRef } from "react"
import { cn } from "@/lib/utils"

const Card = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "relative",
        "bg-[var(--color-bg-surface)]",
        "rounded-[var(--radius-lg)]",
        // Strong double-border: outer border + inner white highlight ring
        "border border-[var(--color-border-strong)]",
        "ring-1 ring-inset ring-white/50",
        // Layered shadow for physical depth
        "shadow-[0_1px_2px_rgba(0,0,0,0.06),0_3px_10px_rgba(0,0,0,0.04),inset_0_1px_0_rgba(255,255,255,0.7)]",
        "transition-shadow duration-[var(--duration-normal)] ease-[var(--ease-out)]",
        "overflow-hidden",
        className
      )}
      {...props}
    />
  )
)
Card.displayName = "Card"

/** Premium card variant with inner grid texture — like Zed's "Letter from the team" */
const CardPremium = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "relative",
        "bg-[var(--color-bg-surface)]",
        "rounded-[var(--radius-lg)]",
        "border border-[var(--color-border-strong)]",
        "ring-1 ring-inset ring-white/50",
        "shadow-[0_1px_3px_rgba(0,0,0,0.08),0_4px_14px_rgba(0,0,0,0.05),inset_0_1px_0_rgba(255,255,255,0.7)]",
        "hover:shadow-[0_2px_6px_rgba(0,0,0,0.1),0_8px_24px_rgba(0,0,0,0.07),inset_0_1px_0_rgba(255,255,255,0.7)]",
        "transition-all duration-[var(--duration-normal)] ease-[var(--ease-out)]",
        "overflow-hidden",
        className
      )}
      {...props}
    >
      {/* Inner grid pattern */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.035]"
        style={{
          backgroundImage: [
            'linear-gradient(to bottom, var(--color-text-ink) 0.5px, transparent 0.5px)',
            'linear-gradient(to right, var(--color-text-ink) 0.5px, transparent 0.5px)',
          ].join(', '),
          backgroundSize: '20px 20px',
        }}
      />
      <div className="relative">
        {children}
      </div>
    </div>
  )
)
CardPremium.displayName = "CardPremium"

/** Featured card with accent border + glow — for Pro/upgrade CTAs */
const CardFeatured = forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { accentColor?: "blue" | "warm" }
>(({ className, children, accentColor = "blue", ...props }, ref) => {
  const colors = {
    blue: {
      border: "border-[var(--color-accent-blue)]",
      ring: "ring-[var(--color-accent-blue)]/20",
      glow: "shadow-[0_0_0_1px_var(--color-accent-blue),0_2px_8px_rgba(37,99,235,0.12),0_8px_24px_rgba(37,99,235,0.08),inset_0_1px_0_rgba(255,255,255,0.6)]",
      gradient: "from-[var(--color-accent-blue)]/[0.04] to-transparent",
    },
    warm: {
      border: "border-[var(--color-accent-warm)]",
      ring: "ring-[var(--color-accent-warm)]/20",
      glow: "shadow-[0_0_0_1px_var(--color-accent-warm),0_2px_8px_rgba(194,105,61,0.12),0_8px_24px_rgba(194,105,61,0.08),inset_0_1px_0_rgba(255,255,255,0.6)]",
      gradient: "from-[var(--color-accent-warm)]/[0.04] to-transparent",
    },
  }
  const c = colors[accentColor]

  return (
    <div
      ref={ref}
      className={cn(
        "relative",
        "bg-[var(--color-bg-surface)]",
        "rounded-[var(--radius-lg)]",
        `border-2 ${c.border}`,
        `ring-1 ring-inset ${c.ring}`,
        c.glow,
        "transition-all duration-[var(--duration-normal)] ease-[var(--ease-out)]",
        "overflow-hidden",
        className
      )}
      {...props}
    >
      {/* Subtle gradient wash from top */}
      <div className={cn(
        "absolute inset-0 pointer-events-none bg-gradient-to-b",
        c.gradient
      )} />
      <div className="relative">
        {children}
      </div>
    </div>
  )
})
CardFeatured.displayName = "CardFeatured"

const CardHeader = forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex items-center justify-between gap-4",
      "px-5 py-4",
      "border-b border-[var(--color-border)]",
      className
    )}
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
      "font-[family-name:var(--font-display)] font-semibold text-[var(--text-h3)]",
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
  <div ref={ref} className={cn("px-5 py-4", className)} {...props} />
))
CardContent.displayName = "CardContent"

const CardFooter = forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex items-center gap-3",
      "px-5 py-3",
      "border-t border-[var(--color-border)]",
      "bg-[var(--color-bg-hover)]/40",
      className
    )}
    {...props}
  />
))
CardFooter.displayName = "CardFooter"

export { Card, CardPremium, CardFeatured, CardHeader, CardTitle, CardContent, CardFooter }
