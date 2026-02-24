import { cn } from "@/lib/utils"

interface StepIndicatorProps {
  currentStep: number
  steps: string[]
  className?: string
}

function StepIndicator({ currentStep, steps, className }: StepIndicatorProps) {
  return (
    <div className={cn("flex items-center justify-center gap-0", className)}>
      {steps.map((label, i) => {
        const isComplete = i < currentStep
        const isCurrent = i === currentStep
        const isLast = i === steps.length - 1

        return (
          <div key={i} className="flex items-center">
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-[var(--radius-full)]",
                  "font-[family-name:var(--font-display)] text-[var(--text-caption)] font-bold",
                  "transition-all duration-300",
                  isComplete && "bg-[var(--color-status-success)] text-white",
                  isCurrent && "bg-[var(--color-accent-blue)] text-white",
                  !isComplete && !isCurrent && "bg-[var(--color-bg-hover)] text-[var(--color-text-tertiary)]"
                )}
              >
                {isComplete ? (
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  i + 1
                )}
              </div>
              <span
                className={cn(
                  "whitespace-nowrap font-[family-name:var(--font-display)] text-[11px] font-medium",
                  isCurrent ? "text-[var(--color-text-ink)]" : "text-[var(--color-text-tertiary)]"
                )}
              >
                {label}
              </span>
            </div>

            {!isLast && (
              <div
                className={cn(
                  "mx-3 mb-5 h-[2px] w-16",
                  isComplete ? "bg-[var(--color-status-success)]" : "bg-[var(--color-border)]"
                )}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

export { StepIndicator }
