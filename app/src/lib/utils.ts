import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format seconds to human-readable duration (e.g., "1h 23m", "45m", "2m 30s")
 */
export function formatDuration(seconds: number | null): string {
  if (!seconds) return "—"
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)
  if (hours > 0) return `${hours}h ${minutes}m`
  if (minutes > 0) return `${minutes}m ${secs > 0 ? `${secs}s` : ""}`
  return `${secs}s`
}

/**
 * Format a date string to relative time (e.g., "2 hours ago", "3 days ago")
 */
export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffSecs = Math.floor(diffMs / 1000)
  const diffMins = Math.floor(diffSecs / 60)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffSecs < 60) return "just now"
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

/**
 * Format a date string to short date (e.g., "Jan 15, 2026")
 */
export function formatDate(dateString: string | null): string {
  if (!dateString) return "—"
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

/**
 * Truncate text with ellipsis
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength).trimEnd() + "…"
}

/**
 * Get score color based on value (0-100)
 */
export function getScoreColor(score: number): string {
  if (score >= 80) return "text-accent-green"
  if (score >= 50) return "text-accent-amber"
  return "text-accent-red"
}

/**
 * Get score background color based on value (0-100)
 */
export function getScoreBgColor(score: number): string {
  if (score >= 80) return "bg-status-success-bg"
  if (score >= 50) return "bg-status-warning-bg"
  return "bg-status-error-bg"
}
