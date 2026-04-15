"use client"

import { useState, useEffect, useCallback, type ReactNode } from "react"
import { Sidebar } from "./sidebar"
import { MobileHeader } from "./mobile-header"
import { SubscriptionBanners } from "@/components/ui/subscription-banners"
import { useUsage } from "@/hooks/use-usage"

interface AppShellProps {
  children: ReactNode
}

function AppShell({ children }: AppShellProps) {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const { usage } = useUsage()

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

  // Close mobile sidebar on escape key
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
    <div className="flex h-screen overflow-hidden bg-background text-foreground font-sans">
      {/* Desktop sidebar */}
      <div className="hidden md:flex">
        <Sidebar
          collapsed={collapsed}
          onToggleCollapse={toggleCollapse}
        />
      </div>

      {/* Mobile sidebar overlay */}
      {mobileSidebarOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/30 md:hidden"
            onClick={() => setMobileSidebarOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 z-50 md:hidden">
            <Sidebar
              collapsed={false}
              onToggleCollapse={() => setMobileSidebarOpen(false)}
            />
          </div>
        </>
      )}

      {/* Main content area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <MobileHeader
          sidebarOpen={mobileSidebarOpen}
          onToggleSidebar={toggleMobileSidebar}
        />

        {/* Subscription status banner (trialing / past_due / blocked) */}
        <SubscriptionBanners
          status={usage?.status ?? null}
          trialEndsAt={usage?.trialEndsAt ?? null}
          pastDueSince={usage?.pastDueSince ?? null}
        />

        <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-[1400px]">{children}</div>
        </main>
      </div>
    </div>
  )
}

export { AppShell }
