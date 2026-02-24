import { cn } from "@/lib/utils"
import { Loader2 } from "lucide-react"

interface ProcessingBannerProps {
  processingCount: number
  className?: string
}

function ProcessingBanner({
  processingCount,
  className,
}: ProcessingBannerProps) {
  if (processingCount <= 0) return null

  return (
    <div
      className={cn(
        "flex items-center justify-between",
        "rounded-[var(--radius-md)] px-4 py-3",
        "bg-[var(--color-status-warning-light)]",
        "border border-[var(--color-status-warning)]/20",
        "animate-enter",
        className
      )}
    >
      <div className="flex items-center gap-2.5">
        <Loader2 className="h-4 w-4 animate-spin text-[var(--color-status-warning)]" />
        <span className="font-[family-name:var(--font-display)] text-[var(--text-body-sm)] font-semibold text-[var(--color-status-warning)]">
          {processingCount} episode{processingCount !== 1 ? "s" : ""} processing
        </span>
        <span className="text-[var(--text-body-sm)] text-[var(--color-text-secondary)]">
          — transcription &amp; AI assets being generated
        </span>
      </div>
      <div className="flex gap-0.5">
        {[0, 1, 2, 3, 4].map((i) => (
          <span
            key={i}
            className="h-3 w-1 rounded-[var(--radius-full)] bg-[var(--color-status-warning)]"
            style={{
              animation: `pulse-dot 1.4s ease-in-out ${i * 0.15}s infinite`,
            }}
          />
        ))}
      </div>
    </div>
  )
}

export { ProcessingBanner }
