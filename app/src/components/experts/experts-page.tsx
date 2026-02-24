"use client"

import { cn } from "@/lib/utils"
import { useState, useEffect } from "react"
import { PageHeader } from "@/components/layout/page-header"
import { SearchBar } from "@/components/ui/search-bar"
import { StatCard } from "@/components/ui/stat-card"
import { Skeleton } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/ui/empty-state"
import { ExpertCard } from "./expert-card"
import { Users, UserPlus, Clock, Search } from "lucide-react"
import useShows from "@/hooks/use-shows"
import useExperts from "@/hooks/use-experts"

function ExpertsPage() {
  const { shows } = useShows()
  const currentShowId = shows[0]?.id
  const { experts, isLoading, search } = useExperts({ showId: currentShowId })
  const [query, setQuery] = useState("")

  // Auto-search when show loads
  useEffect(() => {
    if (currentShowId && !experts.length) {
      search("podcast guest expert")
    }
  }, [currentShowId, experts.length, search])

  const handleSearch = (value: string) => {
    setQuery(value)
    if (value.trim() && currentShowId) {
      search(value)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Experts"
        badge={{ label: "AI POWERED", variant: "blue" }}
        description="Discover and manage guest experts with AI-powered matching"
      />

      {/* Stats */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard
          icon={UserPlus}
          label="Recently Added"
          value={experts.filter((e) => e.category === "fresh").length}
        />
        <StatCard
          icon={Users}
          label="Total Experts"
          value={experts.length}
        />
        <StatCard
          icon={Clock}
          label="Pending Review"
          value={experts.filter((e) => e.category === "established").length}
        />
      </div>

      {/* Search */}
      <SearchBar
        value={query}
        onValueChange={handleSearch}
        placeholder="Search experts by topic, name, or expertise…"
        shortcutHint="⌘K"
        className="max-w-md"
      />

      {/* Expert grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className={cn(
                "rounded-[var(--radius-md)] border border-[var(--color-border)]",
                "bg-[var(--color-bg-surface)] p-4"
              )}
            >
              <div className="flex gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1">
                  <Skeleton className="mb-2 h-4 w-2/3" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
              <Skeleton className="mt-3 h-3 w-full" />
              <div className="mt-3 flex gap-1">
                <Skeleton className="h-5 w-16 rounded-full" />
                <Skeleton className="h-5 w-20 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      ) : experts.length === 0 ? (
        <EmptyState
          icon={Search}
          title="Search for experts"
          description="Enter a topic to discover potential podcast guests with AI-powered matching scores."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {experts.map((expert, i) => (
            <div
              key={expert.id}
              className={`animate-enter stagger-${Math.min(i + 1, 6) as 1 | 2 | 3 | 4 | 5 | 6}`}
            >
              <ExpertCard expert={expert} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export { ExpertsPage }
