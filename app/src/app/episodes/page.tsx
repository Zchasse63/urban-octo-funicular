'use client'

import * as React from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { EpisodeList } from '@/components/episodes/episode-list'
import type { EpisodeRowData } from '@/components/episodes/episode-row'

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
  const handleEpisodeClick = (id: string) => {
    // Navigate to episode detail page
    console.log('Navigate to episode:', id)
    // In a real app: router.push(`/episodes/${id}`)
  }

  const handleNewTransformation = () => {
    // Open new transformation modal or navigate to upload page
    console.log('New transformation clicked')
    // In a real app: router.push('/episodes/new') or open modal
  }

  return (
    <div className="min-h-screen bg-[var(--bg-base)]">
      <main className="max-w-6xl mx-auto px-6 py-8 animate-in">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="font-mono text-xs font-medium uppercase tracking-[0.1em] text-[var(--text-secondary)]">
            Episodes
          </h1>
          <Button onClick={handleNewTransformation}>
            <Plus className="h-4 w-4" />
            New Transformation
          </Button>
        </div>

        {/* Episode List */}
        <EpisodeList
          episodes={mockEpisodes}
          onEpisodeClick={handleEpisodeClick}
        />
      </main>
    </div>
  )
}
