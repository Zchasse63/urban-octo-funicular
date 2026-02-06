"use client";

/**
 * Processing States - AI-native loading experiences
 * Phase 6: Loading & AI States components
 */

import { useState, useEffect } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import AILoadingState from '@/components/kokonutui/ai-loading';
import ShimmerText from '@/components/kokonutui/shimmer-text';
import { springs } from '@/lib/motion';
import { cn } from '@/lib/utils';

export interface ProcessingStep {
  label: string;
  status: 'pending' | 'active' | 'complete';
}

export interface ProcessingStateProps {
  title?: string;
  progress?: number;
  steps?: ProcessingStep[];
  className?: string;
}

export interface AIContentRevealProps {
  content: string;
  speed?: number;
  interval?: number;
  onComplete?: () => void;
  className?: string;
}

/**
 * ProcessingState - Composite loading state with orb, shimmer title, progress bar, and step list
 */
export function ProcessingState({
  title,
  progress = 0,
  steps = [],
  className,
}: ProcessingStateProps) {
  const prefersReducedMotion = useReducedMotion();
  const clampedProgress = Math.max(0, Math.min(100, progress));

  const containerVariants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.1 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: {
      opacity: 1,
      x: 0,
      transition: prefersReducedMotion ? { duration: 0 } : springs.smooth
    },
  };

  return (
    <div
      className={cn("flex flex-col items-center space-y-6 w-full max-w-2xl mx-auto", className)}
      role="status"
      aria-live="polite"
      aria-label={`Processing ${title || 'content'}`}
    >
      {/* AI Loading Orb */}
      <div className="w-full flex justify-center">
        <AILoadingState />
      </div>

      {/* Shimmer Title */}
      {title && (
        <div className="w-full flex justify-center">
          <ShimmerText text={title} className="text-2xl" />
        </div>
      )}

      {/* Progress Bar */}
      <div className="w-full space-y-2">
        <div className="flex items-center justify-between text-sm text-[var(--text-secondary)]">
          <span>Progress</span>
          <span>{Math.round(clampedProgress)}%</span>
        </div>
        <div
          className="h-2 w-full rounded-full bg-[var(--bg-subtle)] overflow-hidden"
          role="progressbar"
          aria-valuenow={clampedProgress}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <motion.div
            className="h-full bg-[var(--accent-blue)] rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${clampedProgress}%` }}
            transition={prefersReducedMotion ? { duration: 0 } : springs.smooth}
          />
        </div>
      </div>

      {/* Step List */}
      {steps.length > 0 && (
        <motion.ul
          className="w-full space-y-3"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {steps.map((step, index) => (
            <motion.li
              key={`${step.label}-${index}`}
              variants={itemVariants}
              className="flex items-center gap-3"
              role="status"
            >
              {/* Status Indicator */}
              {step.status === 'pending' && (
                <div className="w-5 h-5 rounded-full bg-[var(--bg-subtle)] border-2 border-[var(--border-soft)]" />
              )}
              {step.status === 'active' && (
                <motion.div
                  className="w-5 h-5 rounded-full border-2 border-[var(--accent-blue)]"
                  animate={{ rotate: 360 }}
                  transition={{
                    duration: 1,
                    repeat: Number.POSITIVE_INFINITY,
                    ease: 'linear',
                  }}
                >
                  <div className="w-1 h-1 bg-[var(--accent-blue)] rounded-full m-0.5" />
                </motion.div>
              )}
              {step.status === 'complete' && (
                <motion.div
                  className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={prefersReducedMotion ? { duration: 0 } : springs.bouncy}
                >
                  <svg
                    className="w-3 h-3 text-white"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path d="M5 13l4 4L19 7" />
                  </svg>
                </motion.div>
              )}

              {/* Step Label */}
              <span
                className={cn(
                  "text-sm",
                  step.status === 'active' ? "text-[var(--text-primary)] font-medium" : "text-[var(--text-secondary)]"
                )}
              >
                {step.label}
              </span>
            </motion.li>
          ))}
        </motion.ul>
      )}
    </div>
  );
}

/**
 * AIContentReveal - Typewriter effect for revealing show notes
 */
export function AIContentReveal({
  content,
  speed = 2,
  interval = 30,
  onComplete,
  className,
}: AIContentRevealProps) {
  const [revealedCount, setRevealedCount] = useState(0);
  const prefersReducedMotion = useReducedMotion();
  const shouldShowFullContent = prefersReducedMotion || !content;
  const clampedRevealedCount = Math.min(revealedCount, content.length);
  const revealedContent = shouldShowFullContent
    ? content
    : content.slice(0, clampedRevealedCount);
  const isComplete = shouldShowFullContent || clampedRevealedCount >= content.length;

  useEffect(() => {
    if (!content || content.length === 0) {
      onComplete?.();
      return;
    }

    if (prefersReducedMotion) {
      onComplete?.();
      return;
    }

    const timer = setInterval(() => {
      setRevealedCount((prev) => {
        const next = prev + speed;
        if (next >= content.length) {
          clearInterval(timer);
          onComplete?.();
          return content.length;
        }
        return next;
      });
    }, interval);

    return () => clearInterval(timer);
  }, [content, speed, interval, onComplete, prefersReducedMotion]);

  return (
    <motion.div
      className={cn("relative", className)}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={prefersReducedMotion ? { duration: 0 } : springs.gentle}
      aria-live="polite"
      aria-atomic="false"
    >
      <div className="whitespace-pre-wrap text-[var(--text-primary)]">
        {revealedContent}
        {!isComplete && (
          <motion.span
            className="inline-block w-0.5 h-5 bg-[var(--accent-blue)] ml-0.5"
            animate={{ opacity: [1, 0, 1] }}
            transition={{
              duration: 0.8,
              repeat: Number.POSITIVE_INFINITY,
              ease: 'linear',
            }}
          />
        )}
      </div>
    </motion.div>
  );
}
