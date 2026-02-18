"use client";

import { motion, AnimatePresence } from "motion/react";
import { Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { springs } from "@/lib/motion";

// AI Loading Orb
export function AILoadingOrb({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center justify-center", className)}>
      <div className="relative h-16 w-16">
        <motion.div
          className="absolute inset-0 rounded-full bg-gradient-to-br from-accent-blue to-accent-purple opacity-20"
          animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.1, 0.2] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute inset-2 rounded-full bg-gradient-to-br from-accent-blue to-accent-purple opacity-40"
          animate={{ scale: [1, 1.1, 1], opacity: [0.4, 0.2, 0.4] }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 0.3,
          }}
        />
        <motion.div
          className="absolute inset-4 rounded-full bg-gradient-to-br from-accent-blue to-accent-purple"
          animate={{ rotate: 360 }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
        />
      </div>
    </div>
  );
}

// Processing Step List
interface ProcessingStep {
  id: string;
  label: string;
  status: "pending" | "active" | "completed" | "error";
}

export function ProcessingSteps({
  steps,
  className,
}: {
  steps: ProcessingStep[];
  className?: string;
}) {
  return (
    <div className={cn("space-y-3", className)}>
      {steps.map((step) => (
        <motion.div
          key={step.id}
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={springs.smooth}
          className="flex items-center gap-3"
        >
          <div className="flex h-6 w-6 shrink-0 items-center justify-center">
            {step.status === "completed" ? (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={springs.bouncy}
                className="flex h-5 w-5 items-center justify-center rounded-full bg-accent-green"
              >
                <Check className="h-3 w-3 text-white" />
              </motion.div>
            ) : step.status === "active" ? (
              <Loader2 className="h-5 w-5 animate-spin text-accent-blue" />
            ) : step.status === "error" ? (
              <div className="h-5 w-5 rounded-full bg-accent-red" />
            ) : (
              <div className="h-2 w-2 rounded-full bg-border-soft" />
            )}
          </div>
          <span
            className={cn(
              "text-sm",
              step.status === "completed"
                ? "text-text-secondary line-through"
                : step.status === "active"
                  ? "text-text-primary font-medium"
                  : step.status === "error"
                    ? "text-accent-red"
                    : "text-text-tertiary"
            )}
          >
            {step.label}
          </span>
        </motion.div>
      ))}
    </div>
  );
}

// Progress Bar
export function ProcessingProgressBar({
  progress,
  label,
  className,
}: {
  progress: number;
  label?: string;
  className?: string;
}) {
  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-text-secondary">{label}</span>
          <span className="font-mono text-xs font-medium tabular-nums text-text-primary">
            {Math.round(progress)}%
          </span>
        </div>
      )}
      <div className="h-2 overflow-hidden rounded-full bg-border-soft">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-accent-blue to-accent-purple"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}

// AI Content Reveal - typing effect for AI-generated content
export function AIContentReveal({
  content,
  isRevealing,
  className,
}: {
  content: string;
  isRevealing: boolean;
  className?: string;
}) {
  return (
    <div className={cn("relative", className)}>
      <AnimatePresence>
        {isRevealing ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-1"
          >
            {content.split("\n").map((line, i) => (
              <motion.p
                key={`${i}-${line.slice(0, 10)}`}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05, duration: 0.3 }}
                className="text-sm text-text-primary"
              >
                {line || "\u00A0"}
              </motion.p>
            ))}
          </motion.div>
        ) : (
          <div className="text-sm text-text-primary whitespace-pre-wrap">
            {content}
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
