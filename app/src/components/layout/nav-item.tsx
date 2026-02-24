"use client"

import { cn } from "@/lib/utils"
import Link from "next/link"
import { usePathname } from "next/navigation"
import type { LucideIcon } from "lucide-react"

interface NavItemProps {
  icon: LucideIcon
  label: string
  href: string
  count?: number
  statusColor?: "success" | "warning" | "processing" | "error"
  isAccent?: boolean
  collapsed?: boolean
}

const statusDotColors: Record<string, string> = {
  success: "bg-[var(--color-status-success)]",
  warning: "bg-[var(--color-status-warning)]",
  processing: "bg-[var(--color-status-processing)]",
  error: "bg-[var(--color-status-error)]",
}

function NavItem({
  icon: Icon,
  label,
  href,
  count,
  statusColor,
  isAccent,
  collapsed,
}: NavItemProps) {
  const pathname = usePathname()
  const isActive = pathname === href || pathname.startsWith(href + "/")

  return (
    <Link
      href={href}
      className={cn(
        "group relative flex items-center gap-3 rounded-[var(--radius-md)] px-3 py-2",
        "font-[family-name:var(--font-display)] text-[var(--text-body-sm)] font-medium",
        "transition-all duration-[var(--duration-fast)]",
        collapsed && "justify-center px-0",
        isActive
          ? [
              "bg-[var(--color-bg-surface)] text-[var(--color-text-ink)]",
              "shadow-[var(--shadow-card)]",
            ]
          : [
              "text-[var(--color-text-secondary)]",
              "hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text-ink)]",
            ]
      )}
    >
      {/* Active indicator bar */}
      {isActive && (
        <span className="absolute left-0 top-1/2 h-4 w-[3px] -translate-y-1/2 rounded-r-[var(--radius-full)] bg-[var(--color-accent-blue)]" />
      )}

      <Icon
        className={cn(
          "h-[18px] w-[18px] flex-shrink-0",
          isAccent && !isActive && "text-[var(--color-accent-warm)]"
        )}
      />

      {!collapsed && (
        <>
          <span className="flex-1 truncate">{label}</span>

          <div className="flex items-center gap-1.5">
            {count !== undefined && (
              <span
                className={cn(
                  "font-[family-name:var(--font-mono)] text-[10px] font-medium",
                  "min-w-[20px] rounded-[var(--radius-full)] px-1.5 py-0.5 text-center",
                  isActive
                    ? "bg-[var(--color-accent-blue-light)] text-[var(--color-accent-blue)]"
                    : "bg-[var(--color-bg-hover)] text-[var(--color-text-secondary)]"
                )}
              >
                {count}
              </span>
            )}

            {statusColor && (
              <span
                className={cn(
                  "h-2 w-2 rounded-[var(--radius-full)]",
                  statusDotColors[statusColor]
                )}
              />
            )}
          </div>
        </>
      )}
    </Link>
  )
}

export { NavItem }
