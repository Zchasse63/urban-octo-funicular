'use client'

import * as React from 'react'
import { Plus, Podcast } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ShowCard, type ShowCardData } from '@/components/shows/show-card'
import { CreateShowModal } from '@/components/shows/create-show-modal'

// Mock data for demonstration
const mockShows: ShowCardData[] = [
  {
    id: 'show-001',
    name: 'The Tech Founders Podcast',
    description: 'Conversations with founders building the future of technology',
    artworkUrl: null,
    episodeCount: 47,
    defaultLanguage: 'en',
  },
  {
    id: 'show-002',
    name: 'Marketing Masterclass',
    description: 'Weekly insights on digital marketing and growth strategies',
    artworkUrl: null,
    episodeCount: 23,
    defaultLanguage: 'en',
  },
  {
    id: 'show-003',
    name: 'Startup Stories',
    description: 'Behind-the-scenes tales from the startup world',
    artworkUrl: null,
    episodeCount: 12,
    defaultLanguage: 'en',
  },
]

export default function ShowsPage() {
  const [isCreateModalOpen, setIsCreateModalOpen] = React.useState(false)
  const [shows, setShows] = React.useState<ShowCardData[]>(mockShows)

  const handleShowClick = (id: string) => {
    // Navigate to show episodes page
    console.log('Navigate to show:', id)
    // In a real app: router.push(`/shows/${id}/episodes`)
  }

  const handleCreateShow = (showData: {
    name: string
    description: string
    defaultLanguage: string
    artworkFile: File | null
  }) => {
    // Create new show - in real app this would call the API
    const newShow: ShowCardData = {
      id: `show-${Date.now()}`,
      name: showData.name,
      description: showData.description,
      artworkUrl: null,
      episodeCount: 0,
      defaultLanguage: showData.defaultLanguage,
    }
    setShows([newShow, ...shows])
    setIsCreateModalOpen(false)
    console.log('Created show:', showData)
  }

  return (
    <div className="min-h-screen bg-[var(--bg-base)]">
      <main className="max-w-6xl mx-auto px-6 py-8 animate-in">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="font-mono text-xs font-medium uppercase tracking-[0.1em] text-[var(--text-secondary)]">
            Shows
          </h1>
          <Button onClick={() => setIsCreateModalOpen(true)}>
            <Plus className="h-4 w-4" />
            Create New Show
          </Button>
        </div>

        {/* Shows Grid */}
        {shows.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {shows.map((show) => (
              <ShowCard
                key={show.id}
                show={show}
                onClick={handleShowClick}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-24">
            <div className="w-16 h-16 rounded-full bg-[var(--bg-subtle)] flex items-center justify-center mb-4">
              <Podcast className="h-8 w-8 text-[var(--text-tertiary)]" />
            </div>
            <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
              No shows yet
            </h2>
            <p className="text-sm text-[var(--text-secondary)] mb-6 text-center max-w-md">
              Create your first show to start uploading episodes and generating AI-powered show notes.
            </p>
            <Button onClick={() => setIsCreateModalOpen(true)}>
              <Plus className="h-4 w-4" />
              Create Your First Show
            </Button>
          </div>
        )}

        {/* Create Show Modal */}
        <CreateShowModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onCreate={handleCreateShow}
        />
      </main>
    </div>
  )
}
