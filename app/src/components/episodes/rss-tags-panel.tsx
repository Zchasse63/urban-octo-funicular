"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Copy,
  Check,
  Loader2,
  Radio,
  Users,
  Volume2,
  BookOpen,
  FileText,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { PersonTag, SoundbiteTag, TranscriptTag, ChaptersTag, PodrollItem } from "@/lib/podcasting2/tag-generators";

// ─── Types ───────────────────────────────────────────────────────────────────

interface RSSTagsData {
  snippet: string;
  channelTags: string;
  itemTags: string;
  tags: {
    persons: PersonTag[];
    transcript: TranscriptTag | null;
    soundbites: SoundbiteTag[];
    chapters: ChaptersTag | null;
    chaptersJson: {
      version: string;
      chapters: Array<{ startTime: number; title: string }>;
    } | null;
    podroll: PodrollItem[];
  };
}

interface RSSTagsPanelProps {
  episodeId: string;
}

// ─── Copy Button ─────────────────────────────────────────────────────────────

function CopyButton({
  text,
  label = "Copy",
  className,
}: {
  text: string;
  label?: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [text]);

  return (
    <button
      onClick={handleCopy}
      className={cn(
        "flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[11px] font-sans font-medium transition-all",
        copied
          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
          : "text-muted-foreground hover:text-foreground hover:bg-accent border border-transparent hover:border-border",
        className
      )}
    >
      {copied ? (
        <Check className="w-3 h-3" />
      ) : (
        <Copy className="w-3 h-3" />
      )}
      {copied ? "Copied" : label}
    </button>
  );
}

// ─── Collapsible Section ─────────────────────────────────────────────────────

function TagSection({
  title,
  icon: Icon,
  count,
  children,
  defaultOpen = true,
  accentColor = "bg-blue-500",
}: {
  title: string;
  icon: React.ElementType;
  count?: number;
  children: React.ReactNode;
  defaultOpen?: boolean;
  accentColor?: string;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border border-border rounded-lg overflow-hidden bg-card shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-muted/30 transition-colors"
      >
        <div
          className={cn(
            "w-6 h-6 rounded-md flex items-center justify-center",
            accentColor
          )}
        >
          <Icon className="w-3.5 h-3.5 text-white" />
        </div>
        <span className="font-sans text-[13px] font-semibold text-foreground flex-1">
          {title}
        </span>
        {count !== undefined && (
          <span className="font-mono text-[10px] font-bold text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
            {count}
          </span>
        )}
        {isOpen ? (
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        ) : (
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        )}
      </button>
      {isOpen && (
        <div className="px-4 pb-4 border-t border-border bg-muted/20">
          {children}
        </div>
      )}
    </div>
  );
}

// ─── Format Helpers ──────────────────────────────────────────────────────────

function formatSeconds(sec: number): string {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);
  if (h > 0) return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

// ─── Main Panel ──────────────────────────────────────────────────────────────

export default function RSSTagsPanel({ episodeId }: RSSTagsPanelProps) {
  const [data, setData] = useState<RSSTagsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchRSSTags() {
      setIsLoading(true);
      setError(null);

      try {
        const res = await fetch(`/api/episodes/${episodeId}/rss-tags`);
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error || `Failed to load RSS tags (${res.status})`);
        }
        const json = await res.json();
        if (!cancelled) {
          setData(json.data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load RSS tags");
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    fetchRSSTags();
    return () => {
      cancelled = true;
    };
  }, [episodeId]);

  // ── Loading State ──
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        <p className="text-[13px] text-muted-foreground font-sans">
          Generating Podcasting 2.0 tags...
        </p>
      </div>
    );
  }

  // ── Error State ──
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4">
        <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center">
          <AlertCircle className="w-5 h-5 text-red-500" />
        </div>
        <p className="text-[13px] text-muted-foreground font-sans text-center max-w-sm">
          {error}
        </p>
      </div>
    );
  }

  // ── Empty State ──
  if (!data || (!data.itemTags && !data.channelTags)) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4">
        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
          <Radio className="w-5 h-5 text-muted-foreground" />
        </div>
        <div className="text-center">
          <p className="text-[13px] font-medium text-foreground font-sans">
            No RSS tags available yet
          </p>
          <p className="text-[12px] text-muted-foreground font-sans mt-1 max-w-sm">
            Process the episode to generate transcripts, viral moments, and
            chapters. RSS tags will be generated from that data.
          </p>
        </div>
      </div>
    );
  }

  const { tags } = data;
  const hasPersons = tags.persons.length > 0;
  const hasSoundbites = tags.soundbites.length > 0;
  const hasChapters = tags.chaptersJson && tags.chaptersJson.chapters.length > 0;
  const hasTranscript = tags.transcript !== null;
  const hasPodroll = tags.podroll && tags.podroll.length > 0;

  return (
    <div className="flex flex-col lg:flex-row gap-5 lg:gap-6">
      {/* ── Left: Full XML Snippet ── */}
      <div className="flex-1 min-w-0">
        <div className="bg-card border border-border rounded-lg overflow-hidden shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
          {/* Toolbar */}
          <div className="flex items-center justify-between px-4 sm:px-5 py-3 border-b border-border bg-muted/50">
            <div className="flex items-center gap-3">
              <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                RSS Tags
              </span>
              <span className="font-mono text-[10px] text-muted-foreground/60 uppercase tracking-wider">
                Podcasting 2.0
              </span>
            </div>
            <CopyButton text={data.snippet} label="Copy All" />
          </div>

          {/* XML Code Block */}
          <div className="p-4 sm:p-5">
            <pre className="bg-stone-950 text-stone-300 rounded-lg p-4 overflow-x-auto text-[12px] leading-relaxed font-mono whitespace-pre-wrap break-words border border-stone-800">
              {data.snippet}
            </pre>
          </div>

          {/* Separate sections for channel vs item */}
          {data.channelTags && data.itemTags && (
            <div className="px-4 sm:px-5 pb-4 sm:pb-5 flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    Channel Tags
                  </span>
                  <CopyButton text={data.channelTags} label="Copy" />
                </div>
                <pre className="bg-stone-950 text-emerald-400/80 rounded-lg p-3 overflow-x-auto text-[11px] leading-relaxed font-mono whitespace-pre-wrap break-words border border-stone-800">
                  {data.channelTags}
                </pre>
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    Item Tags
                  </span>
                  <CopyButton text={data.itemTags} label="Copy" />
                </div>
                <pre className="bg-stone-950 text-blue-400/80 rounded-lg p-3 overflow-x-auto text-[11px] leading-relaxed font-mono whitespace-pre-wrap break-words border border-stone-800">
                  {data.itemTags}
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Right: Tag Breakdown + Help ── */}
      <div className="lg:w-[340px] xl:w-[380px] flex-shrink-0 space-y-4">
        {/* Tag Details */}
        {hasPersons && (
          <TagSection
            title="Person Tags"
            icon={Users}
            count={tags.persons.length}
            accentColor="bg-violet-500"
          >
            <div className="mt-3 space-y-2">
              {tags.persons.map((p, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 p-2.5 bg-card rounded-md border border-border"
                >
                  {p.img ? (
                    <img
                      src={p.img}
                      alt={p.name}
                      className="w-8 h-8 rounded-full object-cover border border-border"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                      <Users className="w-3.5 h-3.5" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-medium text-foreground truncate">
                      {p.name}
                    </p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-mono">
                      {p.role}
                    </p>
                  </div>
                  {p.href && (
                    <a
                      href={p.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              ))}
            </div>
          </TagSection>
        )}

        {hasSoundbites && (
          <TagSection
            title="Soundbites"
            icon={Volume2}
            count={tags.soundbites.length}
            accentColor="bg-amber-500"
          >
            <div className="mt-3 space-y-2">
              {tags.soundbites.map((sb, i) => (
                <div
                  key={i}
                  className="p-2.5 bg-card rounded-md border border-border"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-[10px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">
                      {formatSeconds(sb.startTime)}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {sb.duration}s
                    </span>
                  </div>
                  {sb.title && (
                    <p className="text-[12px] text-foreground/80 leading-relaxed line-clamp-2">
                      {sb.title}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </TagSection>
        )}

        {hasChapters && tags.chaptersJson && (
          <TagSection
            title="Chapters"
            icon={BookOpen}
            count={tags.chaptersJson.chapters.length}
            accentColor="bg-emerald-500"
          >
            <div className="mt-3 space-y-1.5">
              {tags.chaptersJson.chapters.map((ch, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2.5 p-2 bg-card rounded-md border border-border"
                >
                  <span className="font-mono text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded min-w-[48px] text-center">
                    {formatSeconds(ch.startTime)}
                  </span>
                  <p className="text-[12px] text-foreground/80 truncate flex-1">
                    {ch.title}
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-3">
              <CopyButton
                text={JSON.stringify(tags.chaptersJson, null, 2)}
                label="Copy Chapters JSON"
                className="w-full justify-center bg-card border border-border"
              />
            </div>
          </TagSection>
        )}

        {hasPodroll && tags.podroll && (
          <TagSection
            title="Podroll"
            icon={Radio}
            count={tags.podroll.length}
            accentColor="bg-orange-500"
            defaultOpen={false}
          >
            <div className="mt-3 space-y-2">
              {tags.podroll.map((item, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 p-2.5 bg-card rounded-md border border-border"
                >
                  <div className="w-8 h-8 rounded-md bg-orange-50 flex items-center justify-center text-orange-600">
                    <Radio className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-medium text-foreground truncate">
                      {item.title}
                    </p>
                    {item.feedUrl && (
                      <p className="text-[10px] text-muted-foreground font-mono truncate">
                        {item.feedUrl}
                      </p>
                    )}
                  </div>
                  {item.feedUrl && (
                    <a
                      href={item.feedUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              ))}
            </div>
            <p className="mt-2 text-[11px] text-muted-foreground leading-relaxed">
              Recommended podcasts from your guest&apos;s other appearances,
              creating a cross-promotion network.
            </p>
          </TagSection>
        )}

        {hasTranscript && tags.transcript && (
          <TagSection
            title="Transcript"
            icon={FileText}
            accentColor="bg-blue-500"
            defaultOpen={false}
          >
            <div className="mt-3 p-2.5 bg-card rounded-md border border-border">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-muted-foreground font-mono uppercase">
                    Format
                  </span>
                  <span className="text-[11px] text-foreground font-mono">
                    {tags.transcript.type}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-muted-foreground font-mono uppercase">
                    Language
                  </span>
                  <span className="text-[11px] text-foreground font-mono">
                    {tags.transcript.language}
                  </span>
                </div>
              </div>
            </div>
            <p className="mt-2 text-[11px] text-muted-foreground leading-relaxed">
              Replace the placeholder URL in the tag with the hosted location
              of your transcript VTT file.
            </p>
          </TagSection>
        )}

        {/* ── Help Section ── */}
        <div className="bg-card border border-border rounded-lg p-4 shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
          <div className="flex items-center gap-2 mb-3">
            <Radio className="w-4 h-4 text-blue-500" />
            <span className="font-sans text-[13px] font-semibold text-foreground">
              About Podcasting 2.0
            </span>
          </div>
          <div className="space-y-2.5 text-[12px] text-muted-foreground leading-relaxed">
            <p>
              Podcasting 2.0 is an open standard that extends RSS feeds with
              rich metadata tags for enhanced podcast features.
            </p>
            <p>
              <strong className="text-foreground/80">How to use:</strong> Copy
              the generated XML tags and add them to your podcast RSS feed.
              Channel-level tags go inside the{" "}
              <code className="font-mono text-[11px] bg-muted px-1 py-0.5 rounded">
                &lt;channel&gt;
              </code>{" "}
              element, and item-level tags go inside each{" "}
              <code className="font-mono text-[11px] bg-muted px-1 py-0.5 rounded">
                &lt;item&gt;
              </code>{" "}
              element.
            </p>
            <p>
              Make sure to add the namespace declaration to your RSS root
              element:{" "}
            </p>
            <pre className="bg-muted rounded p-2 text-[10px] font-mono text-foreground/70 overflow-x-auto">
              {`xmlns:podcast="https://podcastindex.org/namespace/1.0"`}
            </pre>
            <p>
              Replace any{" "}
              <code className="font-mono text-[11px] bg-muted px-1 py-0.5 rounded">
                example.com
              </code>{" "}
              placeholder URLs with your actual hosted file locations.
            </p>
            <a
              href="https://github.com/Podcastindex-org/podcast-namespace/blob/main/docs/1.0.md"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-700 font-medium transition-colors"
            >
              View full specification
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
