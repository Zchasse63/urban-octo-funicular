"use client";

import React from "react";
import MouseEffectCard from "@/components/kokonutui/mouse-effect-card";
import { cn } from "@/lib/utils";

export interface InteractiveCardProps {
  className?: string;
  children?: React.ReactNode;
  onClick?: () => void;
  href?: string;
}

export function InteractiveCard({
  className,
  children,
  onClick,
  href,
}: InteractiveCardProps) {
  const content = (
    <MouseEffectCard
      className={cn(
        "bg-[var(--bg-elevated)] border border-[var(--border-soft)] shadow-[var(--shadow-elevation-2)]",
        "transition-all duration-300",
        (onClick || href) && "cursor-pointer hover:shadow-[var(--shadow-elevation-3)]",
        className
      )}
      dotSize={2}
      dotSpacing={16}
      repulsionRadius={80}
      repulsionStrength={20}
      title=""
      subtitle=""
      topText=""
      topSubtext=""
      primaryCtaText=""
      secondaryCtaText=""
      footerText=""
    >
      {children}
    </MouseEffectCard>
  );

  if (href) {
    return (
      <a href={href} className="block">
        {content}
      </a>
    );
  }

  if (onClick) {
    return (
      <button onClick={onClick} className="block w-full text-left">
        {content}
      </button>
    );
  }

  return content;
}
