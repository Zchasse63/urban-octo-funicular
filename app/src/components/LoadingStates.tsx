/**
 * LoadingStates - Reusable loading UI components for PodBrain
 * Provides skeletons, spinners, and page-level loading states
 */

import * as React from 'react'

/**
 * Animated skeleton placeholder for individual cards
 */
export function CardSkeleton() {
  return (
    <div
      className="topo-card animate-pulse"
      role="status"
      aria-label="Loading content"
    >
      <div className="h-4 bg-[var(--bg-subtle)] rounded w-3/4 mb-3" />
      <div className="h-3 bg-[var(--bg-subtle)] rounded w-full mb-2" />
      <div className="h-3 bg-[var(--bg-subtle)] rounded w-5/6" />
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
      className="flex items-center gap-4 px-4 py-3 border-b border-[var(--border-soft)] animate-pulse"
      role="status"
      aria-label="Loading row"
    >
      <div className="h-3 bg-[var(--bg-subtle)] rounded w-12" />
      <div className="h-3 bg-[var(--bg-subtle)] rounded flex-1" />
      <div className="h-3 bg-[var(--bg-subtle)] rounded w-24" />
      <div className="h-3 bg-[var(--bg-subtle)] rounded w-16" />
    </div>
  )
}
