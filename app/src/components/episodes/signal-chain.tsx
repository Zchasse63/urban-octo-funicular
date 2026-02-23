"use client"

import { cn } from "@/lib/utils"
import { Upload, FileAudio, Sparkles, CheckCircle2 } from "lucide-react"
import type { EpisodeStatus } from "@/types/database"

interface SignalChainProps {
  status: EpisodeStatus
  className?: string
}

const stages = [
  { key: "upload", label: "Uploaded", icon: Upload },
  { key: "transcribe", label: "Transcribed", icon: FileAudio },
  { key: "generate", label: "Generated", icon: Sparkles },
  { key: "ready", label: "Ready", icon: CheckCircle2 },
]

function getActiveStage(status: EpisodeStatus): number {
  switch (status) {
    case "pending": return 0
    case "processing": return 1
    case "completed": return 3
    case "failed": return -1
    default: return 0
  }
}

function SignalChain({ status, className }: SignalChainProps) {
  const activeStage = getActiveStage(status)
  const isFailed = status === "failed"

  return (
    <div className={cn("flex items-center gap-1", className)}>
      {stages.map((stage, i) => {
        const Icon = stage.icon
        const isComplete = activeStage >= i
        const isActive = activeStage === i && status === "processing"

        return (
          <div key={stage.key} className="flex items-center gap-1">
            {/* Stage node */}
            <div
              className={cn(
                "flex items-center gap-1.5 px-2 py-1 rounded-[var(--radius-sm)]",
                "transition-all duration-[var(--duration-normal)]",
                isComplete && !isFailed
                  ? "text-[var(--color-accent-warm)]"
                  : isFailed
                    ? "text-[var(--color-status-error)]"
                    : "text-[var(--color-text-tertiary)]",
                isActive && "bg-[var(--color-accent-blue-light)]"
              )}
            >
              <Icon className={cn("w-3.5 h-3.5", isActive && "animate-pulse")} />
              <span className="text-[var(--text-label)] font-[family-name:var(--font-mono)] uppercase tracking-wider hidden sm:inline">
                {stage.label}
              </span>
            </div>

            {/* Connector line */}
            {i < stages.length - 1 && (
              <div
                className={cn(
                  "w-6 h-[2px] rounded-full",
                  "transition-colors duration-[var(--duration-normal)]",
                  activeStage > i
                    ? "bg-[var(--color-accent-warm)]"
                    : "bg-[var(--color-border)]"
                )}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

export { SignalChain }
