"use client"

import { cn } from "@/lib/utils"
import { Menu, X } from "lucide-react"
import { ThemeToggle } from "@/components/ui/theme-toggle"

interface MobileHeaderProps {
  sidebarOpen: boolean
  onToggleSidebar: () => void
}

function MobileHeader({ sidebarOpen, onToggleSidebar }: MobileHeaderProps) {
  return (
    <header
      className={cn(
        "flex h-14 items-center justify-between border-b border-[var(--color-border)]",
        "bg-[var(--color-bg-sidebar)] px-4",
        "md:hidden"
      )}
    >
      <button
        onClick={onToggleSidebar}
        className={cn(
          "flex h-11 w-11 items-center justify-center rounded-[var(--radius-sm)]",
          "text-[var(--color-text-secondary)] transition-colors",
          "hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text-ink)]"
        )}
        aria-label={sidebarOpen ? "Close menu" : "Open menu"}
      >
        {sidebarOpen ? (
          <X className="h-5 w-5" />
        ) : (
          <Menu className="h-5 w-5" />
        )}
      </button>

      <span className="font-[family-name:var(--font-display)] text-[var(--text-body-sm)] font-bold text-[var(--color-text-ink)]">
        PodBrain
      </span>

      <ThemeToggle />
    </header>
  )
}

export { MobileHeader }
