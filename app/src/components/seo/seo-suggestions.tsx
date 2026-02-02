'use client'

import * as React from 'react'
import {
  AlertCircle,
  AlertTriangle,
  Info,
  Sparkles,
  Check,
  ChevronRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { TopoCard, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { SEOSuggestion } from '@/lib/seo/analyzer'

interface SEOSuggestionsProps {
  suggestions: SEOSuggestion[]
  onApplyFix?: (suggestion: SEOSuggestion) => void
  className?: string
}

interface SuggestionItemProps {
  suggestion: SEOSuggestion
  onApply?: () => void
  isApplied?: boolean
}

function PriorityIcon({ priority }: { priority: SEOSuggestion['priority'] }) {
  switch (priority) {
    case 'high':
      return <AlertCircle className="w-4 h-4 text-[var(--accent-red)]" />
    case 'medium':
      return <AlertTriangle className="w-4 h-4 text-[var(--accent-amber)]" />
    case 'low':
      return <Info className="w-4 h-4 text-[var(--accent-blue)]" />
  }
}

function PriorityBadge({ priority }: { priority: SEOSuggestion['priority'] }) {
  const variants: Record<SEOSuggestion['priority'], 'error' | 'warning' | 'new'> = {
    high: 'error',
    medium: 'warning',
    low: 'new',
  }

  return (
    <Badge variant={variants[priority]} className="capitalize text-[10px]">
      {priority}
    </Badge>
  )
}

function SuggestionItem({ suggestion, onApply, isApplied }: SuggestionItemProps) {
  return (
    <div
      className={cn(
        'group flex items-start gap-3 p-4 rounded-lg border border-[var(--border-soft)]',
        'bg-[var(--bg-elevated)] transition-all duration-200',
        'hover:shadow-[var(--shadow-subtle)]',
        isApplied && 'opacity-60'
      )}
    >
      {/* Priority Icon */}
      <div className="flex-shrink-0 mt-0.5">
        {isApplied ? (
          <div className="w-4 h-4 rounded-full bg-[var(--accent-green)] flex items-center justify-center">
            <Check className="w-2.5 h-2.5 text-white" />
          </div>
        ) : (
          <PriorityIcon priority={suggestion.priority} />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h4 className={cn(
            'text-sm font-medium text-[var(--text-primary)]',
            isApplied && 'line-through'
          )}>
            {suggestion.title}
          </h4>
          <PriorityBadge priority={suggestion.priority} />
        </div>
        <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
          {suggestion.description}
        </p>
      </div>

      {/* Action Button */}
      {suggestion.autoFixable && onApply && !isApplied && (
        <Button
          variant="secondary"
          size="sm"
          onClick={onApply}
          className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <Sparkles className="w-3 h-3" />
          Apply
        </Button>
      )}

      {!suggestion.autoFixable && !isApplied && (
        <ChevronRight className="w-4 h-4 text-[var(--text-tertiary)] flex-shrink-0 mt-0.5" />
      )}
    </div>
  )
}

export function SEOSuggestions({
  suggestions,
  onApplyFix,
  className,
}: SEOSuggestionsProps) {
  const [appliedIds, setAppliedIds] = React.useState<Set<string>>(new Set())

  const handleApply = (suggestion: SEOSuggestion) => {
    if (onApplyFix) {
      onApplyFix(suggestion)
      setAppliedIds(prev => new Set([...prev, suggestion.id]))
    }
  }

  // Group suggestions by priority
  const highPriority = suggestions.filter(s => s.priority === 'high')
  const mediumPriority = suggestions.filter(s => s.priority === 'medium')
  const lowPriority = suggestions.filter(s => s.priority === 'low')

  const pendingCount = suggestions.length - appliedIds.size

  if (suggestions.length === 0) {
    return (
      <TopoCard className={className} hover={false}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            SEO Suggestions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="w-12 h-12 rounded-full bg-[rgba(52,199,89,0.1)] flex items-center justify-center mb-3">
              <Check className="w-6 h-6 text-[var(--accent-green)]" />
            </div>
            <p className="text-sm font-medium text-[var(--text-primary)]">
              Looking good!
            </p>
            <p className="text-xs text-[var(--text-secondary)] mt-1">
              No SEO improvements needed
            </p>
          </div>
        </CardContent>
      </TopoCard>
    )
  }

  return (
    <TopoCard className={className} hover={false}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="w-4 h-4" />
          SEO Suggestions
        </CardTitle>
        {pendingCount > 0 && (
          <Badge variant="default" className="text-[10px]">
            {pendingCount} remaining
          </Badge>
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        {/* High Priority */}
        {highPriority.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-mono text-[10px] font-medium uppercase tracking-[0.05em] text-[var(--accent-red)]">
              High Priority
            </h3>
            <div className="space-y-2">
              {highPriority.map(suggestion => (
                <SuggestionItem
                  key={suggestion.id}
                  suggestion={suggestion}
                  onApply={() => handleApply(suggestion)}
                  isApplied={appliedIds.has(suggestion.id)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Medium Priority */}
        {mediumPriority.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-mono text-[10px] font-medium uppercase tracking-[0.05em] text-[var(--accent-amber)]">
              Medium Priority
            </h3>
            <div className="space-y-2">
              {mediumPriority.map(suggestion => (
                <SuggestionItem
                  key={suggestion.id}
                  suggestion={suggestion}
                  onApply={() => handleApply(suggestion)}
                  isApplied={appliedIds.has(suggestion.id)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Low Priority */}
        {lowPriority.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-mono text-[10px] font-medium uppercase tracking-[0.05em] text-[var(--accent-blue)]">
              Nice to Have
            </h3>
            <div className="space-y-2">
              {lowPriority.map(suggestion => (
                <SuggestionItem
                  key={suggestion.id}
                  suggestion={suggestion}
                  onApply={() => handleApply(suggestion)}
                  isApplied={appliedIds.has(suggestion.id)}
                />
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </TopoCard>
  )
}

// Export individual components
export { SuggestionItem, PriorityBadge, PriorityIcon }
