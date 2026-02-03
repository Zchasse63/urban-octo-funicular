"use client";

import * as React from "react";
import { Sidebar } from "./sidebar";
import { ToastProvider } from "@/components/ui/toast";
import { Menu } from "lucide-react";

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = React.useState(false);

  // Close sidebar on navigation (mobile)
  React.useEffect(() => {
    const handleRouteChange = () => setIsMobileSidebarOpen(false);
    window.addEventListener("popstate", handleRouteChange);
    return () => window.removeEventListener("popstate", handleRouteChange);
  }, []);

  // Prevent body scroll when mobile sidebar is open
  React.useEffect(() => {
    if (isMobileSidebarOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileSidebarOpen]);

  return (
    <ToastProvider>
      {/* Mobile Header with Hamburger - only shown on mobile */}
      <header
        className="md:hidden fixed top-0 left-0 right-0 z-40 px-4 py-3 border-b flex items-center gap-3"
        style={{
          backgroundColor: "var(--bg-elevated)",
          borderColor: "var(--border-soft)",
        }}
      >
        <button
          onClick={() => setIsMobileSidebarOpen(true)}
          className="p-2 rounded-lg hover:bg-[var(--bg-subtle)] transition-colors"
          aria-label="Open menu"
          aria-expanded={isMobileSidebarOpen}
        >
          <Menu className="w-5 h-5" style={{ color: "var(--text-primary)" }} />
        </button>
        <span className="text-[var(--text-primary)] font-semibold text-lg tracking-tight">
          PodBrain
        </span>
      </header>

      {/* App Container - CSS Grid layout */}
      <div className="app-container">
        <Sidebar
          isMobileOpen={isMobileSidebarOpen}
          onMobileClose={() => setIsMobileSidebarOpen(false)}
        />

        <main className="main-content">
          <div className="mx-auto max-w-[1400px] w-full px-4 sm:px-6 md:px-16 py-6 md:py-10">
            <a
              href="#main-content"
              className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-[var(--bg-elevated)] focus:rounded-lg focus:shadow-lg"
            >
              Skip to main content
            </a>
            <div id="main-content">{children}</div>
          </div>
        </main>
      </div>
    </ToastProvider>
  );
}
