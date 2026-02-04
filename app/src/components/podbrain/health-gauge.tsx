"use client";

import React, { useEffect } from "react";
import { motion, useMotionValue, useTransform, animate, useReducedMotion } from "motion/react";
import { springs } from "@/lib/motion";

export interface HealthGaugeProps {
  value: number; // 0-100
  label: string;
  color: string;
  size?: "sm" | "md" | "lg";
}

const SIZE_CONFIG = {
  sm: { width: 64, height: 64, strokeWidth: 6, fontSize: "text-lg" },
  md: { width: 80, height: 80, strokeWidth: 8, fontSize: "text-xl" },
  lg: { width: 120, height: 120, strokeWidth: 10, fontSize: "text-3xl" },
};

export function HealthGauge({
  value,
  label,
  color,
  size = "md",
}: HealthGaugeProps) {
  const prefersReducedMotion = useReducedMotion();
  const config = SIZE_CONFIG[size];
  const radius = (config.width - config.strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;

  // Motion values for animation
  const progress = useMotionValue(0);
  const displayValue = useTransform(progress, (p) => Math.round(p));

  // Calculate stroke-dashoffset based on progress
  const dashoffset = circumference - (value / 100) * circumference;

  useEffect(() => {
    const controls = animate(progress, value, {
      ...springs.smooth,
      duration: prefersReducedMotion ? 0 : 1.5,
    });

    return controls.stop;
  }, [value, progress, prefersReducedMotion]);

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: config.width, height: config.height }}>
        <svg
          width={config.width}
          height={config.height}
          viewBox={`0 0 ${config.width} ${config.height}`}
          className="transform -rotate-90"
          aria-label={`${label} - ${value}%`}
        >
          <title>{`${label} - ${value}%`}</title>

          {/* Background ring */}
          <circle
            cx={config.width / 2}
            cy={config.height / 2}
            r={radius}
            fill="none"
            stroke="var(--border-soft)"
            strokeWidth={config.strokeWidth}
          />

          {/* Progress ring */}
          <circle
            cx={config.width / 2}
            cy={config.height / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={config.strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={dashoffset}
            strokeLinecap="round"
            style={{
              filter: "drop-shadow(0 0 4px rgba(0,0,0,0.1))",
            }}
          />
        </svg>

        {/* Center value */}
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.span
            className={`font-bold tabular-nums ${config.fontSize}`}
            style={{ color: "var(--text-primary)" }}
          >
            {displayValue}
          </motion.span>
        </div>
      </div>

      {/* Label */}
      <span
        className="font-mono text-xs font-medium uppercase tracking-wider"
        style={{ color: "var(--text-secondary)" }}
      >
        {label}
      </span>
    </div>
  );
}
