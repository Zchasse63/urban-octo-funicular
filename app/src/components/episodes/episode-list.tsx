'use client'

import * as React from 'react'
import { Check, AlertTriangle, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { EpisodeRow, type EpisodeRowData } from './episode-row'
import type { EpisodeStatus } from '@/types/database'

type FilterTab = 'all' | 'last30days' | 'hasAlerts' | 'processing'

interface EpisodeListProps {
  episodes: EpisodeRowData[]
  onEpisodeClick?: (id: string) => void
  searchQuery?: string
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

const filterTabs: { key: FilterTab; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'last30days', label: 'Last 30 days' },
  { key: 'hasAlerts', label: 'Has alerts' },
  { key: 'processing', label: 'Processing' },
]

function isWithinLast30Days(dateStr: string): boolean {
  const date = new Date(dateStr)
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  return date >= thirtyDaysAgo
}

function filterEpisodes(episodes: EpisodeRowData[], filter: FilterTab, searchQuery: string): EpisodeRowData[] {
  let filtered = episodes

  // Apply filter tab
  switch (filter) {
    case 'last30days':
      filtered = filtered.filter(ep => isWithinLast30Days(ep.date))
      break
    case 'hasAlerts':
      filtered = filtered.filter(ep => ep.alertCount && ep.alertCount > 0)
      break
    case 'processing':
      filtered = filtered.filter(ep => ep.status === 'processing')
      break
    case 'all':
    default:
      break
  }

  // Apply search query
  if (searchQuery.trim()) {
    const query = searchQuery.toLowerCase()
    filtered = filtered.filter(ep =>
      ep.title.toLowerCase().includes(query) ||
      `ep ${ep.episodeNumber}`.includes(query) ||
      ep.episodeNumber.toString().includes(query)
    )
  }

  return filtered
}

export function EpisodeList({ episodes, onEpisodeClick, searchQuery = '' }: EpisodeListProps) {
  const [activeFilter, setActiveFilter] = React.useState<FilterTab>('all')

  const filteredEpisodes = React.useMemo(
    () => filterEpisodes(episodes, activeFilter, searchQuery),
    [episodes, activeFilter, searchQuery]
  )

  return (
    <div className="flex flex-col gap-4">

      {/* Filter Tabs */}
      <div className="flex gap-1 border-b border-[var(--border-soft)] overflow-x-auto">
        {filterTabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveFilter(tab.key)}
            className={cn(
              'px-3 sm:px-4 py-3 sm:py-2.5 text-sm font-medium transition-colors duration-150',
              'border-b-2 -mb-px whitespace-nowrap min-h-[44px] sm:min-h-0',
              activeFilter === tab.key
                ? 'border-[var(--text-primary)] text-[var(--text-primary)]'
                : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            )}
            role="tab"
            aria-selected={activeFilter === tab.key}
            aria-label={`Filter by ${tab.label}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Episodes Table/Cards */}
      <div className="overflow-hidden rounded-xl border border-[var(--border-soft)] bg-[var(--bg-elevated)]">
        {/* Desktop: Table */}
        <table className="w-full hidden sm:table">
          <thead>
            <tr className="border-b border-[var(--border-soft)] bg-[var(--bg-subtle)]">
              <th className="py-3 px-4 text-left">
                <span className="font-mono text-xs font-medium uppercase tracking-wider text-[var(--text-secondary)]">
                  Episode
                </span>
              </th>
              <th className="py-3 px-4 text-left">
                <span className="font-mono text-xs font-medium uppercase tracking-wider text-[var(--text-secondary)]">
                  Date
                </span>
              </th>
              <th className="py-3 px-4 text-left">
                <span className="font-mono text-xs font-medium uppercase tracking-wider text-[var(--text-secondary)]">
                  Health Score
                </span>
              </th>
              <th className="py-3 px-4 text-left">
                <span className="font-mono text-xs font-medium uppercase tracking-wider text-[var(--text-secondary)]">
                  Status
                </span>
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredEpisodes.length > 0 ? (
              filteredEpisodes.map((episode, index) => (
                <EpisodeRow
                  key={episode.id}
                  episode={episode}
                  onClick={onEpisodeClick}
                  index={index}
                />
              ))
            ) : (
              <tr>
                <td colSpan={4} className="py-12 text-center">
                  <p className="text-[var(--text-secondary)]">No episodes found</p>
                  <p className="text-sm text-[var(--text-tertiary)] mt-1">
                    {searchQuery ? 'Try adjusting your search query' : 'Upload your first episode to get started'}
                  </p>
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Mobile: Card Layout */}
        <div className="sm:hidden divide-y divide-[var(--border-soft)]">
          {filteredEpisodes.length > 0 ? (
            filteredEpisodes.map((episode) => (
              <button
                key={episode.id}
                onClick={() => onEpisodeClick?.(episode.id)}
                className="w-full p-4 text-left hover:bg-[var(--bg-subtle)] transition-colors min-h-[100px]"
                aria-label={`View episode ${episode.episodeNumber}: ${episode.title}`}
              >
                <div className="flex flex-col gap-2">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <span className="font-mono text-xs text-[var(--text-tertiary)] block mb-1">
                        EP {episode.episodeNumber.toString().padStart(3, '0')}
                      </span>
                      <h3 className="font-medium text-[var(--text-primary)] text-sm leading-snug">
                        {episode.title}
                      </h3>
                    </div>
                    <StatusBadge status={episode.status} alertCount={episode.alertCount} />
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-[var(--text-secondary)]">{episode.date}</span>
                    <span className={cn(
                      'font-mono font-semibold',
                      episode.healthScore !== null && episode.healthScore > 80 ? 'text-[var(--accent-green)]' :
                      episode.healthScore !== null && episode.healthScore >= 60 ? 'text-[var(--accent-amber)]' :
                      episode.healthScore !== null ? 'text-[var(--accent-red)]' :
                      'text-[var(--text-tertiary)]'
                    )}>
                      {episode.healthScore !== null ? `Score: ${episode.healthScore}` : 'No score'}
                    </span>
                  </div>
                </div>
              </button>
            ))
          ) : (
            <div className="py-12 text-center px-4">
              <p className="text-[var(--text-secondary)]">No episodes found</p>
              <p className="text-sm text-[var(--text-tertiary)] mt-1">
                {searchQuery ? 'Try adjusting your search query' : 'Upload your first episode to get started'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Results Count */}
      <p className="text-xs text-[var(--text-tertiary)] text-right">
        Showing {filteredEpisodes.length} of {episodes.length} episodes
      </p>
    </div>
  )
}
