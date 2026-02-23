"use client"

import { Upload, Mic, Search, Filter, Sparkles } from "lucide-react"
import Link from "next/link"
import { useState } from "react"
import { PageHeader } from "@/components/layout/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { EmptyState } from "@/components/ui/empty-state"
import { EpisodeRow } from "@/components/episodes/episode-row"
import useEpisodes from "@/hooks/use-episodes"

export default function EpisodesPage() {
  const { episodes, total, isLoading } = useEpisodes()
  const [searchQuery, setSearchQuery] = useState("")

  const filtered = searchQuery
    ? episodes.filter(
        (ep) =>
          ep.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          ep.guest_name?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : episodes

  return (
    <>
      <PageHeader
        title="Episodes"
        description={total > 0 ? `${total} episode${total !== 1 ? "s" : ""} in your library` : undefined}
        actions={
          <Button asChild>
            <Link href="/upload">
              <Upload className="w-4 h-4" />
              Upload Episode
            </Link>
          </Button>
        }
      />

      {/* Search + Filters */}
      {total > 0 && (
        <div className="flex items-center gap-3 mb-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-tertiary)]" />
            <Input
              placeholder="Search episodes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button variant="secondary" size="sm">
            <Filter className="w-3.5 h-3.5" />
            Filter
          </Button>
        </div>
      )}

      {/* Episode List */}
      {isLoading ? (
        <Card>
          <div className="space-y-0">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-5 py-3 border-b border-[var(--color-border)] last:border-0">
                <div className="w-2 h-2 rounded-full bg-[var(--color-border)] animate-pulse" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-4 w-48 bg-[var(--color-border)] rounded animate-pulse" />
                  <div className="h-3 w-24 bg-[var(--color-border)] rounded animate-pulse opacity-60" />
                </div>
                <div className="h-5 w-8 bg-[var(--color-border)] rounded-[var(--radius-sm)] animate-pulse" />
                <div className="h-4 w-20 bg-[var(--color-border)] rounded animate-pulse opacity-60" />
              </div>
            ))}
          </div>
        </Card>
      ) : filtered.length > 0 ? (
        <Card>
          {/* Column headers */}
          <div className="flex items-center gap-4 px-5 py-2 border-b border-[var(--color-border)] bg-[var(--color-bg-hover)]/50">
            <div className="w-2" />
            <div className="flex-1 text-label">Episode</div>
            <div className="w-12 text-center text-label">SEO</div>
            <div className="w-24 text-right text-label">Date</div>
            <div className="w-8" />
          </div>

          {/* Rows */}
          {filtered.map((episode) => (
            <EpisodeRow
              key={episode.id}
              id={episode.id}
              title={episode.title}
              status={episode.status}
              seoScore={episode.seo_score}
              guestName={episode.guest_name}
              createdAt={episode.created_at}
            />
          ))}

          {/* Summary footer */}
          {filtered.length > 3 && (
            <div className="flex items-center justify-between px-5 py-2.5 border-t border-[var(--color-border)] bg-[var(--color-bg-hover)]/30">
              <span className="text-[var(--text-caption)] text-[var(--color-text-tertiary)] font-[family-name:var(--font-mono)]">
                {filtered.length} episode{filtered.length !== 1 ? "s" : ""}
              </span>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="text-[var(--text-caption)] text-[var(--color-accent-blue)] hover:underline"
                >
                  Clear search
                </button>
              )}
            </div>
          )}
        </Card>
      ) : searchQuery ? (
        <Card>
          <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
            <Search className="w-8 h-8 text-[var(--color-text-tertiary)]" />
            <div>
              <h3 className="font-[family-name:var(--font-display)] font-semibold text-[var(--text-h3)] text-[var(--color-text-ink)]">
                No matches found
              </h3>
              <p className="text-[var(--text-body-sm)] text-[var(--color-text-secondary)] mt-1">
                Try a different search term
              </p>
            </div>
            <button
              onClick={() => setSearchQuery("")}
              className="text-[var(--text-body-sm)] text-[var(--color-accent-blue)] hover:underline mt-1"
            >
              Clear search
            </button>
          </div>
        </Card>
      ) : (
        <EmptyState
          icon={Mic}
          title="No episodes yet"
          description="Upload your first episode to get started. PodBrain will generate show notes, SEO analysis, and 30+ content assets."
          action={
            <Button asChild>
              <Link href="/upload">
                <Sparkles className="w-4 h-4" />
                Upload Your First Episode
              </Link>
            </Button>
          }
        />
      )}
    </>
  )
}
