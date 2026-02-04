"use client";

import React from "react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { X } from "lucide-react";
import { springs } from "@/lib/motion";
import { cn } from "@/lib/utils";

export interface AlertCardProps {
  variant: "warning" | "error" | "success" | "info";
  title: string;
  description?: string;
  onDismiss?: () => void;
  action?: {
    label: string;
    onClick: () => void;
  };
  isVisible?: boolean;
}

const VARIANT_STYLES = {
  warning: {
    bg: "var(--color-status-warning-bg)",
    border: "var(--accent-amber)",
    text: "var(--color-status-warning-text)",
  },
  error: {
    bg: "var(--color-status-error-bg)",
    border: "var(--accent-red)",
    text: "var(--color-status-error-text)",
  },
  success: {
    bg: "var(--color-status-success-bg)",
    border: "var(--accent-green)",
    text: "var(--color-status-success-text)",
  },
  info: {
    bg: "var(--color-status-info-bg)",
    border: "var(--accent-blue)",
    text: "var(--color-status-info-text)",
  },
};

export function AlertCard({
  variant,
  title,
  description,
  onDismiss,
  action,
  isVisible = true,
}: AlertCardProps) {
  const styles = VARIANT_STYLES[variant];
  const prefersReducedMotion = useReducedMotion();

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={prefersReducedMotion ? { duration: 0 } : springs.snappy}
          className={cn(
            "relative rounded-lg p-4 border-l-[3px]",
            "shadow-[var(--shadow-elevation-1)]"
          )}
          style={{
            backgroundColor: styles.bg,
            borderLeftColor: styles.border,
          }}
          role="alert"
          aria-live="polite"
          aria-atomic="true"
        >
          <div className="flex items-start gap-3">
            <div className="flex-1">
              <h4
                className="font-semibold text-sm"
                style={{ color: styles.text }}
              >
                {title}
              </h4>
              {description && (
                <p
                  className="mt-1 text-sm"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {description}
                </p>
              )}
              {action && (
                <button
                  onClick={action.onClick}
                  className="mt-2 text-sm font-medium underline transition-opacity hover:opacity-80"
                  style={{ color: styles.text }}
                >
                  {action.label}
                </button>
              )}
            </div>
            {onDismiss && (
              <button
                onClick={onDismiss}
                className="shrink-0 rounded p-1 transition-colors hover:bg-black/5"
                aria-label="Dismiss"
                style={{ color: "var(--text-secondary)" }}
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
