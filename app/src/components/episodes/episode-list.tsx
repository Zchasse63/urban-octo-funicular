"use client"

import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence, Reorder } from 'motion/react';
import { Plus, Search, FileAudio, Clock, UploadCloud, BarChart2, Loader2, CheckCircle2, FileEdit, AlertCircle, ChevronRight, MoreHorizontal, Pencil, Copy, Trash2, ExternalLink, Download, X, CheckSquare, Square, Zap, SlidersHorizontal, ArrowUpDown, ChevronUp, ChevronDown, GripVertical, Tag, Bookmark, BookmarkCheck, RotateCcw, Save, CalendarDays, Hash, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import useEpisodes from '@/hooks/use-episodes';
import useShows from '@/hooks/use-shows';

// ─── Types ────────────────────────────────────────────────────────────────────

type EpisodeStatus = 'completed' | 'processing' | 'draft' | 'failed';
type FilterType = 'all' | EpisodeStatus;
type SortField = 'date' | 'title' | 'seoScore' | 'duration' | 'manual';
type SortDir = 'asc' | 'desc';
type IntegrationPlatform = 'youtube' | 'spotify' | 'apple';
interface Integration {
  platform: IntegrationPlatform;
  status: 'synced' | 'pending' | 'error' | 'none';
}
interface Episode {
  id: string;
  number: number;
  title: string;
  description: string;
  status: EpisodeStatus;
  date: string;
  duration: string;
  seoScore?: number;
  tags?: string[];
  integrations?: Integration[];
}
interface SavedView {
  id: string;
  name: string;
  filter: FilterType;
  sortField: SortField;
  sortDir: SortDir;
}

// ─── Format Duration ─────────────────────────────────────────────────────────

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}` : `${m}:${String(s).padStart(2, '0')}`;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const durationToSecs = (d: string) => {
  const parts = d.split(':').map(Number);
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  return parts[0] * 60 + (parts[1] || 0);
};
const secsToHuman = (total: number) => {
  if (total <= 0) return '0m';
  const h = Math.floor(total / 3600);
  const m = Math.floor(total % 3600 / 60);
  const s = total % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0 && s > 0) return `${m}m ${s}s`;
  return `${m}m`;
};
const getWeekLabel = (dateStr: string) => {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays < 7) return 'This Week';
  if (diffDays < 14) return 'Last Week';
  const month = date.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric'
  });
  return month;
};

// ─── Status Config ─────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<EpisodeStatus, {
  label: string;
  dot: string;
  badge: string;
  icon: React.ElementType;
}> = {
  completed: {
    label: 'Completed',
    dot: 'bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.5)]',
    badge: 'bg-emerald-50 border-emerald-200/60 text-emerald-700',
    icon: CheckCircle2
  },
  processing: {
    label: 'Processing',
    dot: 'bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.5)] animate-pulse',
    badge: 'bg-amber-50 border-amber-200/60 text-amber-700',
    icon: Loader2
  },
  draft: {
    label: 'Draft',
    dot: 'bg-stone-300',
    badge: 'bg-muted border-border text-muted-foreground',
    icon: FileEdit
  },
  failed: {
    label: 'Failed',
    dot: 'bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.5)]',
    badge: 'bg-red-50 border-red-200/60 text-red-700',
    icon: XCircle
  }
};

// ─── Integration Icons ────────────────────────────────────────────────────────

const INTEGRATION_CONFIG: Record<IntegrationPlatform, {
  label: string;
  icon: React.ReactNode;
  colors: Record<string, string>;
}> = {
  youtube: {
    label: 'YouTube',
    icon: <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" /></svg>,
    colors: {
      synced: 'text-red-500 bg-red-50 border-red-200/50',
      pending: 'text-amber-500 bg-amber-50 border-amber-200/50',
      error: 'text-red-600 bg-red-100 border-red-300/50',
      none: 'text-muted-foreground bg-muted/50 border-border/40'
    }
  },
  spotify: {
    label: 'Spotify',
    icon: <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" /></svg>,
    colors: {
      synced: 'text-emerald-600 bg-emerald-50 border-emerald-200/50',
      pending: 'text-amber-500 bg-amber-50 border-amber-200/50',
      error: 'text-red-600 bg-red-100 border-red-300/50',
      none: 'text-muted-foreground bg-muted/50 border-border/40'
    }
  },
  apple: {
    label: 'Apple Podcasts',
    icon: <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="currentColor"><path d="M5.34 0A5.328 5.328 0 0 0 0 5.34v13.32A5.328 5.328 0 0 0 5.34 24h13.32A5.328 5.328 0 0 0 24 18.66V5.34A5.328 5.328 0 0 0 18.66 0zm6.007 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" /></svg>,
    colors: {
      synced: 'text-violet-600 bg-violet-50 border-violet-200/50',
      pending: 'text-amber-500 bg-amber-50 border-amber-200/50',
      error: 'text-red-600 bg-red-100 border-red-300/50',
      none: 'text-muted-foreground bg-muted/50 border-border/40'
    }
  }
};

// ─── Integration Badges ───────────────────────────────────────────────────────

const IntegrationBadges = ({
  integrations,
  compact = false
}: {
  integrations?: Integration[];
  compact?: boolean;
}) => {
  if (!integrations) return null;
  return <div className="flex items-center gap-1">
      {integrations.map(intg => {
      const cfg = INTEGRATION_CONFIG[intg.platform];
      const colorClass = cfg.colors[intg.status];
      return <div key={intg.platform} title={`${cfg.label}: ${intg.status}`} className={cn('flex items-center justify-center rounded border transition-all', compact ? 'w-4 h-4' : 'w-5 h-5', colorClass)}>
            {cfg.icon}
          </div>;
    })}
    </div>;
};

// ─── SEO Score Badge ───────────────────────────────────────────────────────────

const SEOBadge = ({
  score
}: {
  score: number;
}) => {
  const color = score >= 90 ? 'text-emerald-700 bg-emerald-50 border-emerald-200/70' : score >= 75 ? 'text-sky-700 bg-sky-50 border-sky-200/70' : 'text-amber-700 bg-amber-50 border-amber-200/70';
  return <div className={cn('flex items-center gap-1.5 px-2 py-1 rounded-md border text-[10px] font-mono font-bold', color)}>
      <BarChart2 className="w-3 h-3" />
      SEO {score}
    </div>;
};

// ─── Tag Chip ──────────────────────────────────────────────────────────────────

const TagChip = ({
  tag,
  query,
  onRemove,
  small
}: {
  tag: string;
  query?: string;
  onRemove?: () => void;
  small?: boolean;
}) => {
  const highlighted = query && tag.toLowerCase().includes(query.toLowerCase());
  return <span className={cn('inline-flex items-center gap-1 rounded-full border font-sans font-medium', small ? 'px-1.5 py-0.5 text-[9px]' : 'px-2 py-0.5 text-[10px]', highlighted ? 'bg-amber-100 border-amber-300 text-amber-800' : 'bg-muted border-border text-muted-foreground')}>
      <Hash className="w-2 h-2 opacity-60" />
      {tag}
      {onRemove && <button onClick={onRemove} className="hover:text-red-500 transition-colors ml-0.5">
          <X className="w-2.5 h-2.5" />
        </button>}
    </span>;
};

// ─── Highlight Text ───────────────────────────────────────────────────────────

const HighlightText = ({
  text,
  query
}: {
  text: string;
  query: string;
}) => {
  if (!query.trim()) return <>{text}</>;
  const lower = text.toLowerCase();
  const lowerQuery = query.toLowerCase().trim();
  const idx = lower.indexOf(lowerQuery);
  if (idx === -1) return <>{text}</>;
  return <>
      {text.slice(0, idx)}
      <mark className="bg-amber-200 text-amber-900 rounded-sm px-0.5 not-italic">{text.slice(idx, idx + lowerQuery.length)}</mark>
      {text.slice(idx + lowerQuery.length)}
    </>;
};

// ─── Skeleton Card ────────────────────────────────────────────────────────────

const SkeletonCard = ({
  index
}: {
  index: number;
}) => <motion.div initial={{
  opacity: 0,
  y: 10
}} animate={{
  opacity: 1,
  y: 0
}} transition={{
  duration: 0.2,
  delay: index * 0.06
}} className="flex items-start gap-4 px-5 py-4 bg-card border border-border rounded-xl shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
    <div className="w-4 h-4 rounded bg-muted animate-pulse mt-0.5" />
    <div className="w-8 h-3 rounded bg-muted animate-pulse mt-1" />
    <div className="flex-1 space-y-2.5">
      <div className="flex gap-2">
        <div className="w-20 h-4 rounded-md bg-muted animate-pulse" />
        <div className="w-12 h-4 rounded-md bg-muted animate-pulse" />
      </div>
      <div className="w-3/4 h-4 rounded bg-muted animate-pulse" />
      <div className="w-2/3 h-3 rounded bg-muted animate-pulse" />
      <div className="w-2/3 h-3 rounded bg-muted animate-pulse" />
    </div>
    <div className="w-16 h-5 rounded-md bg-muted animate-pulse mt-0.5" />
  </motion.div>;

// ─── Quick Actions Menu ───────────────────────────────────────────────────────

const QUICK_ACTIONS: { icon: React.ElementType; label: string; shortcut: string | null; destructive?: boolean }[] = [{
  icon: ExternalLink,
  label: 'Open episode',
  shortcut: '↵'
}, {
  icon: Pencil,
  label: 'Edit details',
  shortcut: 'E'
}, {
  icon: Copy,
  label: 'Duplicate',
  shortcut: 'D'
}, {
  icon: Download,
  label: 'Export assets',
  shortcut: null
}, {
  icon: Trash2,
  label: 'Delete',
  shortcut: '⌫',
  destructive: true
}];
const QuickActionsMenu = ({
  episodeId,
  onClose,
  onDelete
}: {
  episodeId: string;
  onClose: () => void;
  onDelete?: (id: string) => void;
}) => {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [onClose]);
  return <motion.div ref={ref} initial={{
    opacity: 0,
    scale: 0.95,
    y: -4
  }} animate={{
    opacity: 1,
    scale: 1,
    y: 0
  }} exit={{
    opacity: 0,
    scale: 0.95,
    y: -4
  }} transition={{
    duration: 0.13,
    ease: 'easeOut'
  }} className="absolute right-0 top-8 z-30 w-44 bg-card border border-border rounded-xl shadow-xl overflow-hidden" onClick={e => e.stopPropagation()}>
      <div className="p-1">
        {QUICK_ACTIONS.map((action, i) => <React.Fragment key={i}>
            {i === QUICK_ACTIONS.length - 1 && <div className="my-1 border-t border-border/50" />}
            <button className={cn('w-full flex items-center justify-between gap-2.5 px-3 py-2 rounded-lg text-left transition-colors text-[12.5px] font-sans', action.destructive ? 'text-red-500 hover:bg-red-50 hover:text-red-600' : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground')} onClick={() => { if (action.destructive && onDelete) { onDelete(episodeId); } onClose(); }}>
              <div className="flex items-center gap-2.5">
                <action.icon className="w-3.5 h-3.5 flex-shrink-0" />
                {action.label}
              </div>
              {action.shortcut && <kbd className="font-mono text-[9px] text-muted-foreground bg-muted border border-border rounded px-1 py-0.5">
                  {action.shortcut}
                </kbd>}
            </button>
          </React.Fragment>)}
      </div>
    </motion.div>;
};

// ─── Processing Progress Banner ────────────────────────────────────────────────

const ProcessingBanner = ({
  count
}: {
  count: number;
}) => <motion.div initial={{
  opacity: 0,
  y: -6
}} animate={{
  opacity: 1,
  y: 0
}} exit={{
  opacity: 0,
  y: -6
}} transition={{
  duration: 0.25
}} className="flex items-center gap-3 px-4 py-3 bg-amber-50 border border-amber-200/60 rounded-xl mb-5 shadow-sm">
    <div className="flex items-center gap-2 flex-1 min-w-0">
      <Loader2 className="w-3.5 h-3.5 text-amber-500 animate-spin flex-shrink-0" />
      <span className="text-[12.5px] font-sans font-semibold text-amber-700">
        {count} episode{count > 1 ? 's' : ''} processing
      </span>
      <span className="text-[11.5px] font-serif text-amber-500 truncate">
        — transcription & AI assets being generated
      </span>
    </div>
    <div className="flex items-center gap-2 flex-shrink-0">
      <div className="flex gap-0.5">
        {Array.from({
        length: 5
      }).map((_, i) => <motion.div key={i} className="w-1 h-3 bg-amber-400 rounded-full" animate={{
        scaleY: [0.4, 1, 0.4]
      }} transition={{
        duration: 0.8,
        delay: i * 0.12,
        repeat: Infinity,
        ease: 'easeInOut'
      }} />)}
      </div>
    </div>
  </motion.div>;

// ─── Undo Toast ───────────────────────────────────────────────────────────────

const UndoToast = ({
  count,
  onUndo,
  onDismiss
}: {
  count: number;
  onUndo: () => void;
  onDismiss: () => void;
}) => <motion.div initial={{
  opacity: 0,
  y: 20,
  scale: 0.96
}} animate={{
  opacity: 1,
  y: 0,
  scale: 1
}} exit={{
  opacity: 0,
  y: 20,
  scale: 0.96
}} transition={{
  duration: 0.22,
  ease: 'easeOut'
}} className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-4 py-3 bg-stone-900 text-stone-100 rounded-xl shadow-2xl border border-stone-700">
    <Trash2 className="w-3.5 h-3.5 text-muted-foreground/80" />
    <span className="text-[12.5px] font-sans font-medium">
      {count} episode{count > 1 ? 's' : ''} deleted
    </span>
    <div className="w-px h-4 bg-stone-700" />
    <button onClick={onUndo} className="flex items-center gap-1.5 text-[12px] font-sans font-bold text-amber-400 hover:text-amber-300 transition-colors">
      <RotateCcw className="w-3 h-3" />
      Undo
    </button>
    <button onClick={onDismiss} className="p-0.5 rounded text-muted-foreground hover:text-muted-foreground/60 transition-colors">
      <X className="w-3.5 h-3.5" />
    </button>
  </motion.div>;

// ─── Bulk Action Bar ───────────────────────────────────────────────────────────

const BulkActionBar = ({
  selectedCount,
  totalCount,
  totalDuration,
  onSelectAll,
  onClearAll,
  onBulkDelete,
  onBulkExport
}: {
  selectedCount: number;
  totalCount: number;
  totalDuration: string;
  onSelectAll: () => void;
  onClearAll: () => void;
  onBulkDelete: () => void;
  onBulkExport: () => void;
}) => <motion.div initial={{
  opacity: 0,
  y: 8
}} animate={{
  opacity: 1,
  y: 0
}} exit={{
  opacity: 0,
  y: 8
}} transition={{
  duration: 0.2
}} className="flex items-center gap-3 px-4 py-2.5 bg-stone-900 text-stone-100 rounded-xl mb-4 shadow-lg">
    <button onClick={selectedCount === totalCount ? onClearAll : onSelectAll} className="flex items-center gap-2 text-[12px] font-medium hover:text-white transition-colors">
      {selectedCount === totalCount ? <CheckSquare className="w-3.5 h-3.5 text-muted-foreground/80" /> : <Square className="w-3.5 h-3.5 text-muted-foreground/80" />}
      <span className="font-mono text-[11px] font-bold text-muted-foreground/60">{selectedCount} selected</span>
    </button>

    <div className="w-px h-4 bg-stone-700 mx-1" />

    {/* Total duration */}
    <div className="flex items-center gap-1.5 text-[11px] font-mono text-muted-foreground/80">
      <Clock className="w-3 h-3" />
      {totalDuration}
    </div>

    <div className="w-px h-4 bg-stone-700 mx-1" />

    <div className="flex items-center gap-1 flex-1">
      <button onClick={onBulkExport} className="flex items-center gap-1.5 px-3 py-1.5 text-[11.5px] font-sans font-semibold rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 transition-colors">
        <Download className="w-3.5 h-3.5" />
        Export
      </button>
      <button onClick={onBulkExport} className="flex items-center gap-1.5 px-3 py-1.5 text-[11.5px] font-sans font-semibold rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 transition-colors">
        <Zap className="w-3.5 h-3.5" />
        Reprocess
      </button>
      <button onClick={onBulkDelete} className="flex items-center gap-1.5 px-3 py-1.5 text-[11.5px] font-sans font-semibold rounded-lg bg-red-900/50 hover:bg-red-900/80 text-red-300 transition-colors ml-auto">
        <Trash2 className="w-3.5 h-3.5" />
        Delete
      </button>
    </div>

    <button onClick={onClearAll} className="p-1.5 rounded-lg hover:bg-stone-700 text-muted-foreground/80 hover:text-stone-200 transition-colors">
      <X className="w-3.5 h-3.5" />
    </button>
  </motion.div>;

// ─── Batch Edit Panel ─────────────────────────────────────────────────────────

const BatchEditPanel = ({
  selectedCount,
  onApply,
  onClose
}: {
  selectedCount: number;
  onApply: (tags: string[], status?: EpisodeStatus) => void;
  onClose: () => void;
}) => {
  const [newTag, setNewTag] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [status, setStatus] = useState<EpisodeStatus | ''>('');
  const addTag = () => {
    const trimmed = newTag.trim().toLowerCase().replace(/\s+/g, '-');
    if (trimmed && !tags.includes(trimmed)) {
      setTags(prev => [...prev, trimmed]);
    }
    setNewTag('');
  };
  return <motion.div initial={{
    opacity: 0,
    y: -8,
    scale: 0.98
  }} animate={{
    opacity: 1,
    y: 0,
    scale: 1
  }} exit={{
    opacity: 0,
    y: -8,
    scale: 0.98
  }} transition={{
    duration: 0.18,
    ease: 'easeOut'
  }} className="mb-4 p-4 bg-card border border-border rounded-xl shadow-lg">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-[12.5px] font-sans font-bold text-foreground">
            Batch edit {selectedCount} episode{selectedCount > 1 ? 's' : ''}
          </span>
        </div>
        <button onClick={onClose} className="p-1 rounded text-muted-foreground hover:text-foreground/80 hover:bg-accent transition-colors">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {/* Tags */}
        <div>
          <label className="block text-[10px] font-mono font-bold uppercase tracking-widest text-muted-foreground mb-1.5">Add Tags</label>
          <div className="flex gap-1.5">
            <input type="text" value={newTag} onChange={e => setNewTag(e.target.value)} onKeyDown={e => {
            if (e.key === 'Enter') {
              e.preventDefault();
              addTag();
            }
          }} placeholder="e.g. productivity" className="flex-1 px-2.5 py-1.5 text-[12px] font-sans text-foreground bg-card border border-border rounded-lg focus:outline-none focus:border-ring transition-colors placeholder:text-muted-foreground" />
            <button onClick={addTag} className="px-2.5 py-1.5 text-[11px] font-bold bg-stone-900 text-white rounded-lg hover:bg-stone-800 transition-colors">
              Add
            </button>
          </div>
          {tags.length > 0 && <div className="flex flex-wrap gap-1 mt-2">
              {tags.map(t => <TagChip key={t} tag={t} onRemove={() => setTags(prev => prev.filter(x => x !== t))} />)}
            </div>}
        </div>

        {/* Status */}
        <div>
          <label className="block text-[10px] font-mono font-bold uppercase tracking-widest text-muted-foreground mb-1.5">Change Status</label>
          <div className="flex flex-col gap-1">
            {(['', 'completed', 'processing', 'draft', 'failed'] as const).map(s => <button key={s || 'none'} onClick={() => setStatus(s)} className={cn('flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-left text-[11.5px] font-sans font-medium transition-colors', status === s ? 'bg-stone-900 text-white' : 'text-muted-foreground hover:text-accent-foreground hover:bg-accent')}>
                {s === '' ? <><span className="w-2 h-2 rounded-full bg-stone-300 flex-shrink-0" />No change</> : <><span className={cn('w-2 h-2 rounded-full flex-shrink-0', STATUS_CONFIG[s].dot)} />{STATUS_CONFIG[s].label}</>}
              </button>)}
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-2 mt-3 pt-3 border-t border-border/50">
        <button onClick={onClose} className="px-3 py-1.5 text-[11.5px] font-sans font-semibold text-muted-foreground hover:text-accent-foreground transition-colors">
          Cancel
        </button>
        <button onClick={() => {
        onApply(tags, status || undefined);
        onClose();
      }} className="flex items-center gap-1.5 px-3 py-1.5 text-[11.5px] font-sans font-bold bg-stone-900 text-white rounded-lg hover:bg-stone-800 transition-colors shadow-sm">
          <Save className="w-3 h-3" />
          Apply to {selectedCount}
        </button>
      </div>
    </motion.div>;
};

// ─── Saved Views Panel ────────────────────────────────────────────────────────

const SavedViewsPanel = ({
  views,
  activeViewId,
  currentFilter,
  currentSortField,
  currentSortDir,
  onApply,
  onSave,
  onDelete,
  onClose
}: {
  views: SavedView[];
  activeViewId: string | null;
  currentFilter: FilterType;
  currentSortField: SortField;
  currentSortDir: SortDir;
  onApply: (view: SavedView) => void;
  onSave: (name: string) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}) => {
  const [newName, setNewName] = useState('');
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);
  return <motion.div ref={ref} initial={{
    opacity: 0,
    y: -6,
    scale: 0.97
  }} animate={{
    opacity: 1,
    y: 0,
    scale: 1
  }} exit={{
    opacity: 0,
    y: -6,
    scale: 0.97
  }} transition={{
    duration: 0.15,
    ease: 'easeOut'
  }} className="absolute right-0 top-full mt-1.5 z-30 w-64 bg-card border border-border rounded-xl shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
      <div className="px-3 pt-3 pb-2 border-b border-border/50">
        <p className="text-[10px] font-mono font-bold uppercase tracking-widest text-muted-foreground">Saved Views</p>
      </div>

      {views.length === 0 && <p className="px-4 py-4 text-[12px] font-serif text-muted-foreground text-center">No saved views yet</p>}

      <div className="p-1.5 space-y-0.5">
        {views.map(view => <div key={view.id} className={cn('flex items-center gap-2 px-2.5 py-2 rounded-lg group transition-colors', activeViewId === view.id ? 'bg-stone-900' : 'hover:bg-accent')}>
            <BookmarkCheck className={cn('w-3 h-3 flex-shrink-0', activeViewId === view.id ? 'text-muted-foreground/80' : 'text-muted-foreground')} />
            <button onClick={() => onApply(view)} className={cn('flex-1 text-left text-[12px] font-sans font-medium truncate', activeViewId === view.id ? 'text-white' : 'text-foreground/80')}>
              {view.name}
            </button>
            <button onClick={() => onDelete(view.id)} className="opacity-0 group-hover:opacity-100 p-0.5 rounded text-muted-foreground hover:text-red-500 transition-all">
              <X className="w-3 h-3" />
            </button>
          </div>)}
      </div>

      <div className="p-2 border-t border-border/50">
        <p className="px-1 mb-1.5 text-[10px] font-mono font-bold uppercase tracking-widest text-muted-foreground">
          Save current view
        </p>
        <div className="flex gap-1.5">
          <input type="text" value={newName} onChange={e => setNewName(e.target.value)} onKeyDown={e => {
          if (e.key === 'Enter' && newName.trim()) {
            onSave(newName.trim());
            setNewName('');
          }
        }} placeholder="View name…" className="flex-1 px-2.5 py-1.5 text-[11.5px] font-sans bg-card border border-border rounded-lg focus:outline-none focus:border-ring transition-colors placeholder:text-muted-foreground text-foreground" />
          <button onClick={() => {
          if (newName.trim()) {
            onSave(newName.trim());
            setNewName('');
          }
        }} className="px-2.5 py-1.5 text-[11px] font-bold bg-stone-900 text-white rounded-lg hover:bg-stone-800 transition-colors">
            <Save className="w-3 h-3" />
          </button>
        </div>
      </div>
    </motion.div>;
};

// ─── Group Header ──────────────────────────────────────────────────────────────

const GroupHeader = ({
  label,
  count
}: {
  label: string;
  count: number;
}) => <div className="flex items-center gap-3 mb-2 mt-5 first:mt-0">
    <div className="flex items-center gap-2">
      <CalendarDays className="w-3 h-3 text-muted-foreground" />
      <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-muted-foreground">{label}</span>
    </div>
    <div className="flex-1 border-t border-dashed border-border" />
    <span className="text-[10px] font-mono text-muted-foreground">{count}</span>
  </div>;

// ─── Episode Card ──────────────────────────────────────────────────────────────

const EpisodeCard = ({
  episode,
  index,
  isSelected,
  searchQuery,
  onToggleSelect,
  onClick,
  isDraggable,
  onDelete
}: {
  episode: Episode;
  index: number;
  isSelected: boolean;
  searchQuery: string;
  onToggleSelect: (id: string) => void;
  onClick: () => void;
  isDraggable: boolean;
  onDelete?: (id: string) => void;
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const cfg = STATUS_CONFIG[episode.status];
  const formattedDate = new Date(episode.date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
  return <motion.div initial={{
    opacity: 0,
    y: 14
  }} animate={{
    opacity: 1,
    y: 0
  }} transition={{
    duration: 0.28,
    ease: 'easeOut',
    delay: index * 0.04
  }} layout onClick={onClick} className={cn('group relative flex items-start gap-3 px-4 py-4 cursor-pointer', 'border rounded-xl transition-all duration-200 ease-out', 'shadow-[0_1px_4px_rgba(0,0,0,0.04)]', isSelected ? 'bg-stone-900 border-stone-700 shadow-[0_4px_16px_-4px_rgba(0,0,0,0.2)]' : 'bg-card border-border hover:shadow-[0_6px_20px_-4px_rgba(0,0,0,0.12),0_2px_8px_-4px_rgba(0,0,0,0.08)] hover:border-border')}>
      {/* Drag Handle */}
      {isDraggable && <div className={cn('flex-shrink-0 flex items-center pt-1 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity', isSelected && 'opacity-30')} onClick={e => e.stopPropagation()}>
          <GripVertical className={cn('w-3.5 h-3.5', isSelected ? 'text-muted-foreground' : 'text-muted-foreground')} />
        </div>}

      {/* Checkbox */}
      <div className="flex-shrink-0 flex items-start pt-0.5" onClick={e => {
      e.stopPropagation();
      onToggleSelect(episode.id);
    }}>
        <motion.div className={cn('w-4 h-4 rounded-[4px] border-2 flex items-center justify-center transition-all duration-150 cursor-pointer', isSelected ? 'bg-white border-white shadow-sm' : 'border-border bg-transparent opacity-0 group-hover:opacity-100')} whileTap={{
        scale: 0.9
      }}>
          {isSelected && <div className="w-2 h-2 rounded-[2px] bg-stone-900" />}
        </motion.div>
      </div>

      {/* Episode Number */}
      <div className="flex-shrink-0 w-7 pt-0.5 text-right">
        <span className={cn('font-mono text-[11px] font-bold select-none', isSelected ? 'text-muted-foreground' : 'text-muted-foreground')}>
          {String(episode.number).padStart(2, '0')}
        </span>
      </div>

      {/* Main Content */}
      <div className="flex-1 min-w-0">
        {/* Status Badge + Meta Row */}
        <div className="flex items-center gap-2 flex-wrap mb-1.5">
          <div className={cn('flex items-center gap-1.5 px-2 py-0.5 rounded-md border text-[10px] font-sans font-bold uppercase tracking-wide', isSelected ? 'bg-stone-800 border-stone-600 text-muted-foreground/60' : cfg.badge)}>
            <div className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0', isSelected ? 'bg-stone-500' : cfg.dot)} />
            {cfg.label}
          </div>
          <div className={cn('flex items-center gap-1', isSelected ? 'text-muted-foreground' : 'text-muted-foreground')}>
            <Clock className="w-3 h-3" />
            <span className="font-mono text-[10px] font-semibold">{episode.duration}</span>
          </div>
          <span className={cn('font-mono text-[10px]', isSelected ? 'text-muted-foreground' : 'text-muted-foreground')}>{formattedDate}</span>
        </div>

        {/* Title */}
        <h3 className={cn('font-sans font-semibold text-[13.5px] tracking-tight leading-snug mb-1 transition-colors', isSelected ? 'text-white' : 'text-foreground group-hover:text-foreground')}>
          <HighlightText text={episode.title} query={searchQuery} />
        </h3>

        {/* Description */}
        <p className={cn('font-serif text-[11.5px] leading-relaxed line-clamp-2 mb-1.5', isSelected ? 'text-muted-foreground/80' : 'text-muted-foreground')}>
          <HighlightText text={episode.description} query={searchQuery} />
        </p>

        {/* Tags */}
        {episode.tags && episode.tags.length > 0 && <div className="flex items-center gap-1 flex-wrap">
            {episode.tags.map(tag => <TagChip key={tag} tag={tag} query={searchQuery} small />)}
          </div>}
      </div>

      {/* Right Actions */}
      <div className="hidden sm:flex flex-shrink-0 flex-col items-end gap-2 pt-0.5" onClick={e => e.stopPropagation()}>
        {episode.seoScore !== undefined && !isSelected && <SEOBadge score={episode.seoScore} />}

        {/* Integration Status */}
        {!isSelected && <IntegrationBadges integrations={episode.integrations} />}

        {episode.status === 'processing' && !isSelected && <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-amber-50 border border-amber-200/60 text-[10px] font-mono font-bold text-amber-600">
            <Loader2 className="w-3 h-3 animate-spin" />
            Processing…
          </div>}

        {/* Quick Actions Trigger */}
        <div className="relative">
          <motion.button onClick={e => {
          e.stopPropagation();
          setMenuOpen(o => !o);
        }} whileTap={{
          scale: 0.92
        }} className={cn('p-1.5 rounded-lg transition-all duration-150', menuOpen ? 'opacity-100 bg-muted text-foreground/80' : isSelected ? 'opacity-100 text-muted-foreground/80 hover:text-stone-200 hover:bg-stone-800' : 'opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-foreground/80 hover:bg-accent')}>
            <MoreHorizontal className="w-3.5 h-3.5" />
          </motion.button>
          <AnimatePresence>
            {menuOpen && <QuickActionsMenu episodeId={episode.id} onClose={() => setMenuOpen(false)} onDelete={onDelete} />}
          </AnimatePresence>
        </div>

        {!isSelected && <motion.div className="opacity-0 group-hover:opacity-100 transition-opacity mt-auto">
            <div className="flex items-center gap-1 text-muted-foreground hover:text-foreground/80 transition-colors">
              <span className="font-sans text-[11px] font-medium">Open</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </div>
          </motion.div>}
      </div>

      {/* Active left indicator */}
      <motion.div className={cn('absolute left-0 top-3 bottom-3 w-[3px] rounded-full transition-opacity', isSelected ? 'bg-white opacity-30' : 'bg-stone-800 opacity-0 group-hover:opacity-100')} />
    </motion.div>;
};

// ─── Empty State ───────────────────────────────────────────────────────────────

const EmptyStateView = ({
  onUpload
}: {
  onUpload: () => void;
}) => <motion.div initial={{
  opacity: 0,
  y: 16
}} animate={{
  opacity: 1,
  y: 0
}} transition={{
  duration: 0.3,
  ease: 'easeOut'
}} className="flex flex-col items-center justify-center py-24 px-8 text-center">
    <div className="w-16 h-16 rounded-2xl bg-card border border-border shadow-[0_4px_16px_-4px_rgba(0,0,0,0.08)] flex items-center justify-center mb-5">
      <FileAudio className="w-7 h-7 text-muted-foreground" />
    </div>
    <h3 className="font-sans font-bold text-lg text-foreground tracking-tight mb-2">No episodes yet</h3>
    <p className="font-serif text-[13.5px] text-muted-foreground leading-relaxed max-w-xs mb-7">
      Upload your first audio file to get started. PodBrain will handle the transcription, show notes, and assets automatically.
    </p>
    <button onClick={onUpload} className={cn('flex items-center gap-2 px-5 py-2.5 rounded-lg', 'bg-stone-900 text-white text-[13px] font-sans font-semibold', 'hover:bg-stone-800 active:scale-[0.98] transition-all duration-150 shadow-sm')}>
      <UploadCloud className="w-4 h-4" />
      Upload First Episode
    </button>
  </motion.div>;

// ─── Sort Button ───────────────────────────────────────────────────────────────

const SortButton = ({
  field,
  label,
  activeField,
  activeDir,
  onClick
}: {
  field: SortField;
  label: string;
  activeField: SortField;
  activeDir: SortDir;
  onClick: (field: SortField) => void;
}) => {
  const isActive = activeField === field;
  return <button onClick={() => onClick(field)} className={cn('flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-sans font-semibold transition-all duration-150', isActive ? 'bg-stone-900 text-white shadow-sm' : 'text-muted-foreground hover:text-accent-foreground hover:bg-accent')}>
      {label}
      {isActive ? activeDir === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" /> : <ArrowUpDown className="w-3 h-3 opacity-30" />}
    </button>;
};

// ─── Filter Pills ──────────────────────────────────────────────────────────────

const FILTERS: {
  id: FilterType;
  label: string;
}[] = [{
  id: 'all',
  label: 'All'
}, {
  id: 'completed',
  label: 'Completed'
}, {
  id: 'processing',
  label: 'Processing'
}, {
  id: 'draft',
  label: 'Draft'
}, {
  id: 'failed',
  label: 'Failed'
}];

// ─── Main Component ────────────────────────────────────────────────────────────

export function EpisodeList() {
  const router = useRouter();
  const { shows } = useShows();
  const activeShowId = shows[0]?.id;
  const { episodes: apiEpisodes, isLoading: apiLoading, error: apiError, refetch } = useEpisodes({ showId: activeShowId });

  const mappedEpisodes = useMemo(() => {
    return apiEpisodes.map((ep, i) => ({
      id: ep.id,
      number: apiEpisodes.length - i,
      title: ep.title || 'Untitled Episode',
      description: ep.description || '',
      // Map DB statuses to UI EpisodeStatus.
      // - 'failed' is now a first-class state with its own filter tab + red pill.
      // - 'pending' (pre-processing) is shown as 'draft' since the user hasn't kicked off a run yet.
      // Anything else (completed | processing | draft) passes through unchanged.
      status: (ep.status === 'pending' ? 'draft' : ep.status) as Episode['status'],
      date: ep.created_at ? new Date(ep.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '',
      duration: ep.audio_duration_seconds ? formatDuration(ep.audio_duration_seconds) : '0:00',
      seoScore: ep.seo_score ?? undefined,
      tags: [] as string[],
      format: 'audio' as const,
      integrations: [] as Integration[],
    }));
  }, [apiEpisodes]);

  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [showSortPanel, setShowSortPanel] = useState(false);
  const [groupByWeek, setGroupByWeek] = useState(false);
  const [showBatchEdit, setShowBatchEdit] = useState(false);
  const [showViewsPanel, setShowViewsPanel] = useState(false);
  const [savedViews, setSavedViews] = useState<SavedView[]>([{
    id: 'v1',
    name: 'Recent Completed',
    filter: 'completed',
    sortField: 'date',
    sortDir: 'desc'
  }, {
    id: 'v2',
    name: 'Top SEO',
    filter: 'completed',
    sortField: 'seoScore',
    sortDir: 'desc'
  }]);
  const [activeViewId, setActiveViewId] = useState<string | null>(null);
  const isLoading = apiLoading;

  // Delay showing skeletons by 200ms so fast requests don't flash a
  // skeleton before the real content (or empty state) renders. Users
  // with 0 episodes on a fast connection will see the empty state
  // directly instead of "skeleton → empty state" flicker.
  const [showSkeleton, setShowSkeleton] = useState(false);
  useEffect(() => {
    if (!isLoading) {
      setShowSkeleton(false);
      return;
    }
    const timer = setTimeout(() => setShowSkeleton(true), 200);
    return () => clearTimeout(timer);
  }, [isLoading]);
  const [undoStack, setUndoStack] = useState<{
    episodes: Episode[];
    count: number;
  } | null>(null);
  const undoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const processingCount = episodes.filter(e => e.status === 'processing').length;

  // Sync mapped API data into local state
  useEffect(() => {
    if (mappedEpisodes.length > 0) {
      setEpisodes(mappedEpisodes);
    }
  }, [mappedEpisodes]);

  // ── Keyboard shortcuts ──
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'f') {
        e.preventDefault();
        searchRef.current?.focus();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'a') {
        e.preventDefault();
        selectAll();
      }
      if (e.key === 'Escape') {
        if (searchQuery) {
          setSearchQuery('');
          searchRef.current?.blur();
        } else if (selectedIds.size > 0) {
          setSelectedIds(new Set());
        }
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [searchQuery, selectedIds]);

  // ── Sorting ──
  const handleSort = useCallback((field: SortField) => {
    if (sortField === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('desc');
    }
    setActiveViewId(null);
  }, [sortField]);

  // ── Filtering + Sorting ──
  const filteredEpisodes = useMemo(() => {
    let list = episodes.filter(ep => {
      const matchesFilter = activeFilter === 'all' || ep.status === activeFilter;
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch = !query || ep.title.toLowerCase().includes(query) || ep.description.toLowerCase().includes(query) || (ep.tags || []).some(t => t.toLowerCase().includes(query));
      return matchesFilter && matchesSearch;
    });
    if (sortField !== 'manual') {
      list = [...list].sort((a, b) => {
        let cmp = 0;
        if (sortField === 'date') cmp = new Date(a.date).getTime() - new Date(b.date).getTime();else if (sortField === 'title') cmp = a.title.localeCompare(b.title);else if (sortField === 'seoScore') cmp = (a.seoScore ?? -1) - (b.seoScore ?? -1);else if (sortField === 'duration') cmp = durationToSecs(a.duration) - durationToSecs(b.duration);
        return sortDir === 'asc' ? cmp : -cmp;
      });
    }
    return list;
  }, [episodes, searchQuery, activeFilter, sortField, sortDir]);

  // ── Groups ──
  const groupedEpisodes = useMemo(() => {
    if (!groupByWeek) return null;
    const groups: {
      label: string;
      episodes: Episode[];
    }[] = [];
    const seen = new Map<string, Episode[]>();
    for (const ep of filteredEpisodes) {
      const label = getWeekLabel(ep.date);
      if (!seen.has(label)) {
        seen.set(label, []);
        groups.push({
          label,
          episodes: seen.get(label)!
        });
      }
      seen.get(label)!.push(ep);
    }
    return groups;
  }, [filteredEpisodes, groupByWeek]);
  const counts = useMemo(() => ({
    all: episodes.length,
    completed: episodes.filter(e => e.status === 'completed').length,
    processing: episodes.filter(e => e.status === 'processing').length,
    draft: episodes.filter(e => e.status === 'draft').length,
    failed: episodes.filter(e => e.status === 'failed').length
  }), [episodes]);

  // ── Total duration of selected ──
  const selectedTotalDuration = useMemo(() => {
    const total = episodes.filter(e => selectedIds.has(e.id)).reduce((sum, e) => sum + durationToSecs(e.duration), 0);
    return secsToHuman(total);
  }, [episodes, selectedIds]);

  // ── Selection helpers ──
  const toggleSelect = useCallback((id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);else next.add(id);
      return next;
    });
  }, []);
  const selectAll = useCallback(() => {
    setSelectedIds(new Set(filteredEpisodes.map(e => e.id)));
  }, [filteredEpisodes]);
  const clearSelection = useCallback(() => setSelectedIds(new Set()), []);

  // ── Bulk Delete with Undo ──
  const handleBulkDelete = useCallback(() => {
    const count = selectedIds.size;
    if (count === 0) return;
    // Save undo state
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    setUndoStack({
      episodes: [...episodes],
      count
    });
    setEpisodes(prev => prev.filter(e => !selectedIds.has(e.id)));
    setSelectedIds(new Set());
    undoTimerRef.current = setTimeout(() => setUndoStack(null), 6000);
  }, [selectedIds, episodes]);
  const handleUndo = useCallback(() => {
    if (undoStack) {
      setEpisodes(undoStack.episodes);
      setUndoStack(null);
      if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    }
  }, [undoStack]);

  // ── Batch Edit Apply ──
  const handleBatchApply = useCallback((tags: string[], status?: EpisodeStatus) => {
    setEpisodes(prev => prev.map(ep => {
      if (!selectedIds.has(ep.id)) return ep;
      return {
        ...ep,
        ...(status ? {
          status
        } : {}),
        tags: tags.length > 0 ? [...new Set([...(ep.tags || []), ...tags])] : ep.tags
      };
    }));
  }, [selectedIds]);

  // ── Saved Views ──
  const handleSaveView = useCallback((name: string) => {
    const id = `v${Date.now()}`;
    setSavedViews(prev => [...prev, {
      id,
      name,
      filter: activeFilter,
      sortField,
      sortDir
    }]);
    setActiveViewId(id);
  }, [activeFilter, sortField, sortDir]);
  const handleApplyView = useCallback((view: SavedView) => {
    setActiveFilter(view.filter);
    setSortField(view.sortField);
    setSortDir(view.sortDir);
    setActiveViewId(view.id);
    setShowViewsPanel(false);
  }, []);
  const handleDeleteView = useCallback((id: string) => {
    setSavedViews(prev => prev.filter(v => v.id !== id));
    if (activeViewId === id) setActiveViewId(null);
  }, [activeViewId]);

  // ── Reorder (manual drag) ──
  const handleReorder = useCallback((newOrder: Episode[]) => {
    setEpisodes(prev => {
      const reordered = [...prev];
      // Replace filtered positions with new order
      const filteredIds = new Set(filteredEpisodes.map(e => e.id));
      let fi = 0;
      return reordered.map(ep => filteredIds.has(ep.id) ? newOrder[fi++] : ep);
    });
  }, [filteredEpisodes]);

  // ── Delete single episode (local removal) ──
  const handleDelete = useCallback((episodeId: string) => {
    setEpisodes(prev => prev.filter(e => e.id !== episodeId));
  }, []);

  // ── Navigate to episode ──
  const handleEpisodeClick = useCallback((episodeId: string) => {
    router.push(`/episodes/${episodeId}`);
  }, [router]);

  return <div className="flex-1 h-full overflow-y-auto">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-8">

        {/* ── Header ── */}
        <motion.div initial={{
        opacity: 0,
        y: -10
      }} animate={{
        opacity: 1,
        y: 0
      }} transition={{
        duration: 0.3,
        ease: 'easeOut'
      }} className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-0 mb-5 sm:mb-7">
          <div>
            <h1 className="font-sans font-bold text-[22px] sm:text-[26px] text-foreground tracking-tighter leading-tight mb-1">
              Episodes
            </h1>
            <p className="font-serif text-[13px] sm:text-[13.5px] text-muted-foreground leading-relaxed">
              {episodes.length} {episodes.length === 1 ? 'episode' : 'episodes'} across your show — manage, review, and publish.
            </p>
          </div>
          <Link href="/upload" className={cn('flex items-center gap-2 px-4 py-2.5 rounded-lg self-start', 'bg-stone-900 text-white text-[12px] font-sans font-semibold', 'hover:bg-stone-800 active:scale-[0.98] transition-all duration-150', 'shadow-[0_2px_8px_-2px_rgba(0,0,0,0.2)]')}>
            <Plus className="w-4 h-4" />
            New Episode
          </Link>
        </motion.div>

        {/* ── Processing Banner ── */}
        <AnimatePresence>
          {processingCount > 0 && <ProcessingBanner count={processingCount} />}
        </AnimatePresence>

        {/* ── Search & Filters ── */}
        <motion.div initial={{
        opacity: 0,
        y: 8
      }} animate={{
        opacity: 1,
        y: 0
      }} transition={{
        duration: 0.28,
        ease: 'easeOut',
        delay: 0.08
      }} className="flex flex-col gap-2 mb-3">
          {/* Search Bar */}
          <div className="relative w-full max-w-xl">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
            <input ref={searchRef} type="text" placeholder="Search episodes, tags… (⌘F)" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className={cn('w-full pl-10 pr-9 py-2.5 rounded-xl text-[13px] font-sans text-foreground', 'placeholder:text-muted-foreground', 'bg-card border border-border', 'focus:outline-none focus:border-ring', 'focus:shadow-[0_0_0_3px_rgba(120,113,108,0.1)]', 'shadow-[0_1px_3px_rgba(0,0,0,0.05)]', 'transition-all duration-150')} />
            <AnimatePresence>
              {searchQuery && <motion.button initial={{
              opacity: 0,
              scale: 0.8
            }} animate={{
              opacity: 1,
              scale: 1
            }} exit={{
              opacity: 0,
              scale: 0.8
            }} transition={{
              duration: 0.12
            }} onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-md text-muted-foreground hover:text-accent-foreground hover:bg-accent transition-colors">
                  <X className="w-3.5 h-3.5" />
                </motion.button>}
            </AnimatePresence>
          </div>

          {/* Filter Pills + Sort + Views row */}
          <div className="flex items-center gap-2 w-full overflow-x-auto scrollbar-none">
          <div className="flex items-center bg-muted/40 rounded-xl p-1 border border-border gap-0.5 overflow-x-auto scrollbar-none">
            {FILTERS.map(filter => <button key={filter.id} onClick={() => {
            setActiveFilter(filter.id);
            setActiveViewId(null);
          }} className={cn('relative px-3 py-1.5 rounded-lg text-[11px] font-sans font-semibold transition-all duration-150 whitespace-nowrap flex-shrink-0', activeFilter === filter.id ? 'bg-card text-foreground shadow-[0_2px_8px_-2px_rgba(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,1)] border border-border' : 'text-muted-foreground hover:text-foreground/80 hover:bg-muted/50')}>
                {filter.label}
                {filter.id !== 'all' && counts[filter.id] > 0 && <span className="ml-1.5 font-mono text-[9px] font-bold text-muted-foreground">{counts[filter.id]}</span>}
              </button>)}
          </div>

          {/* Sort Button */}
          <div className="relative flex-shrink-0">
            <button onClick={() => setShowSortPanel(o => !o)} className={cn('flex items-center gap-1.5 px-3 py-2.5 rounded-lg text-[12px] font-sans font-semibold transition-all duration-150 border', showSortPanel ? 'bg-stone-900 text-white border-stone-800 shadow-sm' : 'bg-card text-muted-foreground border-border hover:text-accent-foreground hover:border-border shadow-[0_1px_3px_rgba(0,0,0,0.05)]')}>
              <SlidersHorizontal className="w-3.5 h-3.5" />
              Sort
            </button>
            <AnimatePresence>
              {showSortPanel && <motion.div initial={{
              opacity: 0,
              y: -6,
              scale: 0.97
            }} animate={{
              opacity: 1,
              y: 0,
              scale: 1
            }} exit={{
              opacity: 0,
              y: -4,
              scale: 0.97
            }} transition={{
              duration: 0.15,
              ease: 'easeOut'
            }} className="absolute right-0 top-full mt-1.5 z-20 bg-card border border-border rounded-xl shadow-xl p-2 min-w-[170px]">
                  <p className="px-2.5 pt-1 pb-2 text-[10px] font-mono font-bold uppercase tracking-widest text-muted-foreground">Sort by</p>
                  {([{
                field: 'date',
                label: 'Date'
              }, {
                field: 'title',
                label: 'Title'
              }, {
                field: 'seoScore',
                label: 'SEO Score'
              }, {
                field: 'duration',
                label: 'Duration'
              }, {
                field: 'manual',
                label: 'Manual (drag)'
              }] as {
                field: SortField;
                label: string;
              }[]).map(opt => <SortButton key={opt.field} field={opt.field} label={opt.label} activeField={sortField} activeDir={sortDir} onClick={f => {
                handleSort(f);
                setShowSortPanel(false);
              }} />)}
                  <div className="my-1 border-t border-border/50" />
                  <button onClick={() => {
                setGroupByWeek(v => !v);
                setShowSortPanel(false);
              }} className={cn('flex items-center gap-1.5 w-full px-2.5 py-1.5 rounded-lg text-[11px] font-sans font-semibold transition-all duration-150', groupByWeek ? 'bg-stone-900 text-white' : 'text-muted-foreground hover:text-accent-foreground hover:bg-accent')}>
                    <CalendarDays className="w-3 h-3" />
                    Group by week
                    {groupByWeek && <span className="ml-auto text-[9px] opacity-60">✓</span>}
                  </button>
                </motion.div>}
            </AnimatePresence>
          </div>

          {/* Saved Views Button */}
          <div className="relative flex-shrink-0">
            <button onClick={() => setShowViewsPanel(o => !o)} className={cn('flex items-center gap-1.5 px-3 py-2.5 rounded-lg text-[12px] font-sans font-semibold transition-all duration-150 border', showViewsPanel || activeViewId ? 'bg-stone-900 text-white border-stone-800 shadow-sm' : 'bg-card text-muted-foreground border-border hover:text-accent-foreground hover:border-border shadow-[0_1px_3px_rgba(0,0,0,0.05)]')}>
              <Bookmark className="w-3.5 h-3.5" />
              Views
            </button>
            <AnimatePresence>
              {showViewsPanel && <SavedViewsPanel views={savedViews} activeViewId={activeViewId} currentFilter={activeFilter} currentSortField={sortField} currentSortDir={sortDir} onApply={handleApplyView} onSave={handleSaveView} onDelete={handleDeleteView} onClose={() => setShowViewsPanel(false)} />}
            </AnimatePresence>
          </div>
          </div>
        </motion.div>

        {/* ── Bulk Selection Bar ── */}
        <AnimatePresence>
          {selectedIds.size > 0 && <BulkActionBar selectedCount={selectedIds.size} totalCount={filteredEpisodes.length} totalDuration={selectedTotalDuration} onSelectAll={selectAll} onClearAll={clearSelection} onBulkDelete={handleBulkDelete} onBulkExport={clearSelection} />}
        </AnimatePresence>

        {/* ── Batch Edit Panel ── */}
        <AnimatePresence>
          {showBatchEdit && selectedIds.size > 0 && <BatchEditPanel selectedCount={selectedIds.size} onApply={handleBatchApply} onClose={() => setShowBatchEdit(false)} />}
        </AnimatePresence>

        {/* ── Select All hint + batch edit trigger ── */}
        <AnimatePresence>
          {filteredEpisodes.length > 0 && <motion.div initial={{
          opacity: 0
        }} animate={{
          opacity: 1
        }} exit={{
          opacity: 0
        }} className="flex items-center justify-between mb-3 px-1">
              <span className="text-[11px] font-mono text-muted-foreground">
                {filteredEpisodes.length} result{filteredEpisodes.length !== 1 ? 's' : ''}
                {sortField === 'manual' && <span className="ml-2 text-muted-foreground/80">· drag to reorder</span>}
              </span>
              <div className="flex items-center gap-3">
                {selectedIds.size > 0 && <button onClick={() => setShowBatchEdit(v => !v)} className={cn('flex items-center gap-1.5 text-[11px] font-sans font-semibold transition-colors', showBatchEdit ? 'text-foreground/80' : 'text-muted-foreground hover:text-foreground/80')}>
                    <Pencil className="w-3 h-3" />
                    Batch edit
                  </button>}
                <button onClick={selectAll} className="flex items-center gap-1.5 text-[11px] font-sans font-semibold text-muted-foreground hover:text-foreground/80 transition-colors">
                  <CheckSquare className="w-3.5 h-3.5" />
                  Select all <kbd className="ml-1 font-mono text-[9px] text-muted-foreground bg-muted border border-border rounded px-1 py-0.5">⌘A</kbd>
                </button>
              </div>
            </motion.div>}
        </AnimatePresence>

        {/* ── Error State ── */}
        {apiError && !isLoading && <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-12 h-12 rounded-xl bg-red-50 border border-red-200 flex items-center justify-center mb-4 shadow-sm">
              <AlertCircle className="w-5 h-5 text-red-500" />
            </div>
            <p className="font-sans text-[14px] font-semibold text-foreground mb-1">Failed to load episodes</p>
            <p className="font-serif text-[12.5px] text-muted-foreground mb-4">{apiError}</p>
            <button onClick={() => refetch()} className="text-[11px] font-sans font-semibold text-muted-foreground hover:text-accent-foreground underline underline-offset-2 transition-colors">
              Try again
            </button>
          </div>}

        {/* ── Skeleton Loading (delayed 200ms to avoid flicker) ── */}
        {isLoading && showSkeleton && <div className="space-y-3">
            {[0, 1, 2, 3].map(i => <SkeletonCard key={i} index={i} />)}
          </div>}

        {/* ── Episode List ── */}
        {!isLoading && !apiError && <div>
            {filteredEpisodes.length === 0 ? <AnimatePresence>
                <motion.div key="empty" initial={{
            opacity: 0
          }} animate={{
            opacity: 1
          }} exit={{
            opacity: 0
          }} transition={{
            duration: 0.2
          }}>
                  {searchQuery || activeFilter !== 'all' ? <div className="flex flex-col items-center justify-center py-20 text-center">
                      <div className="w-12 h-12 rounded-xl bg-card border border-border flex items-center justify-center mb-4 shadow-sm">
                        <AlertCircle className="w-5 h-5 text-muted-foreground" />
                      </div>
                      <p className="font-sans text-[14px] font-semibold text-muted-foreground mb-1">No episodes found</p>
                      <p className="font-serif text-[12.5px] text-muted-foreground">Try adjusting your search or filter.</p>
                      <button onClick={() => {
                setSearchQuery('');
                setActiveFilter('all');
              }} className="mt-4 text-[11px] font-sans font-semibold text-muted-foreground hover:text-accent-foreground underline underline-offset-2 transition-colors">
                        Clear filters
                      </button>
                    </div> : <EmptyStateView onUpload={() => router.push('/upload')} />}
                </motion.div>
              </AnimatePresence> : sortField === 'manual' ?
        // ── Drag-to-reorder mode ──
        <Reorder.Group axis="y" values={filteredEpisodes} onReorder={handleReorder} className="space-y-3">
                {filteredEpisodes.map((episode, index) => <Reorder.Item key={episode.id} value={episode} className="list-none">
                    <EpisodeCard episode={episode} index={index} isSelected={selectedIds.has(episode.id)} searchQuery={searchQuery} onToggleSelect={toggleSelect} onClick={() => handleEpisodeClick(episode.id)} isDraggable={true} onDelete={handleDelete} />
                  </Reorder.Item>)}
              </Reorder.Group> : groupedEpisodes ?
        // ── Grouped by week ──
        <div>
                {groupedEpisodes.map(group => <div key={group.label}>
                    <GroupHeader label={group.label} count={group.episodes.length} />
                    <div className="space-y-3 mb-2">
                      {group.episodes.map((episode, index) => <EpisodeCard key={episode.id} episode={episode} index={index} isSelected={selectedIds.has(episode.id)} searchQuery={searchQuery} onToggleSelect={toggleSelect} onClick={() => handleEpisodeClick(episode.id)} isDraggable={false} onDelete={handleDelete} />)}
                    </div>
                  </div>)}
              </div> :
        // ── Normal list ──
        <AnimatePresence mode="popLayout">
                <div className="space-y-3">
                  {filteredEpisodes.map((episode, index) => <EpisodeCard key={episode.id} episode={episode} index={index} isSelected={selectedIds.has(episode.id)} searchQuery={searchQuery} onToggleSelect={toggleSelect} onClick={() => handleEpisodeClick(episode.id)} isDraggable={false} onDelete={handleDelete} />)}
                </div>
              </AnimatePresence>}
          </div>}

        {/* ── Footer spacing ── */}
        <div className="h-12" />
      </div>

      {/* ── Undo Toast ── */}
      <AnimatePresence>
        {undoStack && <UndoToast count={undoStack.count} onUndo={handleUndo} onDismiss={() => setUndoStack(null)} />}
      </AnimatePresence>
    </div>;
}
