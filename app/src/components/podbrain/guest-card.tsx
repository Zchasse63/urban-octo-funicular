"use client";

import React from "react";
import { motion, useReducedMotion } from "motion/react";
import { Linkedin, Twitter, Globe } from "lucide-react";
import { cn } from "@/lib/utils";

export interface GuestCardProps {
  name: string;
  title?: string;
  company?: string;
  avatar?: string;
  socials?: {
    linkedin?: string;
    twitter?: string;
    website?: string;
  };
  stats?: {
    episodes?: number;
    reach?: string;
    engagement?: string;
  };
  className?: string;
}

export function GuestCard({
  name,
  title,
  company,
  avatar,
  socials,
  stats,
  className,
}: GuestCardProps) {
  const prefersReducedMotion = useReducedMotion();
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <motion.div
      whileHover={{ x: prefersReducedMotion ? 0 : 4 }}
      transition={
        prefersReducedMotion
          ? { duration: 0 }
          : { type: "spring", stiffness: 400, damping: 30 }
      }
      className={cn(
        "group relative overflow-hidden rounded-lg border bg-[var(--bg-elevated)] p-4",
        "shadow-[var(--shadow-elevation-2)] transition-shadow hover:shadow-[var(--shadow-elevation-3)]",
        className
      )}
      style={{ borderColor: "var(--border-soft)" }}
    >
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div
          className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full"
          aria-label={`${name}'s avatar`}
        >
          {avatar ? (
            <img
              src={avatar}
              alt={name}
              className="h-full w-full object-cover"
            />
          ) : (
            <div
              className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[var(--accent-blue)] to-[var(--accent-blue)]/60 font-semibold text-sm text-white"
            >
              {initials}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h3
            className="truncate font-semibold text-base"
            style={{ color: "var(--text-primary)" }}
          >
            {name}
          </h3>
          {title && (
            <p
              className="truncate text-sm"
              style={{ color: "var(--text-secondary)" }}
            >
              {title}
            </p>
          )}
          {company && (
            <p
              className="truncate text-xs"
              style={{ color: "var(--text-tertiary)" }}
            >
              {company}
            </p>
          )}
        </div>
      </div>

      {/* Social Links */}
      {socials && (Object.keys(socials).length > 0) && (
        <div className="mt-3 flex items-center gap-2 border-t pt-3" style={{ borderColor: "var(--border-soft)" }}>
          {socials.linkedin && (
            <a
              href={socials.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded p-1.5 transition-colors hover:bg-[var(--hover-overlay)]"
              aria-label={`${name} on LinkedIn`}
              style={{ color: "var(--text-secondary)" }}
            >
              <Linkedin className="h-4 w-4" />
            </a>
          )}
          {socials.twitter && (
            <a
              href={socials.twitter}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded p-1.5 transition-colors hover:bg-[var(--hover-overlay)]"
              aria-label={`${name} on Twitter`}
              style={{ color: "var(--text-secondary)" }}
            >
              <Twitter className="h-4 w-4" />
            </a>
          )}
          {socials.website && (
            <a
              href={socials.website}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded p-1.5 transition-colors hover:bg-[var(--hover-overlay)]"
              aria-label={`${name}'s website`}
              style={{ color: "var(--text-secondary)" }}
            >
              <Globe className="h-4 w-4" />
            </a>
          )}
        </div>
      )}

      {/* Stats */}
      {stats && (
        <div className="mt-3 grid grid-cols-3 gap-2 border-t pt-3" style={{ borderColor: "var(--border-soft)" }}>
          {stats.episodes !== undefined && (
            <div className="text-center">
              <div
                className="font-bold text-lg tabular-nums"
                style={{ color: "var(--text-primary)" }}
              >
                {stats.episodes}
              </div>
              <div
                className="font-mono text-xs uppercase tracking-wider"
                style={{ color: "var(--text-tertiary)" }}
              >
                Episodes
              </div>
            </div>
          )}
          {stats.reach && (
            <div className="text-center">
              <div
                className="font-bold text-lg tabular-nums"
                style={{ color: "var(--text-primary)" }}
              >
                {stats.reach}
              </div>
              <div
                className="font-mono text-xs uppercase tracking-wider"
                style={{ color: "var(--text-tertiary)" }}
              >
                Reach
              </div>
            </div>
          )}
          {stats.engagement && (
            <div className="text-center">
              <div
                className="font-bold text-lg tabular-nums"
                style={{ color: "var(--text-primary)" }}
              >
                {stats.engagement}
              </div>
              <div
                className="font-mono text-xs uppercase tracking-wider"
                style={{ color: "var(--text-tertiary)" }}
              >
                Engage
              </div>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}
