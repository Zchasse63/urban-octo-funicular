"use client"

import { cn } from "@/lib/utils"
import { useState, useEffect, useCallback, type ReactNode } from "react"
import { Sidebar } from "./sidebar"
import { MobileHeader } from "./mobile-header"

interface AppShellProps {
  children: ReactNode
}

function AppShell({ children }: AppShellProps) {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)

  // Restore collapse state from localStorage
  useEffect(() => {
    const stored = localStorage.getItem("podbrain-sidebar-collapsed")
    if (stored === "true") setCollapsed(true)
  }, [])

  const toggleCollapse = useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev
      localStorage.setItem("podbrain-sidebar-collapsed", String(next))
      return next
    })
  }, [])

  const toggleMobileSidebar = useCallback(() => {
    setMobileSidebarOpen((prev) => !prev)
  }, [])

  // Close mobile sidebar on route change (Next.js handles this via pathname)
  // and on escape key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && mobileSidebarOpen) {
        setMobileSidebarOpen(false)
      }
    }
    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [mobileSidebarOpen])

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Desktop sidebar */}
      <Sidebar
        collapsed={collapsed}
        onToggleCollapse={toggleCollapse}
        className="hidden md:flex"
      />

      {/* Mobile sidebar overlay */}
      {mobileSidebarOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-[var(--color-bg-overlay)] md:hidden"
            onClick={() => setMobileSidebarOpen(false)}
          />
          <Sidebar
            collapsed={false}
            onToggleCollapse={() => setMobileSidebarOpen(false)}
            className="fixed inset-y-0 left-0 z-50 w-60 md:hidden"
          />
        </>
      )}

      {/* Main content area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <MobileHeader
          sidebarOpen={mobileSidebarOpen}
          onToggleSidebar={toggleMobileSidebar}
        />

        <main
          className={cn(
            "flex-1 overflow-y-auto",
            "px-4 py-6 sm:px-6 lg:px-8"
          )}
        >
          <div className="mx-auto max-w-[1400px]">{children}</div>
        </main>
      </div>
    </div>
  )
}

export { AppShell }
