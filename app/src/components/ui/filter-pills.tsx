"use client"

import { cn } from "@/lib/utils"

interface FilterOption {
  label: string
  value: string
  count?: number
}

interface FilterPillsProps {
  options: FilterOption[]
  activeValue: string
  onChange: (value: string) => void
  className?: string
}

function FilterPills({
  options,
  activeValue,
  onChange,
  className,
}: FilterPillsProps) {
  return (
    <div className={cn("flex flex-wrap gap-1.5", className)}>
      {options.map((option) => {
        const isActive = option.value === activeValue
        return (
          <button
            key={option.value}
            onClick={() => onChange(option.value)}
            className={cn(
              "inline-flex items-center gap-1.5 px-3 py-2.5 md:py-1.5",
              "rounded-[var(--radius-full)]",
              "font-[family-name:var(--font-display)] text-[var(--text-body-sm)] font-medium",
              "transition-all duration-[var(--duration-fast)]",
              "cursor-pointer",
              isActive
                ? [
                    "bg-[var(--color-text-ink)] text-[var(--color-text-on-accent)]",
                    "shadow-[var(--shadow-button)]",
                  ].join(" ")
                : [
                    "text-[var(--color-text-secondary)]",
                    "hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text-ink)]",
                  ].join(" ")
            )}
          >
            {option.label}
            {option.count !== undefined && (
              <span
                className={cn(
                  "font-[family-name:var(--font-mono)] text-[10px]",
                  isActive ? "opacity-70" : "opacity-60"
                )}
              >
                {option.count}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}

export { FilterPills }
export type { FilterOption }
