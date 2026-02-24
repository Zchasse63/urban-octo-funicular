import { cn } from "@/lib/utils"

type VocabCategory = "person" | "brand" | "technical" | "acronym" | "custom"

interface VocabCategoryBadgeProps {
  category: VocabCategory
  className?: string
}

const categoryStyles: Record<VocabCategory, string> = {
  person: "bg-[var(--color-accent-blue-light)] text-[var(--color-accent-blue)] border-[var(--color-accent-blue)]/20",
  brand: "bg-[var(--color-accent-warm-light)] text-[var(--color-accent-warm)] border-[var(--color-accent-warm)]/20",
  technical: "bg-[var(--color-status-success-light)] text-[var(--color-status-success)] border-[var(--color-status-success)]/20",
  acronym: "bg-[var(--color-status-processing-light)] text-[var(--color-status-processing)] border-[var(--color-status-processing)]/20",
  custom: "bg-[var(--color-bg-hover)] text-[var(--color-text-secondary)] border-[var(--color-border)]",
}

function VocabCategoryBadge({ category, className }: VocabCategoryBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-[var(--radius-full)] border px-2 py-0.5",
        "font-[family-name:var(--font-mono)] text-[10px] font-medium uppercase tracking-wider",
        categoryStyles[category],
        className
      )}
    >
      {category}
    </span>
  )
}

export { VocabCategoryBadge }
export type { VocabCategory }
