import * as React from "react"
import { cn } from "@/lib/utils"

// Topo Card - Primary elevated card with layered shadow
const TopoCard = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { hover?: boolean }
>(({ className, hover = true, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "relative overflow-hidden rounded-xl border border-[var(--border-soft)] bg-[var(--bg-elevated)] p-6",
      "shadow-[0_1px_2px_rgba(0,0,0,0.02),0_4px_12px_rgba(0,0,0,0.03),0_12px_32px_rgba(0,0,0,0.04)]",
      hover && "transition-all duration-300 ease-[cubic-bezier(0.19,1,0.22,1)] hover:-translate-y-0.5 hover:shadow-[0_4px_6px_rgba(0,0,0,0.02),0_15px_45px_rgba(0,0,0,0.06)]",
      // Top edge highlight
      "before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-white/80 before:to-transparent",
      className
    )}
    {...props}
  />
))
TopoCard.displayName = "TopoCard"

// Card Header with mono label
const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center justify-between mb-6", className)}
    {...props}
  />
))
CardHeader.displayName = "CardHeader"

// Card Title (mono style)
const CardTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "font-mono text-xs font-medium uppercase tracking-[0.05em] text-[var(--text-secondary)]",
      className
    )}
    {...props}
  />
))
CardTitle.displayName = "CardTitle"

// Card Content
const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("", className)} {...props} />
))
CardContent.displayName = "CardContent"

// Metric Card - For displaying scores and KPIs
const MetricCard = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-lg border border-transparent bg-[var(--bg-subtle)] p-4",
      className
    )}
    {...props}
  />
))
MetricCard.displayName = "MetricCard"

// Metric Value
const MetricValue = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-2xl font-bold my-1", className)}
    {...props}
  />
))
MetricValue.displayName = "MetricValue"

// Metric Label
const MetricLabel = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex items-center gap-1 text-xs text-[var(--text-secondary)]",
      className
    )}
    {...props}
  />
))
MetricLabel.displayName = "MetricLabel"

// Alert Card
interface AlertCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'info' | 'success' | 'warning' | 'error'
}

const AlertCard = React.forwardRef<HTMLDivElement, AlertCardProps>(
  ({ className, variant = 'info', ...props }, ref) => {
    const borderColors = {
      info: 'border-l-[var(--accent-blue)]',
      success: 'border-l-[var(--accent-green)]',
      warning: 'border-l-[var(--accent-amber)]',
      error: 'border-l-[var(--accent-red)]',
    }

    return (
      <div
        ref={ref}
        className={cn(
          "rounded-lg border-l-[3px] bg-[var(--bg-subtle)] p-4",
          borderColors[variant],
          className
        )}
        {...props}
      />
    )
  }
)
AlertCard.displayName = "AlertCard"

export {
  TopoCard,
  CardHeader,
  CardTitle,
  CardContent,
  MetricCard,
  MetricValue,
  MetricLabel,
  AlertCard,
}
