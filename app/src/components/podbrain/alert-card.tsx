"use client";

import { motion, AnimatePresence } from "motion/react";
import { AlertTriangle, Lightbulb, Info, XCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { springs } from "@/lib/motion";

type AlertVariant = "attention" | "opportunity" | "info" | "error";

interface AlertCardProps {
  variant: AlertVariant;
  title: string;
  description: string;
  onDismiss?: () => void;
  className?: string;
}

const variantConfig: Record<
  AlertVariant,
  { icon: React.ElementType; bg: string; border: string; iconColor: string }
> = {
  attention: {
    icon: AlertTriangle,
    bg: "bg-status-warning-bg",
    border: "border-amber-200",
    iconColor: "text-status-warning-text",
  },
  opportunity: {
    icon: Lightbulb,
    bg: "bg-status-success-bg",
    border: "border-green-200",
    iconColor: "text-status-success-text",
  },
  info: {
    icon: Info,
    bg: "bg-status-info-bg",
    border: "border-blue-200",
    iconColor: "text-status-info-text",
  },
  error: {
    icon: XCircle,
    bg: "bg-status-error-bg",
    border: "border-red-200",
    iconColor: "text-status-error-text",
  },
};

export default function AlertCard({
  variant,
  title,
  description,
  onDismiss,
  className,
}: AlertCardProps) {
  const config = variantConfig[variant];
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.98 }}
      transition={springs.smooth}
      className={cn(
        "flex gap-3 rounded-xl border p-4",
        config.bg,
        config.border,
        className
      )}
    >
      <Icon className={cn("h-5 w-5 shrink-0 mt-0.5", config.iconColor)} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-text-primary">{title}</p>
        <p className="mt-0.5 text-xs text-text-secondary line-clamp-2">
          {description}
        </p>
      </div>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className="shrink-0 text-text-tertiary hover:text-text-secondary transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </motion.div>
  );
}

// Alert list with AnimatePresence
export function AlertList({
  alerts,
  onDismiss,
  className,
}: {
  alerts: { id: string; variant: AlertVariant; title: string; description: string }[];
  onDismiss?: (id: string) => void;
  className?: string;
}) {
  return (
    <div className={cn("space-y-2", className)}>
      <AnimatePresence>
        {alerts.map((alert) => (
          <AlertCard
            key={alert.id}
            variant={alert.variant}
            title={alert.title}
            description={alert.description}
            onDismiss={onDismiss ? () => onDismiss(alert.id) : undefined}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}
