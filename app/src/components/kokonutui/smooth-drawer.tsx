"use client";

/**
 * @author: @dorianbaffier (modified for PodBrain)
 * @description: Smooth Drawer - Reusable mobile drawer with spring animations
 * @version: 2.0.0
 * @date: 2025-06-26
 * @license: MIT
 * @website: https://kokonutui.com
 * @github: https://github.com/kokonut-labs/kokonutui
 */

import { motion } from "motion/react";
import type * as React from "react";
import {
  Drawer,
  DrawerContent,
  DrawerTrigger,
} from "@/components/ui/drawer";

interface SmoothDrawerProps {
  trigger: React.ReactNode;
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  side?: "left" | "right" | "bottom";
  className?: string;
}

const drawerVariants = {
  hidden: {
    x: "-100%",
    opacity: 0,
    transition: {
      type: "spring" as const,
      stiffness: 300,
      damping: 30,
    },
  },
  visible: {
    x: 0,
    opacity: 1,
    transition: {
      type: "spring" as const,
      stiffness: 300,
      damping: 30,
      mass: 0.8,
    },
  },
};

export default function SmoothDrawer({
  trigger,
  children,
  open,
  onOpenChange,
  side = "left",
  className = "",
}: SmoothDrawerProps) {
  const sideClasses = {
    left: "fixed inset-y-0 left-0 h-full w-[280px] border-r rounded-none",
    right: "fixed inset-y-0 right-0 h-full w-[280px] border-l rounded-none",
    bottom: "fixed inset-x-0 bottom-0 h-auto max-h-[85vh] border-t rounded-t-[10px]",
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerTrigger asChild>{trigger}</DrawerTrigger>
      <DrawerContent
        className={`${sideClasses[side]} bg-[var(--bg-elevated)] ${className}`}
        style={{ borderColor: "var(--border-soft)" }}
        showHandle={side === "bottom"}
      >
        <motion.div
          animate="visible"
          className="h-full w-full"
          initial="hidden"
          variants={drawerVariants}
        >
          {children}
        </motion.div>
      </DrawerContent>
    </Drawer>
  );
}

// Named export for flexibility
export { SmoothDrawer };
