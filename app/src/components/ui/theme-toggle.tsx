"use client"

import { useEffect, useState, useCallback } from "react"
import { Sun, Moon } from "lucide-react"
import { cn } from "@/lib/utils"

type Theme = "light" | "dark"

function getInitialTheme(): Theme {
  if (typeof window === "undefined") return "light"
  const stored = localStorage.getItem("podbrain-theme") as Theme | null
  if (stored === "light" || stored === "dark") return stored
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
}

function ThemeToggle({ className }: { className?: string }) {
  const [theme, setTheme] = useState<Theme>("light")
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    setTheme(getInitialTheme())
  }, [])

  useEffect(() => {
    if (!mounted) return
    document.documentElement.setAttribute("data-theme", theme)
    localStorage.setItem("podbrain-theme", theme)
  }, [theme, mounted])

  const toggle = useCallback(() => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"))
  }, [])

  // Prevent flash during hydration
  if (!mounted) {
    return (
      <button className={cn("p-2 rounded-[var(--radius-sm)]", className)} aria-label="Toggle theme">
        <Sun className="w-4 h-4 text-[var(--color-text-tertiary)]" />
      </button>
    )
  }

  return (
    <button
      onClick={toggle}
      className={cn(
        "p-2 rounded-[var(--radius-sm)]",
        "text-[var(--color-text-tertiary)]",
        "hover:text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-active)]",
        "transition-colors duration-[var(--duration-fast)]",
        "cursor-pointer",
        className
      )}
      aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
    >
      {theme === "light" ? (
        <Moon className="w-4 h-4" />
      ) : (
        <Sun className="w-4 h-4" />
      )}
    </button>
  )
}

export { ThemeToggle }
