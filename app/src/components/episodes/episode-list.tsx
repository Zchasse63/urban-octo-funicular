"use client"

import { cn } from "@/lib/utils"
import { useState, useMemo } from "react"
import { SearchBar } from "@/components/ui/search-bar"
import { FilterPills, type FilterOption } from "@/components/ui/filter-pills"
import { Skeleton } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/ui/empty-state"
import { ProcessingBanner } from "@/components/ui/processing-banner"
import { EpisodeRow } from "./episode-row"
import { Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import useEpisodes from "@/hooks/use-episodes"
import type { EpisodeStatus } from "@/types/database"

function EpisodeList() {
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  const { episodes, total, isLoading } = useEpisodes({
    status: statusFilter === "all" ? undefined : statusFilter,
    search: search || undefined,
  })

  // Count episodes by status for filter badges
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {
      all: total,
      completed: 0,
      processing: 0,
      pending: 0,
      failed: 0,
    }
    episodes.forEach((ep) => {
      if (counts[ep.status] !== undefined) {
        counts[ep.status]++
      }
    })
    // If showing "all", use the actual counts from the list
    if (statusFilter === "all") {
      counts.all = total
    }
    return counts
  }, [episodes, total, statusFilter])

  const processingCount = episodes.filter(
    (ep) => ep.status === ("processing" as EpisodeStatus)
  ).length

  const filterOptions: FilterOption[] = [
    { label: "All", value: "all", count: statusCounts.all },
    { label: "Completed", value: "completed", count: statusCounts.completed },
    { label: "Processing", value: "processing", count: statusCounts.processing },
    { label: "Draft", value: "pending", count: statusCounts.pending },
  ]

  return (
    <div className="flex flex-col gap-4">
      {/* Processing banner */}
      <ProcessingBanner processingCount={processingCount} />

      {/* Search + Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SearchBar
          value={search}
          onValueChange={setSearch}
          placeholder="Search episodes, guests…"
          shortcutHint="⌘K"
          className="w-full sm:max-w-xs"
        />
        <FilterPills
          options={filterOptions}
          activeValue={statusFilter}
          onChange={setStatusFilter}
        />
      </div>

      {/* Episode list */}
      {isLoading ? (
        <div className="flex flex-col gap-3">
          {[0, 1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className={cn(
                "flex items-center gap-4 rounded-[var(--radius-md)] border border-[var(--color-border)]",
                "bg-[var(--color-bg-surface)] px-4 py-3.5",
                `stagger-${Math.min(i + 1, 6) as 1 | 2 | 3 | 4 | 5 | 6}`
              )}
            >
              <Skeleton className="h-2.5 w-2.5 rounded-full" />
              <div className="flex flex-1 flex-col gap-2">
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-3 w-1/3" />
              </div>
              <Skeleton className="h-8 w-8 rounded-full" />
            </div>
          ))}
        </div>
      ) : episodes.length === 0 ? (
        <EmptyState
          icon={Upload}
          title="No episodes yet"
          description="Upload your first episode to get started with AI-powered show notes and content."
          action={
            <Button asChild>
              <Link href="/upload">Upload First Episode</Link>
            </Button>
          }
        />
      ) : (
        <div className="flex flex-col gap-2">
          {episodes.map((episode, i) => (
            <div
              key={episode.id}
              className={`animate-enter stagger-${Math.min(i + 1, 6) as 1 | 2 | 3 | 4 | 5 | 6}`}
            >
              <EpisodeRow episode={episode} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export { EpisodeList }
