'use client'

import * as React from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Podcast, Settings, Trash2, Upload, Book, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { TopoCard, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { Show } from '@/types/database'

// Mock data for demonstration
const mockShow: Show & { episodeCount: number } = {
  id: 'show-001',
  user_id: 'user-001',
  name: 'The Tech Founders Podcast',
  description: 'Conversations with founders building the future of technology. We dive deep into the challenges, lessons, and breakthroughs of startup life.',
  default_language: 'en',
  style_preferences: {
    tone: 'professional',
    format_preferences: {
      show_notes_length: 'detailed',
      include_timestamps: true,
    },
  },
  artwork_url: null,
  created_at: '2024-06-15T10:00:00Z',
  updated_at: '2026-01-28T14:30:00Z',
  episodeCount: 47,
}

const languages = [
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Spanish' },
  { code: 'fr', label: 'French' },
  { code: 'de', label: 'German' },
  { code: 'pt', label: 'Portuguese' },
  { code: 'it', label: 'Italian' },
  { code: 'ja', label: 'Japanese' },
  { code: 'ko', label: 'Korean' },
  { code: 'zh', label: 'Chinese' },
]

const toneOptions = [
  { value: 'professional', label: 'Professional' },
  { value: 'casual', label: 'Casual' },
  { value: 'educational', label: 'Educational' },
  { value: 'conversational', label: 'Conversational' },
  { value: 'formal', label: 'Formal' },
]

export default function ShowDetailPage() {
  const params = useParams()
  const router = useRouter()
  const showId = params.id as string

  // Form state
  const [name, setName] = React.useState(mockShow.name)
  const [description, setDescription] = React.useState(mockShow.description || '')
  const [defaultLanguage, setDefaultLanguage] = React.useState(mockShow.default_language)
  const [tone, setTone] = React.useState(mockShow.style_preferences.tone || 'professional')
  const [artworkFile, setArtworkFile] = React.useState<File | null>(null)
  const [artworkPreview, setArtworkPreview] = React.useState<string | null>(mockShow.artwork_url)
  const [isSaving, setIsSaving] = React.useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false)

  const fileInputRef = React.useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setArtworkFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setArtworkPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000))
    // In real app: save show data via API
    setIsSaving(false)
  }

  const handleDelete = async () => {
    // Simulate delete API call
    // In real app: delete show via API
    router.push('/shows')
  }

  return (
    <div className="min-h-screen bg-[var(--bg-base)]">
      <main className="max-w-4xl mx-auto px-6 py-8 animate-in">
        {/* Back Link */}
        <Link
          href="/shows"
          className="inline-flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Shows
        </Link>

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div
              className="w-16 h-16 rounded-lg bg-gradient-to-br from-[var(--bg-subtle)] to-[var(--border-soft)] flex items-center justify-center"
              style={artworkPreview ? { backgroundImage: `url(${artworkPreview})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}
            >
              {!artworkPreview && <Podcast className="h-8 w-8 text-[var(--text-tertiary)]" />}
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-[var(--text-primary)]">
                {name}
              </h1>
              <p className="text-sm text-[var(--text-secondary)]">
                {mockShow.episodeCount} episodes
              </p>
            </div>
          </div>
          <Link href={`/shows/${showId}/vocabulary`}>
            <Button variant="secondary">
              <Book className="h-4 w-4" />
              Vocabulary
            </Button>
          </Link>
        </div>

        {/* Show Info Section */}
        <TopoCard className="mb-6" hover={false}>
          <CardHeader>
            <CardTitle>Show Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Artwork Upload */}
            <div>
              <label className="block font-mono text-xs font-medium uppercase tracking-[0.05em] text-[var(--text-secondary)] mb-2">
                Artwork
              </label>
              <div className="flex items-start gap-4">
                <div
                  className="w-24 h-24 rounded-lg bg-gradient-to-br from-[var(--bg-subtle)] to-[var(--border-soft)] flex items-center justify-center"
                  style={artworkPreview ? { backgroundImage: `url(${artworkPreview})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}
                  role="img"
                  aria-label={artworkPreview ? "Show artwork preview" : "No artwork"}
                >
                  {!artworkPreview && <Podcast className="h-10 w-10 text-[var(--text-tertiary)]" />}
                </div>
                <div className="flex-1">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                    id="artwork-upload"
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="h-4 w-4" />
                    Change Artwork
                  </Button>
                  <p className="text-xs text-[var(--text-tertiary)] mt-2">
                    Recommended: 1400x1400px, JPG or PNG
                  </p>
                </div>
              </div>
            </div>

            {/* Name */}
            <div>
              <label
                htmlFor="show-name"
                className="block font-mono text-xs font-medium uppercase tracking-[0.05em] text-[var(--text-secondary)] mb-2"
              >
                Show Name
              </label>
              <input
                id="show-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={cn(
                  'w-full px-4 py-2.5',
                  'bg-[var(--bg-elevated)] border border-[var(--border-soft)] rounded-lg',
                  'text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)]',
                  'focus:outline-none focus:border-[var(--accent-blue)] focus:shadow-[var(--shadow-focus)]',
                  'transition-all duration-200'
                )}
              />
            </div>

            {/* Description */}
            <div>
              <label
                htmlFor="show-description"
                className="block font-mono text-xs font-medium uppercase tracking-[0.05em] text-[var(--text-secondary)] mb-2"
              >
                Description
              </label>
              <textarea
                id="show-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className={cn(
                  'w-full px-4 py-2.5 resize-none',
                  'bg-[var(--bg-elevated)] border border-[var(--border-soft)] rounded-lg',
                  'text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)]',
                  'focus:outline-none focus:border-[var(--accent-blue)] focus:shadow-[var(--shadow-focus)]',
                  'transition-all duration-200'
                )}
              />
            </div>
          </CardContent>
        </TopoCard>

        {/* Settings Section */}
        <TopoCard className="mb-6" hover={false}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Default Language */}
            <div>
              <label
                htmlFor="default-language"
                className="block font-mono text-xs font-medium uppercase tracking-[0.05em] text-[var(--text-secondary)] mb-2"
              >
                Default Language
              </label>
              <select
                id="default-language"
                value={defaultLanguage}
                onChange={(e) => setDefaultLanguage(e.target.value)}
                className={cn(
                  'w-full px-4 py-2.5',
                  'bg-[var(--bg-elevated)] border border-[var(--border-soft)] rounded-lg',
                  'text-sm text-[var(--text-primary)]',
                  'focus:outline-none focus:border-[var(--accent-blue)] focus:shadow-[var(--shadow-focus)]',
                  'transition-all duration-200'
                )}
              >
                {languages.map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.label}
                  </option>
                ))}
              </select>
              <p className="text-xs text-[var(--text-tertiary)] mt-1">
                This will be used for new episodes unless specified otherwise.
              </p>
            </div>

            {/* Tone Preferences */}
            <div>
              <label
                htmlFor="tone"
                className="block font-mono text-xs font-medium uppercase tracking-[0.05em] text-[var(--text-secondary)] mb-2"
              >
                Content Tone
              </label>
              <select
                id="tone"
                value={tone}
                onChange={(e) => setTone(e.target.value)}
                className={cn(
                  'w-full px-4 py-2.5',
                  'bg-[var(--bg-elevated)] border border-[var(--border-soft)] rounded-lg',
                  'text-sm text-[var(--text-primary)]',
                  'focus:outline-none focus:border-[var(--accent-blue)] focus:shadow-[var(--shadow-focus)]',
                  'transition-all duration-200'
                )}
              >
                {toneOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <p className="text-xs text-[var(--text-tertiary)] mt-1">
                Influences how AI-generated content is written for this show.
              </p>
            </div>
          </CardContent>
        </TopoCard>

        {/* Save Button */}
        <div className="flex justify-end mb-8">
          <Button onClick={handleSave} disabled={isSaving}>
            <Save className="h-4 w-4" />
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>

        {/* Danger Zone */}
        <TopoCard className="border-[var(--accent-red)]/30" hover={false}>
          <CardHeader>
            <CardTitle className="text-[var(--accent-red)]">Danger Zone</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-[var(--text-primary)]">Delete Show</h4>
                <p className="text-sm text-[var(--text-secondary)]">
                  Permanently delete this show and all its episodes. This action cannot be undone.
                </p>
              </div>
              {!showDeleteConfirm ? (
                <Button
                  variant="destructive"
                  onClick={() => setShowDeleteConfirm(true)}
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </Button>
              ) : (
                <div className="flex items-center gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setShowDeleteConfirm(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleDelete}
                  >
                    Confirm Delete
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </TopoCard>
      </main>
    </div>
  )
}
