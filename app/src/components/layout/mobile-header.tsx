"use client"

import { cn } from "@/lib/utils"
import { Menu, X, Moon, Sun } from "lucide-react"
import { useState, useEffect } from "react"

interface MobileHeaderProps {
  sidebarOpen: boolean
  onToggleSidebar: () => void
}

function MobileHeader({ sidebarOpen, onToggleSidebar }: MobileHeaderProps) {
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains('dark'))
  }, [])

  const toggleDark = () => {
    const next = !isDark
    setIsDark(next)
    if (next) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
    localStorage.setItem('podbrain-theme', next ? 'dark' : 'light')
  }

  return (
    <header
      className={cn(
        "flex h-14 items-center justify-between border-b border-border",
        "bg-background px-4",
        "md:hidden"
      )}
    >
      <button
        onClick={onToggleSidebar}
        className="flex h-11 w-11 items-center justify-center rounded-md text-muted-foreground/70 transition-colors hover:bg-accent hover:text-accent-foreground"
        aria-label={sidebarOpen ? "Close menu" : "Open menu"}
      >
        {sidebarOpen ? (
          <X className="h-5 w-5" />
        ) : (
          <Menu className="h-5 w-5" />
        )}
      </button>

      <span className="font-sans text-sm font-bold text-foreground">
        PodBrain
      </span>

      <button
        onClick={toggleDark}
        className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground/70 transition-colors hover:bg-accent hover:text-accent-foreground"
        aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      >
        {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      </button>
    </header>
  )
}

export { MobileHeader }
