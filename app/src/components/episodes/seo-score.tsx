import { cn } from "@/lib/utils"

interface SEOScoreProps {
  score: number | null
  size?: "sm" | "lg"
  className?: string
}

function SEOScore({ score, size = "sm", className }: SEOScoreProps) {
  if (score === null) {
    return (
      <span className={cn("text-[var(--color-text-tertiary)]", className)}>
        —
      </span>
    )
  }

  const color =
    score >= 80
      ? "var(--color-status-success)"
      : score >= 50
        ? "var(--color-accent-warm)"
        : "var(--color-status-error)"

  if (size === "lg") {
    const circumference = 2 * Math.PI * 36
    const offset = circumference - (score / 100) * circumference

    return (
      <div className={cn("relative inline-flex items-center justify-center", className)}>
        <svg width="88" height="88" viewBox="0 0 88 88" className="-rotate-90">
          {/* Background circle */}
          <circle
            cx="44"
            cy="44"
            r="36"
            fill="none"
            stroke="var(--color-border)"
            strokeWidth="4"
          />
          {/* Score arc */}
          <circle
            cx="44"
            cy="44"
            r="36"
            fill="none"
            stroke={color}
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-all duration-[var(--duration-slow)] ease-[var(--ease-out)]"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className="font-[family-name:var(--font-display)] text-[1.5rem] font-bold"
            style={{ color }}
          >
            {score}
          </span>
          <span className="text-label">SEO</span>
        </div>
      </div>
    )
  }

  return (
    <span
      className={cn(
        "font-[family-name:var(--font-mono)] text-[var(--text-caption)] font-medium",
        className
      )}
      style={{ color }}
    >
      {score}
    </span>
  )
}

export { SEOScore }
