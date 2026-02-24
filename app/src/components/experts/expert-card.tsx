import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { ExternalLink } from "lucide-react"
import type { Expert } from "@/lib/experts/types"

interface ExpertCardProps {
  expert: Expert
  className?: string
}

const categoryBadgeVariant = {
  fresh: "success",
  established: "blue",
  oversaturated: "warning",
} as const

const availabilityLabels = {
  fresh: "Available",
  established: "Limited",
  oversaturated: "Busy",
} as const

function getInitials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()
}

function getAvatarColor(name: string) {
  const colors = [
    "bg-[var(--color-accent-blue)]",
    "bg-[var(--color-accent-warm)]",
    "bg-[var(--color-status-success)]",
    "bg-[#A34EBE]",
    "bg-[#F4A600]",
  ]
  const hash = name.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0)
  return colors[hash % colors.length]
}

function ExpertCard({ expert, className }: ExpertCardProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-[var(--radius-md)] border border-[var(--color-border)]",
        "bg-[var(--color-bg-surface)] p-4",
        "transition-all duration-[var(--duration-fast)]",
        "hover:border-[var(--color-border-strong)] hover:shadow-[var(--shadow-card)]",
        className
      )}
    >
      {/* Header: Avatar + Name + Score */}
      <div className="flex items-start gap-3">
        <span
          className={cn(
            "flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-[var(--radius-full)]",
            "text-[13px] font-bold text-white",
            getAvatarColor(expert.name)
          )}
        >
          {getInitials(expert.name)}
        </span>
        <div className="flex flex-1 flex-col gap-0.5">
          <span className="font-[family-name:var(--font-display)] text-[var(--text-body-sm)] font-semibold text-[var(--color-text-ink)]">
            {expert.name}
          </span>
          {expert.metadata.affiliation && (
            <span className="text-[var(--text-caption)] text-[var(--color-text-secondary)]">
              {expert.metadata.affiliation}
            </span>
          )}
        </div>
        <div className="flex flex-col items-center">
          <span className="font-[family-name:var(--font-mono)] text-[var(--text-h2)] font-bold text-[var(--color-accent-blue)]">
            {expert.freshnessScore}
          </span>
          <span className="text-[9px] text-[var(--color-text-tertiary)]">MATCH</span>
        </div>
      </div>

      {/* Bio / AI insight */}
      {expert.metadata.bio && (
        <p className="line-clamp-2 font-[family-name:var(--font-body)] text-[var(--text-caption)] text-[var(--color-text-secondary)]">
          {expert.metadata.bio}
        </p>
      )}

      {/* Expertise tags */}
      {expert.expertise.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {expert.expertise.slice(0, 4).map((tag) => (
            <span
              key={tag}
              className={cn(
                "rounded-[var(--radius-full)] bg-[var(--color-bg-hover)] px-2 py-0.5",
                "font-[family-name:var(--font-mono)] text-[10px] text-[var(--color-text-secondary)]"
              )}
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Footer: Availability + appearances + links */}
      <div className="flex items-center justify-between border-t border-[var(--color-border)] pt-2">
        <Badge variant={categoryBadgeVariant[expert.category]}>
          {availabilityLabels[expert.category]}
        </Badge>
        <div className="flex items-center gap-3">
          <span className="font-[family-name:var(--font-mono)] text-[var(--text-caption)] text-[var(--color-text-tertiary)]">
            {expert.appearanceCount} appearances
          </span>
          {expert.contactHints.linkedin && (
            <a
              href={expert.contactHints.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--color-text-tertiary)] transition-colors hover:text-[var(--color-accent-blue)]"
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          )}
        </div>
      </div>
    </div>
  )
}

export { ExpertCard }
