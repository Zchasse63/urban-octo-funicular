"use client";

/**
 * PodBrain Button Components - Phase 4 Buttons & Interactions
 * Wraps Kokonut UI buttons with consistent API for PodBrain app
 */

import * as React from "react";
import { cn } from "@/lib/utils";
import { motion, useReducedMotion } from "motion/react";
import GradientButton from "@/components/kokonutui/gradient-button";
import SlideTextButton from "@/components/kokonutui/slide-text-button";
import HoldButton from "@/components/kokonutui/hold-button";
import { springs } from "@/lib/motion";
import CommandButton from "@/components/kokonutui/command-button";

// PrimaryButton - Gradient border animation
interface PrimaryButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
  size?: "sm" | "md" | "lg";
}

export function PrimaryButton({
  children,
  className,
  loading = false,
  size = "md",
  disabled,
  onClick,
  ...props
}: PrimaryButtonProps) {
  const sizeClasses = {
    sm: "h-9 px-3 text-sm",
    md: "h-12 px-4 text-md",
    lg: "h-14 px-6 text-lg",
  };

  return (
    <GradientButton
      label={loading ? "Loading..." : (children as string)}
      className={cn(sizeClasses[size], className)}
      disabled={disabled || loading}
      variant="emerald"
      onClick={onClick}
      aria-busy={loading}
      {...props}
    />
  );
}

// SecondaryButton - Subtle press animation with scale
interface SecondaryButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "outline" | "ghost";
}

export function SecondaryButton({
  children,
  className,
  variant = "outline",
  disabled,
  onClick,
  type = "button",
}: SecondaryButtonProps) {
  const prefersReducedMotion = useReducedMotion();
  const variantStyles =
    variant === "ghost"
      ? "border-transparent bg-transparent hover:bg-[var(--hover-overlay)]"
      : "border border-[var(--border-soft)] bg-transparent hover:bg-[var(--hover-overlay)]";

  return (
    <motion.button
      whileTap={{ scale: prefersReducedMotion ? 1 : 0.98 }}
      transition={prefersReducedMotion ? { duration: 0 } : springs.snappy}
      onClick={onClick}
      disabled={disabled}
      type={type}
      className={cn(
        "h-10 px-4 font-medium text-md rounded-md inline-flex items-center justify-center whitespace-nowrap text-sm",
        "text-[var(--text-primary)] transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-blue)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-elevated)]",
        "disabled:pointer-events-none disabled:opacity-50",
        "transition-all duration-200",
        variantStyles,
        className
      )}
    >
      {children}
    </motion.button>
  );
}

// PublishButton - Slide text reveal on hover
interface PublishButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  destination?: string;
}

export function PublishButton({
  children,
  className,
  destination,
  disabled,
  onClick,
}: PublishButtonProps) {
  // Use SlideTextButton with button wrapper to handle onClick
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    if (onClick && !disabled) {
      onClick(e as unknown as React.MouseEvent<HTMLButtonElement>);
    }
  };

  return (
    <SlideTextButton
      text={children as string}
      hoverText={destination || (children as string)}
      href="#"
      onClick={handleClick}
      className={cn(
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-blue)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-elevated)]",
        disabled && "pointer-events-none opacity-50",
        className
      )}
      aria-disabled={disabled}
    />
  );
}

// ExportButton - Keyboard shortcut display
interface ExportButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  shortcut?: string;
}

export function ExportButton({
  children,
  className,
  shortcut = "⌘E",
  disabled,
  onClick,
  ...props
}: ExportButtonProps) {
  return (
    <CommandButton
      onClick={onClick}
      disabled={disabled}
      className={cn(disabled && "pointer-events-none opacity-50", className)}
      {...props}
    >
      {children || shortcut}
    </CommandButton>
  );
}

// DangerButton - Hold-to-confirm using HoldButton with 1-second press
interface DangerButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "onClick"> {
  onConfirm: () => void;
  holdDuration?: number;
  holdingText?: string;
}

export function DangerButton({
  children,
  className,
  onConfirm,
  disabled,
  holdDuration,
  holdingText = "Release to confirm",
  ...props
}: DangerButtonProps) {
  return (
    <HoldButton
      variant="red"
      holdDuration={holdDuration ?? 1000}
      onConfirm={onConfirm}
      holdingText={holdingText}
      className={className}
      disabled={disabled}
      {...props}
    >
      {children}
    </HoldButton>
  );
}
