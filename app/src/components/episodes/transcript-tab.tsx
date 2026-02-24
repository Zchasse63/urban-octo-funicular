"use client"

import { cn } from "@/lib/utils"
import { EmptyState } from "@/components/ui/empty-state"
import { FileAudio } from "lucide-react"
import type { Episode } from "@/types/database"

interface TranscriptTabProps {
  episode: Episode
}

function formatTimestamp(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
  return `${m}:${String(s).padStart(2, "0")}`
}

function TranscriptTab({ episode }: TranscriptTabProps) {
  const segments = episode.transcript_segments

  if (!segments || segments.length === 0) {
    if (episode.transcript) {
      return (
        <div
          className={cn(
            "rounded-[var(--radius-md)] border border-[var(--color-border)]",
            "bg-[var(--color-bg-surface)] p-6"
          )}
        >
          <div className="whitespace-pre-wrap font-[family-name:var(--font-body)] text-[var(--text-body)] text-[var(--color-text-ink)]">
            {episode.transcript}
          </div>
        </div>
      )
    }

    return (
      <EmptyState
        icon={FileAudio}
        title="No transcript available"
        description="Process this episode to generate a speaker-diarized transcript."
      />
    )
  }

  return (
    <div
      className={cn(
        "rounded-[var(--radius-md)] border border-[var(--color-border)]",
        "bg-[var(--color-bg-surface)] divide-y divide-[var(--color-border)]"
      )}
    >
      {segments.map((segment, i) => (
        <div key={i} className="flex gap-4 px-4 py-3">
          <div className="flex w-20 flex-shrink-0 flex-col items-start gap-0.5 sm:w-24">
            <span className="font-[family-name:var(--font-mono)] text-[var(--text-caption)] text-[var(--color-accent-blue)]">
              {formatTimestamp(segment.start)}
            </span>
            {segment.speaker && (
              <span className="text-label text-[var(--color-text-tertiary)]">
                {segment.speaker}
              </span>
            )}
          </div>
          <p className="flex-1 font-[family-name:var(--font-body)] text-[var(--text-body-sm)] text-[var(--color-text-ink)]">
            {segment.text}
          </p>
        </div>
      ))}
    </div>
  )
}

export { TranscriptTab }
