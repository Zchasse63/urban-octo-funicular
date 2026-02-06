"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, Twitter, Linkedin, Globe, Instagram } from "lucide-react";

interface SocialLink {
  platform: "twitter" | "linkedin" | "website" | "instagram";
  url: string;
}

interface GuestData {
  name: string;
  title: string;
  company: string;
  avatarUrl?: string;
  topics: string[];
  socialLinks: SocialLink[];
}

interface GuestIntelligenceCardProps {
  guest: GuestData;
}

function SocialIcon({ platform }: { platform: SocialLink["platform"] }) {
  const iconProps = { className: "w-4 h-4" };
  switch (platform) {
    case "twitter":
      return <Twitter {...iconProps} />;
    case "linkedin":
      return <Linkedin {...iconProps} />;
    case "instagram":
      return <Instagram {...iconProps} />;
    case "website":
      return <Globe {...iconProps} />;
    default:
      return <Globe {...iconProps} />;
  }
}

export function GuestIntelligenceCard({ guest }: GuestIntelligenceCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Guest Intelligence</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Guest Info */}
        <div className="flex items-center gap-4 mb-5">
          <div
            className="w-14 h-14 rounded-full bg-gradient-to-br from-[var(--bg-subtle)] to-[var(--border-soft)] flex items-center justify-center"
            style={guest.avatarUrl ? { backgroundImage: `url(${guest.avatarUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}
            role="img"
            aria-label={`${guest.name} avatar`}
          >
            {!guest.avatarUrl && <User className="w-6 h-6 text-[var(--text-tertiary)]" />}
          </div>
          <div>
            <h4 className="font-semibold text-[var(--text-primary)]">
              {guest.name}
            </h4>
            <p className="text-sm text-[var(--text-secondary)]">
              {guest.title} at {guest.company}
            </p>
          </div>
        </div>

        {/* Topics */}
        <div className="mb-5">
          <h5 className="font-mono text-[10px] uppercase tracking-wider text-[var(--text-secondary)] mb-3">
            Topics They Discuss
          </h5>
          <div className="flex flex-wrap gap-2">
            {guest.topics.map((topic, index) => (
              <Badge key={index} variant="default">
                {topic}
              </Badge>
            ))}
          </div>
        </div>

        {/* Social Links */}
        <div>
          <h5 className="font-mono text-[10px] uppercase tracking-wider text-[var(--text-secondary)] mb-3">
            Connect
          </h5>
          <div className="flex items-center gap-3">
            {guest.socialLinks.map((link, index) => (
              <a
                key={index}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center w-9 h-9 rounded-lg bg-[var(--bg-subtle)] text-[var(--text-secondary)] hover:text-[var(--accent-blue)] hover:bg-[rgba(0,122,255,0.08)] transition-colors"
                aria-label={`${guest.name} on ${link.platform}`}
              >
                <SocialIcon platform={link.platform} />
              </a>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
