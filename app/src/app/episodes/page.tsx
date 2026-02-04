'use client'

import * as React from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { EpisodeList } from '@/components/episodes/episode-list'
import { EpisodeSearch } from '@/components/podbrain/search'
import type { EpisodeRowData } from '@/components/episodes/episode-row'
import { TableRowSkeleton } from '@/components/LoadingStates'

// Mock data for demonstration - showing different episode states
const mockEpisodes: EpisodeRowData[] = [
  {
    id: 'ep-001',
    episodeNumber: 47,
    title: 'Building AI-First Products with Sarah Chen',
    date: '2026-01-28',
    healthScore: 92,
    status: 'completed',
  },
  {
    id: 'ep-002',
    episodeNumber: 46,
    title: 'The Future of Remote Work: Lessons from 2025',
    date: '2026-01-21',
    healthScore: null,
    status: 'processing',
  },
  {
    id: 'ep-003',
    episodeNumber: 45,
    title: 'Scaling Your Startup: From 10 to 100 Employees',
    date: '2026-01-14',
    healthScore: 68,
    status: 'pending',
    alertCount: 2,
  },
  {
    id: 'ep-004',
    episodeNumber: 44,
    title: 'Deep Dive into Podcast Monetization Strategies',
    date: '2026-01-07',
    healthScore: 85,
    status: 'completed',
  },
  {
    id: 'ep-005',
    episodeNumber: 43,
    title: 'Content Repurposing: Getting 10x Value from Every Episode',
    date: '2025-12-28',
    healthScore: 54,
    status: 'pending',
    alertCount: 4,
  },
  {
    id: 'ep-006',
    episodeNumber: 42,
    title: 'SEO for Podcasters: A Comprehensive Guide',
    date: '2025-12-21',
    healthScore: 91,
    status: 'completed',
  },
]

export default function EpisodesPage() {
  const [isLoading, setIsLoading] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState('')

  const handleEpisodeClick = (id: string) => {
    // Navigate to episode detail page
    // In a real app: router.push(`/episodes/${id}`)
  }

  const handleNewTransformation = () => {
    // Open new transformation modal or navigate to upload page
    // In a real app: router.push('/episodes/new') or open modal
  }

  const handleSearchChange = (value: string) => {
    setSearchQuery(value)
  }

  const handleSearch = (query: string) => {
    setSearchQuery(query)
  }

  // Filter episodes based on search query
  const filteredEpisodes = React.useMemo(() => {
    if (!searchQuery.trim()) {
      return mockEpisodes
    }
    const lowerQuery = searchQuery.toLowerCase()
    return mockEpisodes.filter(
      (episode) =>
        episode.title.toLowerCase().includes(lowerQuery) ||
        episode.episodeNumber.toString().includes(lowerQuery)
    )
  }, [searchQuery])

  return (
    <div className="animate-in">
      {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 sm:mb-8">
          <h1 className="font-mono text-xs font-medium uppercase tracking-[0.1em] text-[var(--text-secondary)]">
            Episodes
          </h1>
          <Button
            onClick={handleNewTransformation}
            className="min-h-[44px]"
            aria-label="Create new transformation"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            New Transformation
          </Button>
        </div>

        {/* Episode Search */}
        <div className="mb-6">
          <EpisodeSearch
            placeholder="Search episodes by title or number..."
            value={searchQuery}
            onChange={handleSearchChange}
            onSearch={handleSearch}
          />
        </div>

        {/* Episode List */}
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <TableRowSkeleton key={i} />
            ))}
          </div>
        ) : (
        <EpisodeList
          episodes={filteredEpisodes}
          onEpisodeClick={handleEpisodeClick}
          searchQuery={searchQuery}
        />
      )}
    </div>
  )
}
