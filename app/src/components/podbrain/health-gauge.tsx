"use client";

import { motion, useMotionValue, useTransform, animate } from "motion/react";
import { useEffect, useRef } from "react";
import { cn, getScoreColor } from "@/lib/utils";

interface HealthGaugeProps {
  value: number; // 0-100
  label: string;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  className?: string;
}

const sizeConfig = {
  sm: { dimension: 64, strokeWidth: 4, fontSize: "text-sm", labelSize: "text-[9px]" },
  md: { dimension: 96, strokeWidth: 5, fontSize: "text-xl", labelSize: "text-[10px]" },
  lg: { dimension: 128, strokeWidth: 6, fontSize: "text-2xl", labelSize: "text-xs" },
};

export default function HealthGauge({
  value,
  label,
  size = "md",
  showLabel = true,
  className,
}: HealthGaugeProps) {
  const config = sizeConfig[size];
  const radius = (config.dimension - config.strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = config.dimension / 2;

  const color = getScoreColor(value);

  // Animated counter
  const countRef = useRef<HTMLSpanElement>(null);
  const motionValue = useMotionValue(0);

  useEffect(() => {
    const controls = animate(motionValue, value, {
      duration: 1.2,
      ease: [0.25, 1, 0.5, 1],
      onUpdate: (latest) => {
        if (countRef.current) {
          countRef.current.textContent = Math.round(latest).toString();
        }
      },
    });
    return () => controls.stop();
  }, [value, motionValue]);

  const reducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  return (
    <div className={cn("flex flex-col items-center gap-1.5", className)}>
      <div className="relative" style={{ width: config.dimension, height: config.dimension }}>
        <svg
          viewBox={`0 0 ${config.dimension} ${config.dimension}`}
          className="rotate-[-90deg]"
          width={config.dimension}
          height={config.dimension}
        >
          {/* Background circle */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="currentColor"
            className="text-border-soft"
            strokeWidth={config.strokeWidth}
          />
          {/* Progress circle */}
          <motion.circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={config.strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{
              strokeDashoffset: circumference - (value / 100) * circumference,
            }}
            transition={
              reducedMotion
                ? { duration: 0 }
                : { duration: 1.2, ease: [0.25, 1, 0.5, 1] }
            }
          />
        </svg>

        {/* Center text */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span
            ref={countRef}
            className={cn("font-semibold tabular-nums text-text-primary", config.fontSize)}
          >
            {reducedMotion ? value : 0}
          </span>
        </div>
      </div>

      {showLabel && (
        <span
          className={cn(
            "font-mono font-medium uppercase tracking-wider text-text-tertiary",
            config.labelSize
          )}
        >
          {label}
        </span>
      )}
    </div>
  );
}
