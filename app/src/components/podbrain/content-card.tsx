"use client";

import { cn } from "@/lib/utils";
import { LiquidGlassCard, type LiquidGlassCardProps } from "@/components/kokonutui/liquid-glass-card";

// Wrapper around LiquidGlassCard with PodBrain defaults
export function GlassCard({
  className,
  children,
  ...props
}: LiquidGlassCardProps) {
  return (
    <LiquidGlassCard
      className={cn(
        "rounded-xl border border-border-soft bg-bg-elevated/80",
        className
      )}
      {...props}
    >
      {children}
    </LiquidGlassCard>
  );
}

// Simple elevated card without glass effect
export function ElevatedCard({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border-soft bg-bg-elevated p-6 shadow-[var(--shadow-topo)] transition-shadow hover:shadow-[var(--shadow-topo-hover)]",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

// Stat card for dashboard metrics
export function StatCard({
  label,
  value,
  sublabel,
  className,
}: {
  label: string;
  value: string | number;
  sublabel?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-xl border border-border-soft bg-bg-elevated p-4 shadow-[var(--shadow-topo)] transition-all duration-200 hover:shadow-[var(--shadow-topo-hover)] hover:-translate-y-0.5",
        className
      )}
    >
      {/* Gradient accent line — visible on hover */}
      <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-accent-blue to-accent-purple opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
      <p className="font-mono text-[10px] font-semibold uppercase tracking-wider text-text-tertiary">
        {label}
      </p>
      <p className="mt-1 text-2xl font-semibold tabular-nums text-text-primary">
        {value}
      </p>
      {sublabel && (
        <p className="mt-0.5 text-xs text-text-secondary">{sublabel}</p>
      )}
    </div>
  );
}
