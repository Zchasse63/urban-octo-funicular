import { cn } from "@/lib/utils"
import { forwardRef } from "react"

const Input = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-9 w-full rounded-[var(--radius-sm)]",
          "border border-[var(--color-border)] bg-[var(--color-bg-surface)]",
          "px-3 py-2 text-[var(--text-body-sm)]",
          "font-[family-name:var(--font-display)]",
          "text-[var(--color-text-ink)]",
          "placeholder:text-[var(--color-text-tertiary)]",
          "transition-shadow duration-[var(--duration-fast)]",
          "focus-visible:outline-none focus-visible:shadow-[var(--shadow-focus)]",
          "disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

const Textarea = forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        "flex min-h-[80px] w-full rounded-[var(--radius-sm)]",
        "border border-[var(--color-border)] bg-[var(--color-bg-surface)]",
        "px-3 py-2 text-[var(--text-body-sm)]",
        "font-[family-name:var(--font-display)]",
        "text-[var(--color-text-ink)]",
        "placeholder:text-[var(--color-text-tertiary)]",
        "transition-shadow duration-[var(--duration-fast)]",
        "focus-visible:outline-none focus-visible:shadow-[var(--shadow-focus)]",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "resize-y",
        className
      )}
      ref={ref}
      {...props}
    />
  )
})
Textarea.displayName = "Textarea"

export { Input, Textarea }
