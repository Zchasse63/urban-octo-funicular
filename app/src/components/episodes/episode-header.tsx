"use client"

import { cn } from "@/lib/utils"
import { formatDuration } from "@/lib/utils"
import { ArrowLeft, Play, Download, RotateCw, MoreHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { StatusDot } from "./status-dot"
import { SignalChain } from "./signal-chain"
import Link from "next/link"
import type { Episode } from "@/types/database"

interface EpisodeHeaderProps {
  episode: Episode
  onProcess?: () => void
  className?: string
}

const statusBadgeVariant = {
  completed: "success",
  processing: "processing",
  pending: "default",
  failed: "error",
} as const

function EpisodeHeader({ episode, onProcess, className }: EpisodeHeaderProps) {
  const processingStep =
    (episode.metadata as Record<string, string>)?.processing_step || episode.status

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      {/* Back nav + actions */}
      <div className="flex items-center justify-between">
        <Link
          href="/episodes"
          className={cn(
            "flex items-center gap-1.5 text-[var(--text-body-sm)] text-[var(--color-text-secondary)]",
            "transition-colors hover:text-[var(--color-text-ink)]"
          )}
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="font-[family-name:var(--font-display)] font-medium">
            Episodes
          </span>
        </Link>

        <div className="flex items-center gap-2">
          {episode.status === "pending" && (
            <Button size="sm" onClick={onProcess}>
              <Play className="h-3.5 w-3.5" />
              Process
            </Button>
          )}
          {episode.status === "failed" && (
            <Button size="sm" variant="warm" onClick={onProcess}>
              <RotateCw className="h-3.5 w-3.5" />
              Retry
            </Button>
          )}
          {episode.status === "completed" && (
            <Button size="sm" variant="secondary">
              <Download className="h-3.5 w-3.5" />
              Export
            </Button>
          )}
          <Button size="sm" variant="ghost">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Title + metadata */}
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-3">
          <StatusDot status={episode.status} />
          <h1 className="font-[family-name:var(--font-display)] text-[var(--text-h1)] font-bold text-[var(--color-text-ink)]">
            {episode.title || "Untitled Episode"}
          </h1>
          <Badge variant={statusBadgeVariant[episode.status]}>
            {episode.status}
          </Badge>
        </div>

        <div className="flex items-center gap-4 text-[var(--text-caption)] text-[var(--color-text-secondary)]">
          {episode.guest_name && (
            <span>with {episode.guest_name}</span>
          )}
          <span className="font-[family-name:var(--font-mono)]">
            {formatDuration(episode.audio_duration_seconds)}
          </span>
        </div>
      </div>

      {/* Signal chain (processing pipeline) */}
      {episode.status !== "pending" && (
        <SignalChain currentStep={processingStep} />
      )}
    </div>
  )
}

export { EpisodeHeader }
