import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider transition-colors",
  {
    variants: {
      variant: {
        default:
          "bg-bg-subtle text-text-secondary border border-border-soft",
        new: "bg-accent-blue/10 text-accent-blue",
        success:
          "bg-status-success-bg text-status-success-text",
        warning:
          "bg-status-warning-bg text-status-warning-text",
        error:
          "bg-status-error-bg text-status-error-text",
        ai: "bg-gradient-to-r from-accent-blue/10 to-accent-purple/10 text-accent-blue",
        processing:
          "bg-accent-amber/10 text-accent-amber animate-pulse",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

// Status badge helper
export function StatusBadge({ status }: { status: string }) {
  const variantMap: Record<string, BadgeProps["variant"]> = {
    draft: "default",
    processing: "processing",
    completed: "success",
    failed: "error",
    new: "new",
  };

  return (
    <Badge variant={variantMap[status] || "default"}>
      {status}
    </Badge>
  );
}
