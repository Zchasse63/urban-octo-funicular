'use client'

import * as React from 'react'
import { Search } from 'lucide-react'
import { cn } from '@/lib/utils'
import { EpisodeRow, type EpisodeRowData } from './episode-row'

type FilterTab = 'all' | 'last30days' | 'hasAlerts' | 'processing'

interface EpisodeListProps {
  episodes: EpisodeRowData[]
  onEpisodeClick?: (id: string) => void
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

export function EpisodeList({ episodes, onEpisodeClick }: EpisodeListProps) {
  const [activeFilter, setActiveFilter] = React.useState<FilterTab>('all')
  const [searchQuery, setSearchQuery] = React.useState('')

  const filteredEpisodes = React.useMemo(
    () => filterEpisodes(episodes, activeFilter, searchQuery),
    [episodes, activeFilter, searchQuery]
  )

  return (
    <div className="flex flex-col gap-4">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-tertiary)]" />
        <input
          type="text"
          placeholder="Search episodes..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className={cn(
            'w-full pl-10 pr-4 py-2.5',
            'bg-[var(--bg-subtle)] border border-[var(--border-soft)] rounded-lg',
            'text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)]',
            'focus:outline-none focus:border-[var(--accent-blue)] focus:shadow-[var(--shadow-focus)]',
            'transition-all duration-200'
          )}
        />
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-1 border-b border-[var(--border-soft)]">
        {filterTabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveFilter(tab.key)}
            className={cn(
              'px-4 py-2.5 text-sm font-medium transition-colors duration-150',
              'border-b-2 -mb-px',
              activeFilter === tab.key
                ? 'border-[var(--text-primary)] text-[var(--text-primary)]'
                : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Episodes Table */}
      <div className="overflow-hidden rounded-xl border border-[var(--border-soft)] bg-[var(--bg-elevated)]">
        <table className="w-full">
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
              filteredEpisodes.map((episode) => (
                <EpisodeRow
                  key={episode.id}
                  episode={episode}
                  onClick={onEpisodeClick}
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
      </div>

      {/* Results Count */}
      <p className="text-xs text-[var(--text-tertiary)] text-right">
        Showing {filteredEpisodes.length} of {episodes.length} episodes
      </p>
    </div>
  )
}
