"use client"

import { useState } from "react"
import {
  Brain,
  Search,
  ExternalLink,
  Star,
  Mic,
} from "lucide-react"
import { PageHeader } from "@/components/layout/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { EmptyState } from "@/components/ui/empty-state"
import { Skeleton } from "@/components/ui/skeleton"
import useShows from "@/hooks/use-shows"
import useExperts from "@/hooks/use-experts"

export default function ExpertsPage() {
  const { shows } = useShows()
  const selectedShowId = shows[0]?.id || ""
  const { experts, topic, isLoading, search } = useExperts({ showId: selectedShowId })
  const [query, setQuery] = useState("")

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) search(query.trim())
  }

  return (
    <>
      <PageHeader
        title="Expert Finder"
        description="Discover potential guests and subject matter experts from your episode content"
      />

      <div className="space-y-6">
        {/* Search */}
        <Card>
          <CardContent>
            <form onSubmit={handleSearch} className="flex gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-tertiary)]" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search for a topic, e.g., 'machine learning', 'startup fundraising'..."
                  className="pl-9"
                />
              </div>
              <Button type="submit" disabled={!query.trim() || isLoading || !selectedShowId}>
                <Brain className="w-4 h-4" />
                Find Experts
              </Button>
            </form>
            {!selectedShowId && (
              <p className="text-[var(--text-caption)] text-[var(--color-accent-warm)] mt-2">
                Create a show first to use the expert finder.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Results */}
        {isLoading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="space-y-3">
                  <Skeleton className="h-5 w-48" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : experts.length > 0 ? (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-label">Results for</span>
              <Badge variant="blue">{topic}</Badge>
              <span className="text-[var(--text-caption)] text-[var(--color-text-tertiary)]">
                {experts.length} expert{experts.length !== 1 ? "s" : ""} found
              </span>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {experts.map((expert) => (
                <Card key={expert.id} className="hover:shadow-[var(--shadow-card-hover)] transition-shadow">
                  <CardContent className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-[family-name:var(--font-display)] font-semibold text-[var(--text-body)] text-[var(--color-text-ink)]">
                          {expert.name}
                        </h3>
                        {expert.metadata?.affiliation && (
                          <p className="text-[var(--text-caption)] text-[var(--color-text-secondary)]">
                            {expert.metadata.affiliation}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <Star className="w-3.5 h-3.5 text-[var(--color-accent-warm)]" />
                        <span className="text-mono text-[var(--color-accent-warm)] font-medium">
                          {Math.round(expert.freshnessScore * 100)}%
                        </span>
                      </div>
                    </div>

                    {expert.metadata?.bio && (
                      <p className="text-[var(--text-body-sm)] text-[var(--color-text-secondary)] line-clamp-3">
                        {expert.metadata.bio}
                      </p>
                    )}

                    {expert.expertise.length > 0 && (
                      <div className="flex gap-1.5 flex-wrap">
                        {expert.expertise.slice(0, 4).map((topic, j) => (
                          <Badge key={j} variant="default">{topic}</Badge>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-[var(--text-caption)] text-[var(--color-text-tertiary)]">
                        <Mic className="w-3.5 h-3.5" />
                        <span>{expert.appearanceCount} appearance{expert.appearanceCount !== 1 ? "s" : ""}</span>
                      </div>
                      <Badge variant={
                        expert.category === "fresh" ? "success"
                          : expert.category === "established" ? "blue"
                            : "warm"
                      }>
                        {expert.category}
                      </Badge>
                    </div>

                    {expert.contactHints.website && (
                      <a
                        href={expert.contactHints.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-[var(--text-caption)] text-[var(--color-accent-blue)] hover:underline"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        Website
                      </a>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ) : topic ? (
          <EmptyState
            icon={Brain}
            title="No experts found"
            description={`No experts matched "${topic}". Try a different topic or process more episodes to build the knowledge base.`}
          />
        ) : (
          <EmptyState
            icon={Brain}
            title="Search for experts"
            description="Enter a topic to find potential guests and experts from your episode content. The AI analyzes transcripts to identify subject matter experts."
          />
        )}
      </div>
    </>
  )
}
