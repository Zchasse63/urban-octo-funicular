/**
 * LoadingStates - Reusable loading UI components for PodBrain
 * Provides skeletons, spinners, and page-level loading states
 */

import * as React from 'react'
import { cn } from '@/lib/utils'
import { ProcessingState, AIContentReveal } from '@/components/podbrain/processing-states'

/**
 * Base Skeleton component with shimmer animation
 */
export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-shimmer rounded-lg bg-[var(--bg-subtle)]", className)}
      {...props}
    />
  )
}

/**
 * Animated skeleton placeholder for individual cards
 */
export function CardSkeleton() {
  return (
    <div
      className="topo-card"
      role="status"
      aria-label="Loading content"
    >
      <Skeleton className="h-4 w-3/4 mb-3" />
      <Skeleton className="h-3 w-full mb-2" />
      <Skeleton className="h-3 w-5/6" />
    </div>
  )
}

/**
 * Grid of card skeletons for list loading states
 */
export function ListSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      role="status"
      aria-label="Loading list"
    >
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  )
}

/**
 * Circular loading spinner using design system colors
 * @deprecated Consider using ProcessingState for AI processing UIs
 */
export function Spinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  }

  return (
    <div
      className={`${sizeClasses[size]} animate-spin rounded-full border-2 border-[var(--border-soft)] border-t-[var(--accent-blue)]`}
      role="status"
      aria-label="Loading"
    />
  )
}

/**
 * Full-page loading state with centered spinner
 * @deprecated Consider using ProcessingState for AI processing UIs
 */
export function PageLoader({ message }: { message?: string }) {
  return (
    <div
      className="flex flex-col items-center justify-center min-h-[400px] gap-4"
      role="status"
      aria-label={message || "Loading page"}
    >
      <Spinner size="lg" />
      {message && (
        <p className="text-sm text-[var(--text-secondary)]">
          {message}
        </p>
      )}
    </div>
  )
}

/**
 * Table row skeleton for episode list
 */
export function TableRowSkeleton() {
  return (
    <div
      className="flex items-center gap-4 px-4 py-3 border-b border-[var(--border-soft)]"
      role="status"
      aria-label="Loading row"
    >
      <Skeleton className="h-3 w-12" />
      <Skeleton className="h-3 flex-1" />
      <Skeleton className="h-3 w-24" />
      <Skeleton className="h-3 w-16" />
    </div>
  )
}

/**
 * Metric card skeleton for dashboard KPIs
 */
export function MetricSkeleton() {
  return (
    <div
      className="relative overflow-hidden rounded-xl border border-[var(--border-soft)] bg-[var(--bg-elevated)] p-4"
      role="status"
      aria-label="Loading metric"
    >
      <Skeleton className="h-3 w-20 mb-2" />
      <Skeleton className="h-8 w-16 mb-1" />
      <Skeleton className="h-3 w-12" />
    </div>
  )
}

// Export new Kokonut UI-based components
export { ProcessingState, AIContentReveal }
