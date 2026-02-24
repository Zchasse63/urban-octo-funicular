import { cn } from "@/lib/utils"

interface SignalChainProps {
  currentStep: string
  className?: string
}

const steps = [
  { key: "uploading", label: "Upload" },
  { key: "transcribing", label: "Transcribed" },
  { key: "generating", label: "Generated" },
  { key: "completed", label: "Ready" },
]

const stepOrder: Record<string, number> = {
  uploading: 0,
  transcribing: 1,
  vocabulary_processing: 1,
  generating_show_notes: 2,
  seo_analysis: 2,
  generating_assets: 2,
  completed: 3,
  failed: -1,
}

function SignalChain({ currentStep, className }: SignalChainProps) {
  const currentIndex = stepOrder[currentStep] ?? -1

  return (
    <div className={cn("flex items-center gap-1", className)}>
      {steps.map((step, i) => {
        const isComplete = currentIndex > i
        const isCurrent = currentIndex === i
        const isFailed = currentStep === "failed"

        return (
          <div key={step.key} className="flex items-center gap-1">
            {/* Dot */}
            <div className="flex flex-col items-center gap-1">
              <span
                className={cn(
                  "h-2.5 w-2.5 rounded-[var(--radius-full)] transition-all duration-300",
                  isComplete && "bg-[var(--color-status-success)]",
                  isCurrent && !isFailed && "bg-[var(--color-status-processing)] animate-pulse",
                  isFailed && i <= currentIndex && "bg-[var(--color-status-error)]",
                  !isComplete && !isCurrent && !isFailed && "bg-[var(--color-border-strong)]"
                )}
              />
              <span
                className={cn(
                  "font-[family-name:var(--font-mono)] text-[9px]",
                  isComplete ? "text-[var(--color-status-success)]" :
                  isCurrent ? "text-[var(--color-text-ink)]" :
                  "text-[var(--color-text-tertiary)]"
                )}
              >
                {step.label}
              </span>
            </div>

            {/* Connecting line */}
            {i < steps.length - 1 && (
              <span
                className={cn(
                  "mb-4 h-[2px] w-6 rounded-[var(--radius-full)]",
                  isComplete
                    ? "bg-[var(--color-status-success)]"
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
