"use client"

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Brain, Sparkles, BookOpen, CheckCircle2, TrendingUp, Layers, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── Types ───────────────────────────────────────────────────────────────────

interface LearningInsight {
  type: 'new_term' | 'correction_applied' | 'accuracy_improved' | 'pattern_detected';
  description: string;
  confidence: number;
  metadata?: Record<string, unknown>;
}

interface EpisodeLearnings {
  episodeId: string;
  insights: LearningInsight[];
  newTermsCount: number;
  correctionsApplied: number;
  vocabularyGrowth: number;
}

interface LearningInsightsProps {
  episodeId: string;
}

// ─── Insight Icon + Color Config ─────────────────────────────────────────────

const INSIGHT_CONFIG: Record<LearningInsight['type'], {
  icon: React.ElementType;
  iconColor: string;
  dotColor: string;
  bgColor: string;
}> = {
  new_term: {
    icon: BookOpen,
    iconColor: 'text-sky-600',
    dotColor: 'bg-sky-500',
    bgColor: 'bg-sky-50 border-sky-200/60',
  },
  correction_applied: {
    icon: CheckCircle2,
    iconColor: 'text-emerald-600',
    dotColor: 'bg-emerald-500',
    bgColor: 'bg-emerald-50 border-emerald-200/60',
  },
  accuracy_improved: {
    icon: TrendingUp,
    iconColor: 'text-amber-600',
    dotColor: 'bg-amber-500',
    bgColor: 'bg-amber-50 border-amber-200/60',
  },
  pattern_detected: {
    icon: Layers,
    iconColor: 'text-violet-600',
    dotColor: 'bg-violet-500',
    bgColor: 'bg-violet-50 border-violet-200/60',
  },
};

// ─── Component ───────────────────────────────────────────────────────────────

export default function LearningInsights({ episodeId }: LearningInsightsProps) {
  const [learnings, setLearnings] = useState<EpisodeLearnings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function fetchLearnings() {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`/api/episodes/${episodeId}/learnings`);
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error || 'Failed to fetch learnings');
        }
        const json = await res.json();
        if (!cancelled) {
          setLearnings(json.data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchLearnings();
    return () => { cancelled = true; };
  }, [episodeId]);

  // Loading state
  if (loading) {
    return (
      <div className="bg-card border border-border rounded-lg p-5 shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-200/60 flex items-center justify-center">
            <Loader2 className="w-4 h-4 text-amber-600 animate-spin" />
          </div>
          <div>
            <span className="font-sans text-[13px] font-semibold text-foreground">PodBrain Learned</span>
            <p className="font-sans text-[11px] text-muted-foreground mt-0.5">Analyzing learnings...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return null; // Silently fail — this is supplementary info
  }

  // Empty state — nothing learned
  if (!learnings || learnings.insights.length === 0) {
    return (
      <div className="bg-card border border-border rounded-lg p-5 shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-muted border border-border flex items-center justify-center">
            <Brain className="w-4 h-4 text-muted-foreground" />
          </div>
          <div>
            <span className="font-sans text-[13px] font-semibold text-foreground">PodBrain Learned</span>
            <p className="font-sans text-[11px] text-muted-foreground mt-0.5">No new learnings from this episode</p>
          </div>
        </div>
      </div>
    );
  }

  const { insights, newTermsCount, correctionsApplied, vocabularyGrowth } = learnings;
  const visibleInsights = expanded ? insights : insights.slice(0, 2);

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
      {/* Header */}
      <div className="px-5 pt-5 pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-200/60 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-amber-600" />
            </div>
            <div>
              <span className="font-sans text-[13px] font-semibold text-foreground tracking-tight">PodBrain Learned</span>
              <p className="font-sans text-[11px] text-muted-foreground mt-0.5">
                {newTermsCount > 0 && `${newTermsCount} new term${newTermsCount !== 1 ? 's' : ''}`}
                {newTermsCount > 0 && correctionsApplied > 0 && ' · '}
                {correctionsApplied > 0 && `${correctionsApplied} correction${correctionsApplied !== 1 ? 's' : ''}`}
                {vocabularyGrowth > 0 && ` · +${vocabularyGrowth}% vocabulary`}
              </p>
            </div>
          </div>

          {/* Summary badges */}
          <div className="hidden sm:flex items-center gap-2">
            {newTermsCount > 0 && (
              <span className="flex items-center gap-1 font-mono text-[9px] font-bold text-sky-700 bg-sky-50 border border-sky-200/60 px-2 py-0.5 rounded-full uppercase tracking-wider">
                <div className="w-1 h-1 rounded-full bg-sky-500" />
                {newTermsCount} terms
              </span>
            )}
            {correctionsApplied > 0 && (
              <span className="flex items-center gap-1 font-mono text-[9px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 rounded-full uppercase tracking-wider">
                <div className="w-1 h-1 rounded-full bg-emerald-500" />
                {correctionsApplied} fixes
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Insight List */}
      <div className="px-5 pb-2">
        <AnimatePresence mode="sync">
          {visibleInsights.map((insight, index) => {
            const config = INSIGHT_CONFIG[insight.type];
            const Icon = config.icon;

            return (
              <motion.div
                key={`${insight.type}-${index}`}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.2, delay: index * 0.05 }}
                className="flex items-start gap-3 py-2.5 border-t border-border first:border-t-0"
              >
                <div className={cn(
                  'w-6 h-6 rounded-md border flex items-center justify-center flex-shrink-0 mt-0.5',
                  config.bgColor
                )}>
                  <Icon className={cn('w-3 h-3', config.iconColor)} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-sans text-[12px] text-foreground/90 leading-relaxed">
                    {insight.description}
                  </p>
                  {insight.confidence < 0.9 && (
                    <span className="font-mono text-[9px] text-muted-foreground mt-0.5 block">
                      {Math.round(insight.confidence * 100)}% confidence
                    </span>
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Expand / Collapse */}
      {insights.length > 2 && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full px-5 py-2.5 border-t border-border flex items-center justify-center gap-1.5 hover:bg-muted/30 transition-colors"
        >
          <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            {expanded ? 'Show less' : `Show ${insights.length - 2} more`}
          </span>
          {expanded ? (
            <ChevronUp className="w-3 h-3 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-3 h-3 text-muted-foreground" />
          )}
        </button>
      )}
    </div>
  );
}
