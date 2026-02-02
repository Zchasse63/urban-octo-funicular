'use client'

import * as React from 'react'
import { Check, AlertTriangle, Loader2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { EpisodeStatus } from '@/types/database'

export interface EpisodeRowData {
  id: string
  episodeNumber: number
  title: string
  date: string
  healthScore: number | null
  status: EpisodeStatus
  alertCount?: number
}

interface EpisodeRowProps {
  episode: EpisodeRowData
  onClick?: (id: string) => void
}

function getHealthScoreColor(score: number | null): string {
  if (score === null) return 'text-[var(--text-tertiary)]'
  if (score > 80) return 'text-[var(--accent-green)]'
  if (score >= 60) return 'text-[var(--accent-amber)]'
  return 'text-[var(--accent-red)]'
}

function StatusBadge({ status, alertCount }: { status: EpisodeStatus; alertCount?: number }) {
  switch (status) {
    case 'completed':
      return (
        <Badge variant="success" className="gap-1">
          <Check className="h-3 w-3" />
          Complete
        </Badge>
      )
    case 'processing':
      return (
        <Badge variant="new" className="gap-1">
          <Loader2 className="h-3 w-3 animate-spin" />
          Processing
        </Badge>
      )
    case 'failed':
      return (
        <Badge variant="error" className="gap-1">
          <AlertTriangle className="h-3 w-3" />
          Failed
        </Badge>
      )
    case 'pending':
      if (alertCount && alertCount > 0) {
        return (
          <Badge variant="warning" className="gap-1">
            <AlertTriangle className="h-3 w-3" />
            {alertCount} Alert{alertCount > 1 ? 's' : ''}
          </Badge>
        )
      }
      return (
        <Badge variant="default">
          Pending
        </Badge>
      )
    default:
      return null
  }
}

export function EpisodeRow({ episode, onClick }: EpisodeRowProps) {
  const handleClick = () => {
    onClick?.(episode.id)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onClick?.(episode.id)
    }
  }

  return (
    <tr
      className={cn(
        'group border-b border-[var(--border-soft)] transition-colors duration-150',
        'hover:bg-[var(--bg-subtle)] cursor-pointer',
        'focus-visible:outline-none focus-visible:bg-[var(--bg-subtle)]'
      )}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="button"
      aria-label={`View episode ${episode.episodeNumber}: ${episode.title}`}
    >
      <td className="py-4 px-4">
        <div className="flex flex-col gap-1">
          <span className="font-mono text-xs text-[var(--text-tertiary)]">
            EP {episode.episodeNumber.toString().padStart(3, '0')}
          </span>
          <span className="font-medium text-[var(--text-primary)] group-hover:text-[var(--accent-blue)] transition-colors">
            {episode.title}
          </span>
        </div>
      </td>
      <td className="py-4 px-4">
        <span className="text-sm text-[var(--text-secondary)]">
          {episode.date}
        </span>
      </td>
      <td className="py-4 px-4">
        <span className={cn(
          'font-mono text-sm font-semibold',
          getHealthScoreColor(episode.healthScore)
        )}>
          {episode.healthScore !== null ? episode.healthScore : '--'}
        </span>
      </td>
      <td className="py-4 px-4">
        <StatusBadge status={episode.status} alertCount={episode.alertCount} />
      </td>
    </tr>
  )
}
