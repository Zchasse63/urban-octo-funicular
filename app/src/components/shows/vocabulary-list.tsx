'use client'

import * as React from 'react'
import { Plus, Trash2, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export interface VocabularyTermData {
  id: string
  term: string
  alternatives: string[]
  occurrenceCount: number
}

interface VocabularyListProps {
  terms: VocabularyTermData[]
  onAddTerm: (term: string, alternatives: string[]) => void
  onDeleteTerm: (id: string) => void
}

export function VocabularyList({ terms, onAddTerm, onDeleteTerm }: VocabularyListProps) {
  const [searchQuery, setSearchQuery] = React.useState('')
  const [newTerm, setNewTerm] = React.useState('')
  const [newAlternatives, setNewAlternatives] = React.useState('')
  const [isAdding, setIsAdding] = React.useState(false)
  const [deleteConfirmId, setDeleteConfirmId] = React.useState<string | null>(null)

  const filteredTerms = React.useMemo(() => {
    if (!searchQuery.trim()) return terms
    const query = searchQuery.toLowerCase()
    return terms.filter(
      (term) =>
        term.term.toLowerCase().includes(query) ||
        term.alternatives.some((alt) => alt.toLowerCase().includes(query))
    )
  }, [terms, searchQuery])

  const handleAddTerm = () => {
    if (!newTerm.trim()) return
    const alternatives = newAlternatives
      .split(',')
      .map((alt) => alt.trim())
      .filter((alt) => alt.length > 0)
    onAddTerm(newTerm.trim(), alternatives)
    setNewTerm('')
    setNewAlternatives('')
    setIsAdding(false)
  }

  const handleDelete = (id: string) => {
    onDeleteTerm(id)
    setDeleteConfirmId(null)
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Search and Add Row */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-tertiary)]" />
          <input
            type="text"
            placeholder="Search vocabulary terms..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={cn(
              'w-full pl-10 pr-4 py-2.5',
              'bg-[var(--bg-subtle)] border border-[var(--border-soft)] rounded-lg',
              'text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)]',
              'focus:outline-none focus:border-[var(--accent-blue)] focus:shadow-[var(--shadow-focus)]',
              'transition-all duration-200'
            )}
          />
        </div>
        {!isAdding && (
          <Button onClick={() => setIsAdding(true)}>
            <Plus className="h-4 w-4" />
            Add Term
          </Button>
        )}
      </div>

      {/* Add Term Form */}
      {isAdding && (
        <div className="p-4 rounded-xl border border-[var(--accent-blue)] bg-[rgba(0,122,255,0.02)]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block font-mono text-xs font-medium uppercase tracking-[0.05em] text-[var(--text-secondary)] mb-2">
                Term *
              </label>
              <input
                type="text"
                value={newTerm}
                onChange={(e) => setNewTerm(e.target.value)}
                placeholder="e.g., SaaS, TechCorp Inc."
                className={cn(
                  'w-full px-4 py-2.5',
                  'bg-[var(--bg-elevated)] border border-[var(--border-soft)] rounded-lg',
                  'text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)]',
                  'focus:outline-none focus:border-[var(--accent-blue)] focus:shadow-[var(--shadow-focus)]',
                  'transition-all duration-200'
                )}
                autoFocus
              />
            </div>
            <div>
              <label className="block font-mono text-xs font-medium uppercase tracking-[0.05em] text-[var(--text-secondary)] mb-2">
                Alternatives
              </label>
              <input
                type="text"
                value={newAlternatives}
                onChange={(e) => setNewAlternatives(e.target.value)}
                placeholder="Comma-separated alternatives"
                className={cn(
                  'w-full px-4 py-2.5',
                  'bg-[var(--bg-elevated)] border border-[var(--border-soft)] rounded-lg',
                  'text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)]',
                  'focus:outline-none focus:border-[var(--accent-blue)] focus:shadow-[var(--shadow-focus)]',
                  'transition-all duration-200'
                )}
              />
            </div>
          </div>
          <div className="flex items-center justify-end gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setIsAdding(false)
                setNewTerm('')
                setNewAlternatives('')
              }}
            >
              Cancel
            </Button>
            <Button size="sm" onClick={handleAddTerm} disabled={!newTerm.trim()}>
              Add Term
            </Button>
          </div>
        </div>
      )}

      {/* Vocabulary Table */}
      <div className="overflow-hidden rounded-xl border border-[var(--border-soft)] bg-[var(--bg-elevated)]">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[var(--border-soft)] bg-[var(--bg-subtle)]">
              <th className="py-3 px-4 text-left">
                <span className="font-mono text-xs font-medium uppercase tracking-wider text-[var(--text-secondary)]">
                  Term
                </span>
              </th>
              <th className="py-3 px-4 text-left">
                <span className="font-mono text-xs font-medium uppercase tracking-wider text-[var(--text-secondary)]">
                  Alternatives
                </span>
              </th>
              <th className="py-3 px-4 text-left">
                <span className="font-mono text-xs font-medium uppercase tracking-wider text-[var(--text-secondary)]">
                  Times Used
                </span>
              </th>
              <th className="py-3 px-4 text-right">
                <span className="font-mono text-xs font-medium uppercase tracking-wider text-[var(--text-secondary)]">
                  Actions
                </span>
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredTerms.length > 0 ? (
              filteredTerms.map((term) => (
                <tr
                  key={term.id}
                  className="border-b border-[var(--border-soft)] last:border-b-0 hover:bg-[var(--bg-subtle)] transition-colors"
                >
                  <td className="py-3 px-4">
                    <span className="font-medium text-[var(--text-primary)]">
                      {term.term}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    {term.alternatives.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {term.alternatives.map((alt, i) => (
                          <span
                            key={i}
                            className="inline-flex px-2 py-0.5 text-xs bg-[var(--bg-subtle)] text-[var(--text-secondary)] rounded"
                          >
                            {alt}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-sm text-[var(--text-tertiary)]">-</span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-mono text-sm text-[var(--text-secondary)]">
                      {term.occurrenceCount}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    {deleteConfirmId === term.id ? (
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteConfirmId(null)}
                        >
                          Cancel
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDelete(term.id)}
                        >
                          Delete
                        </Button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setDeleteConfirmId(term.id)}
                        className="p-1.5 rounded-md text-[var(--text-tertiary)] hover:text-[var(--accent-red)] hover:bg-[rgba(239,68,68,0.08)] transition-colors"
                        title="Delete term"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="py-12 text-center">
                  <p className="text-[var(--text-secondary)]">
                    {searchQuery ? 'No matching terms found' : 'No vocabulary terms yet'}
                  </p>
                  <p className="text-sm text-[var(--text-tertiary)] mt-1">
                    {searchQuery
                      ? 'Try adjusting your search query'
                      : 'Add terms to help improve transcription accuracy'}
                  </p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Results Count */}
      <p className="text-xs text-[var(--text-tertiary)] text-right">
        Showing {filteredTerms.length} of {terms.length} terms
      </p>
    </div>
  )
}
