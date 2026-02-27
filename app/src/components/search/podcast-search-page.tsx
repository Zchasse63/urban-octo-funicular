"use client"

import { useCallback, type FormEvent } from 'react'
import { Search, Podcast, Radio, ChevronLeft, ChevronRight, ExternalLink, Clock, Disc3 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { cn, formatDuration, truncate } from '@/lib/utils'
import usePodcastSearch from '@/hooks/use-podcast-search'
import type { TaddyPodcast, TaddyEpisode } from '@/lib/taddy/types'

// ─── Type Guard Helpers ──────────────────────────────────────────────────────

function isPodcastArray(results: (TaddyPodcast | TaddyEpisode)[]): results is TaddyPodcast[] {
  if (results.length === 0) return true
  return 'totalEpisodesCount' in results[0]
}

function isEpisodeArray(results: (TaddyPodcast | TaddyEpisode)[]): results is TaddyEpisode[] {
  if (results.length === 0) return true
  return 'audioUrl' in results[0]
}

// ─── Search Page ─────────────────────────────────────────────────────────────

export function PodcastSearchPage() {
  const {
    query,
    type,
    page,
    results,
    resultCount,
    isLoading,
    error,
    hasSearched,
    setQuery,
    setType,
    search,
    nextPage,
    prevPage,
  } = usePodcastSearch()

  const handleSubmit = useCallback(
    (e: FormEvent) => {
      e.preventDefault()
      search()
    },
    [search]
  )

  const handleTypeChange = useCallback(
    (newType: 'PODCASTSERIES' | 'PODCASTEPISODE') => {
      setType(newType)
      if (query.trim()) {
        search(query, newType)
      }
    },
    [setType, search, query]
  )

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="font-sans text-2xl font-bold tracking-tight text-foreground">
          Podcast Search
        </h1>
        <p className="text-sm font-serif text-muted-foreground">
          Discover podcasts and episodes across the podcast ecosystem
        </p>
      </div>

      {/* Search Bar */}
      <Card className="p-4">
        <form onSubmit={handleSubmit} className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder={type === 'PODCASTSERIES' ? 'Search podcasts...' : 'Search episodes...'}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9 font-sans"
            />
          </div>
          <Button type="submit" disabled={!query.trim() || isLoading}>
            {isLoading ? (
              <Disc3 className="w-4 h-4 animate-spin" />
            ) : (
              'Search'
            )}
          </Button>
        </form>

        {/* Type Toggle */}
        <div className="flex items-center gap-1 mt-3">
          <TypeToggle
            icon={Podcast}
            label="Podcasts"
            isActive={type === 'PODCASTSERIES'}
            onClick={() => handleTypeChange('PODCASTSERIES')}
          />
          <TypeToggle
            icon={Radio}
            label="Episodes"
            isActive={type === 'PODCASTEPISODE'}
            onClick={() => handleTypeChange('PODCASTEPISODE')}
          />
        </div>
      </Card>

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-900/20 p-4">
          <p className="text-[13px] font-sans text-red-700 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Results */}
      {hasSearched && !error && (
        <>
          {resultCount > 0 && (
            <p className="text-[12px] font-mono font-semibold text-muted-foreground uppercase tracking-wider">
              {resultCount} result{resultCount !== 1 ? 's' : ''} &middot; Page {page}
            </p>
          )}

          {results.length === 0 && !isLoading && (
            <EmptyState type={type} query={query} />
          )}

          {type === 'PODCASTSERIES' && isPodcastArray(results) && results.length > 0 && (
            <div className="grid gap-4 sm:grid-cols-2">
              {results.map((podcast) => (
                <PodcastCard key={podcast.uuid} podcast={podcast} />
              ))}
            </div>
          )}

          {type === 'PODCASTEPISODE' && isEpisodeArray(results) && results.length > 0 && (
            <div className="space-y-3">
              {results.map((episode) => (
                <EpisodeCard key={episode.uuid} episode={episode} />
              ))}
            </div>
          )}

          {/* Pagination */}
          {results.length > 0 && (
            <div className="flex items-center justify-center gap-3 pt-2 pb-8">
              <Button
                variant="secondary"
                size="sm"
                onClick={prevPage}
                disabled={page <= 1 || isLoading}
                className="gap-1.5"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                Previous
              </Button>
              <span className="text-[12px] font-mono font-semibold text-muted-foreground tabular-nums">
                Page {page}
              </span>
              <Button
                variant="secondary"
                size="sm"
                onClick={nextPage}
                disabled={results.length === 0 || isLoading}
                className="gap-1.5"
              >
                Next
                <ChevronRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          )}
        </>
      )}

      {/* Initial empty state */}
      {!hasSearched && !isLoading && <InitialState />}
    </div>
  )
}

// ─── Type Toggle Button ──────────────────────────────────────────────────────

function TypeToggle({
  icon: Icon,
  label,
  isActive,
  onClick,
}: {
  icon: React.ElementType
  label: string
  isActive: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] font-sans font-medium transition-all',
        isActive
          ? 'bg-foreground text-background shadow-sm'
          : 'text-muted-foreground hover:text-foreground hover:bg-accent'
      )}
    >
      <Icon className="w-3.5 h-3.5" />
      {label}
    </button>
  )
}

// ─── Podcast Card ────────────────────────────────────────────────────────────

function PodcastCard({ podcast }: { podcast: TaddyPodcast }) {
  return (
    <Card className="flex gap-4 p-4 transition-shadow hover:shadow-md">
      {/* Image */}
      <div className="flex-shrink-0">
        {podcast.imageUrl ? (
          <img
            src={podcast.imageUrl}
            alt=""
            className="w-16 h-16 rounded-lg object-cover bg-muted"
            loading="lazy"
          />
        ) : (
          <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center">
            <Podcast className="w-6 h-6 text-muted-foreground" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0 space-y-1.5">
        <h3 className="font-sans text-[14px] font-semibold text-foreground leading-tight line-clamp-1">
          {podcast.name}
        </h3>
        {podcast.authorName && (
          <p className="text-[11px] font-sans text-muted-foreground">
            by {podcast.authorName}
          </p>
        )}
        <p className="text-[12px] font-serif text-muted-foreground line-clamp-2 leading-relaxed">
          {truncate(stripHtmlBasic(podcast.description), 200)}
        </p>
        <div className="flex items-center gap-3 pt-1">
          <span className="flex items-center gap-1 text-[10px] font-mono font-semibold text-muted-foreground">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            {podcast.totalEpisodesCount} episodes
          </span>
          {podcast.language && (
            <span className="text-[10px] font-mono text-muted-foreground uppercase">
              {podcast.language}
            </span>
          )}
          {podcast.websiteUrl && (
            <a
              href={podcast.websiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-0.5 text-[10px] font-mono text-blue-600 dark:text-blue-400 hover:underline"
            >
              Website
              <ExternalLink className="w-2.5 h-2.5" />
            </a>
          )}
        </div>
      </div>
    </Card>
  )
}

// ─── Episode Card ────────────────────────────────────────────────────────────

function EpisodeCard({ episode }: { episode: TaddyEpisode }) {
  const publishedDate = episode.datePublished
    ? new Date(episode.datePublished * 1000).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : null

  return (
    <Card className="flex gap-4 p-4 transition-shadow hover:shadow-md">
      {/* Podcast Image */}
      <div className="flex-shrink-0">
        {episode.podcastSeries?.imageUrl ? (
          <img
            src={episode.podcastSeries.imageUrl}
            alt=""
            className="w-12 h-12 rounded-lg object-cover bg-muted"
            loading="lazy"
          />
        ) : (
          <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
            <Radio className="w-5 h-5 text-muted-foreground" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0 space-y-1.5">
        <h3 className="font-sans text-[13px] font-semibold text-foreground leading-tight line-clamp-1">
          {episode.name}
        </h3>
        {episode.podcastSeries && (
          <p className="text-[11px] font-sans text-muted-foreground">
            {episode.podcastSeries.name}
          </p>
        )}
        <p className="text-[12px] font-serif text-muted-foreground line-clamp-2 leading-relaxed">
          {truncate(stripHtmlBasic(episode.description), 200)}
        </p>
        <div className="flex items-center gap-3 pt-1">
          {publishedDate && (
            <span className="text-[10px] font-mono text-muted-foreground">
              {publishedDate}
            </span>
          )}
          {episode.duration > 0 && (
            <span className="flex items-center gap-1 text-[10px] font-mono text-muted-foreground">
              <Clock className="w-2.5 h-2.5" />
              {formatDuration(episode.duration)}
            </span>
          )}
          {episode.audioUrl && (
            <a
              href={episode.audioUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-0.5 text-[10px] font-mono text-blue-600 dark:text-blue-400 hover:underline"
            >
              Listen
              <ExternalLink className="w-2.5 h-2.5" />
            </a>
          )}
        </div>
      </div>
    </Card>
  )
}

// ─── Empty / Initial States ──────────────────────────────────────────────────

function EmptyState({ type, query }: { type: string; query: string }) {
  return (
    <div className="flex flex-col items-center py-16 space-y-3">
      <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
        <Search className="w-5 h-5 text-muted-foreground" />
      </div>
      <p className="text-[14px] font-sans font-semibold text-foreground">No results found</p>
      <p className="text-[12px] font-serif text-muted-foreground text-center max-w-xs">
        No {type === 'PODCASTSERIES' ? 'podcasts' : 'episodes'} matched &ldquo;{query}&rdquo;.
        Try a different search term.
      </p>
    </div>
  )
}

function InitialState() {
  return (
    <div className="flex flex-col items-center py-20 space-y-4">
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-100 to-orange-50 dark:from-orange-900/30 dark:to-orange-900/10 flex items-center justify-center border border-orange-200/50 dark:border-orange-800/30">
        <Search className="w-7 h-7 text-orange-600 dark:text-orange-400" />
      </div>
      <div className="text-center space-y-1.5">
        <p className="text-[16px] font-sans font-bold text-foreground">Search the podcast directory</p>
        <p className="text-[13px] font-serif text-muted-foreground max-w-sm">
          Find podcasts and episodes across the entire podcast ecosystem.
          Search by name, topic, or keyword.
        </p>
      </div>
    </div>
  )
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function stripHtmlBasic(text: string): string {
  return text.replace(/<[^>]+>/g, '').trim()
}
