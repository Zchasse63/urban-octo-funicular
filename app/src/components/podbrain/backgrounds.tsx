"use client";

/**
 * @description: PodBrain Background Components - Wrappers around Kokonut UI backgrounds
 * @version: 1.0.0
 */

import { motion, useReducedMotion } from "motion/react";
import BackgroundPaths from "@/components/kokonutui/background-paths";
import BeamsBackground from "@/components/kokonutui/beams-background";

/**
 * UploadHero - Hero section background for upload page with animated paths
 */
export interface UploadHeroProps {
  children: React.ReactNode;
  title?: string;
}

export function UploadHero({ children, title }: UploadHeroProps) {
  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      {/* Background layer at z-0 */}
      <div className="absolute inset-0 z-0">
        <BackgroundPaths title={title} />
      </div>

      {/* Content overlay at z-10 */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}

/**
 * DashboardBackground - Subtle animated beams for dashboard atmosphere
 */
export interface DashboardBackgroundProps {
  children: React.ReactNode;
  className?: string;
}

export function DashboardBackground({ children, className }: DashboardBackgroundProps) {
  return (
    <div className="relative min-h-screen w-full">
      {/* Background layer - BeamsBackground renders its own container */}
      <div className="absolute inset-0 z-0">
        <BeamsBackground intensity="subtle" className={className} />
      </div>

      {/* Content overlay at z-10 */}
      <div className="relative z-10 min-h-screen">
        {children}
      </div>
    </div>
  );
}

/**
 * EmptyStateBackground - Lightweight background for empty state pages
 */
export interface EmptyStateBackgroundProps {
  children: React.ReactNode;
}

export function EmptyStateBackground({ children }: EmptyStateBackgroundProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      {/* Background layer at z-0 with reduced opacity */}
      <div className="absolute inset-0 z-0 opacity-40">
        <div className="pointer-events-none absolute inset-0 overflow-hidden bg-white dark:bg-neutral-950">
          <svg
            className="h-full w-full text-slate-950/20 dark:text-white/20"
            fill="none"
            preserveAspectRatio="xMidYMid slice"
            viewBox="-2400 -800 4800 1600"
            role="presentation"
          >
            <title>Empty State Background</title>
            <defs>
              <linearGradient id="emptyStateGradient" x1="0%" x2="100%" y1="0%" y2="0%">
                <stop offset="0%" stopColor="rgba(147, 51, 234, 0.3)" />
                <stop offset="50%" stopColor="rgba(236, 72, 153, 0.3)" />
                <stop offset="100%" stopColor="rgba(59, 130, 246, 0.3)" />
              </linearGradient>
            </defs>
            <motion.path
              animate={{ y: prefersReducedMotion ? 0 : [0, -10, 0] }}
              d="M 2400 800 C 2200 750, 2000 700, 1800 650 C 1600 600, 1400 550, 1200 500 C 1000 450, 800 400, 600 350 C 400 300, 200 250, 0 200"
              initial={{ opacity: 0 }}
              stroke="url(#emptyStateGradient)"
              strokeLinecap="round"
              strokeWidth={3}
              transition={
                prefersReducedMotion
                  ? { duration: 0 }
                  : {
                      opacity: { duration: 1 },
                      y: {
                        duration: 6,
                        repeat: Number.POSITIVE_INFINITY,
                        ease: "easeInOut",
                        repeatType: "reverse",
                      },
                    }
              }
            />
          </svg>
        </div>
      </div>

      {/* Content overlay at z-10 with centering */}
      <div className="relative z-10 flex min-h-screen items-center justify-center">
        {children}
      </div>
    </div>
  );
}
