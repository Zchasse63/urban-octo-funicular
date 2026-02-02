'use client'

import * as React from 'react'
import Link from 'next/link'
import { Podcast, Mic } from 'lucide-react'
import { TopoCard } from '@/components/ui/card'

export interface ShowCardData {
  id: string
  name: string
  description: string | null
  artworkUrl: string | null
  episodeCount: number
  defaultLanguage: string
}

interface ShowCardProps {
  show: ShowCardData
  onClick?: (id: string) => void
}

const languageLabels: Record<string, string> = {
  en: 'English',
  es: 'Spanish',
  fr: 'French',
  de: 'German',
  pt: 'Portuguese',
  it: 'Italian',
  ja: 'Japanese',
  ko: 'Korean',
  zh: 'Chinese',
}

export function ShowCard({ show, onClick }: ShowCardProps) {
  const handleClick = () => {
    onClick?.(show.id)
  }

  return (
    <Link href={`/shows/${show.id}/episodes`} onClick={handleClick}>
      <TopoCard className="cursor-pointer h-full">
        <div className="flex flex-col h-full">
          {/* Artwork */}
          <div className="flex items-start gap-4 mb-4">
            {show.artworkUrl ? (
              <img
                src={show.artworkUrl}
                alt={`${show.name} artwork`}
                className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
              />
            ) : (
              <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-[var(--bg-subtle)] to-[var(--border-soft)] flex items-center justify-center flex-shrink-0">
                <Podcast className="h-8 w-8 text-[var(--text-tertiary)]" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-[var(--text-primary)] truncate">
                {show.name}
              </h3>
              <span className="inline-flex items-center px-2 py-0.5 mt-1 text-[10px] font-medium uppercase tracking-wide bg-[var(--bg-subtle)] text-[var(--text-secondary)] rounded">
                {languageLabels[show.defaultLanguage] || show.defaultLanguage}
              </span>
            </div>
          </div>

          {/* Description */}
          {show.description && (
            <p className="text-sm text-[var(--text-secondary)] mb-4 line-clamp-2 flex-grow">
              {show.description}
            </p>
          )}

          {/* Stats */}
          <div className="flex items-center gap-1 text-xs text-[var(--text-tertiary)] mt-auto pt-4 border-t border-[var(--border-soft)]">
            <Mic className="h-3.5 w-3.5" />
            <span>
              {show.episodeCount} {show.episodeCount === 1 ? 'episode' : 'episodes'}
            </span>
          </div>
        </div>
      </TopoCard>
    </Link>
  )
}
