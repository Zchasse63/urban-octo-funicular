"use client"

import { cn } from "@/lib/utils"

interface CircularProgressProps {
  value: number
  size?: number
  strokeWidth?: number
  color?: "blue" | "warm" | "success" | "error" | "warning" | "auto"
  className?: string
  showValue?: boolean
}

function getAutoColor(value: number): string {
  if (value >= 90) return "var(--color-status-success)"
  if (value >= 75) return "var(--color-accent-blue)"
  if (value >= 60) return "var(--color-status-warning)"
  return "var(--color-status-error)"
}

const colorMap: Record<string, string> = {
  blue: "var(--color-accent-blue)",
  warm: "var(--color-accent-warm)",
  success: "var(--color-status-success)",
  error: "var(--color-status-error)",
  warning: "var(--color-status-warning)",
}

function CircularProgress({
  value,
  size = 88,
  strokeWidth = 6,
  color = "auto",
  className,
  showValue = true,
}: CircularProgressProps) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (value / 100) * circumference
  const strokeColor = color === "auto" ? getAutoColor(value) : colorMap[color]

  return (
    <div
      className={cn("relative inline-flex items-center justify-center", className)}
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--color-border)"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-[stroke-dashoffset] duration-700 ease-out"
        />
      </svg>
      {showValue && (
        <span
          className="absolute font-[family-name:var(--font-mono)] font-semibold text-[var(--color-text-ink)]"
          style={{ fontSize: size * 0.28 }}
        >
          {Math.round(value)}
        </span>
      )}
    </div>
  )
}

interface LinearProgressProps {
  value: number
  color?: "blue" | "warm" | "success" | "error" | "warning" | "auto"
  className?: string
}

function LinearProgress({
  value,
  color = "auto",
  className,
}: LinearProgressProps) {
  const strokeColor = color === "auto" ? getAutoColor(value) : colorMap[color]

  return (
    <div
      className={cn(
        "h-1.5 w-full overflow-hidden rounded-[var(--radius-full)]",
        "bg-[var(--color-border)]",
        className
      )}
    >
      <div
        className="h-full rounded-[var(--radius-full)] transition-[width] duration-500 ease-out"
        style={{
          width: `${Math.min(100, Math.max(0, value))}%`,
          backgroundColor: strokeColor,
        }}
      />
    </div>
  )
}

export { CircularProgress, LinearProgress }
