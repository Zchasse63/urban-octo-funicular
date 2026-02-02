'use client'

import * as React from 'react'
import { Search, Headphones, Clock, Calendar, Pencil } from 'lucide-react'
import { cn } from '@/lib/utils'
import { TopoCard, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatDurationDisplay } from '@/lib/seo/schema-generator'

interface SearchPreviewProps {
  title: string
  url: string
  description: string
  showName?: string
  duration?: number // seconds
  publishDate?: string
  onEditTitle?: () => void
  onEditDescription?: () => void
  className?: string
}

function truncateTitle(title: string, maxLength = 60): string {
  if (title.length <= maxLength) return title
  return title.substring(0, maxLength - 3) + '...'
}

function truncateDescription(description: string, maxLength = 155): string {
  if (description.length <= maxLength) return description
  return description.substring(0, maxLength - 3) + '...'
}

function formatUrl(url: string): string {
  try {
    const urlObj = new URL(url)
    const pathParts = urlObj.pathname.split('/').filter(Boolean)
    if (pathParts.length === 0) return urlObj.hostname
    return `${urlObj.hostname} > ${pathParts.join(' > ')}`
  } catch {
    return url
  }
}

function CharacterCount({
  current,
  max,
  label,
}: {
  current: number
  max: number
  label: string
}) {
  const isOver = current > max
  const isNearLimit = current > max * 0.9

  return (
    <span
      className={cn(
        'text-[10px] font-mono',
        isOver
          ? 'text-[var(--accent-red)]'
          : isNearLimit
            ? 'text-[var(--accent-amber)]'
            : 'text-[var(--text-tertiary)]'
      )}
    >
      {current}/{max} {label}
    </span>
  )
}

export function SearchPreview({
  title,
  url,
  description,
  showName,
  duration,
  publishDate,
  onEditTitle,
  onEditDescription,
  className,
}: SearchPreviewProps) {
  const displayTitle = truncateTitle(title)
  const displayDescription = truncateDescription(description)
  const displayUrl = formatUrl(url)

  const formattedDate = publishDate
    ? new Date(publishDate).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : null

  return (
    <TopoCard className={className} hover={false}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="w-4 h-4" />
          Search Preview
        </CardTitle>
        <div className="flex items-center gap-3 text-[10px] text-[var(--text-tertiary)]">
          <CharacterCount current={title.length} max={60} label="title" />
          <CharacterCount current={description.length} max={155} label="desc" />
        </div>
      </CardHeader>
      <CardContent>
        {/* Google Search Result Mock */}
        <div className="rounded-lg border border-[var(--border-soft)] bg-white p-4">
          {/* Favicon and URL breadcrumb */}
          <div className="flex items-center gap-2 mb-1">
            <div className="w-7 h-7 rounded-full bg-[var(--bg-subtle)] flex items-center justify-center">
              <Headphones className="w-4 h-4 text-[var(--text-secondary)]" />
            </div>
            <div className="flex flex-col">
              <span className="text-xs text-[var(--text-secondary)]">
                {displayUrl}
              </span>
            </div>
          </div>

          {/* Title */}
          <div className="group flex items-start gap-2 mb-1">
            <h3
              className="text-xl text-[#1a0dab] hover:underline cursor-pointer font-normal leading-snug"
              style={{ fontFamily: 'arial, sans-serif' }}
            >
              {displayTitle}
            </h3>
            {onEditTitle && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onEditTitle}
                className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
              >
                <Pencil className="w-3 h-3" />
              </Button>
            )}
          </div>

          {/* Rich snippet metadata */}
          <div className="flex items-center gap-3 mb-2 text-xs text-[#70757a]">
            {formattedDate && (
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {formattedDate}
              </span>
            )}
            {duration && (
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formatDurationDisplay(duration)}
              </span>
            )}
            {showName && (
              <span className="flex items-center gap-1">
                <Headphones className="w-3 h-3" />
                {showName}
              </span>
            )}
          </div>

          {/* Description */}
          <div className="group flex items-start gap-2">
            <p
              className="text-sm text-[#4d5156] leading-relaxed"
              style={{ fontFamily: 'arial, sans-serif' }}
            >
              {displayDescription}
            </p>
            {onEditDescription && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onEditDescription}
                className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
              >
                <Pencil className="w-3 h-3" />
              </Button>
            )}
          </div>
        </div>

        {/* Helper text */}
        <div className="mt-4 space-y-2">
          <p className="text-xs text-[var(--text-secondary)]">
            This is a preview of how your episode might appear in Google search results.
            Actual appearance may vary based on search context.
          </p>

          {/* SEO Tips */}
          <div className="flex flex-wrap gap-2">
            {title.length > 60 && (
              <span className="inline-flex items-center gap-1 text-[10px] px-2 py-1 rounded bg-[rgba(239,68,68,0.08)] text-[var(--accent-red)]">
                Title may be truncated
              </span>
            )}
            {description.length > 155 && (
              <span className="inline-flex items-center gap-1 text-[10px] px-2 py-1 rounded bg-[rgba(239,68,68,0.08)] text-[var(--accent-red)]">
                Description may be truncated
              </span>
            )}
            {title.length <= 60 && description.length <= 155 && (
              <span className="inline-flex items-center gap-1 text-[10px] px-2 py-1 rounded bg-[rgba(52,199,89,0.08)] text-[var(--accent-green)]">
                Good length for search display
              </span>
            )}
          </div>
        </div>
      </CardContent>
    </TopoCard>
  )
}

// Export helper functions
export { truncateTitle, truncateDescription, formatUrl, CharacterCount }
