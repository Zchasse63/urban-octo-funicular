import { cn } from "@/lib/utils"
import type { EpisodeStatus } from "@/types/database"

interface StatusDotProps {
  status: EpisodeStatus
  className?: string
  showLabel?: boolean
}

const statusConfig: Record<EpisodeStatus, { dotClass: string; label: string }> = {
  completed: { dotClass: "status-dot-success", label: "Completed" },
  processing: { dotClass: "status-dot-processing", label: "Processing" },
  failed: { dotClass: "status-dot-error", label: "Failed" },
  pending: { dotClass: "status-dot-pending", label: "Pending" },
}

function StatusDot({ status, className, showLabel = false }: StatusDotProps) {
  const config = statusConfig[status]

  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <span className={cn("status-dot", config.dotClass)} />
      {showLabel && (
        <span className="text-label">{config.label}</span>
      )}
    </span>
  )
}

export { StatusDot }
