import { cn } from "@/lib/utils"
import { Badge } from "./badge"
import { LinearProgress } from "./progress"

interface UsageMeterProps {
  label: string
  current: number
  max: number
  unit: string
  warningThreshold?: number
  className?: string
}

function UsageMeter({
  label,
  current,
  max,
  unit,
  warningThreshold = 80,
  className,
}: UsageMeterProps) {
  const percentage = Math.min(100, Math.round((current / max) * 100))
  const isWarning = percentage >= warningThreshold

  const color =
    percentage >= warningThreshold
      ? "warning"
      : percentage >= 60
      ? "blue"
      : "success"

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-[family-name:var(--font-display)] text-[var(--text-body-sm)] font-semibold text-[var(--color-text-ink)]">
            {label}
          </span>
          {isWarning && <Badge variant="warning">HIGH</Badge>}
        </div>
        <span className="font-[family-name:var(--font-mono)] text-[var(--text-caption)] text-[var(--color-accent-blue)]">
          {current.toLocaleString()} / {max.toLocaleString()} {unit}
        </span>
      </div>
      <LinearProgress value={percentage} color={color} />
      <div className="flex justify-between text-[var(--text-caption)] text-[var(--color-text-secondary)]">
        <span>{percentage}% used</span>
        <span>{(max - current).toLocaleString()} {unit} remaining</span>
      </div>
    </div>
  )
}

export { UsageMeter }
