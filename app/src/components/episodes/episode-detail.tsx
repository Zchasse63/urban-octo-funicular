"use client"

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, CheckCircle2, Loader2, Circle, ChevronRight, BarChart2, Zap, FileText, Package, AlignLeft, User, Brain, RefreshCw, Download, Copy, Check, Sparkles, Link2, Hash, Target, TrendingUp, AlertCircle, Globe, Clock, Mic2, MessageSquare, Twitter, Linkedin, Youtube, Mail, Image, BookOpen, Users, Wand2, Play, Volume2, ExternalLink, ChevronDown, ArrowUpRight, Radio, Activity, X, Pencil } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import useEpisode from '@/hooks/use-episode';
import useEpisodeAssets from '@/hooks/use-episode-assets';
import useEpisodeSeo from '@/hooks/use-episode-seo';
import type { Episode, GeneratedAsset, SEOAnalysis } from '@/types/database';
import { toast } from 'sonner';
import RSSTagsPanel from './rss-tags-panel';
import PreInterviewPanel from './pre-interview-panel';
import { AssetEditor } from './asset-editor';
import RelatedEpisodes from './related-episodes';
import LearningInsights from './learning-insights';
import { sanitizeHtmlForDisplay } from '@/lib/sanitize-html';

// ─── Types ───────────────────────────────────────────────────────────────────

type Tab = 'show-notes' | 'assets' | 'transcript' | 'guest' | 'intelligence' | 'rss-tags';
type ProcessingStep = 'upload' | 'transcribe' | 'generate' | 'ready';
type StepStatus = 'done' | 'active' | 'pending';
type AssetStatus = 'generated' | 'generating' | 'idle';
interface SignalStep {
  id: ProcessingStep;
  label: string;
  status: StepStatus;
}
interface AssetItem {
  id: string;
  label: string;
  icon: React.ElementType;
  description: string;
  status: AssetStatus;
  accentColor: string;
  content?: string;
}
interface AssetCategory {
  id: string;
  label: string;
  dot: string;
  iconBg: string;
  countColor: string;
  assets: AssetItem[];
}
interface TranscriptSegment {
  id: string;
  speaker: string;
  speakerInitial: string;
  speakerColor: string;
  timestamp: string;
  text: string;
}

// ─── Signal Chain ─────────────────────────────────────────────────────────────

const SIGNAL_STEPS: SignalStep[] = [{
  id: 'upload',
  label: 'Upload',
  status: 'done'
}, {
  id: 'transcribe',
  label: 'Transcribe',
  status: 'done'
}, {
  id: 'generate',
  label: 'Generate',
  status: 'done'
}, {
  id: 'ready',
  label: 'Ready',
  status: 'done'
}];
const stepStatusConfig: Record<StepStatus, {
  dot: string;
  text: string;
  connector: string;
}> = {
  done: {
    dot: 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.45)] border-emerald-400',
    text: 'text-emerald-700',
    connector: 'bg-emerald-300'
  },
  active: {
    dot: 'bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.5)] border-amber-300 animate-pulse',
    text: 'text-amber-700',
    connector: 'bg-muted'
  },
  pending: {
    dot: 'bg-accent border-border',
    text: 'text-muted-foreground',
    connector: 'bg-muted'
  }
};
const SignalChain = ({
  steps
}: {
  steps: SignalStep[];
}) => <div className="flex items-center gap-0">
    {steps.map((step, i) => {
    const cfg = stepStatusConfig[step.status];
    return <React.Fragment key={step.id}>
          <div className="flex flex-col items-center gap-1">
            <div className={cn('w-2.5 h-2.5 rounded-full border', cfg.dot)} />
            <span className={cn('font-mono text-[9px] font-bold uppercase tracking-widest', cfg.text)}>
              {step.label}
            </span>
          </div>
          {i < steps.length - 1 && <div className={cn('h-[2px] w-7 mb-3 rounded-full', step.status === 'done' ? 'bg-emerald-300' : 'bg-muted')} />}
        </React.Fragment>;
  })}
  </div>;

// ─── Tab Bar ─────────────────────────────────────────────────────────────────

const TAB_CONFIG: {
  id: Tab;
  label: string;
  icon: React.ElementType;
}[] = [{
  id: 'show-notes',
  label: 'Show Notes',
  icon: FileText
}, {
  id: 'assets',
  label: 'Assets',
  icon: Package
}, {
  id: 'transcript',
  label: 'Transcript',
  icon: AlignLeft
}, {
  id: 'guest',
  label: 'Guest Package',
  icon: User
}, {
  id: 'intelligence',
  label: 'Intelligence',
  icon: Brain
}, {
  id: 'rss-tags',
  label: 'RSS Tags',
  icon: Radio
}];

// ─── SEO Score Gauge ─────────────────────────────────────────────────────────

const SEOGauge = ({
  score
}: {
  score: number;
}) => {
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - score / 100 * circumference;
  const color = score >= 90 ? '#10b981' : score >= 75 ? '#0ea5e9' : score >= 60 ? '#f59e0b' : '#ef4444';
  const label = score >= 90 ? 'Excellent' : score >= 75 ? 'Good' : score >= 60 ? 'Fair' : 'Poor';
  return <div className="flex flex-col items-center gap-2">
      <div className="relative">
        <svg width="96" height="96" viewBox="0 0 96 96">
          <circle cx="48" cy="48" r={radius} fill="none" stroke="#e7e5e4" strokeWidth="6" />
          <motion.circle cx="48" cy="48" r={radius} fill="none" stroke={color} strokeWidth="6" strokeLinecap="round" strokeDasharray={circumference} initial={{
          strokeDashoffset: circumference
        }} animate={{
          strokeDashoffset
        }} transition={{
          duration: 1.2,
          ease: 'easeOut' as const,
          delay: 0.2
        }} transform="rotate(-90 48 48)" style={{
          filter: `drop-shadow(0 0 4px ${color}60)`
        }} />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-mono text-2xl font-bold text-foreground leading-none">{score}</span>
          <span className="font-sans text-[9px] font-bold uppercase tracking-widest text-muted-foreground leading-none mt-0.5">SEO</span>
        </div>
      </div>
      <span className="font-sans text-xs font-semibold" style={{
      color
    }}>{label}</span>
    </div>;
};

// ─── SEO Breakdown ───────────────────────────────────────────────────────────

interface SEOMetric {
  label: string;
  score: number;
  icon: React.ElementType;
  note: string;
}
const SEO_METRICS: SEOMetric[] = [{
  label: 'Title Optimisation',
  score: 96,
  icon: Hash,
  note: 'Strong keyword match'
}, {
  label: 'Description',
  score: 88,
  icon: FileText,
  note: 'Good length & density'
}, {
  label: 'Keyword Density',
  score: 91,
  icon: Target,
  note: '3 primary, 8 secondary'
}, {
  label: 'Readability',
  score: 84,
  icon: BookOpen,
  note: 'Flesch score: 72'
}, {
  label: 'Internal Links',
  score: 72,
  icon: Link2,
  note: 'Add 2 more links'
}, {
  label: 'Media Tags',
  score: 100,
  icon: Globe,
  note: 'All tags complete'
}];
const SEOMetricRow = ({
  metric
}: {
  metric: SEOMetric;
}) => {
  const Icon = metric.icon;
  const color = metric.score >= 90 ? 'bg-emerald-400' : metric.score >= 75 ? 'bg-sky-400' : 'bg-amber-400';
  return <div className="flex items-center gap-3 py-2 border-b border-border/50 last:border-0">
      <div className="w-6 h-6 rounded bg-muted flex items-center justify-center flex-shrink-0">
        <Icon className="w-3 h-3 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <span className="font-sans text-[11px] font-medium text-foreground/80 truncate">{metric.label}</span>
          <span className="font-mono text-[10px] font-bold text-muted-foreground ml-2">{metric.score}</span>
        </div>
        <div className="h-1 w-full bg-muted rounded-full overflow-hidden">
          <motion.div initial={{
          width: 0
        }} animate={{
          width: `${metric.score}%`
        }} transition={{
          duration: 0.7,
          ease: 'easeOut' as const,
          delay: 0.4
        }} className={cn('h-full rounded-full', color)} />
        </div>
      </div>
    </div>;
};

// ─── Show Notes Tab ───────────────────────────────────────────────────────────

const CopyButton = ({
  text
}: {
  text: string;
}) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };
  return <button onClick={handleCopy} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-muted-foreground hover:text-foreground/80 hover:bg-accent border border-transparent hover:border-border transition-all text-[11px] font-sans font-medium">
      {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
      {copied ? 'Copied' : 'Copy'}
    </button>;
};
const listVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.06
    }
  }
};
const listItemVariants = {
  hidden: {
    opacity: 0,
    y: 10
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.22,
      ease: 'easeOut' as const
    }
  }
};
interface ShowNotesTabProps {
  episode: Episode | null;
  episodeId: string;
  seoScore: number | null;
  seoAnalysis: SEOAnalysis | null;
  onSaved: () => Promise<void>;
}

type NotesFormat = 'html' | 'markdown' | 'plain';

function stripHtmlTags(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<\/h[1-6]>/gi, '\n\n')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

const FormatToggle = ({ value, onChange }: { value: NotesFormat; onChange: (v: NotesFormat) => void }) => {
  const options: { value: NotesFormat; label: string }[] = [
    { value: 'html', label: 'HTML' },
    { value: 'markdown', label: 'MD' },
    { value: 'plain', label: 'TXT' },
  ];
  return (
    <div className="flex items-center border border-border rounded-lg overflow-hidden">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={cn(
            'px-2 py-1 font-mono text-[10px] font-bold uppercase tracking-wider transition-colors',
            value === opt.value
              ? 'bg-stone-900 text-white'
              : 'text-muted-foreground hover:text-foreground bg-muted'
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
};

const ShowNotesTab = ({ episode, episodeId, seoScore, seoAnalysis, onSaved }: ShowNotesTabProps) => {
  const [notesFormat, setNotesFormat] = useState<NotesFormat>('html');
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const editTextareaRef = useRef<HTMLTextAreaElement>(null);

  const hasUnsavedChanges = isEditing && editContent !== (episode?.show_notes || '');

  const startEditing = useCallback(() => {
    setEditContent(episode?.show_notes || '');
    setIsEditing(true);
    setNotesFormat('markdown');
    setTimeout(() => editTextareaRef.current?.focus(), 0);
  }, [episode?.show_notes]);

  const cancelEditing = useCallback(() => {
    setIsEditing(false);
    setEditContent('');
  }, []);

  const saveShowNotes = useCallback(async () => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      const res = await fetch(`/api/episodes/${episodeId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ show_notes: editContent }),
      });
      if (!res.ok) throw new Error('Failed to save show notes');
      await onSaved();
      setIsEditing(false);
      setEditContent('');
    } catch (err) {
      console.error('Failed to save show notes:', err);
    } finally {
      setIsSaving(false);
    }
  }, [editContent, episodeId, isSaving, onSaved]);

  // Derive SEO keywords from analysis. When `seoAnalysis` is not yet available
  // (episode hasn't been processed) we return an empty list — the keywords
  // panel renders an empty-state message.
  const keywords = useMemo<string[]>(() => {
    if (!seoAnalysis?.keyword_density) return [];
    const entries = Object.entries(seoAnalysis.keyword_density);
    if (entries.length === 0) return [];
    return entries
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([keyword]) => keyword);
  }, [seoAnalysis]);

  // Derive SEO suggestions from analysis. Empty list when not yet available.
  const suggestions = useMemo<string[]>(() => {
    if (!seoAnalysis?.suggestions || seoAnalysis.suggestions.length === 0) {
      return [];
    }
    return seoAnalysis.suggestions.map(s =>
      typeof s === 'string' ? s : (s as { text?: string })?.text ?? String(s)
    );
  }, [seoAnalysis]);

  // Derive SEO metrics from analysis. Only the two metrics the pipeline
  // actually produces are shown. When `seoAnalysis` is null we return an
  // empty list — the SEO panel falls back to "Awaiting analysis" copy.
  const seoMetrics: SEOMetric[] = useMemo(() => {
    if (!seoAnalysis) return [];
    return [
      {
        label: 'Readability',
        score: seoAnalysis.readability_score ?? 0,
        icon: BookOpen,
        note: seoAnalysis.readability_score
          ? `Score: ${seoAnalysis.readability_score}`
          : 'No data',
      },
      {
        label: 'Header Structure',
        score: seoAnalysis.header_structure ? 100 : 0,
        icon: Hash,
        note: seoAnalysis.header_structure ? 'Headers well structured' : 'Needs improvement',
      },
    ];
  }, [seoAnalysis]);

  const resolvedScore = seoScore ?? 0;
  const showNotesContent = episode?.show_notes || episode?.show_notes_html || null;

  return <div className="flex flex-col lg:flex-row gap-5 lg:gap-6 h-full">
    {/* ── Left: Rich show notes ── */}
    <div className="flex-1 min-w-0">
      <div className="bg-card border border-border rounded-lg overflow-hidden shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
        {/* Toolbar */}
        <div className="flex items-center justify-between px-4 sm:px-5 py-3 border-b border-border bg-muted/50">
          <div className="flex items-center gap-3">
            <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              {isEditing ? 'Editing Show Notes' : 'Show Notes'}
            </span>
            {showNotesContent && !isEditing && <FormatToggle value={notesFormat} onChange={setNotesFormat} />}
            {isEditing && (
              <span className="font-mono text-[10px] text-muted-foreground/60 uppercase tracking-wider">Markdown</span>
            )}
          </div>
          <div className="flex items-center gap-1">
            {!isEditing && (
              <>
                <CopyButton text={
                  notesFormat === 'html'
                    ? (showNotesContent || 'Show notes content')
                    : notesFormat === 'markdown'
                      ? (episode?.show_notes || showNotesContent || 'Show notes content')
                      : stripHtmlTags(episode?.show_notes_html || showNotesContent || 'Show notes content')
                } />
                <button className="flex items-center gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-md text-muted-foreground hover:text-foreground/80 hover:bg-accent border border-transparent hover:border-border transition-all text-[11px] font-sans font-medium">
                  <Download className="w-3 h-3" />
                  <span className="hidden sm:inline">Export</span>
                </button>
                <button
                  onClick={startEditing}
                  className="flex items-center gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-md text-muted-foreground hover:text-foreground/80 hover:bg-accent border border-transparent hover:border-border transition-all text-[11px] font-sans font-medium"
                >
                  <Pencil className="w-3 h-3" />
                  <span className="hidden sm:inline">Edit</span>
                </button>
                <button className="flex items-center gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-md bg-stone-900 text-white hover:bg-stone-800 transition-colors text-[11px] font-sans font-semibold ml-1 shadow-sm">
                  <RefreshCw className="w-3 h-3" />
                  <span className="hidden sm:inline">Regenerate</span>
                </button>
              </>
            )}
            {isEditing && (
              <div className="flex items-center gap-2">
                {hasUnsavedChanges && (
                  <span className="font-mono text-[10px] text-amber-600 font-medium">Unsaved changes</span>
                )}
                <button
                  onClick={cancelEditing}
                  disabled={isSaving}
                  className="bg-muted text-muted-foreground hover:text-foreground px-3 py-1.5 rounded-lg font-sans text-[11px] transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={saveShowNotes}
                  disabled={isSaving || !hasUnsavedChanges}
                  className="flex items-center gap-1.5 bg-stone-900 text-white hover:bg-stone-800 px-3 py-1.5 rounded-lg font-sans text-[11px] font-semibold shadow-sm transition-colors disabled:opacity-50"
                >
                  {isSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                  <span>{isSaving ? 'Saving...' : 'Save'}</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <div className={cn(
          "px-5 sm:px-8 py-5 sm:py-7 space-y-5 font-serif text-foreground/80 leading-relaxed max-h-[calc(100vh-320px)] overflow-y-auto",
          isEditing && "p-0"
        )}>
          {isEditing ? (
            /* Edit mode: markdown textarea */
            <textarea
              ref={editTextareaRef}
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="w-full h-[calc(100vh-380px)] min-h-[400px] font-mono text-sm leading-relaxed p-5 sm:p-6 bg-card border-0 rounded-none resize-none focus:outline-none focus:ring-0 text-foreground/80 placeholder:text-muted-foreground/50"
              placeholder="Enter your show notes in markdown..."
              spellCheck={false}
            />
          ) : showNotesContent ? (
            /* Render real show notes in the selected format */
            notesFormat === 'html' ? (
              episode?.show_notes_html ? (
                <div
                  // eslint-disable-next-line react/no-danger
                  dangerouslySetInnerHTML={{ __html: sanitizeHtmlForDisplay(episode.show_notes_html) }}
                  className="prose prose-stone max-w-none"
                />
              ) : (
                /* No HTML available — show the raw markdown source with a
                   one-line notice so users understand why it looks raw. */
                <div className="space-y-3">
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200/60">
                    <AlertCircle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                    <span className="font-sans text-[11px] text-amber-700">
                      HTML version not yet generated. Showing markdown source.
                    </span>
                  </div>
                  <pre className="whitespace-pre-wrap font-mono text-[13px] leading-[1.75] text-foreground/70 bg-muted/30 rounded-lg p-4 border border-border overflow-x-auto">
                    {episode?.show_notes ?? showNotesContent}
                  </pre>
                </div>
              )
            ) : notesFormat === 'markdown' ? (
              <pre className="whitespace-pre-wrap font-mono text-[13px] leading-[1.75] text-foreground/70 bg-muted/30 rounded-lg p-4 border border-border overflow-x-auto">
                {episode?.show_notes || showNotesContent}
              </pre>
            ) : (
              <div className="whitespace-pre-wrap text-[14.5px] leading-[1.8] text-muted-foreground">
                {stripHtmlTags(episode?.show_notes_html || showNotesContent)}
              </div>
            )
          ) : (
            /* Empty state — episode hasn't been processed yet */
            <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                <FileText className="w-6 h-6 text-muted-foreground" />
              </div>
              <div>
                <p className="font-sans font-semibold text-sm text-foreground mb-1">
                  No show notes yet
                </p>
                <p className="font-sans text-[12px] text-muted-foreground max-w-xs">
                  Show notes are generated automatically when this episode finishes processing.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>

    {/* ── Right: SEO Panel ── */}
    <div className="w-full lg:w-[248px] lg:flex-shrink-0 space-y-3">
      {/* Score card */}
      <div className="bg-card border border-border rounded-lg p-5 shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
        <div className="flex items-center justify-between mb-4">
          <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">SEO Score</span>
          <BarChart2 aria-label="SEO score breakdown" className="w-3.5 h-3.5 text-muted-foreground" />
        </div>
        <div className="flex justify-center mb-4">
          <SEOGauge score={resolvedScore} />
        </div>
        {seoMetrics.length > 0 ? (
          <div className="space-y-0">
            {seoMetrics.map(m => <SEOMetricRow key={m.label} metric={m} />)}
          </div>
        ) : (
          <p className="font-sans text-[11px] text-muted-foreground italic text-center">
            SEO breakdown will appear after this episode is processed.
          </p>
        )}
      </div>

      {/* Keywords card */}
      <div className="bg-card border border-border rounded-lg p-4 shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
        <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground block mb-3">Top Keywords</span>
        {keywords.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {keywords.map(kw => (
              <span key={kw} className="font-sans text-[10px] text-muted-foreground bg-muted/80 border border-border px-2 py-0.5 rounded-full">
                {kw}
              </span>
            ))}
          </div>
        ) : (
          <p className="font-sans text-[11px] text-muted-foreground italic">
            Keywords are extracted after the episode is processed.
          </p>
        )}
      </div>

      {/* Suggestions card */}
      {suggestions.length > 0 && (
        <div className="bg-amber-50 border border-amber-200/60 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
            <span className="font-sans text-[11px] font-semibold text-amber-700">{suggestions.length} Suggestion{suggestions.length !== 1 ? 's' : ''}</span>
          </div>
          <ul className="space-y-2">
            {suggestions.map((s, i) => <li key={i} className="flex items-start gap-2 text-[11px] text-amber-700 leading-relaxed">
                <span className="font-mono text-amber-400 mt-0.5">&rarr;</span>
                {s}
              </li>)}
          </ul>
        </div>
      )}
    </div>
  </div>;
};

// ─── Assets Tab ───────────────────────────────────────────────────────────────

const ASSET_CATEGORIES: AssetCategory[] = [{
  id: 'core',
  label: 'Core',
  dot: 'bg-emerald-500',
  iconBg: 'bg-emerald-50 border-emerald-200/60',
  countColor: 'text-emerald-600 bg-emerald-50 border-emerald-200/60',
  assets: [{
    id: 'show-notes',
    label: 'Show Notes',
    icon: FileText,
    description: 'Full editorial show notes with timestamps',
    status: 'generated',
    accentColor: 'text-emerald-600'
  }, {
    id: 'chapter-markers',
    label: 'Chapter Markers',
    icon: Hash,
    description: 'Timestamped chapter titles for podcast apps',
    status: 'generated',
    accentColor: 'text-emerald-600'
  }, {
    id: 'episode-description',
    label: 'Episode Description',
    icon: AlignLeft,
    description: 'RSS feed description (500 chars)',
    status: 'generated',
    accentColor: 'text-emerald-600'
  }]
}, {
  id: 'social',
  label: 'Social',
  dot: 'bg-sky-500',
  iconBg: 'bg-sky-50 border-sky-200/60',
  countColor: 'text-sky-600 bg-sky-50 border-sky-200/60',
  assets: [{
    id: 'twitter-thread',
    label: 'X Thread',
    icon: Twitter,
    description: '8-tweet thread with key insights',
    status: 'generated',
    accentColor: 'text-sky-600'
  }, {
    id: 'linkedin-post',
    label: 'LinkedIn Post',
    icon: Linkedin,
    description: 'Long-form professional post',
    status: 'idle',
    accentColor: 'text-sky-600'
  }, {
    id: 'instagram-captions',
    label: 'Instagram Captions',
    icon: Image,
    description: '3 caption variations with hashtags',
    status: 'idle',
    accentColor: 'text-sky-600'
  }]
}, {
  id: 'longform',
  label: 'Long-form',
  dot: 'bg-violet-500',
  iconBg: 'bg-violet-50 border-violet-200/60',
  countColor: 'text-violet-600 bg-violet-50 border-violet-200/60',
  assets: [{
    id: 'blog-post',
    label: 'Blog Article',
    icon: BookOpen,
    description: '1,200-word SEO article with structure',
    status: 'generated',
    accentColor: 'text-violet-600'
  }, {
    id: 'newsletter',
    label: 'Newsletter Issue',
    icon: Mail,
    description: 'Email digest of episode highlights',
    status: 'idle',
    accentColor: 'text-violet-600'
  }]
}, {
  id: 'guest',
  label: 'Guest',
  dot: 'bg-amber-500',
  iconBg: 'bg-amber-50 border-amber-200/60',
  countColor: 'text-amber-600 bg-amber-50 border-amber-200/60',
  assets: [{
    id: 'guest-bio',
    label: 'Guest Bio',
    icon: User,
    description: 'Formatted guest bio for show notes',
    status: 'idle',
    accentColor: 'text-amber-600'
  }, {
    id: 'guest-email',
    label: 'Post-show Email',
    icon: Mail,
    description: 'Thank-you email template for guest',
    status: 'idle',
    accentColor: 'text-amber-600'
  }]
}, {
  id: 'visual',
  label: 'Visual',
  dot: 'bg-rose-500',
  iconBg: 'bg-rose-50 border-rose-200/60',
  countColor: 'text-rose-600 bg-rose-50 border-rose-200/60',
  assets: [{
    id: 'audiogram-script',
    label: 'Audiogram Script',
    icon: Volume2,
    description: 'Key quote for 60s audiogram clip',
    status: 'generated',
    accentColor: 'text-rose-600'
  }, {
    id: 'youtube-desc',
    label: 'YouTube Description',
    icon: Youtube,
    description: 'Full YT description with timestamps',
    status: 'idle',
    accentColor: 'text-rose-600'
  }]
}, {
  id: 'ai-summary',
  label: 'AI Summary',
  dot: 'bg-stone-500',
  iconBg: 'bg-muted border-border',
  countColor: 'text-muted-foreground bg-muted border-border',
  assets: [{
    id: '1-liner',
    label: 'One-liner Summary',
    icon: Zap,
    description: 'One sentence episode summary',
    status: 'generated',
    accentColor: 'text-muted-foreground'
  }, {
    id: 'tldr',
    label: 'TL;DR Bullets',
    icon: AlignLeft,
    description: '5 key takeaways from the episode',
    status: 'generated',
    accentColor: 'text-muted-foreground'
  }]
}];

// ─── Asset Row (with category-colored icon bg) ───────────────────────────────

const AssetRow = ({
  asset,
  iconBg,
  index,
  episodeId,
  realAssetId,
  realAssetContent,
  onGenerate,
}: {
  asset: AssetItem;
  iconBg: string;
  index: number;
  episodeId?: string;
  realAssetId?: string;
  realAssetContent?: string;
  /** Called with the UI asset id when the user clicks Generate */
  onGenerate: (uiAssetId: string) => Promise<void>;
}) => {
  const [status, setStatus] = useState<AssetStatus>(realAssetContent ? 'generated' : asset.status);
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const Icon = asset.icon;
  const handleGenerate = useCallback(async () => {
    if (status !== 'idle') return;
    setStatus('generating');
    try {
      await onGenerate(asset.id);
      setStatus('generated');
    } catch {
      setStatus('idle');
    }
  }, [status, onGenerate, asset.id]);
  const contentText = realAssetContent || asset.content || '';
  const handleCopy = () => {
    navigator.clipboard.writeText(contentText);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };
  const handleDownload = () => {
    if (!contentText) return;
    const blob = new Blob([contentText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${asset.label.toLowerCase().replace(/\s+/g, '-')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // One-click sharing via platform intent URLs.
  // These open the platform's native compose/share window with content
  // pre-filled. No API keys or OAuth needed — the user posts from their
  // own account. Each asset type gets the platforms that make sense for it.
  const shareLinks = useMemo<Array<{ url: string; label: string; copyFirst?: boolean }>>(() => {
    if (!contentText) return [];
    const pageUrl = typeof window !== 'undefined' ? window.location.href : '';
    const summary = contentText.slice(0, 280);
    const links: Array<{ url: string; label: string; copyFirst?: boolean }> = [];

    switch (asset.id) {
      case 'twitter-thread': {
        const firstTweet = contentText.split(/\n\n|\n\d+[./)]/)[0]?.slice(0, 280) || summary;
        links.push({ url: `https://x.com/intent/post?text=${encodeURIComponent(firstTweet)}`, label: 'Post on X' });
        links.push({ url: `https://www.facebook.com/sharer/sharer.php?quote=${encodeURIComponent(firstTweet)}&u=${encodeURIComponent(pageUrl)}`, label: 'Facebook' });
        links.push({ url: `https://reddit.com/submit?title=${encodeURIComponent('Check out this episode')}&text=${encodeURIComponent(firstTweet)}`, label: 'Reddit' });
        break;
      }
      case 'linkedin-post':
        links.push({ url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(pageUrl)}`, label: 'LinkedIn', copyFirst: true });
        links.push({ url: `https://www.facebook.com/sharer/sharer.php?quote=${encodeURIComponent(summary)}&u=${encodeURIComponent(pageUrl)}`, label: 'Facebook' });
        break;
      case 'blog-post':
        links.push({ url: `https://reddit.com/submit?title=${encodeURIComponent(asset.label)}&text=${encodeURIComponent(summary)}`, label: 'Reddit' });
        links.push({ url: `https://www.facebook.com/sharer/sharer.php?quote=${encodeURIComponent(summary)}&u=${encodeURIComponent(pageUrl)}`, label: 'Facebook' });
        break;
      case 'newsletter':
        // mailto: opens their email client with subject + body pre-filled
        links.push({
          url: `mailto:?subject=${encodeURIComponent('New episode: ' + (asset.label || 'Newsletter'))}&body=${encodeURIComponent(contentText)}`,
          label: 'Send as email',
        });
        break;
      case 'guest-email':
        // Guest promo kit — email is the primary action
        links.push({
          url: `mailto:?subject=${encodeURIComponent('Thanks for joining the show!')}&body=${encodeURIComponent(contentText)}`,
          label: 'Send as email',
        });
        break;
      case 'instagram-captions':
        links.push({ url: `https://www.facebook.com/sharer/sharer.php?quote=${encodeURIComponent(summary)}&u=${encodeURIComponent(pageUrl)}`, label: 'Facebook' });
        break;
      // YouTube, TikTok, etc. — no web intent, copy-only is the right UX
    }
    return links;
  }, [asset.id, asset.label, contentText]);

  const hasRealContent = !!realAssetId && !!realAssetContent && !!episodeId;
  return <motion.div variants={listItemVariants} className="flex flex-col">
      <div className="flex items-center gap-4 py-2.5 px-4 rounded-lg hover:bg-accent/50 transition-colors group cursor-pointer" onClick={() => hasRealContent && setExpanded(!expanded)}>
        <div className={cn('w-8 h-8 rounded-lg border flex items-center justify-center flex-shrink-0', iconBg)}>
          <Icon className={cn('w-3.5 h-3.5', asset.accentColor)} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="font-sans text-[13px] font-medium text-foreground">{asset.label}</span>
            {(status === 'generated' || hasRealContent) && <span className="flex items-center gap-1 font-mono text-[9px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200/60 px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                <CheckCircle2 className="w-2.5 h-2.5" />
                Ready
              </span>}
            {hasRealContent && <span className={cn('transition-transform duration-150', expanded ? 'rotate-90' : 'rotate-0')}>
                <ChevronRight className="w-3 h-3 text-muted-foreground" />
              </span>}
          </div>
          <p className="font-sans text-[11px] text-muted-foreground">{asset.description}</p>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
          {(status === 'generated' || hasRealContent) && <>
              {/* Copy — always visible so users don't have to discover it */}
              <button
                onClick={handleCopy}
                aria-label={copied ? 'Copied!' : `Copy ${asset.label}`}
                title="Copy to clipboard"
                className={cn(
                  'flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-sans font-medium transition-all',
                  copied
                    ? 'text-emerald-600 bg-emerald-50 border border-emerald-200/60'
                    : 'text-muted-foreground hover:text-foreground bg-muted/50 border border-border hover:border-border/80'
                )}
              >
                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                <span className="hidden sm:inline">{copied ? 'Copied' : 'Copy'}</span>
              </button>
              {/* Download as .txt */}
              <button
                onClick={handleDownload}
                aria-label={`Download ${asset.label}`}
                title="Download as text file"
                className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-sans font-medium text-muted-foreground hover:text-foreground bg-muted/50 border border-border hover:border-border/80 transition-all"
              >
                <Download className="w-3 h-3" />
                <span className="hidden sm:inline">.txt</span>
              </button>
              {/* Share links — X, Facebook, Reddit, Email, LinkedIn */}
              {shareLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.url}
                  target={link.url.startsWith('mailto:') ? undefined : '_blank'}
                  rel={link.url.startsWith('mailto:') ? undefined : 'noopener noreferrer'}
                  title={link.label}
                  onClick={() => {
                    // For platforms that can't pre-fill body text (LinkedIn),
                    // copy the content to clipboard so the user can paste.
                    if (link.copyFirst) {
                      navigator.clipboard.writeText(contentText);
                    }
                  }}
                  className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-sans font-medium text-muted-foreground hover:text-foreground bg-muted/50 border border-border hover:border-border/80 transition-all"
                >
                  <ExternalLink className="w-3 h-3" />
                  <span className="hidden sm:inline">{link.label}</span>
                </a>
              ))}
            </>}
          {status === 'generating' && !hasRealContent && <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-amber-50 border border-amber-200/60 text-[10px] font-sans font-semibold text-amber-600">
              <Loader2 className="w-3 h-3 animate-spin" />
              Generating...
            </div>}
          {status === 'idle' && !hasRealContent && <button onClick={handleGenerate} className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-stone-900 text-white text-[10px] font-sans font-semibold hover:bg-stone-800 transition-colors shadow-sm">
              <Wand2 className="w-3 h-3" />
              Generate
            </button>}
        </div>
      </div>
      <AnimatePresence>
        {expanded && hasRealContent && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="px-4 pb-3 overflow-hidden"
          >
            <AssetEditor
              episodeId={episodeId}
              assetId={realAssetId}
              assetType={asset.id}
              initialContent={realAssetContent}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>;
};

// ─── Category Card with stagger ──────────────────────────────────────────────

const CategoryCard = ({
  cat,
  catIndex,
  episodeId,
  assetMap,
  onGenerate,
}: {
  cat: AssetCategory;
  catIndex: number;
  episodeId?: string;
  assetMap?: Map<string, GeneratedAsset>;
  onGenerate: (uiAssetId: string) => Promise<void>;
}) => {
  const readyCount = cat.assets.filter(a => {
    if (assetMap) {
      const real = assetMap.get(a.id);
      if (real) return true;
    }
    return a.status === 'generated';
  }).length;
  const total = cat.assets.length;
  const allReady = readyCount === total;
  return <motion.div variants={listVariants} className="bg-card border border-border rounded-lg overflow-hidden shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
      {/* Category Header */}
      <div className="flex items-center gap-2.5 px-4 py-3 border-b border-border/50 bg-muted/50">
        <div className={cn('w-2 h-2 rounded-full flex-shrink-0', cat.dot)} />
        <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{cat.label}</span>
        <span className="ml-auto">
          <span className={cn('font-mono text-[9px] font-bold px-1.5 py-0.5 rounded-full border', allReady ? 'text-emerald-600 bg-emerald-50 border-emerald-200/60' : cat.countColor)}>
            {readyCount}/{total} ready
          </span>
        </span>
      </div>

      {/* Assets */}
      <motion.div className="divide-y divide-border/50" variants={listVariants} initial="hidden" animate="visible">
        {cat.assets.map((asset, i) => {
          const realAsset = assetMap?.get(asset.id);
          return <AssetRow
            key={asset.id}
            asset={asset}
            iconBg={cat.iconBg}
            index={i}
            episodeId={episodeId}
            realAssetId={realAsset?.id}
            realAssetContent={realAsset?.content}
            onGenerate={onGenerate}
          />;
        })}
      </motion.div>
    </motion.div>;
};

// Map from UI asset IDs to database asset_type values
const UI_ID_TO_DB_TYPE: Record<string, string> = {
  'show-notes': 'show_notes',
  'chapter-markers': 'chapter_markers',
  'episode-description': 'seo_description',
  'twitter-thread': 'twitter_thread',
  'linkedin-post': 'linkedin_post',
  'instagram-captions': 'instagram_caption',
  'blog-post': 'blog_post',
  'newsletter': 'newsletter_email',
  'guest-bio': 'guest_bio_short',
  'guest-email': 'guest_promo_kit',
  'audiogram-script': 'audiogram_clips',
  'youtube-desc': 'youtube_description',
  '1-liner': 'ai_summary_short',
  'tldr': 'key_takeaways',
};

interface AssetsTabProps {
  episodeId: string;
  apiAssets: GeneratedAsset[];
  generateAsset: (assetType: string) => Promise<void>;
}

const AssetsTab = ({ episodeId, apiAssets, generateAsset }: AssetsTabProps) => {
  const [isBatchRunning, setIsBatchRunning] = useState(false);
  const [batchProgress, setBatchProgress] = useState({ done: 0, total: 0 });

  // Build a map from UI asset IDs to real API assets
  const assetMap = useMemo(() => {
    const map = new Map<string, GeneratedAsset>();
    if (!apiAssets || apiAssets.length === 0) return map;

    // Build reverse lookup: db type -> UI ID
    const dbTypeToUiId = new Map<string, string>();
    for (const [uiId, dbType] of Object.entries(UI_ID_TO_DB_TYPE)) {
      dbTypeToUiId.set(dbType, uiId);
    }

    for (const asset of apiAssets) {
      const uiId = dbTypeToUiId.get(asset.asset_type);
      if (uiId) {
        map.set(uiId, asset);
      }
    }
    return map;
  }, [apiAssets]);

  const totalAssets = ASSET_CATEGORIES.reduce((sum, cat) => sum + cat.assets.length, 0);
  const generatedCount = ASSET_CATEGORIES.reduce((sum, cat) => {
    return sum + cat.assets.filter(a => {
      if (assetMap.has(a.id)) return true;
      return false;
    }).length;
  }, 0);

  // Resolve a single UI asset id and call the real generation API
  const handleGenerateOne = useCallback(
    async (uiAssetId: string) => {
      const dbType = UI_ID_TO_DB_TYPE[uiAssetId];
      if (!dbType) {
        toast.error(`No backend type for "${uiAssetId}"`);
        throw new Error(`Unmapped UI asset id: ${uiAssetId}`);
      }
      try {
        await generateAsset(dbType);
      } catch (err) {
        toast.error('Generation failed. Please try again.');
        throw err;
      }
    },
    [generateAsset]
  );

  // Generate every missing asset, with concurrency=3 so we don't hammer the
  // backend or trip the per-IP rate limit (20 req/min). Batch progress is
  // tracked in state so the overlay can show real progress, not fake bars.
  const handleGenerateAll = useCallback(async () => {
    if (isBatchRunning) return;
    const missing = ASSET_CATEGORIES.flatMap((cat) => cat.assets).filter(
      (a) => !assetMap.has(a.id)
    );
    const dbTypes = missing
      .map((a) => UI_ID_TO_DB_TYPE[a.id])
      .filter((t): t is string => !!t);

    if (dbTypes.length === 0) {
      toast.success('All assets already generated.');
      return;
    }

    setIsBatchRunning(true);
    setBatchProgress({ done: 0, total: dbTypes.length });

    const concurrency = 3;
    let completed = 0;
    let failures = 0;

    try {
      for (let i = 0; i < dbTypes.length; i += concurrency) {
        const batch = dbTypes.slice(i, i + concurrency);
        const results = await Promise.allSettled(
          batch.map((dbType) => generateAsset(dbType))
        );
        for (const r of results) {
          completed += 1;
          if (r.status === 'rejected') failures += 1;
        }
        setBatchProgress({ done: completed, total: dbTypes.length });
      }

      if (failures === 0) {
        toast.success(`Generated ${dbTypes.length} ${dbTypes.length === 1 ? 'asset' : 'assets'}.`);
      } else if (failures === dbTypes.length) {
        toast.error('Generation failed for all assets.');
      } else {
        toast.warning(
          `Generated ${dbTypes.length - failures} of ${dbTypes.length}. ${failures} failed — try regenerating individually.`
        );
      }
    } finally {
      // Always reset, even if the loop or a state setter throws — otherwise
      // the button stays permanently disabled until the user reloads.
      setIsBatchRunning(false);
    }
  }, [assetMap, generateAsset, isBatchRunning]);

  const batchPercent =
    batchProgress.total > 0 ? Math.round((batchProgress.done / batchProgress.total) * 100) : 0;

  return (
    <div className="space-y-4">
      {/* Header row */}
      <div className="flex items-center justify-between px-1">
        <div>
          <p className="font-sans text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">
              {generatedCount} of {totalAssets}
            </span>{' '}
            assets generated
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Download All as ZIP */}
          {generatedCount > 0 && (
            <a
              href={`/api/episodes/${episodeId}/assets/download`}
              download
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-[12px] font-sans font-semibold text-muted-foreground hover:text-foreground bg-card border border-border hover:border-border/80 transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              Download ZIP
            </a>
          )}
          <button
            type="button"
            onClick={handleGenerateAll}
            disabled={isBatchRunning || generatedCount === totalAssets}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg text-[12px] font-sans font-semibold transition-all shadow-sm',
              isBatchRunning || generatedCount === totalAssets
                ? 'bg-stone-700 text-muted-foreground/80 cursor-not-allowed'
                : 'bg-stone-900 text-white hover:bg-stone-800'
            )}
          >
            {isBatchRunning ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Generating ({batchProgress.done}/{batchProgress.total})
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                Generate All Remaining
              </>
            )}
          </button>
        </div>
      </div>

      {/* Real progress bar replacing the fake animated overlay */}
      {isBatchRunning && (
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Generating assets
            </span>
            <span className="font-mono text-[10px] text-muted-foreground">{batchPercent}%</span>
          </div>
          <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
            <motion.div
              animate={{ width: `${batchPercent}%` }}
              transition={{ duration: 0.3, ease: 'easeOut' as const }}
              className="h-full bg-emerald-400 rounded-full"
            />
          </div>
        </div>
      )}

      {/* Category Cards with stagger */}
      <motion.div className="space-y-4" variants={listVariants} initial="hidden" animate="visible">
        {ASSET_CATEGORIES.map((cat, i) => (
          <CategoryCard
            key={cat.id}
            cat={cat}
            catIndex={i}
            episodeId={episodeId}
            assetMap={assetMap}
            onGenerate={handleGenerateOne}
          />
        ))}
      </motion.div>
    </div>
  );
};

// ─── Transcript Tab ───────────────────────────────────────────────────────────

// ─── Highlight matched text ───────────────────────────────────────────────────

const HighlightedText = ({
  text,
  query
}: {
  text: string;
  query: string;
}) => {
  if (!query.trim()) return <>{text}</>;
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  const parts = text.split(regex);
  return <>
      {parts.map((part, i) => regex.test(part) ? <mark key={i} className="bg-amber-200/70 text-amber-900 rounded-sm px-0.5 not-italic">
            {part}
          </mark> : <React.Fragment key={i}>{part}</React.Fragment>)}
    </>;
};
interface TranscriptTabProps {
  episode: Episode | null;
}

// Helper to format seconds to MM:SS
const formatTimestamp = (seconds: number): string => {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

// Map API transcript segments to the UI format
const mapApiSegments = (apiSegments: import('@/types/database').TranscriptSegment[]): TranscriptSegment[] => {
  const speakerColors: Record<string, string> = {};
  const colorPalette = [
    'bg-stone-800 text-stone-100',
    'bg-amber-600 text-white',
    'bg-sky-700 text-white',
    'bg-violet-700 text-white',
    'bg-emerald-700 text-white',
    'bg-rose-700 text-white',
  ];
  let colorIdx = 0;

  return apiSegments.map((seg, i) => {
    const speaker = seg.speaker || 'Speaker';
    if (!speakerColors[speaker]) {
      speakerColors[speaker] = colorPalette[colorIdx % colorPalette.length];
      colorIdx++;
    }
    return {
      id: `t${i}`,
      speaker,
      speakerInitial: speaker.charAt(0).toUpperCase(),
      speakerColor: speakerColors[speaker],
      timestamp: formatTimestamp(seg.start),
      text: seg.text,
    };
  });
};

const TranscriptTab = ({ episode }: TranscriptTabProps) => {
  const segments = useMemo<TranscriptSegment[]>(() => {
    if (episode?.transcript_segments && episode.transcript_segments.length > 0) {
      return mapApiSegments(episode.transcript_segments);
    }
    return [];
  }, [episode]);

  const [searchQ, setSearchQ] = useState('');

  // No transcript yet — show a clear empty state instead of an empty toolbar
  if (segments.length === 0) {
    return (
      <div className="bg-card border border-border rounded-lg p-10 shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
        <div className="flex flex-col items-center justify-center gap-4 text-center">
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
            <AlignLeft className="w-6 h-6 text-muted-foreground" />
          </div>
          <div>
            <p className="font-sans font-semibold text-sm text-foreground mb-1">
              Transcript not yet available
            </p>
            <p className="font-sans text-[12px] text-muted-foreground max-w-sm">
              {episode?.status === 'processing'
                ? 'Transcription is in progress. This view will populate automatically when ready.'
                : 'The transcript will appear here once this episode is processed.'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const filtered = segments.filter(s => !searchQ || s.text.toLowerCase().includes(searchQ.toLowerCase()) || s.speaker.toLowerCase().includes(searchQ.toLowerCase()));
  const matchCount = searchQ.trim() ? filtered.reduce((acc, seg) => {
    const re = new RegExp(searchQ.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    return acc + (seg.text.match(re)?.length ?? 0);
  }, 0) : 0;
  return <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Activity className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
          <input type="text" placeholder="Search transcript…" value={searchQ} onChange={e => setSearchQ(e.target.value)} className="w-full pl-9 pr-4 py-2 rounded-lg text-sm font-sans text-foreground placeholder:text-muted-foreground bg-card border border-border focus:outline-none focus:border-ring focus:shadow-[0_0_0_3px_rgba(120,113,108,0.1)] transition-all shadow-[0_1px_3px_rgba(0,0,0,0.04)]" />
          {/* Match count badge */}
          <AnimatePresence>
            {searchQ.trim() && <motion.span initial={{
            opacity: 0,
            scale: 0.8
          }} animate={{
            opacity: 1,
            scale: 1
          }} exit={{
            opacity: 0,
            scale: 0.8
          }} transition={{
            duration: 0.15
          }} className="absolute right-3 top-1/2 -translate-y-1/2 font-mono text-[10px] font-bold text-amber-700 bg-amber-100 border border-amber-200/70 px-1.5 py-0.5 rounded-full">
                {matchCount} match{matchCount !== 1 ? 'es' : ''}
              </motion.span>}
          </AnimatePresence>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-2 bg-card border border-border rounded-lg">
          <Radio className="w-3 h-3 text-emerald-500" />
          <span className="font-mono text-[10px] font-bold text-muted-foreground">{segments.length} segments</span>
        </div>
        <button className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-muted-foreground hover:text-accent-foreground bg-card border border-border hover:border-border transition-all text-[11px] font-sans font-medium">
          <Download className="w-3.5 h-3.5" />
          Export SRT
        </button>
      </div>

      <div className="bg-card border border-border rounded-lg overflow-hidden shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
        <AnimatePresence mode="wait">
          <motion.div key={searchQ} variants={listVariants} initial="hidden" animate="visible" className="divide-y divide-border/50">
            {filtered.length === 0 ? <motion.div variants={listItemVariants} className="flex flex-col items-center justify-center py-14 gap-3">
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                  <Activity className="w-5 h-5 text-muted-foreground" />
                </div>
                <p className="font-sans text-sm text-muted-foreground">No results for <span className="font-semibold text-muted-foreground">&quot;{searchQ}&quot;</span></p>
              </motion.div> : filtered.map((seg, i) => <motion.div key={seg.id} variants={listItemVariants} className="flex gap-4 px-5 py-4 hover:bg-accent/50 transition-colors group">
                  {/* Timestamp */}
                  <div className="flex-shrink-0 w-12 text-right pt-0.5">
                    <span className="font-mono text-[10px] font-bold text-muted-foreground group-hover:text-muted-foreground transition-colors">
                      {seg.timestamp}
                    </span>
                  </div>

                  {/* Speaker avatar */}
                  <div className="flex-shrink-0">
                    <div className={cn('w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-mono font-bold mt-0.5', seg.speakerColor)}>
                      {seg.speakerInitial}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="font-sans text-[11px] font-semibold text-muted-foreground">{seg.speaker}</span>
                      {seg.speaker.includes('AI') && <span className="font-mono text-[9px] text-amber-600 bg-amber-50 border border-amber-200/60 px-1.5 py-0.5 rounded-full">AI Voice</span>}
                    </div>
                    <p className="font-serif text-[13.5px] text-muted-foreground leading-[1.75]">
                      <HighlightedText text={seg.text} query={searchQ} />
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-start gap-1 pt-0.5">
                    <button className="p-1 rounded text-muted-foreground hover:text-accent-foreground hover:bg-accent transition-all">
                      <Copy className="w-3 h-3" />
                    </button>
                    <button className="p-1 rounded text-muted-foreground hover:text-accent-foreground hover:bg-accent transition-all">
                      <Play className="w-3 h-3" />
                    </button>
                  </div>
                </motion.div>)}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>;
};

// ─── Guest Package Tab ────────────────────────────────────────────────────────

interface GuestPackageTabProps {
  episode: Episode | null;
  episodeId: string;
  generateAsset: (assetType: string) => Promise<void>;
  apiAssets: GeneratedAsset[];
}

interface GuestAssetItem {
  label: string;
  icon: React.ElementType;
  description: string;
  assetType: string;
}

const GUEST_PACKAGE_ITEMS: GuestAssetItem[] = [
  {
    label: 'Guest Bio',
    icon: User,
    description: 'Formatted bio for show notes and website',
    assetType: 'guest_bio_short',
  },
  {
    label: 'Post-show Email',
    icon: Mail,
    description: 'Personalised thank-you email template with episode link',
    assetType: 'guest_promo_kit',
  },
  {
    label: 'Social Mention Copy',
    icon: MessageSquare,
    description: 'X/LinkedIn mention text tagging the guest',
    assetType: 'linkedin_post_guest',
  },
  {
    label: 'Guest Audiogram',
    icon: Volume2,
    description: 'Best quote clip formatted for guest to share',
    assetType: 'audiogram_clips',
  },
];

const GuestPackageTab = ({ episode, episodeId, generateAsset, apiAssets }: GuestPackageTabProps) => {
  const guestName = episode?.guest_name || 'Unknown Guest';
  const guestBio = episode?.guest_bio || null;
  const guestInitials = guestName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const isSoloEpisode = !episode?.guest_name;

  // Track which assets are currently being generated so the buttons show
  // a loading state instead of fake setTimeout animations.
  const [generatingTypes, setGeneratingTypes] = useState<Set<string>>(new Set());

  // Index existing assets by type so we can mark already-generated items as Ready
  const generatedTypes = useMemo(() => {
    const set = new Set<string>();
    for (const asset of apiAssets || []) {
      set.add(asset.asset_type);
    }
    return set;
  }, [apiAssets]);

  const handleGenerate = useCallback(
    async (assetType: string) => {
      if (generatingTypes.has(assetType)) return;
      setGeneratingTypes((prev) => new Set(prev).add(assetType));
      try {
        await generateAsset(assetType);
        toast.success('Asset generated.');
      } catch {
        toast.error('Generation failed. Please try again.');
      } finally {
        setGeneratingTypes((prev) => {
          const next = new Set(prev);
          next.delete(assetType);
          return next;
        });
      }
    },
    [generateAsset, generatingTypes]
  );

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        {/* Guest Card */}
        <div className="bg-card border border-border rounded-lg p-5 shadow-[0_1px_4px_rgba(0,0,0,0.04)] col-span-2">
          <div className="flex items-start gap-5">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-stone-700 to-stone-900 flex items-center justify-center text-white font-mono font-bold text-lg shadow-lg flex-shrink-0">
              {isSoloEpisode ? <Mic2 className="w-5 h-5" /> : guestInitials}
            </div>
            <div className="flex-1">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-sans font-bold text-base text-foreground tracking-tight">
                    {isSoloEpisode ? 'Solo Episode' : guestName}
                  </h3>
                  {!isSoloEpisode && !guestBio && (
                    <p className="font-sans text-sm text-muted-foreground">Guest</p>
                  )}
                </div>
                {isSoloEpisode && (
                  <span className="font-mono text-[10px] font-bold text-amber-600 bg-amber-50 border border-amber-200/60 px-2 py-1 rounded-full">
                    Solo
                  </span>
                )}
              </div>
              {isSoloEpisode ? (
                <p className="font-serif text-[13px] text-muted-foreground leading-relaxed mt-3">
                  This is a solo episode — no guest was featured. Guest-specific
                  content (bio, promo kit, social mentions) is disabled below.
                </p>
              ) : guestBio ? (
                <p className="font-serif text-[13px] text-muted-foreground leading-relaxed mt-3">
                  {guestBio}
                </p>
              ) : (
                <p className="font-serif text-[12.5px] text-muted-foreground/80 leading-relaxed mt-3 italic">
                  No bio yet — generate one with the &ldquo;Guest Bio&rdquo; button below.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Pre-interview research panel — only relevant when there's a guest */}
      {!isSoloEpisode && episode?.guest_name && (
        <PreInterviewPanel episodeId={episodeId} guestName={episode.guest_name} />
      )}

      {GUEST_PACKAGE_ITEMS.map((item) => {
        const Icon = item.icon;
        const isGenerated = generatedTypes.has(item.assetType);
        const isGenerating = generatingTypes.has(item.assetType);
        return (
          <div
            key={item.assetType}
            className="flex items-center gap-4 bg-card border border-border rounded-lg p-4 shadow-[0_1px_4px_rgba(0,0,0,0.03)]"
          >
            <div className="w-9 h-9 rounded-lg bg-muted border border-border flex items-center justify-center flex-shrink-0">
              <Icon className="w-4 h-4 text-muted-foreground" />
            </div>
            <div className="flex-1">
              <span className="font-sans text-sm font-medium text-foreground block">
                {item.label}
              </span>
              <span className="font-sans text-[11px] text-muted-foreground">
                {item.description}
              </span>
            </div>
            {isGenerated ? (
              <span className="flex items-center gap-1 font-mono text-[9px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200/60 px-2 py-1 rounded-full uppercase tracking-wider">
                <CheckCircle2 className="w-2.5 h-2.5" />
                Ready
              </span>
            ) : (
              <button
                type="button"
                onClick={() => handleGenerate(item.assetType)}
                disabled={isGenerating || isSoloEpisode}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-stone-900 text-white text-[10px] font-sans font-semibold hover:bg-stone-800 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Generating…
                  </>
                ) : (
                  <>
                    <Wand2 className="w-3 h-3" />
                    Generate
                  </>
                )}
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
};

// ─── Intelligence Tab ─────────────────────────────────────────────────────────

interface IntelligenceTabProps {
  episode: Episode | null;
}

const TOPIC_CLUSTER_COLORS = [
  'bg-sky-400',
  'bg-violet-400',
  'bg-emerald-400',
  'bg-amber-400',
  'bg-rose-400',
  'bg-muted-foreground/70',
];

const IntelligenceTab = ({ episode }: IntelligenceTabProps) => {
  // Real metrics derived from `seo_analysis.keyword_density`. Anything the
  // pipeline doesn't currently produce (entity count, sentiment score,
  // sentiment arc, engagement scores) is rendered as an empty state instead
  // of being faked.
  const keywordEntries = useMemo(() => {
    return Object.entries(episode?.seo_analysis?.keyword_density ?? {});
  }, [episode?.seo_analysis?.keyword_density]);

  const topicCount = keywordEntries.length;
  const hasAnalysis = !!episode?.seo_analysis;

  const topicClusters = useMemo(() => {
    if (keywordEntries.length === 0) return [];
    const sorted = [...keywordEntries].sort(([, a], [, b]) => b - a).slice(0, 6);
    const max = sorted[0][1] || 1;
    return sorted.map(([topic, density], i) => ({
      topic,
      weight: Math.max(1, Math.round((density / max) * 100)),
      color: TOPIC_CLUSTER_COLORS[i % TOPIC_CLUSTER_COLORS.length],
    }));
  }, [keywordEntries]);

  const stats = [
    {
      label: 'Topics Detected',
      value: hasAnalysis ? String(topicCount) : '—',
      subtext: hasAnalysis ? `${topicCount} keyword themes` : 'Awaiting analysis',
      icon: Hash,
      accent: 'text-sky-600',
      bg: 'bg-sky-50 border-sky-200/60',
    },
    {
      label: 'Entities Found',
      value: '—',
      subtext: 'Not yet computed',
      icon: Users,
      accent: 'text-violet-600',
      bg: 'bg-violet-50 border-violet-200/60',
    },
    {
      label: 'Sentiment Score',
      value: '—',
      subtext: 'Not yet computed',
      icon: TrendingUp,
      accent: 'text-emerald-600',
      bg: 'bg-emerald-50 border-emerald-200/60',
    },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className={cn(
                'bg-card border rounded-lg p-4 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.1),0_1px_0_rgba(255,255,255,1)_inset] border-border'
              )}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-sans text-[11px] text-muted-foreground font-medium">
                  {stat.label}
                </span>
                <div className={cn('w-6 h-6 rounded-md border flex items-center justify-center', stat.bg)}>
                  <Icon className={cn('w-3 h-3', stat.accent)} />
                </div>
              </div>
              <span className="font-mono text-2xl font-bold text-foreground">{stat.value}</span>
              <div className="font-sans text-[10px] text-muted-foreground mt-0.5">
                {stat.subtext}
              </div>
            </div>
          );
        })}
      </div>

      {/* Topic Clusters — derived from real keyword density when present */}
      <div className="bg-card border border-border rounded-lg p-5 shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
        <div className="flex items-center justify-between mb-4">
          <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Topic Clusters
          </span>
          <span className="font-mono text-[10px] text-muted-foreground">by keyword density</span>
        </div>
        {topicClusters.length > 0 ? (
          <div className="space-y-2.5">
            {topicClusters.map((t) => (
              <div key={t.topic} className="flex items-center gap-3">
                <span className="font-sans text-[12px] text-foreground/80 w-36 flex-shrink-0 truncate">
                  {t.topic}
                </span>
                <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${t.weight}%` }}
                    transition={{ duration: 0.7, ease: 'easeOut' as const, delay: 0.3 }}
                    className={cn('h-full rounded-full', t.color)}
                  />
                </div>
                <span className="font-mono text-[10px] text-muted-foreground w-6 text-right">
                  {t.weight}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 gap-2 text-center">
            <Brain className="w-7 h-7 text-muted-foreground/40" />
            <p className="font-sans text-[12.5px] text-muted-foreground">
              Topic analysis will appear after the episode is processed.
            </p>
          </div>
        )}
      </div>

      {/* Sentiment Arc + Predicted Engagement — both unified empty state.
          The processing pipeline does not currently produce these metrics,
          so we show a single explanatory panel instead of fabricating bars. */}
      <div className="bg-muted/40 border border-border rounded-lg p-6 text-center">
        <Brain className="w-8 h-8 text-muted-foreground/50 mx-auto mb-3" />
        <p className="font-sans text-sm font-medium text-foreground mb-1">
          Sentiment & engagement analysis
        </p>
        <p className="font-sans text-xs text-muted-foreground max-w-sm mx-auto">
          Sentiment arc, hook strength, retention, and share potential are not yet
          generated by the processing pipeline. They&apos;ll appear here once the
          analysis service is enabled for your tier.
        </p>
      </div>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

// ─── Status → Signal Chain mapping ──────────────────────────────────────────

/**
 * Maps episode status + detailed processing step to signal chain steps.
 * Processing steps from Trigger.dev job: uploading → transcribing →
 * vocabulary_processing → generating_show_notes → seo_analysis → generating_assets → completed
 */
const statusToSignalSteps = (
  status: Episode['status'] | undefined,
  processingStep?: string | null
): SignalStep[] => {
  switch (status) {
    case 'completed':
      return [
        { id: 'upload', label: 'Upload', status: 'done' },
        { id: 'transcribe', label: 'Transcribe', status: 'done' },
        { id: 'generate', label: 'Generate', status: 'done' },
        { id: 'ready', label: 'Ready', status: 'done' },
      ];
    case 'processing': {
      // Map detailed processing steps to the 4 visual steps
      const step = processingStep || 'transcribing';

      // Steps that map to "Transcribe" phase
      const transcribeSteps = ['uploading', 'transcribing', 'vocabulary_processing'];
      // Steps that map to "Generate" phase
      const generateSteps = ['generating_show_notes', 'seo_analysis', 'generating_assets'];

      if (transcribeSteps.includes(step)) {
        return [
          { id: 'upload', label: 'Upload', status: 'done' },
          { id: 'transcribe', label: 'Transcribe', status: 'active' },
          { id: 'generate', label: 'Generate', status: 'pending' },
          { id: 'ready', label: 'Ready', status: 'pending' },
        ];
      } else if (generateSteps.includes(step)) {
        return [
          { id: 'upload', label: 'Upload', status: 'done' },
          { id: 'transcribe', label: 'Transcribe', status: 'done' },
          { id: 'generate', label: 'Generate', status: 'active' },
          { id: 'ready', label: 'Ready', status: 'pending' },
        ];
      } else {
        // Default processing state
        return [
          { id: 'upload', label: 'Upload', status: 'done' },
          { id: 'transcribe', label: 'Transcribe', status: 'active' },
          { id: 'generate', label: 'Generate', status: 'pending' },
          { id: 'ready', label: 'Ready', status: 'pending' },
        ];
      }
    }
    case 'failed':
      return [
        { id: 'upload', label: 'Upload', status: 'done' },
        { id: 'transcribe', label: 'Transcribe', status: 'done' },
        { id: 'generate', label: 'Generate', status: 'pending' },
        { id: 'ready', label: 'Ready', status: 'pending' },
      ];
    case 'pending':
      return [
        { id: 'upload', label: 'Upload', status: 'active' },
        { id: 'transcribe', label: 'Transcribe', status: 'pending' },
        { id: 'generate', label: 'Generate', status: 'pending' },
        { id: 'ready', label: 'Ready', status: 'pending' },
      ];
    default:
      return SIGNAL_STEPS;
  }
};

// ─── Status badge config ────────────────────────────────────────────────────

const STATUS_CONFIG: Record<Episode['status'], { dot: string; text: string; bg: string; border: string; label: string }> = {
  completed: { dot: 'bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.5)]', text: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200/60', label: 'Completed' },
  processing: { dot: 'bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.5)] animate-pulse', text: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200/60', label: 'Processing' },
  pending: { dot: 'bg-stone-400', text: 'text-stone-600', bg: 'bg-stone-50', border: 'border-stone-200/60', label: 'Pending' },
  failed: { dot: 'bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.5)]', text: 'text-red-700', bg: 'bg-red-50', border: 'border-red-200/60', label: 'Failed' },
  scheduled: { dot: 'bg-sky-500 shadow-[0_0_6px_rgba(14,165,233,0.5)]', text: 'text-sky-700', bg: 'bg-sky-50', border: 'border-sky-200/60', label: 'Scheduled' },
};

// ─── Duration formatting ────────────────────────────────────────────────────

const formatDuration = (seconds: number | null | undefined): string => {
  if (!seconds) return '--:--';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
};

/**
 * Estimate remaining processing time based on audio duration and current step.
 * Transcription: ~0.5x audio duration; AI generation: ~60 seconds.
 */
const estimateEta = (
  audioDuration: number | null | undefined,
  processingStep: string | null | undefined
): string => {
  if (!audioDuration) return 'Estimating...';

  const generateSteps = ['generating_show_notes', 'seo_analysis', 'generating_assets'];
  const step = processingStep || 'transcribing';

  let remainingSeconds: number;

  if (generateSteps.includes(step)) {
    // Already past transcription — only generation phase remains
    remainingSeconds = 60;
  } else {
    // Still in transcription phase
    remainingSeconds = Math.round(audioDuration * 0.5) + 60;
  }

  const mins = Math.ceil(remainingSeconds / 60);
  return `~${mins} min remaining`;
};

export const EpisodeDetail = () => {
  const router = useRouter();
  const params = useParams();
  const episodeId = params?.id as string;

  // ── Data hooks ──
  const { episode, isLoading: episodeLoading, error: episodeError, processingStep, refetch } = useEpisode(episodeId);
  const { assets: apiAssets, isLoading: assetsLoading, generateAsset } = useEpisodeAssets(episodeId);
  const { seoData, isLoading: _seoLoading } = useEpisodeSeo(episodeId);
  void assetsLoading; void _seoLoading; // used indirectly via seoData

  const [activeTab, setActiveTab] = useState<Tab>('show-notes');

  // ── Inline title editing ──
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const titleInputRef = useRef<HTMLInputElement>(null);

  const startEditingTitle = useCallback(() => {
    setEditTitle(episode?.title || '');
    setIsEditingTitle(true);
    // Focus the input after React renders it
    setTimeout(() => titleInputRef.current?.focus(), 0);
  }, [episode?.title]);

  const cancelEditingTitle = useCallback(() => {
    setIsEditingTitle(false);
    setEditTitle('');
  }, []);

  const saveTitle = useCallback(async () => {
    const trimmed = editTitle.trim();
    if (!trimmed || trimmed === episode?.title) {
      cancelEditingTitle();
      return;
    }
    try {
      const res = await fetch(`/api/episodes/${episodeId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: trimmed }),
      });
      if (!res.ok) throw new Error('Failed to update title');
      await refetch();
    } catch (err) {
      console.error('Failed to save episode title:', err);
    } finally {
      setIsEditingTitle(false);
      setEditTitle('');
    }
  }, [editTitle, episode?.title, episodeId, refetch, cancelEditingTitle]);

  // ── Derived data ──
  const signalSteps = useMemo(() => statusToSignalSteps(episode?.status, processingStep), [episode?.status, processingStep]);
  const statusCfg = episode?.status ? STATUS_CONFIG[episode.status] : STATUS_CONFIG.completed;
  const seoScore = seoData?.seo_score ?? episode?.seo_score ?? null;
  const seoAnalysis = seoData?.seo_analysis ?? episode?.seo_analysis ?? null;

  // ── Loading state ──
  if (episodeLoading) {
    return <div className="flex-1 h-full flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="w-6 h-6 text-muted-foreground animate-spin" />
        <span className="font-sans text-sm text-muted-foreground">Loading episode&hellip;</span>
      </div>
    </div>;
  }

  // ── Error state ──
  if (episodeError) {
    return <div className="flex-1 h-full flex items-center justify-center">
      <div className="flex flex-col items-center gap-3 max-w-sm text-center">
        <AlertCircle className="w-6 h-6 text-red-500" />
        <span className="font-sans text-sm text-red-600">Failed to load episode</span>
        <p className="font-sans text-xs text-muted-foreground">{episodeError}</p>
        <button onClick={() => router.push('/episodes')} className="mt-2 font-sans text-xs text-muted-foreground hover:text-foreground underline">
          Back to episodes
        </button>
      </div>
    </div>;
  }

  return <div className="flex-1 h-full overflow-y-auto relative">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-5 sm:py-7">
        {/* ── Header ── */}
        <div className="mb-5 sm:mb-6">
          {/* Back link */}
          <button onClick={() => router.push('/episodes')} aria-label="Back to all episodes" className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground/80 transition-colors mb-3 sm:mb-4 group">
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
            <span className="font-sans text-[12px] font-medium">All Episodes</span>
          </button>

          {/* Breadcrumb navigation */}
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 mb-4 sm:mb-5">
            <Link href="/episodes" className="font-mono text-[11px] text-muted-foreground hover:text-foreground transition-colors">
              Episodes
            </Link>
            <ChevronRight className="w-3 h-3 text-muted-foreground/50 flex-shrink-0" />
            <span className="font-mono text-[11px] text-muted-foreground/70 truncate max-w-[240px] sm:max-w-[400px]">
              {episode?.title || 'Untitled Episode'}
            </span>
          </nav>

          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 sm:gap-6">
            {/* Left: title + meta */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-2.5 flex-wrap">
                {/* TODO: Replace with real episode number when API returns this field */}
                <span className="font-mono text-[11px] font-bold text-muted-foreground uppercase tracking-widest">EP</span>
                <div className={cn('flex items-center gap-1.5 px-2.5 py-1 rounded-md', statusCfg.bg, statusCfg.border, 'border')}>
                  <div className={cn('w-1.5 h-1.5 rounded-full', statusCfg.dot)} />
                  <span className={cn('font-sans text-[10px] font-bold uppercase tracking-wider', statusCfg.text)}>{statusCfg.label}</span>
                </div>
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  <span className="font-mono text-[10px]">{formatDuration(episode?.audio_duration_seconds)}</span>
                </div>
              </div>
              {/* Inline-editable title */}
              {isEditingTitle ? (
                <input
                  ref={titleInputRef}
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      saveTitle();
                    } else if (e.key === 'Escape') {
                      cancelEditingTitle();
                    }
                  }}
                  onBlur={saveTitle}
                  className="font-sans font-bold text-xl sm:text-[22px] text-foreground tracking-tight leading-tight mb-1.5 w-full bg-transparent border-b-2 border-blue-500 outline-none py-0.5 -my-0.5"
                  aria-label="Edit episode title"
                />
              ) : (
                <div className="group/title flex items-center gap-2 mb-1.5">
                  <h1 className="font-sans font-bold text-xl sm:text-[22px] text-foreground tracking-tight leading-tight">
                    {episode?.title || 'Untitled Episode'}
                  </h1>
                  <button
                    onClick={startEditingTitle}
                    aria-label="Edit episode title"
                    className="opacity-0 group-hover/title:opacity-100 transition-opacity p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/60"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
              <p className="font-serif text-sm text-muted-foreground leading-relaxed">
                {episode?.description || 'No description available.'}
              </p>
            </div>

            {/* Right: Signal chain */}
            <div className="bg-card border border-border rounded-xl px-4 sm:px-5 py-3 sm:py-4 shadow-[0_2px_4px_rgba(0,0,0,0.05)] flex flex-col items-center gap-2 sm:flex-shrink-0 overflow-x-auto">
              <span className="font-mono text-[9px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Signal Chain</span>
              <SignalChain steps={signalSteps} />
              {episode?.status === 'processing' && (
                <div className="flex items-center gap-1.5 mt-1">
                  <Clock className="w-3 h-3 text-muted-foreground" />
                  <span className="font-mono text-[10px] text-muted-foreground">
                    {estimateEta(episode?.audio_duration_seconds, processingStep)}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Tab Bar ── */}
        <div className="relative mb-5" data-testid="episode-detail-tabs">
          <div className="flex items-stretch bg-muted/40 rounded-xl p-1 border border-border gap-1 overflow-x-auto scrollbar-none">
            {TAB_CONFIG.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return <button data-testid={`episode-tab-${tab.id}`} key={tab.id} onClick={() => setActiveTab(tab.id)} className={cn('relative flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-[12px] font-sans font-medium transition-all duration-150 flex-1 justify-center whitespace-nowrap flex-shrink-0 sm:flex-shrink', isActive ? 'bg-card text-foreground shadow-[0_2px_8px_-2px_rgba(0,0,0,0.1),0_1px_0_rgba(255,255,255,1)_inset] border border-border' : 'text-muted-foreground hover:text-foreground/80 hover:bg-muted/50')}>
                  <Icon className={cn('w-3.5 h-3.5 flex-shrink-0', isActive ? 'text-foreground' : 'text-muted-foreground')} />
                  <span className="hidden sm:block">{tab.label}</span>
                  {isActive && <motion.div layoutId="tabUnderline" className="absolute bottom-[5px] left-1/2 -translate-x-1/2 w-4 h-[2px] bg-foreground rounded-full" />}
                </button>;
          })}
          </div>
        </div>

        {/* ── Tab Content ── */}
        <AnimatePresence mode="wait">
          <motion.div key={activeTab} initial={{
          opacity: 0,
          y: 8
        }} animate={{
          opacity: 1,
          y: 0
        }} exit={{
          opacity: 0,
          y: -5
        }} transition={{
          duration: 0.2,
          ease: 'easeOut' as const
        }}>
            {activeTab === 'show-notes' && <ShowNotesTab episode={episode} episodeId={episodeId} seoScore={seoScore} seoAnalysis={seoAnalysis} onSaved={refetch} />}
            {activeTab === 'assets' && (
              <AssetsTab episodeId={episodeId} apiAssets={apiAssets} generateAsset={generateAsset} />
            )}
            {activeTab === 'transcript' && <TranscriptTab episode={episode} />}
            {activeTab === 'guest' && (
              <GuestPackageTab
                episode={episode}
                episodeId={episodeId}
                generateAsset={generateAsset}
                apiAssets={apiAssets}
              />
            )}
            {activeTab === 'intelligence' && (
              <>
                <IntelligenceTab episode={episode} />
                <div className="mt-6"><RelatedEpisodes episodeId={episodeId} /></div>
                <div className="mt-6"><LearningInsights episodeId={episodeId} /></div>
              </>
            )}
            {activeTab === 'rss-tags' && <RSSTagsPanel episodeId={episodeId} />}
          </motion.div>
        </AnimatePresence>

        <div className="h-12" />
      </div>
    </div>;
};
