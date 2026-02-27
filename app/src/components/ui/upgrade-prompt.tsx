'use client'

import { ArrowUpRight, Sparkles } from 'lucide-react'
import Link from 'next/link'

interface UpgradePromptProps {
  title: string
  description: string
  currentUsage?: number
  limit?: number
  variant?: 'inline' | 'banner' | 'modal'
  className?: string
}

export function UpgradePrompt({
  title,
  description,
  currentUsage,
  limit,
  variant = 'inline',
  className = '',
}: UpgradePromptProps) {
  // If variant is 'banner', render a full-width amber banner
  if (variant === 'banner') {
    return (
      <div className={`bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-4 ${className}`}>
        <div className="flex items-start gap-3">
          <Sparkles className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-amber-900 dark:text-amber-100">{title}</p>
            <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">{description}</p>
            {currentUsage !== undefined && limit !== undefined && (
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                {currentUsage} of {limit} used
              </p>
            )}
          </div>
          <Link
            href="/settings?tab=billing"
            className="inline-flex items-center gap-1 text-sm font-medium text-amber-700 dark:text-amber-300 hover:text-amber-900 dark:hover:text-amber-100 shrink-0"
          >
            Upgrade
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    )
  }

  // Default 'inline' variant - a compact card
  return (
    <div className={`bg-accent/5 border border-accent/20 rounded-lg p-4 ${className}`}>
      <div className="flex items-center gap-2 mb-2">
        <Sparkles className="h-4 w-4 text-accent" />
        <p className="text-sm font-medium text-foreground">{title}</p>
      </div>
      <p className="text-sm text-muted-foreground">{description}</p>
      {currentUsage !== undefined && limit !== undefined && (
        <div className="mt-2">
          <div className="flex justify-between text-xs text-muted-foreground mb-1">
            <span>{currentUsage} used</span>
            <span>{limit} limit</span>
          </div>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-accent rounded-full transition-all"
              style={{ width: `${Math.min(100, (currentUsage / limit) * 100)}%` }}
            />
          </div>
        </div>
      )}
      <Link
        href="/settings?tab=billing"
        className="inline-flex items-center gap-1 text-sm font-medium text-accent hover:text-accent/80 mt-3"
      >
        View plans
        <ArrowUpRight className="h-3.5 w-3.5" />
      </Link>
    </div>
  )
}
