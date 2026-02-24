"use client"

import { cn } from "@/lib/utils"
import { useState, useEffect } from "react"
import { PageHeader } from "@/components/layout/page-header"
import { SearchBar } from "@/components/ui/search-bar"
import { FilterPills, type FilterOption } from "@/components/ui/filter-pills"
import { StatCard } from "@/components/ui/stat-card"
import { Skeleton } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/ui/empty-state"
import { Button } from "@/components/ui/button"
import { VocabRow } from "./vocab-row"
import { BookOpen, CheckCircle, Upload, Plus, TrendingUp, Grid3X3, AlertCircle } from "lucide-react"
import type { VocabularyTerm } from "@/types/database"

function VocabularyPage() {
  const [terms, setTerms] = useState<VocabularyTerm[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")

  useEffect(() => {
    async function fetchVocabulary() {
      try {
        // Use the first show — in single-user mode there's typically one
        const showsRes = await fetch("/api/shows")
        const showsData = await showsRes.json()
        const shows = showsData.data || showsData
        if (!Array.isArray(shows) || shows.length === 0) {
          setIsLoading(false)
          return
        }

        const res = await fetch(`/api/shows/${shows[0].id}/vocabulary`)
        if (res.ok) {
          const data = await res.json()
          setTerms(data.data || data || [])
        }
      } catch {
        // empty
      } finally {
        setIsLoading(false)
      }
    }
    fetchVocabulary()
  }, [])

  const filteredTerms = terms.filter((t) => {
    if (search) {
      const q = search.toLowerCase()
      if (!t.term.toLowerCase().includes(q) && !t.alternatives.some((a) => a.toLowerCase().includes(q))) {
        return false
      }
    }
    return true
  })

  const totalAccuracyBoost = terms.length > 0
    ? Math.round(terms.reduce((sum, t) => sum + Math.min(t.occurrence_count * 2, 15), 0) / terms.length)
    : 0

  const filterOptions: FilterOption[] = [
    { label: "All", value: "all", count: terms.length },
    { label: "Person", value: "person" },
    { label: "Technical", value: "technical" },
    { label: "Brand", value: "brand" },
  ]

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Vocabulary"
        badge={{ label: "ACTIVE", variant: "success" }}
        actions={
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button variant="secondary" size="sm">
              <CheckCircle className="h-3.5 w-3.5" />
              Validate All
            </Button>
            <Button variant="secondary" size="sm">
              <Upload className="h-3.5 w-3.5" />
              Bulk Import
            </Button>
            <Button size="sm">
              <Plus className="h-3.5 w-3.5" />
              Add Term
            </Button>
          </div>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={BookOpen}
          label="Total Terms"
          value={terms.length}
        />
        <StatCard
          icon={TrendingUp}
          label="Accuracy Boost"
          value={`+${totalAccuracyBoost}%`}
          trend={`↑ ${totalAccuracyBoost}%`}
          trendColor="success"
        />
        <StatCard
          icon={Grid3X3}
          label="Categories"
          value={4}
        />
        <StatCard
          icon={AlertCircle}
          label="Needs Review"
          value={terms.filter((t) => t.occurrence_count < 2).length}
          trendColor="warning"
        />
      </div>

      {/* Search + Filter */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SearchBar
          value={search}
          onValueChange={setSearch}
          placeholder="Search vocabulary…"
          className="w-full sm:max-w-xs"
        />
        <FilterPills
          options={filterOptions}
          activeValue={categoryFilter}
          onChange={setCategoryFilter}
        />
      </div>

      {/* Term list */}
      {isLoading ? (
        <div className="flex flex-col gap-2">
          {[0, 1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="flex items-center gap-4 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg-surface)] px-4 py-3"
            >
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-5 w-16 rounded-full" />
              <Skeleton className="ml-auto h-3 w-12" />
            </div>
          ))}
        </div>
      ) : filteredTerms.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No vocabulary terms"
          description="Add custom vocabulary to improve transcription accuracy for your show's unique terminology."
          action={
            <Button>
              <Plus className="h-4 w-4" />
              Add First Term
            </Button>
          }
        />
      ) : (
        <div className="flex flex-col gap-2">
          {filteredTerms.map((term, i) => (
            <div
              key={term.id}
              className={`animate-enter stagger-${Math.min(i + 1, 6) as 1 | 2 | 3 | 4 | 5 | 6}`}
            >
              <VocabRow term={term} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export { VocabularyPage }
