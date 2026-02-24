"use client"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { EmptyState } from "@/components/ui/empty-state"
import { Brain, Zap, Clock } from "lucide-react"
import type { Episode, ViralMoment } from "@/types/database"

interface IntelligenceTabProps {
  episode: Episode
}

const momentTypeColors: Record<string, string> = {
  controversial: "error",
  emotional: "warm",
  quotable: "blue",
  revelation: "success",
  counter_intuitive: "processing",
} as const

function formatMomentTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${String(s).padStart(2, "0")}`
}

function ViralMomentCard({ moment }: { moment: ViralMoment }) {
  const badgeVariant = (momentTypeColors[moment.type] || "default") as "error" | "warm" | "blue" | "success" | "processing" | "default"

  return (
    <div
      className={cn(
        "rounded-[var(--radius-md)] border border-[var(--color-border)]",
        "bg-[var(--color-bg-surface)] p-4"
      )}
    >
      <div className="mb-2 flex items-center justify-between">
        <Badge variant={badgeVariant}>
          {moment.type.replace("_", " ")}
        </Badge>
        <div className="flex items-center gap-1.5 text-[var(--color-text-secondary)]">
          <Clock className="h-3 w-3" />
          <span className="font-[family-name:var(--font-mono)] text-[var(--text-caption)]">
            {formatMomentTime(moment.start_time)} – {formatMomentTime(moment.end_time)}
          </span>
        </div>
      </div>
      <p className="mb-2 font-[family-name:var(--font-body)] text-[var(--text-body-sm)] text-[var(--color-text-ink)]">
        &ldquo;{moment.text}&rdquo;
      </p>
      <div className="flex items-center justify-between">
        <span className="text-[var(--text-caption)] text-[var(--color-text-secondary)]">
          {moment.reason}
        </span>
        <div className="flex items-center gap-1">
          <Zap className="h-3 w-3 text-[var(--color-accent-warm)]" />
          <span className="font-[family-name:var(--font-mono)] text-[var(--text-caption)] font-semibold text-[var(--color-accent-warm)]">
            {Math.round(moment.score * 100)}%
          </span>
        </div>
      </div>
    </div>
  )
}

function IntelligenceTab({ episode }: IntelligenceTabProps) {
  const moments = episode.viral_moments

  if (!moments || moments.length === 0) {
    return (
      <EmptyState
        icon={Brain}
        title="No intelligence data yet"
        description="Process this episode to discover viral moments, key quotes, and guest insights."
      />
    )
  }

  // Sort by score descending
  const sorted = [...moments].sort((a, b) => b.score - a.score)

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <Brain className="h-4 w-4 text-[var(--color-accent-blue)]" />
        <h3 className="font-[family-name:var(--font-display)] text-[var(--text-body-sm)] font-semibold text-[var(--color-text-ink)]">
          Viral Moments
        </h3>
        <Badge variant="blue">{sorted.length}</Badge>
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        {sorted.map((moment, i) => (
          <ViralMomentCard key={i} moment={moment} />
        ))}
      </div>
    </div>
  )
}

export { IntelligenceTab }
