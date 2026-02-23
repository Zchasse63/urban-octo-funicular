import { cn } from "@/lib/utils"

interface ProgressProps {
  value: number
  max?: number
  className?: string
  color?: "blue" | "warm" | "success" | "error"
}

function Progress({ value, max = 100, className, color = "blue" }: ProgressProps) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100))

  const colorMap = {
    blue: "bg-[var(--color-accent-blue)]",
    warm: "bg-[var(--color-accent-warm)]",
    success: "bg-[var(--color-status-success)]",
    error: "bg-[var(--color-status-error)]",
  }

  return (
    <div
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
      className={cn(
        "h-1.5 w-full rounded-full",
        "bg-[var(--color-border)]",
        "overflow-hidden",
        className
      )}
    >
      <div
        className={cn(
          "h-full rounded-full",
          "transition-all duration-[var(--duration-slow)] ease-[var(--ease-out)]",
          colorMap[color]
        )}
        style={{ width: `${percentage}%` }}
      />
    </div>
  )
}

export { Progress }
