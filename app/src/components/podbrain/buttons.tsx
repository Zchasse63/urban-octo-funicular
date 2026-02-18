"use client";

import { forwardRef } from "react";
import { Loader2, Download, Send, Trash2, Plus } from "lucide-react";
import { Button, type ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ExtendedButtonProps extends ButtonProps {
  isLoading?: boolean;
  loadingText?: string;
}

export const PrimaryButton = forwardRef<HTMLButtonElement, ExtendedButtonProps>(
  ({ className, children, isLoading, loadingText, disabled, ...props }, ref) => (
    <Button
      ref={ref}
      className={cn(
        "bg-accent-blue text-white hover:bg-accent-blue/90 shadow-sm",
        className
      )}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          {loadingText || "Loading..."}
        </>
      ) : (
        children
      )}
    </Button>
  )
);
PrimaryButton.displayName = "PrimaryButton";

export const SecondaryButton = forwardRef<HTMLButtonElement, ExtendedButtonProps>(
  ({ className, children, isLoading, loadingText, disabled, ...props }, ref) => (
    <Button
      ref={ref}
      variant="outline"
      className={cn(
        "border-border-soft text-text-primary hover:bg-bg-subtle",
        className
      )}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          {loadingText || "Loading..."}
        </>
      ) : (
        children
      )}
    </Button>
  )
);
SecondaryButton.displayName = "SecondaryButton";

export const DangerButton = forwardRef<HTMLButtonElement, ExtendedButtonProps>(
  ({ className, children, isLoading, loadingText, disabled, ...props }, ref) => (
    <Button
      ref={ref}
      className={cn(
        "bg-accent-red text-white hover:bg-accent-red/90",
        className
      )}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          {loadingText || "Deleting..."}
        </>
      ) : (
        <>
          <Trash2 className="mr-2 h-4 w-4" />
          {children}
        </>
      )}
    </Button>
  )
);
DangerButton.displayName = "DangerButton";

export const ExportButton = forwardRef<HTMLButtonElement, ExtendedButtonProps>(
  ({ className, children, isLoading, loadingText, disabled, ...props }, ref) => (
    <Button
      ref={ref}
      variant="outline"
      className={cn(
        "border-border-soft text-text-primary hover:bg-bg-subtle",
        className
      )}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          {loadingText || "Exporting..."}
        </>
      ) : (
        <>
          <Download className="mr-2 h-4 w-4" />
          {children || "Export"}
          <kbd className="ml-2 hidden rounded bg-bg-subtle px-1.5 py-0.5 font-mono text-[10px] text-text-tertiary sm:inline-block">
            ⌘E
          </kbd>
        </>
      )}
    </Button>
  )
);
ExportButton.displayName = "ExportButton";

export const PublishButton = forwardRef<HTMLButtonElement, ExtendedButtonProps>(
  ({ className, children, isLoading, loadingText, disabled, ...props }, ref) => (
    <Button
      ref={ref}
      className={cn(
        "bg-accent-green text-white hover:bg-accent-green/90 shadow-sm",
        className
      )}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          {loadingText || "Publishing..."}
        </>
      ) : (
        <>
          <Send className="mr-2 h-4 w-4" />
          {children || "Publish"}
        </>
      )}
    </Button>
  )
);
PublishButton.displayName = "PublishButton";

export const CreateButton = forwardRef<HTMLButtonElement, ExtendedButtonProps>(
  ({ className, children, ...props }, ref) => (
    <Button
      ref={ref}
      className={cn(
        "bg-accent-blue text-white hover:bg-accent-blue/90 shadow-sm",
        className
      )}
      {...props}
    >
      <Plus className="mr-2 h-4 w-4" />
      {children || "Create New"}
    </Button>
  )
);
CreateButton.displayName = "CreateButton";
