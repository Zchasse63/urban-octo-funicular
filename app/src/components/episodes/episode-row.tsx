"use client"

import Link from "next/link"
import { MoreHorizontal, Copy, Play, Trash2 } from "lucide-react"
import { StatusDot } from "./status-dot"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import type { EpisodeStatus } from "@/types/database"

interface EpisodeRowProps {
  id: string
  title: string | null
  status: EpisodeStatus
  seoScore: number | null
  guestName: string | null
  createdAt: string
  showName?: string
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

function SEOScoreIndicator({ score }: { score: number | null }) {
  if (score === null) return <span className="text-[var(--color-text-tertiary)]">—</span>

  const color =
    score >= 80
      ? "text-[var(--color-status-success)]"
      : score >= 50
        ? "text-[var(--color-accent-warm)]"
        : "text-[var(--color-status-error)]"

  const bgColor =
    score >= 80
      ? "bg-[var(--color-status-success-light)]"
      : score >= 50
        ? "bg-[var(--color-accent-warm-light)]"
        : "bg-[var(--color-status-error-light)]"

  return (
    <span className={cn(
      "inline-flex items-center justify-center",
      "w-8 h-5 rounded-[var(--radius-sm)]",
      "font-[family-name:var(--font-mono)] text-[10px] font-semibold",
      color, bgColor,
    )}>
      {score}
    </span>
  )
}

function EpisodeRow({ id, title, status, seoScore, guestName, createdAt }: EpisodeRowProps) {
  // Left accent color based on status
  const accentColor =
    status === "completed"
      ? "bg-[var(--color-status-success)]"
      : status === "processing"
        ? "bg-[var(--color-status-processing)]"
        : status === "failed"
          ? "bg-[var(--color-status-error)]"
          : "bg-[var(--color-border)]"

  return (
    <Link
      href={`/episodes/${id}`}
      className={cn(
        "relative flex items-center gap-4",
        "px-5 py-3",
        "border-b border-[var(--color-border)] last:border-b-0",
        "transition-all duration-[var(--duration-fast)]",
        "hover:bg-[var(--color-bg-hover)]",
        "group",
      )}
    >
      {/* Left accent bar */}
      <div className={cn(
        "absolute left-0 top-2 bottom-2 w-[3px] rounded-r-full",
        "transition-opacity duration-[var(--duration-fast)]",
        "opacity-0 group-hover:opacity-100",
        accentColor,
      )} />

      {/* Status dot */}
      <StatusDot status={status} />

      {/* Title + Guest */}
      <div className="flex-1 min-w-0">
        <div className="font-[family-name:var(--font-display)] font-medium text-[var(--text-body-sm)] text-[var(--color-text-ink)] truncate group-hover:text-[var(--color-accent-blue)] transition-colors">
          {title || "Untitled Episode"}
        </div>
        {guestName && (
          <div className="text-[var(--text-caption)] text-[var(--color-text-tertiary)] truncate mt-0.5">
            with {guestName}
          </div>
        )}
      </div>

      {/* SEO Score */}
      <div className="w-12 text-center flex-shrink-0">
        <SEOScoreIndicator score={seoScore} />
      </div>

      {/* Date */}
      <div className="w-24 text-right flex-shrink-0">
        <span className="text-mono text-[var(--color-text-tertiary)]">
          {formatDate(createdAt)}
        </span>
      </div>

      {/* Actions */}
      <div
        className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
        onClick={(e) => e.preventDefault()}
      >
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="p-1.5 rounded-[var(--radius-sm)] hover:bg-[var(--color-bg-active)] cursor-pointer">
              <MoreHorizontal className="w-4 h-4 text-[var(--color-text-tertiary)]" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>
              <Play className="w-4 h-4" />
              Process
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Copy className="w-4 h-4" />
              Copy Show Notes
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-[var(--color-status-error)]">
              <Trash2 className="w-4 h-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </Link>
  )
}

export { EpisodeRow }
