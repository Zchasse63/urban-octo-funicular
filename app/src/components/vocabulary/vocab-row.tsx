import { cn } from "@/lib/utils"
import { formatRelativeTime } from "@/lib/utils"
import { VocabCategoryBadge, type VocabCategory } from "./vocab-category-badge"
import { Sparkline } from "@/components/ui/sparkline"
import type { VocabularyTerm } from "@/types/database"

interface VocabRowProps {
  term: VocabularyTerm
  className?: string
}

function inferCategory(term: VocabularyTerm): VocabCategory {
  const t = term.term.toLowerCase()
  if (/^[A-Z]{2,}$/.test(term.term)) return "acronym"
  if (t.includes(" ") && /^[A-Z]/.test(term.term)) return "person"
  return "custom"
}

function VocabRow({ term, className }: VocabRowProps) {
  const category = inferCategory(term)
  // Mock sparkline data from occurrence count
  const sparkData = Array.from({ length: 7 }, (_, i) =>
    Math.max(0, term.occurrence_count - 3 + Math.floor(Math.random() * 6) + i)
  )

  return (
    <div
      className={cn(
        "flex items-center gap-4 rounded-[var(--radius-md)] border border-[var(--color-border)]",
        "bg-[var(--color-bg-surface)] px-4 py-3",
        "transition-all duration-[var(--duration-fast)]",
        "hover:border-[var(--color-border-strong)]",
        className
      )}
    >
      {/* Term + phonetic */}
      <div className="flex flex-1 flex-col gap-0.5">
        <span className="font-[family-name:var(--font-display)] text-[var(--text-body-sm)] font-semibold text-[var(--color-text-ink)]">
          {term.term}
        </span>
        {term.alternatives.length > 0 && (
          <span className="font-[family-name:var(--font-mono)] text-[11px] text-[var(--color-text-tertiary)]">
            {term.alternatives[0]}
          </span>
        )}
      </div>

      {/* Category */}
      <VocabCategoryBadge category={category} />

      {/* Usage count */}
      <div className="hidden items-center gap-2 sm:flex">
        <span className="font-[family-name:var(--font-mono)] text-[var(--text-caption)] text-[var(--color-text-secondary)]">
          {term.occurrence_count}×
        </span>
        <Sparkline data={sparkData} />
      </div>

      {/* Date added */}
      <span className="hidden font-[family-name:var(--font-mono)] text-[var(--text-caption)] text-[var(--color-text-tertiary)] md:block">
        {formatRelativeTime(term.created_at)}
      </span>
    </div>
  )
}

export { VocabRow }
