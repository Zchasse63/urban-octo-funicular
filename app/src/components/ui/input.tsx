import { forwardRef } from "react"
import { cn } from "@/lib/utils"

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex w-full",
          "bg-[var(--color-bg-surface)]",
          "border border-[var(--color-border)]",
          "ring-1 ring-inset ring-white/30",
          "rounded-[var(--radius-md)]",
          "px-3 py-2",
          "text-[var(--text-body-sm)] text-[var(--color-text-ink)]",
          "font-[family-name:var(--font-body)]",
          "placeholder:text-[var(--color-text-tertiary)]",
          "transition-all duration-[var(--duration-fast)]",
          "hover:border-[var(--color-border-strong)]",
          "focus-visible:outline-none focus-visible:border-[var(--color-border-focus)] focus-visible:shadow-[var(--shadow-focus)] focus-visible:ring-0",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "flex w-full min-h-[80px]",
          "bg-[var(--color-bg-surface)]",
          "border border-[var(--color-border)]",
          "ring-1 ring-inset ring-white/30",
          "rounded-[var(--radius-md)]",
          "px-3 py-2",
          "text-[var(--text-body-sm)] text-[var(--color-text-ink)]",
          "font-[family-name:var(--font-body)]",
          "placeholder:text-[var(--color-text-tertiary)]",
          "transition-all duration-[var(--duration-fast)]",
          "hover:border-[var(--color-border-strong)]",
          "focus-visible:outline-none focus-visible:border-[var(--color-border-focus)] focus-visible:shadow-[var(--shadow-focus)] focus-visible:ring-0",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          "resize-y",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Textarea.displayName = "Textarea"

export { Textarea }
