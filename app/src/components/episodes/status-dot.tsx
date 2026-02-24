import { cn } from "@/lib/utils"
import type { EpisodeStatus } from "@/types/database"

interface StatusDotProps {
  status: EpisodeStatus
  size?: "sm" | "md"
  className?: string
}

const dotColors: Record<EpisodeStatus, string> = {
  completed: "status-dot-success",
  processing: "status-dot-processing",
  pending: "status-dot-pending",
  failed: "status-dot-error",
}

const dotSizes = {
  sm: "h-2 w-2",
  md: "h-2.5 w-2.5",
}

function StatusDot({ status, size = "md", className }: StatusDotProps) {
  return (
    <span
      className={cn(
        "inline-block rounded-[var(--radius-full)]",
        dotSizes[size],
        dotColors[status],
        status === "processing" && "animate-pulse",
        className
      )}
      aria-label={status}
    />
  )
}

export { StatusDot }
