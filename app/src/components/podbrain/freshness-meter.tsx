"use client";

import { motion } from "motion/react";
import { cn } from "@/lib/utils";

interface FreshnessMeterProps {
  value: number; // 0-100
  label?: string;
  className?: string;
}

function getMeterColor(value: number): string {
  if (value >= 70) return "bg-accent-green";
  if (value >= 40) return "bg-accent-amber";
  return "bg-accent-red";
}

export default function FreshnessMeter({
  value,
  label,
  className,
}: FreshnessMeterProps) {
  const clampedValue = Math.max(0, Math.min(100, value));

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {label && (
        <div className="flex items-center justify-between">
          <span className="font-mono text-[10px] font-medium uppercase tracking-wider text-text-tertiary">
            {label}
          </span>
          <span className="font-mono text-[10px] font-semibold tabular-nums text-text-secondary">
            {clampedValue}%
          </span>
        </div>
      )}
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-border-soft">
        <motion.div
          className={cn("h-full rounded-full", getMeterColor(clampedValue))}
          initial={{ width: 0 }}
          animate={{ width: `${clampedValue}%` }}
          transition={{ duration: 0.8, ease: [0.25, 1, 0.5, 1] }}
        />
      </div>
    </div>
  );
}
