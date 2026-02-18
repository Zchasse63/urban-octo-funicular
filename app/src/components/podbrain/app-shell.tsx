"use client";

import { motion } from "motion/react";
import Sidebar from "./sidebar";
import MobileNav from "./mobile-nav";
import useKeyboardShortcuts from "@/hooks/use-keyboard-shortcuts";

export default function AppShell({ children }: { children: React.ReactNode }) {
  useKeyboardShortcuts();
  return (
    <div className="relative flex h-dvh overflow-hidden bg-bg-base">
      {/* Dot grid background */}
      <div
        className="pointer-events-none fixed inset-0 z-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "radial-gradient(circle, #121212 0.75px, transparent 0.75px)",
          backgroundSize: "24px 24px",
        }}
      />

      {/* Desktop Sidebar */}
      <div className="hidden lg:block relative z-10">
        <Sidebar />
      </div>

      {/* Main Content Area */}
      <div className="relative z-10 flex flex-1 flex-col overflow-hidden">
        {/* Mobile Nav */}
        <MobileNav />

        {/* Page Content */}
        <motion.main
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: [0.25, 1, 0.5, 1] }}
          className="flex-1 overflow-y-auto"
        >
          <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
            {children}
          </div>
        </motion.main>
      </div>
    </div>
  );
}
