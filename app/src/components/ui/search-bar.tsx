"use client"

import { Search } from "lucide-react"
import { cn } from "@/lib/utils"
import { forwardRef } from "react"

interface SearchBarProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type" | "onChange"> {
  shortcutHint?: string
  onChange?: React.ChangeEventHandler<HTMLInputElement>
  onValueChange?: (value: string) => void
}

const SearchBar = forwardRef<HTMLInputElement, SearchBarProps>(
  ({ className, shortcutHint, onValueChange, onChange, ...props }, ref) => {
    return (
      <div className={cn("relative", className)}>
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-tertiary)]" />
        <input
          ref={ref}
          type="text"
          className={cn(
            "h-9 w-full rounded-[var(--radius-sm)]",
            "border border-[var(--color-border)] bg-[var(--color-bg-surface)]",
            "pl-9 pr-3 text-[var(--text-body-sm)]",
            "font-[family-name:var(--font-display)]",
            "text-[var(--color-text-ink)]",
            "placeholder:text-[var(--color-text-tertiary)]",
            "transition-shadow duration-[var(--duration-fast)]",
            "focus-visible:outline-none focus-visible:shadow-[var(--shadow-focus)]",
            shortcutHint && "pr-12"
          )}
          onChange={(e) => {
            onChange?.(e)
            onValueChange?.(e.target.value)
          }}
          {...props}
        />
        {shortcutHint && (
          <span
            className={cn(
              "absolute right-3 top-1/2 -translate-y-1/2",
              "rounded-[var(--radius-sm)] border border-[var(--color-border)]",
              "bg-[var(--color-bg-hover)] px-1.5 py-0.5",
              "font-[family-name:var(--font-mono)] text-[10px] text-[var(--color-text-tertiary)]"
            )}
          >
            {shortcutHint}
          </span>
        )}
      </div>
    )
  }
)
SearchBar.displayName = "SearchBar"

export { SearchBar }
