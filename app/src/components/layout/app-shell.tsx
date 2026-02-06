"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { motion, useReducedMotion } from "motion/react";
import { Sidebar } from "./sidebar";
import { Menu } from "lucide-react";
import { SmoothDrawer } from "@/components/kokonutui/smooth-drawer";
import { easings, durations } from "@/lib/motion";

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const [mobileNavOpen, setMobileNavOpen] = React.useState(false);
  const pathname = usePathname();
  const prefersReducedMotion = useReducedMotion();

  return (
    <>
      {/* Mobile Header with Hamburger - only shown on mobile */}
      <header
        className="md:hidden fixed top-0 left-0 right-0 z-40 px-4 py-3 border-b flex items-center gap-3"
        style={{
          backgroundColor: "var(--bg-elevated)",
          borderColor: "var(--border-soft)",
        }}
      >
        <SmoothDrawer
          open={mobileNavOpen}
          onOpenChange={setMobileNavOpen}
          side="left"
          trigger={
            <button
              className="p-2 -ml-2 hover:bg-[rgba(0,0,0,0.04)] rounded-lg transition-colors"
              aria-label="Open navigation menu"
            >
              <Menu className="w-5 h-5 text-[var(--text-primary)]" />
            </button>
          }
        >
          <Sidebar
            isMobileOpen={true}
            onMobileClose={() => setMobileNavOpen(false)}
          />
        </SmoothDrawer>
        <span className="text-[var(--text-primary)] font-semibold text-lg tracking-tight">
          PodBrain
        </span>
      </header>

      {/* App Container - CSS Grid layout */}
      <div className="app-container">
        {/* Desktop sidebar - hidden on mobile */}
        <Sidebar key="desktop-sidebar" />

        <motion.main
          key={pathname}
          className="main-content"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={
            prefersReducedMotion
              ? { duration: 0 }
              : {
                  duration: durations.enter,
                  ease: easings.outExpo,
                }
          }
        >
          <div className="mx-auto max-w-[1400px] w-full px-4 sm:px-6 md:px-16 py-6 md:py-10">
            <a
              href="#main-content"
              className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-[var(--bg-elevated)] focus:rounded-lg focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-[var(--accent-blue)] focus:ring-offset-2"
            >
              Skip to main content
            </a>
            <div id="main-content">{children}</div>
          </div>
        </motion.main>
      </div>
    </>
  );
}
