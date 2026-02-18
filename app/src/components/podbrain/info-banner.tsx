import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface InfoBannerProps {
  icon: LucideIcon;
  children: React.ReactNode;
  variant?: "info" | "warning";
  className?: string;
}

const variantStyles = {
  info: "border-accent-blue/20 bg-accent-blue/5",
  warning: "border-accent-amber/20 bg-accent-amber/5",
};

const iconStyles = {
  info: "text-accent-blue",
  warning: "text-accent-amber",
};

export default function InfoBanner({
  icon: Icon,
  children,
  variant = "info",
  className,
}: InfoBannerProps) {
  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-xl border p-4",
        variantStyles[variant],
        className
      )}
    >
      <Icon className={cn("mt-0.5 h-4 w-4 shrink-0", iconStyles[variant])} />
      <div className="text-sm text-text-secondary">{children}</div>
    </div>
  );
}
