"use client";

import React, { useEffect } from "react";
import { motion, useMotionValue, animate, useReducedMotion } from "motion/react";
import { springs } from "@/lib/motion";

export interface FreshnessMeterProps {
  daysOld: number;
  maxDays: number;
  showLabel?: boolean;
  className?: string;
}

export function FreshnessMeter({
  daysOld,
  maxDays,
  showLabel = true,
  className,
}: FreshnessMeterProps) {
  const freshnessPercentage = Math.max(0, Math.min(100, (1 - daysOld / maxDays) * 100));
  const width = useMotionValue(0);
  const prefersReducedMotion = useReducedMotion();

  // Determine color based on freshness
  let color: string;
  if (freshnessPercentage >= 80) {
    color = "var(--accent-green)";
  } else if (freshnessPercentage >= 50) {
    color = "var(--accent-amber)";
  } else {
    color = "var(--accent-red)";
  }

  useEffect(() => {
    const controls = animate(width, freshnessPercentage, {
      ...springs.smooth,
      duration: prefersReducedMotion ? 0 : 1,
    });

    return controls.stop;
  }, [freshnessPercentage, width, prefersReducedMotion]);

  return (
    <div className={className}>
      {showLabel && (
        <div className="mb-2 flex items-center justify-between">
          <span
            className="font-mono text-xs font-medium uppercase tracking-wider"
            style={{ color: "var(--text-secondary)" }}
          >
            Freshness:
          </span>
          <span
            className="font-mono text-xs font-semibold tabular-nums"
            style={{ color }}
          >
            {Math.round(freshnessPercentage)}%
          </span>
        </div>
      )}

      <div
        className="relative h-2 w-full overflow-hidden rounded-full"
        style={{ backgroundColor: "var(--bg-subtle)" }}
      >
        <motion.div
          className="h-full rounded-full"
          style={{
            width: width.get() + "%",
            backgroundColor: color,
          }}
          initial={{ width: 0 }}
        >
          <motion.div
            style={{
              width: `${freshnessPercentage}%`,
              backgroundColor: color,
              height: "100%",
            }}
          />
        </motion.div>
      </div>
    </div>
  );
}
