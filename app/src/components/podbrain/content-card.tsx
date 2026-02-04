"use client";

import React from "react";
import { LiquidGlassCard } from "@/components/kokonutui/liquid-glass-card";
import { cn } from "@/lib/utils";

export interface ContentCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  subtitle?: string;
  variant?: "primary" | "secondary";
}

export function ContentCard({
  title,
  subtitle,
  variant = "primary",
  className,
  children,
  ...props
}: ContentCardProps) {
  return (
    <LiquidGlassCard
      className={cn(
        "bg-[var(--bg-elevated)] border border-[var(--border-soft)]",
        variant === "primary" ? "shadow-[var(--shadow-elevation-2)]" : "shadow-[var(--shadow-elevation-1)]",
        className
      )}
      glassEffect={true}
      {...props}
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <h3
            className="font-mono text-xs font-medium uppercase tracking-wider"
            style={{ color: "var(--text-secondary)" }}
          >
            {title}
          </h3>
          {subtitle && (
            <p
              className="text-sm"
              style={{ color: "var(--text-tertiary)" }}
            >
              {subtitle}
            </p>
          )}
        </div>
        {children && (
          <div style={{ color: "var(--text-primary)" }}>
            {children}
          </div>
        )}
      </div>
    </LiquidGlassCard>
  );
}
