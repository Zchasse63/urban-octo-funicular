"use client"

import React, { useState, useEffect } from 'react';
import {
  Mic2,
  User,
  MessageCircle,
  Lightbulb,
  Target,
  Clock,
  Sparkles,
  Copy,
  CheckCircle2,
  ChevronDown,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import usePreInterview from '@/hooks/use-pre-interview';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PreInterviewPanelProps {
  episodeId: string;
  guestName?: string | null;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

/** Copy button that shows a checkmark on success. */
function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API not available
    }
  };

  return (
    <button
      onClick={handleCopy}
      className="flex-shrink-0 p-1 rounded hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
      title="Copy to clipboard"
    >
      {copied ? (
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
      ) : (
        <Copy className="w-3.5 h-3.5" />
      )}
    </button>
  );
}

/** Collapsible section wrapper. */
function CollapsibleSection({
  title,
  icon: Icon,
  iconColor,
  defaultOpen = true,
  count,
  children,
}: {
  title: string;
  icon: React.ElementType;
  iconColor: string;
  defaultOpen?: boolean;
  count?: number;
  children: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <Card>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-5 cursor-pointer select-none"
      >
        <div className="flex items-center gap-2.5">
          <div
            className={cn(
              'w-7 h-7 rounded-md border flex items-center justify-center',
              iconColor
            )}
          >
            <Icon className="w-3.5 h-3.5" />
          </div>
          <span className="font-sans text-sm font-semibold text-foreground">
            {title}
          </span>
          {count !== undefined && (
            <span className="font-mono text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full border border-border">
              {count}
            </span>
          )}
        </div>
        <ChevronDown
          className={cn(
            'w-4 h-4 text-muted-foreground transition-transform duration-200',
            isOpen && 'rotate-180'
          )}
        />
      </button>
      {isOpen && <CardContent className="pt-0">{children}</CardContent>}
    </Card>
  );
}

/** Loading skeleton. */
function LoadingSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      {/* Header skeleton */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-muted" />
        <div className="space-y-2 flex-1">
          <div className="h-4 w-48 bg-muted rounded" />
          <div className="h-3 w-32 bg-muted rounded" />
        </div>
      </div>

      {/* Summary skeleton */}
      <div className="space-y-2">
        <div className="h-3 w-full bg-muted rounded" />
        <div className="h-3 w-5/6 bg-muted rounded" />
        <div className="h-3 w-3/4 bg-muted rounded" />
      </div>

      {/* Section skeletons */}
      {[1, 2, 3].map((i) => (
        <Card key={i}>
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-md bg-muted" />
              <div className="h-4 w-40 bg-muted rounded" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {[1, 2, 3].map((j) => (
                <div key={j} className="h-3 bg-muted rounded" style={{ width: `${85 - j * 10}%` }} />
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

/** Empty state — no guest set. */
function EmptyState({
  onGenerate,
}: {
  onGenerate: (name: string) => void;
}) {
  const [name, setName] = useState('');

  return (
    <Card>
      <CardContent className="py-10 flex flex-col items-center text-center gap-4">
        <div className="w-14 h-14 rounded-full bg-sky-50 border border-sky-200/60 flex items-center justify-center">
          <User className="w-6 h-6 text-sky-600" />
        </div>
        <div>
          <p className="font-sans text-sm font-semibold text-foreground mb-1">
            No guest information yet
          </p>
          <p className="font-sans text-xs text-muted-foreground max-w-xs">
            Enter a guest name to search their previous podcast appearances and
            generate interview preparation materials.
          </p>
        </div>
        <div className="flex items-center gap-2 w-full max-w-sm">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter guest name..."
            className="flex-1 h-9 px-3 rounded-lg border border-border bg-card text-sm font-sans text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && name.trim()) {
                onGenerate(name.trim());
              }
            }}
          />
          <Button
            variant="primary"
            size="sm"
            disabled={!name.trim()}
            onClick={() => onGenerate(name.trim())}
          >
            <Sparkles className="w-3.5 h-3.5" />
            Generate
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function PreInterviewPanel({
  episodeId,
  guestName: initialGuestName,
}: PreInterviewPanelProps) {
  const { data, isLoading, isGenerating, error, fetch: fetchData, generate } =
    usePreInterview(episodeId);

  // Fetch existing data on mount
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleGenerate = (name: string, bio?: string, topics?: string[]) => {
    generate(name, bio, topics);
  };

  // ── Loading state ──
  if (isLoading) {
    return (
      <div className="space-y-4">
        <SectionHeader title="Pre-Interview Intelligence" />
        <LoadingSkeleton />
      </div>
    );
  }

  // ── Generating state ──
  if (isGenerating) {
    return (
      <div className="space-y-4">
        <SectionHeader title="Pre-Interview Intelligence" />
        <Card>
          <CardContent className="py-10 flex flex-col items-center text-center gap-3">
            <div className="w-10 h-10 rounded-full bg-sky-50 border border-sky-200/60 flex items-center justify-center animate-pulse">
              <Sparkles className="w-5 h-5 text-sky-600" />
            </div>
            <p className="font-sans text-sm font-semibold text-foreground">
              Generating intelligence...
            </p>
            <p className="font-sans text-xs text-muted-foreground max-w-xs">
              Searching podcast appearances and analyzing guest history. This may
              take a moment.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── Error state ──
  if (error && !data) {
    return (
      <div className="space-y-4">
        <SectionHeader title="Pre-Interview Intelligence" />
        <Card>
          <CardContent className="py-8 flex flex-col items-center text-center gap-3">
            <div className="w-10 h-10 rounded-full bg-red-50 border border-red-200/60 flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-red-500" />
            </div>
            <p className="font-sans text-sm text-red-600">{error}</p>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                if (initialGuestName) {
                  handleGenerate(initialGuestName);
                }
              }}
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── Empty state ──
  if (!data) {
    return (
      <div className="space-y-4">
        <SectionHeader title="Pre-Interview Intelligence" />
        <EmptyState
          onGenerate={(name) => handleGenerate(name)}
        />
      </div>
    );
  }

  // ── Data loaded ──
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <SectionHeader title="Pre-Interview Intelligence" />
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleGenerate(data.guestName)}
          className="text-xs"
        >
          <RefreshCw className="w-3 h-3" />
          Refresh
        </Button>
      </div>

      {/* Guest identity card */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-sky-50 border border-sky-200/60 flex items-center justify-center flex-shrink-0">
              <User className="w-5 h-5 text-sky-600" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-sans text-sm font-semibold text-foreground truncate">
                  {data.guestName}
                </h3>
                <span className="font-mono text-[10px] text-sky-600 bg-sky-50 px-1.5 py-0.5 rounded-full border border-sky-200/60 flex-shrink-0">
                  {data.appearanceCount} appearance{data.appearanceCount !== 1 ? 's' : ''}
                </span>
              </div>
              <p className="font-serif text-xs text-muted-foreground leading-relaxed">
                {data.guestSummary}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Previous Appearances */}
      {data.appearances.length > 0 && (
        <CollapsibleSection
          title="Previous Appearances"
          icon={Mic2}
          iconColor="bg-violet-50 border-violet-200/60 text-violet-600"
          count={data.appearances.length}
          defaultOpen={false}
        >
          <div className="space-y-2">
            {data.appearances.map((appearance, i) => (
              <div
                key={i}
                className="flex items-start gap-3 py-2 border-b border-border last:border-0"
              >
                <div className="w-5 h-5 rounded-full bg-muted flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="font-mono text-[9px] font-bold text-muted-foreground">
                    {i + 1}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-sans text-xs font-medium text-foreground truncate">
                    {appearance.episodeName}
                  </p>
                  <p className="font-sans text-[11px] text-muted-foreground">
                    {appearance.podcastName}
                    {appearance.datePublished && (
                      <span className="ml-1.5">
                        <Clock className="w-2.5 h-2.5 inline -mt-px mr-0.5" />
                        {formatAppearanceDate(appearance.datePublished)}
                      </span>
                    )}
                  </p>
                  {appearance.topicsDiscussed.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {appearance.topicsDiscussed.map((topic, j) => (
                        <span
                          key={j}
                          className="font-mono text-[9px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded border border-border"
                        >
                          {topic}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CollapsibleSection>
      )}

      {/* Suggested Questions */}
      {data.suggestedQuestions.length > 0 && (
        <CollapsibleSection
          title="Suggested Questions"
          icon={MessageCircle}
          iconColor="bg-sky-50 border-sky-200/60 text-sky-600"
          count={data.suggestedQuestions.length}
        >
          <ol className="space-y-2">
            {data.suggestedQuestions.map((question, i) => (
              <li
                key={i}
                className="flex items-start gap-2 group"
              >
                <span className="font-mono text-[10px] font-bold text-sky-600 mt-0.5 w-4 flex-shrink-0">
                  {i + 1}.
                </span>
                <p className="font-serif text-xs text-foreground/80 leading-relaxed flex-1">
                  {question}
                </p>
                <CopyButton text={question} />
              </li>
            ))}
          </ol>
        </CollapsibleSection>
      )}

      {/* Topic Gaps */}
      {data.topicGaps.length > 0 && (
        <CollapsibleSection
          title="Topic Gaps"
          icon={Target}
          iconColor="bg-emerald-50 border-emerald-200/60 text-emerald-600"
          count={data.topicGaps.length}
        >
          <p className="font-sans text-[11px] text-muted-foreground mb-3">
            Topics this guest likely hasn't been asked about — your competitive
            advantage.
          </p>
          <div className="space-y-1.5">
            {data.topicGaps.map((gap, i) => (
              <div key={i} className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0" />
                <p className="font-serif text-xs text-foreground/80 leading-relaxed">
                  {gap}
                </p>
              </div>
            ))}
          </div>
        </CollapsibleSection>
      )}

      {/* Talking Points */}
      {data.talkingPoints.length > 0 && (
        <CollapsibleSection
          title="Talking Points"
          icon={Lightbulb}
          iconColor="bg-amber-50 border-amber-200/60 text-amber-600"
          count={data.talkingPoints.length}
        >
          <div className="space-y-1.5">
            {data.talkingPoints.map((point, i) => (
              <div key={i} className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 flex-shrink-0" />
                <p className="font-serif text-xs text-foreground/80 leading-relaxed">
                  {point}
                </p>
              </div>
            ))}
          </div>
        </CollapsibleSection>
      )}

      {/* Icebreakers */}
      {data.icebreakers.length > 0 && (
        <CollapsibleSection
          title="Icebreakers"
          icon={Sparkles}
          iconColor="bg-rose-50 border-rose-200/60 text-rose-600"
          count={data.icebreakers.length}
          defaultOpen={false}
        >
          <div className="space-y-2">
            {data.icebreakers.map((icebreaker, i) => (
              <div
                key={i}
                className="flex items-start gap-2 group"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-rose-400 mt-1.5 flex-shrink-0" />
                <p className="font-serif text-xs text-foreground/80 leading-relaxed italic flex-1">
                  &ldquo;{icebreaker}&rdquo;
                </p>
                <CopyButton text={icebreaker} />
              </div>
            ))}
          </div>
        </CollapsibleSection>
      )}

      {/* Avoid Topics */}
      {data.avoidTopics.length > 0 && (
        <CollapsibleSection
          title="Topics to Avoid"
          icon={AlertCircle}
          iconColor="bg-red-50 border-red-200/60 text-red-500"
          count={data.avoidTopics.length}
          defaultOpen={false}
        >
          <p className="font-sans text-[11px] text-muted-foreground mb-3">
            Questions this guest has been asked too many times.
          </p>
          <div className="space-y-1.5">
            {data.avoidTopics.map((topic, i) => (
              <div key={i} className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1.5 flex-shrink-0" />
                <p className="font-serif text-xs text-foreground/80 leading-relaxed">
                  {topic}
                </p>
              </div>
            ))}
          </div>
        </CollapsibleSection>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function SectionHeader({ title }: { title: string }) {
  return (
    <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
      {title}
    </span>
  );
}

function formatAppearanceDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}
