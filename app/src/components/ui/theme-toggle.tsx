"use client"

import { useEffect, useState } from "react"
import { Moon, Sun } from "lucide-react"
import { cn } from "@/lib/utils"

function ThemeToggle({ className }: { className?: string }) {
  const [mounted, setMounted] = useState(false)
  const [theme, setTheme] = useState<"light" | "dark">("light")

  useEffect(() => {
    setMounted(true)
    const current = document.documentElement.getAttribute("data-theme")
    setTheme(current === "dark" ? "dark" : "light")
  }, [])

  function toggleTheme() {
    const next = theme === "dark" ? "light" : "dark"
    setTheme(next)
    document.documentElement.setAttribute("data-theme", next)
    localStorage.setItem("podbrain-theme", next)
  }

  if (!mounted) return null

  return (
    <button
      onClick={toggleTheme}
      className={cn(
        "inline-flex h-8 w-8 items-center justify-center",
        "rounded-[var(--radius-sm)]",
        "text-[var(--color-text-secondary)]",
        "transition-colors duration-[var(--duration-fast)]",
        "hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text-ink)]",
        "cursor-pointer",
        className
      )}
      aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
    >
      {theme === "dark" ? (
        <Sun className="h-4 w-4" />
      ) : (
        <Moon className="h-4 w-4" />
      )}
    </button>
  )
}

export { ThemeToggle }
