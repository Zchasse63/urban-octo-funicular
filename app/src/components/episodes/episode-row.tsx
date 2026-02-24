"use client"

import { cn } from "@/lib/utils"
import { formatDuration, formatRelativeTime, truncate } from "@/lib/utils"
import { MoreHorizontal } from "lucide-react"
import { StatusDot } from "./status-dot"
import { Badge } from "@/components/ui/badge"
import { CircularProgress } from "@/components/ui/progress"
import Link from "next/link"
import type { EpisodeListItem } from "@/types/database"

interface EpisodeRowProps {
  episode: EpisodeListItem
  className?: string
}

const statusBadgeVariant = {
  completed: "success",
  processing: "processing",
  pending: "default",
  failed: "error",
} as const

function EpisodeRow({ episode, className }: EpisodeRowProps) {
  return (
    <Link
      href={`/episodes/${episode.id}`}
      className={cn(
        "group flex items-center gap-4 rounded-[var(--radius-md)] border border-[var(--color-border)]",
        "bg-[var(--color-bg-surface)] px-4 py-3.5",
        "transition-all duration-[var(--duration-fast)]",
        "hover:border-[var(--color-border-strong)] hover:shadow-[var(--shadow-card)]",
        className
      )}
    >
      {/* Status dot */}
      <StatusDot status={episode.status} />

      {/* Main content */}
      <div className="flex flex-1 flex-col gap-0.5 overflow-hidden">
        <div className="flex items-center gap-2">
          <span className="truncate font-[family-name:var(--font-display)] text-[var(--text-body)] font-semibold text-[var(--color-text-ink)]">
            {episode.title || "Untitled Episode"}
          </span>
          <Badge variant={statusBadgeVariant[episode.status]}>
            {episode.status}
          </Badge>
        </div>

        <div className="flex items-center gap-3 text-[var(--text-caption)] text-[var(--color-text-secondary)]">
          {episode.guest_name && (
            <span className="truncate">
              with {episode.guest_name}
            </span>
          )}
          <span className="font-[family-name:var(--font-mono)]">
            {formatDuration(episode.audio_duration_seconds)}
          </span>
          <span>{formatRelativeTime(episode.created_at)}</span>
        </div>

        {episode.description && (
          <p className="mt-0.5 line-clamp-1 font-[family-name:var(--font-body)] text-[var(--text-caption)] text-[var(--color-text-tertiary)]">
            {truncate(episode.description, 120)}
          </p>
        )}
      </div>

      {/* SEO Score */}
      {episode.seo_score !== null && (
        <div className="hidden items-center gap-1.5 sm:flex">
          <CircularProgress value={episode.seo_score} size={32} />
          <span className="font-[family-name:var(--font-mono)] text-[var(--text-caption)] font-medium text-[var(--color-text-secondary)]">
            SEO
          </span>
        </div>
      )}

      {/* Actions */}
      <button
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
        }}
        aria-label="Episode actions"
        className={cn(
          "flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)]",
          "text-[var(--color-text-tertiary)] opacity-0 transition-all",
          "hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text-secondary)]",
          "group-hover:opacity-100"
        )}
      >
        <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
      </button>
    </Link>
  )
}

export { EpisodeRow }
