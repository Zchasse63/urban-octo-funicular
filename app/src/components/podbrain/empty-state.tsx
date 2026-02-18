"use client";

import { motion } from "motion/react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { PrimaryButton } from "./buttons";

interface EmptyStateProps {
  icon: React.ElementType;
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
  className?: string;
}

export default function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
  className,
}: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.25, 1, 0.5, 1] }}
      className={cn(
        "flex flex-col items-center justify-center rounded-xl border border-border-soft bg-bg-elevated p-12 text-center",
        className
      )}
    >
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-accent-blue/10">
        <Icon className="h-7 w-7 text-accent-blue" />
      </div>
      <h3 className="text-lg font-medium text-text-primary">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-text-secondary">{description}</p>
      {actionLabel && (
        <div className="mt-6">
          {actionHref ? (
            <Link href={actionHref}>
              <PrimaryButton>{actionLabel}</PrimaryButton>
            </Link>
          ) : (
            <PrimaryButton onClick={onAction}>{actionLabel}</PrimaryButton>
          )}
        </div>
      )}
    </motion.div>
  );
}
