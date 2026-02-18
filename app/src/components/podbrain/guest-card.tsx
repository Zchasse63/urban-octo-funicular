"use client";

import { Linkedin, Twitter, Globe, Mic2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface GuestCardProps {
  name: string;
  title?: string;
  company?: string;
  avatarUrl?: string;
  appearances?: number;
  social?: {
    linkedin?: string;
    twitter?: string;
    website?: string;
  };
  className?: string;
}

export default function GuestCard({
  name,
  title,
  company,
  avatarUrl,
  appearances,
  social,
  className,
}: GuestCardProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-4 rounded-xl border border-border-soft bg-bg-elevated p-4 transition-shadow hover:shadow-[var(--shadow-topo)]",
        className
      )}
    >
      {/* Avatar */}
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-accent-blue/10 text-accent-blue">
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={name}
            className="h-12 w-12 rounded-full object-cover"
          />
        ) : (
          <span className="text-lg font-semibold">
            {name.charAt(0).toUpperCase()}
          </span>
        )}
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-text-primary">{name}</p>
        {(title || company) && (
          <p className="truncate text-xs text-text-secondary">
            {[title, company].filter(Boolean).join(" · ")}
          </p>
        )}
        {appearances !== undefined && (
          <div className="mt-1 flex items-center gap-1 text-xs text-text-tertiary">
            <Mic2 className="h-3 w-3" />
            <span>
              {appearances} appearance{appearances !== 1 ? "s" : ""}
            </span>
          </div>
        )}
      </div>

      {/* Social Links */}
      {social && (
        <div className="flex items-center gap-1.5">
          {social.linkedin && (
            <a
              href={social.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg p-1.5 text-text-tertiary hover:bg-bg-subtle hover:text-accent-blue transition-colors"
            >
              <Linkedin className="h-4 w-4" />
            </a>
          )}
          {social.twitter && (
            <a
              href={social.twitter}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg p-1.5 text-text-tertiary hover:bg-bg-subtle hover:text-accent-blue transition-colors"
            >
              <Twitter className="h-4 w-4" />
            </a>
          )}
          {social.website && (
            <a
              href={social.website}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg p-1.5 text-text-tertiary hover:bg-bg-subtle hover:text-accent-blue transition-colors"
            >
              <Globe className="h-4 w-4" />
            </a>
          )}
        </div>
      )}
    </div>
  );
}
