import { CircularProgress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"

interface SEOScoreProps {
  score: number | null
  size?: number
  showLabel?: boolean
  className?: string
}

function SEOScore({ score, size = 88, showLabel = true, className }: SEOScoreProps) {
  if (score === null) return null

  return (
    <div className={cn("flex flex-col items-center gap-1", className)}>
      <CircularProgress value={score} size={size} />
      {showLabel && (
        <span className="font-[family-name:var(--font-mono)] text-[var(--text-caption)] text-[var(--color-text-secondary)]">
          SEO Score
        </span>
      )}
    </div>
  )
}

export { SEOScore }
