"use client"

import { useState, useEffect, useCallback } from "react"
import {
  BookOpen,
  Plus,
  Search,
  Trash2,
  Pencil,
  X,
  Check,
  Sparkles,
} from "lucide-react"
import { PageHeader } from "@/components/layout/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { EmptyState } from "@/components/ui/empty-state"
import { Skeleton } from "@/components/ui/skeleton"
import useShows from "@/hooks/use-shows"

interface VocabTerm {
  id: string
  term: string
  alternatives: string[]
  occurrence_count: number
  created_at: string
}

export default function VocabularyPage() {
  const { shows } = useShows()
  const selectedShowId = shows[0]?.id || ""

  const [terms, setTerms] = useState<VocabTerm[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [isAdding, setIsAdding] = useState(false)
  const [newTerm, setNewTerm] = useState("")
  const [newAlternatives, setNewAlternatives] = useState("")
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTerm, setEditTerm] = useState("")
  const [editAlternatives, setEditAlternatives] = useState("")

  // Fetch vocabulary when show changes
  const fetchVocabulary = useCallback(async () => {
    if (!selectedShowId) return
    setIsLoading(true)
    try {
      const response = await fetch(`/api/shows/${selectedShowId}/vocabulary`)
      if (response.ok) {
        const result = await response.json()
        setTerms(result.data || result || [])
      }
    } catch {
      // Silent fail — will show empty state
    } finally {
      setIsLoading(false)
    }
  }, [selectedShowId])

  // Auto-fetch on mount
  useEffect(() => {
    if (selectedShowId) fetchVocabulary()
  }, [selectedShowId, fetchVocabulary])

  const handleAdd = useCallback(async () => {
    if (!newTerm.trim() || !selectedShowId) return
    try {
      const response = await fetch(`/api/shows/${selectedShowId}/vocabulary`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          term: newTerm.trim(),
          alternatives: newAlternatives.split(",").map(a => a.trim()).filter(Boolean),
        }),
      })
      if (response.ok) {
        setNewTerm("")
        setNewAlternatives("")
        setIsAdding(false)
        fetchVocabulary()
      }
    } catch {
      // Silent fail
    }
  }, [newTerm, newAlternatives, selectedShowId, fetchVocabulary])

  const handleDelete = useCallback(async (termId: string) => {
    if (!selectedShowId) return
    try {
      await fetch(`/api/shows/${selectedShowId}/vocabulary/${termId}`, {
        method: "DELETE",
      })
      setTerms(prev => prev.filter(t => t.id !== termId))
    } catch {
      // Silent fail
    }
  }, [selectedShowId])

  const startEdit = useCallback((term: VocabTerm) => {
    setEditingId(term.id)
    setEditTerm(term.term)
    setEditAlternatives(term.alternatives.join(", "))
  }, [])

  const handleUpdate = useCallback(async () => {
    if (!editingId || !editTerm.trim() || !selectedShowId) return
    try {
      await fetch(`/api/shows/${selectedShowId}/vocabulary/${editingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          term: editTerm.trim(),
          alternatives: editAlternatives.split(",").map(a => a.trim()).filter(Boolean),
        }),
      })
      setEditingId(null)
      fetchVocabulary()
    } catch {
      // Silent fail
    }
  }, [editingId, editTerm, editAlternatives, selectedShowId, fetchVocabulary])

  const filteredTerms = terms.filter(t =>
    t.term.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.alternatives.some(a => a.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  return (
    <>
      <PageHeader
        title="Vocabulary"
        description="Custom terms the AI learns for better transcription accuracy"
        actions={
          <Button onClick={() => setIsAdding(true)}>
            <Plus className="w-4 h-4" />
            Add Term
          </Button>
        }
      />

      <Card>
        {/* Search */}
        <div className="px-5 py-3 border-b border-[var(--color-border)]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-tertiary)]" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search terms..."
              className="pl-9"
            />
          </div>
        </div>

        {/* Add form */}
        {isAdding && (
          <div className="px-5 py-4 border-b border-[var(--color-border)] bg-[var(--color-bg-hover)] space-y-3">
            <div className="space-y-1.5">
              <label className="text-label">Term</label>
              <Input
                value={newTerm}
                onChange={(e) => setNewTerm(e.target.value)}
                placeholder="e.g., Kubernetes"
                autoFocus
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-label">Alternatives <span className="text-[var(--color-text-tertiary)]">(comma-separated)</span></label>
              <Input
                value={newAlternatives}
                onChange={(e) => setNewAlternatives(e.target.value)}
                placeholder="e.g., K8s, kube"
              />
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" onClick={handleAdd} disabled={!newTerm.trim()}>
                <Check className="w-3.5 h-3.5" />
                Add
              </Button>
              <Button variant="ghost" size="sm" onClick={() => { setIsAdding(false); setNewTerm(""); setNewAlternatives("") }}>
                Cancel
              </Button>
            </div>
          </div>
        )}

        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-5 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : filteredTerms.length === 0 ? (
            <div className="py-12">
              <EmptyState
                icon={searchQuery ? Search : BookOpen}
                title={searchQuery ? "No matching terms" : "No vocabulary yet"}
                description={
                  searchQuery
                    ? "Try a different search query."
                    : "Add custom terms to improve AI transcription accuracy. The AI will learn your show's unique vocabulary over time."
                }
                action={
                  !searchQuery ? (
                    <Button onClick={() => setIsAdding(true)}>
                      <Plus className="w-4 h-4" />
                      Add First Term
                    </Button>
                  ) : undefined
                }
              />
            </div>
          ) : (
            <div>
              {filteredTerms.map((term) => (
                <div
                  key={term.id}
                  className="flex items-center gap-4 px-5 py-3 border-b border-[var(--color-border)] last:border-b-0 hover:bg-[var(--color-bg-hover)] transition-colors group"
                >
                  {editingId === term.id ? (
                    /* Edit mode */
                    <div className="flex-1 space-y-2">
                      <Input
                        value={editTerm}
                        onChange={(e) => setEditTerm(e.target.value)}
                        autoFocus
                      />
                      <Input
                        value={editAlternatives}
                        onChange={(e) => setEditAlternatives(e.target.value)}
                        placeholder="Alternatives (comma-separated)"
                      />
                      <div className="flex gap-2">
                        <Button size="sm" onClick={handleUpdate}>
                          <Check className="w-3.5 h-3.5" />
                          Save
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => setEditingId(null)}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    /* Display mode */
                    <>
                      <Sparkles className="w-4 h-4 text-[var(--color-accent-warm)] flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <span className="font-[family-name:var(--font-display)] font-medium text-[var(--text-body-sm)] text-[var(--color-text-ink)]">
                          {term.term}
                        </span>
                        {term.alternatives.length > 0 && (
                          <div className="flex gap-1.5 mt-1 flex-wrap">
                            {term.alternatives.map((alt, i) => (
                              <Badge key={i} variant="default">{alt}</Badge>
                            ))}
                          </div>
                        )}
                      </div>
                      <span className="text-mono text-[var(--color-text-tertiary)] flex-shrink-0">
                        {term.occurrence_count}x
                      </span>
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 flex-shrink-0">
                        <button
                          onClick={() => startEdit(term)}
                          className="p-1.5 rounded-[var(--radius-sm)] hover:bg-[var(--color-bg-active)]"
                        >
                          <Pencil className="w-3.5 h-3.5 text-[var(--color-text-tertiary)]" />
                        </button>
                        <button
                          onClick={() => handleDelete(term.id)}
                          className="p-1.5 rounded-[var(--radius-sm)] hover:bg-[var(--color-bg-active)]"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-[var(--color-status-error)]" />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </>
  )
}
