"use client"

import { useState, useCallback, useEffect } from "react"
import { usePathname } from "next/navigation"
import { Menu, X } from "lucide-react"
import { Sidebar } from "@/components/layout/sidebar"
import { cn } from "@/lib/utils"

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const pathname = usePathname()

  // Close mobile sidebar on navigation
  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  // Close on escape
  useEffect(() => {
    if (!mobileOpen) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileOpen(false)
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [mobileOpen])

  const toggleMobile = useCallback(() => {
    setMobileOpen((prev) => !prev)
  }, [])

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Desktop sidebar */}
      <div className="hidden md:block">
        <Sidebar />
      </div>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-[var(--color-bg-overlay)] md:hidden animate-fade-in"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Mobile sidebar */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 md:hidden",
          "transition-transform duration-[var(--duration-slow)] ease-[var(--ease-out)]",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <Sidebar />
      </div>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        {/* Mobile header */}
        <div className="sticky top-0 z-30 flex items-center gap-3 px-4 py-3 bg-[var(--color-bg-base)] border-b border-[var(--color-border)] md:hidden">
          <button
            onClick={toggleMobile}
            className="p-1.5 rounded-[var(--radius-sm)] hover:bg-[var(--color-bg-active)] transition-colors"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
          >
            {mobileOpen ? (
              <X className="w-5 h-5 text-[var(--color-text-ink)]" />
            ) : (
              <Menu className="w-5 h-5 text-[var(--color-text-ink)]" />
            )}
          </button>
          <span className="font-[family-name:var(--font-display)] font-bold text-[var(--text-body)] text-[var(--color-text-ink)]">
            PodBrain
          </span>
        </div>

        <div className="max-w-[var(--content-max)] mx-auto px-4 py-4 sm:px-6 sm:py-6 lg:px-10 lg:py-8">
          {children}
        </div>
      </main>
    </div>
  )
}
