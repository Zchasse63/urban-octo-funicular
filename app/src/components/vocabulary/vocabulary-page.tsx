"use client"

import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BookOpen, Search, Plus, Upload, Sparkles, X, Check, ChevronDown, Mic2, User, Tag, Cpu, ArrowRight, TrendingUp, Target, CheckCircle2, AlertCircle, Loader2, Copy, Trash2, MoreHorizontal, Filter, FileText, Wand2, Download, RefreshCw, Zap, Hash, SortAsc, SortDesc, CheckSquare, Square, RotateCcw, RotateCw, Keyboard, ChevronUp, BarChart2, ShieldCheck, AlertTriangle, ArrowUpDown, Sliders } from 'lucide-react';
import { cn } from '@/lib/utils';
import useVocabulary from '@/hooks/use-vocabulary';
import useShows from '@/hooks/use-shows';

// ─── Types ────────────────────────────────────────────────────────────────────

type TermCategory = 'Person' | 'Brand' | 'Technical' | 'Acronym' | 'Custom';
type TermStatus = 'active' | 'pending' | 'review';
type SortField = 'term' | 'usageCount' | 'accuracyBoost' | 'addedDate';
type SortDir = 'asc' | 'desc';
interface VocabTerm {
  id: string;
  term: string;
  phonetic?: string;
  category: TermCategory;
  usageCount: number;
  accuracyBoost: number;
  status: TermStatus;
  notes?: string;
  addedDate: string;
  tags?: string[];
  usageTrend?: number[]; // last 7 episodes
  pronunciationValidated?: boolean;
}
interface AISuggestion {
  id: string;
  term: string;
  phonetic?: string;
  category: TermCategory;
  confidence: number;
  sourceEpisode: string;
  detectedCount: number;
}
interface HistoryEntry {
  type: 'delete' | 'add' | 'bulk_delete';
  terms: VocabTerm[];
  label: string;
}
interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'undo';
  undoFn?: () => void;
}

// ─── Data ─────────────────────────────────────────────────────────────────────
// Hardcoded fallback data removed. Terms are fetched via the useVocabulary hook.
// AI suggestions will be populated from future API integration.

// ─── Helpers ──────────────────────────────────────────────────────────────────

const CATEGORY_CONFIG: Record<TermCategory, {
  label: string;
  color: string;
  bg: string;
  border: string;
  dot: string;
}> = {
  Person: {
    label: 'Person',
    color: 'text-sky-700',
    bg: 'bg-sky-50',
    border: 'border-sky-200/70',
    dot: 'bg-sky-500'
  },
  Brand: {
    label: 'Brand',
    color: 'text-violet-700',
    bg: 'bg-violet-50',
    border: 'border-violet-200/70',
    dot: 'bg-violet-500'
  },
  Technical: {
    label: 'Technical',
    color: 'text-amber-700',
    bg: 'bg-amber-50',
    border: 'border-amber-200/70',
    dot: 'bg-amber-500'
  },
  Acronym: {
    label: 'Acronym',
    color: 'text-emerald-700',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200/70',
    dot: 'bg-emerald-500'
  },
  Custom: {
    label: 'Custom',
    color: 'text-muted-foreground',
    bg: 'bg-muted',
    border: 'border-border',
    dot: 'bg-stone-400'
  }
};
const STATUS_CONFIG: Record<TermStatus, {
  label: string;
  color: string;
  bg: string;
  border: string;
}> = {
  active: {
    label: 'Active',
    color: 'text-emerald-700',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200/60'
  },
  pending: {
    label: 'Pending',
    color: 'text-amber-700',
    bg: 'bg-amber-50',
    border: 'border-amber-200/60'
  },
  review: {
    label: 'Review',
    color: 'text-rose-700',
    bg: 'bg-rose-50',
    border: 'border-rose-200/60'
  }
};
const getCategoryIcon = (cat: TermCategory): React.ElementType => {
  switch (cat) {
    case 'Person':
      return User;
    case 'Brand':
      return Tag;
    case 'Technical':
      return Cpu;
    case 'Acronym':
      return Hash;
    default:
      return BookOpen;
  }
};
const formatDate = (dateStr: string): string => {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return 'today';
  if (diffDays === 1) return 'yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  return `${Math.floor(diffDays / 30)}mo ago`;
};

// ─── List animation variants ──────────────────────────────────────────────────

const listVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.04
    }
  }
};
const itemVariants = {
  hidden: {
    opacity: 0,
    y: 6
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.18,
      ease: 'easeOut' as const
    }
  }
};

// ─── Sparkline ────────────────────────────────────────────────────────────────

const Sparkline = ({
  data,
  color = '#10b981'
}: {
  data: number[];
  color?: string;
}) => {
  if (!data || data.length < 2) return null;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const w = 48,
    h = 20,
    pad = 2;
  const pts = data.map((v, i) => {
    const x = pad + i / (data.length - 1) * (w - pad * 2);
    const y = h - pad - (v - min) / range * (h - pad * 2);
    return `${x},${y}`;
  }).join(' ');
  const trend = data[data.length - 1] - data[0];
  const trendColor = trend > 0 ? '#10b981' : trend < 0 ? '#f43f5e' : '#a8a29e';
  return <svg width={w} height={h} className="overflow-visible">
      <polyline points={pts} fill="none" stroke={trendColor} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" opacity="0.8" />
      <circle cx={pts.split(' ').at(-1)?.split(',')[0]} cy={pts.split(' ').at(-1)?.split(',')[1]} r="2" fill={trendColor} />
    </svg>;
};

// ─── Donut Chart ──────────────────────────────────────────────────────────────

const DonutChart = ({
  terms
}: {
  terms: VocabTerm[];
}) => {
  const cats: TermCategory[] = ['Person', 'Brand', 'Technical', 'Acronym'];
  const total = terms.length || 1;
  const slices = cats.map(cat => ({
    cat,
    count: terms.filter(t => t.category === cat).length,
    color: ({
      Person: '#38bdf8',
      Brand: '#a78bfa',
      Technical: '#f59e0b',
      Acronym: '#34d399',
      Custom: '#71717a'
    } as Record<TermCategory, string>)[cat]
  }));
  const r = 28,
    cx = 36,
    cy = 36,
    stroke = 10;
  const circ = 2 * Math.PI * r;
  let offset = 0;
  return <div className="flex items-center gap-4">
      <svg width={72} height={72} viewBox="0 0 72 72" className="-rotate-90">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#e7e5e4" strokeWidth={stroke} />
        {slices.map(({
        cat,
        count,
        color
      }) => {
        const pct = count / total;
        const dash = circ * pct;
        const gap = circ - dash;
        const el = <circle key={cat} cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeDasharray={`${dash} ${gap}`} strokeDashoffset={-offset} strokeLinecap="butt" />;
        offset += dash;
        return el;
      })}
      </svg>
      <div className="space-y-1.5 flex-1">
        {slices.map(({
        cat,
        count,
        color
      }) => <div key={cat} className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full flex-shrink-0" style={{
          background: color
        }} />
            <span className="font-sans text-[11px] text-muted-foreground flex-1">{cat}</span>
            <span className="font-mono text-[10px] text-muted-foreground w-4 text-right">{count}</span>
          </div>)}
      </div>
    </div>;
};

// ─── Toast System ─────────────────────────────────────────────────────────────

const ToastContainer = ({
  toasts,
  onDismiss
}: {
  toasts: Toast[];
  onDismiss: (id: string) => void;
}) => {
  return <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-[200] flex flex-col gap-2 items-center pointer-events-none">
      <AnimatePresence>
        {toasts.map(t => <motion.div key={t.id} initial={{
        opacity: 0,
        y: 16,
        scale: 0.95
      }} animate={{
        opacity: 1,
        y: 0,
        scale: 1
      }} exit={{
        opacity: 0,
        y: 8,
        scale: 0.95
      }} transition={{
        duration: 0.2,
        ease: 'easeOut' as const
      }} className={cn('pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl border shadow-[0_8px_24px_-4px_rgba(0,0,0,0.18)] min-w-[260px] max-w-sm backdrop-blur-sm', t.type === 'success' ? 'bg-stone-900 border-stone-700 text-white' : t.type === 'error' ? 'bg-rose-950 border-rose-800 text-rose-100' : t.type === 'undo' ? 'bg-stone-900 border-stone-700 text-white' : 'bg-card border-border text-foreground')}>
            {t.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />}
            {t.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-400  flex-shrink-0" />}
            {t.type === 'undo' && <RotateCcw className="w-4 h-4 text-amber-400 flex-shrink-0" />}
            {t.type === 'info' && <Zap className="w-4 h-4 text-sky-500   flex-shrink-0" />}
            <span className="font-sans text-[12px] font-medium flex-1">{t.message}</span>
            {t.undoFn && <button onClick={() => {
          t.undoFn!();
          onDismiss(t.id);
        }} className="font-mono text-[10px] font-bold uppercase tracking-widest text-amber-400 hover:text-amber-300 transition-colors px-2 py-1 rounded-md hover:bg-card/10">
                Undo
              </button>}
            <button onClick={() => onDismiss(t.id)} className="p-0.5 rounded text-white/40 hover:text-white/80 transition-colors">
              <X className="w-3 h-3" />
            </button>
          </motion.div>)}
      </AnimatePresence>
    </div>;
};

// ─── Keyboard Shortcuts Modal ─────────────────────────────────────────────────

const ShortcutsModal = ({
  onClose
}: {
  onClose: () => void;
}) => <motion.div initial={{
  opacity: 0
}} animate={{
  opacity: 1
}} exit={{
  opacity: 0
}} className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{
  background: 'rgba(41,37,34,0.35)',
  backdropFilter: 'blur(4px)'
}}>
    <motion.div initial={{
    opacity: 0,
    scale: 0.96,
    y: 12
  }} animate={{
    opacity: 1,
    scale: 1,
    y: 0
  }} exit={{
    opacity: 0,
    scale: 0.96,
    y: 8
  }} transition={{
    duration: 0.22,
    ease: 'easeOut' as const
  }} className="w-full max-w-sm bg-card border border-border rounded-2xl shadow-[0_24px_48px_-8px_rgba(0,0,0,0.18)] overflow-hidden">
      <div className="flex items-center justify-between px-6 py-5 border-b border-border bg-muted/30">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-stone-900 flex items-center justify-center">
            <Keyboard className="w-3.5 h-3.5 text-white" />
          </div>
          <div>
            <h2 className="font-sans font-bold text-sm text-foreground">Keyboard Shortcuts</h2>
            <p className="font-mono text-[9px] text-muted-foreground uppercase tracking-widest">Quick navigation</p>
          </div>
        </div>
        <button onClick={onClose} className="p-1.5 rounded-md text-muted-foreground hover:text-accent-foreground hover:bg-accent transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="px-6 py-5 space-y-2">
        {[['⌘ K', 'Focus search'], ['⌘ N', 'Add new term'], ['⌘ I', 'Bulk import'], ['⌘ Z', 'Undo last action'], ['⌘ ⇧ Z', 'Redo last action'], ['⌘ A', 'Select / deselect all'], ['⌘ E', 'Export filtered CSV'], ['⌘ ?', 'Show this dialog'], ['Esc', 'Clear selection / close']].map(([key, desc]) => <div key={key} className="flex items-center justify-between">
            <span className="font-sans text-[12px] text-muted-foreground">{desc}</span>
            <kbd className="font-mono text-[10px] font-bold text-muted-foreground bg-muted border border-border px-2 py-1 rounded-md">{key}</kbd>
          </div>)}
      </div>
    </motion.div>
  </motion.div>;

// ─── Category Badge ───────────────────────────────────────────────────────────

const CategoryBadge = ({
  category
}: {
  category: TermCategory;
}) => {
  const cfg = CATEGORY_CONFIG[category];
  const Icon = getCategoryIcon(category);
  return <span className={cn('inline-flex items-center gap-1 font-mono text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border', cfg.color, cfg.bg, cfg.border)}>
      <Icon className="w-2.5 h-2.5" />{cfg.label}
    </span>;
};

// ─── Accuracy Boost Bar ───────────────────────────────────────────────────────

const AccuracyBar = ({
  value,
  delay = 0
}: {
  value: number;
  delay?: number;
}) => {
  const color = value >= 20 ? 'bg-emerald-400' : value >= 12 ? 'bg-sky-400' : 'bg-stone-300';
  return <div className="flex items-center gap-2">
      <div className="w-16 h-1 bg-muted rounded-full overflow-hidden">
        <motion.div initial={{
        width: 0
      }} animate={{
        width: `${Math.min(value * 4, 100)}%`
      }} transition={{
        duration: 0.6,
        ease: 'easeOut' as const,
        delay
      }} className={cn('h-full rounded-full', color)} />
      </div>
      <span className="font-mono text-[10px] font-bold text-muted-foreground">+{value}%</span>
    </div>;
};

// ─── Term Row ─────────────────────────────────────────────────────────────────

const TermRow = ({
  term,
  index,
  onDelete,
  selected,
  onSelect
}: {
  term: VocabTerm;
  index: number;
  onDelete: (id: string) => void;
  selected: boolean;
  onSelect: (id: string, multi: boolean) => void;
}) => {
  const statusCfg = STATUS_CONFIG[term.status];
  return <motion.div variants={itemVariants} className={cn('flex items-center gap-3 sm:gap-4 px-3 sm:px-5 py-3.5 transition-colors group border-b border-border/30 last:border-0 cursor-pointer', selected ? 'bg-sky-50/60' : 'hover:bg-accent/50')} onClick={e => onSelect(term.id, e.metaKey || e.ctrlKey || e.shiftKey)}>
      {/* Checkbox */}
      <div className={cn('flex-shrink-0 transition-opacity', selected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100')} onClick={e => {
      e.stopPropagation();
      onSelect(term.id, true);
    }}>
        {selected ? <CheckSquare className="w-3.5 h-3.5 text-sky-500" /> : <Square className="w-3.5 h-3.5 text-muted-foreground" />}
      </div>

      {/* Term + phonetic */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2.5 mb-0.5">
          <span className="font-mono text-[13px] font-bold text-foreground tracking-tight">{term.term}</span>
          {term.status !== 'active' && <span className={cn('font-mono text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-full border', statusCfg.color, statusCfg.bg, statusCfg.border)}>
              {statusCfg.label}
            </span>}
          {term.pronunciationValidated && <span title="Pronunciation validated">
              <ShieldCheck className="w-3 h-3 text-emerald-500" />
            </span>}
        </div>
        {term.phonetic && <span className="font-mono text-[10px] text-muted-foreground italic">{term.phonetic}</span>}
        {term.notes && <p className="font-sans text-[10px] text-amber-600 mt-0.5 flex items-center gap-1">
            <AlertCircle className="w-2.5 h-2.5" />{term.notes}
          </p>}
        {term.tags && term.tags.length > 0 && <div className="flex items-center gap-1 mt-1 flex-wrap">
            {term.tags.map(tag => <span key={tag} className="font-mono text-[8px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-full bg-muted border border-border text-muted-foreground">
                #{tag}
              </span>)}
          </div>}
      </div>

      {/* Category */}
      <div className="w-24 flex-shrink-0 hidden xl:block"><CategoryBadge category={term.category} /></div>

      {/* Usage + sparkline */}
      <div className="w-20 flex-shrink-0 flex items-center gap-2">
        <div>
          <span className="font-mono text-[11px] font-bold text-muted-foreground">{term.usageCount}</span>
          <p className="font-sans text-[9px] text-muted-foreground uppercase tracking-widest">uses</p>
        </div>
        {term.usageTrend && <span className="hidden xl:inline"><Sparkline data={term.usageTrend} /></span>}
      </div>

      {/* Accuracy boost */}
      <div className="w-28 flex-shrink-0 hidden xl:block">
        <AccuracyBar value={term.accuracyBoost} delay={index * 0.04} />
      </div>

      {/* Added date */}
      <div className="w-16 flex-shrink-0 text-right hidden sm:block">
        <span className="font-sans text-[10px] text-muted-foreground">{formatDate(term.addedDate)}</span>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity w-16 justify-end">
        <button aria-label="Copy term" onClick={e => {
        e.stopPropagation();
        navigator.clipboard.writeText(term.term);
      }} className="p-1.5 rounded-md text-muted-foreground/80 hover:text-accent-foreground hover:bg-accent transition-all">
          <Copy className="w-3 h-3" />
        </button>
        <button aria-label="Delete term" onClick={e => {
        e.stopPropagation();
        onDelete(term.id);
      }} className="p-1.5 rounded-md text-muted-foreground/80 hover:text-rose-500 hover:bg-rose-50 transition-all">
          <Trash2 className="w-3 h-3" />
        </button>
      </div>
    </motion.div>;
};

// ─── AI Suggestion Card ───────────────────────────────────────────────────────

const SuggestionCard = ({
  suggestion,
  onAccept,
  onDismiss
}: {
  suggestion: AISuggestion;
  onAccept: (id: string) => void;
  onDismiss: (id: string) => void;
}) => {
  const [accepting, setAccepting] = useState(false);
  const cfg = CATEGORY_CONFIG[suggestion.category];
  const Icon = getCategoryIcon(suggestion.category);
  const confidenceColor = suggestion.confidence >= 90 ? 'text-emerald-600 bg-emerald-50 border-emerald-200/60' : 'text-amber-600 bg-amber-50 border-amber-200/60';
  const handleAccept = () => {
    setAccepting(true);
    setTimeout(() => onAccept(suggestion.id), 500);
  };
  return <motion.div variants={itemVariants} exit={{
    opacity: 0,
    x: 20,
    transition: {
      duration: 0.2
    }
  }} className="group flex flex-col gap-2 p-3 rounded-lg bg-card border border-border hover:border-border/80 hover:shadow-[0_2px_8px_-2px_rgba(0,0,0,0.08)] transition-all">
      <div className="flex items-start justify-between gap-2">
        <div>
          <span className="font-mono text-[12px] font-bold text-foreground">{suggestion.term}</span>
          {suggestion.phonetic && <p className="font-mono text-[9px] text-muted-foreground italic mt-0.5">{suggestion.phonetic}</p>}
        </div>
        <button aria-label="Dismiss suggestion" onClick={() => onDismiss(suggestion.id)} className="p-0.5 rounded text-muted-foreground/80 hover:text-muted-foreground transition-colors flex-shrink-0">
          <X className="w-3 h-3" />
        </button>
      </div>
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className={cn('inline-flex items-center gap-1 font-mono text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-full border', cfg.color, cfg.bg, cfg.border)}>
          <Icon className="w-2 h-2" />{cfg.label}
        </span>
        <span className={cn('font-mono text-[9px] font-bold px-1.5 py-0.5 rounded-full border', confidenceColor)}>
          {suggestion.confidence}% conf.
        </span>
      </div>
      <div className="flex items-center gap-1.5">
        <FileText className="w-2.5 h-2.5 text-muted-foreground/80 flex-shrink-0" />
        <span className="font-sans text-[9px] text-muted-foreground truncate">{suggestion.sourceEpisode}</span>
      </div>
      <p className="font-sans text-[9px] text-muted-foreground">
        Detected <span className="font-bold text-muted-foreground">{suggestion.detectedCount}×</span> in transcript
      </p>
      <button onClick={handleAccept} disabled={accepting} className={cn('w-full flex items-center justify-center gap-1.5 py-1.5 rounded-md text-[10px] font-sans font-semibold transition-all', accepting ? 'bg-emerald-50 text-emerald-600 border border-emerald-200/60' : 'bg-stone-900 text-white hover:bg-stone-800 shadow-sm')}>
        {accepting ? <><CheckCircle2 className="w-3 h-3" />Added!</> : <><Plus className="w-3 h-3" />Add Term</>}
      </button>
    </motion.div>;
};

// ─── Add Term Modal ───────────────────────────────────────────────────────────

interface AddTermModalProps {
  onClose: () => void;
  onAdd: (term: Omit<VocabTerm, 'id' | 'usageCount' | 'accuracyBoost' | 'addedDate'>) => void;
  existingTerms: VocabTerm[];
}
const AddTermModal = ({
  onClose,
  onAdd,
  existingTerms
}: AddTermModalProps) => {
  const [term, setTerm] = useState('');
  const [phonetic, setPhonetic] = useState('');
  const [category, setCategory] = useState<TermCategory>('Technical');
  const [notes, setNotes] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const duplicate = useMemo(() => term.trim() && existingTerms.some(t => t.term.toLowerCase() === term.trim().toLowerCase()), [term, existingTerms]);
  const addTag = () => {
    const t = tagInput.trim().toLowerCase().replace(/^#/, '');
    if (t && !tags.includes(t)) {
      setTags(prev => [...prev, t]);
      setTagInput('');
    }
  };
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!term.trim() || duplicate) return;
    setSubmitting(true);
    setTimeout(() => {
      onAdd({
        term: term.trim(),
        phonetic: phonetic.trim() || undefined,
        category,
        notes: notes.trim() || undefined,
        status: 'pending',
        tags: tags.length ? tags : undefined
      });
      onClose();
    }, 600);
  };
  return <motion.div initial={{
    opacity: 0
  }} animate={{
    opacity: 1
  }} exit={{
    opacity: 0
  }} className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{
    background: 'rgba(41,37,34,0.35)',
    backdropFilter: 'blur(4px)'
  }}>
      <motion.div initial={{
      opacity: 0,
      scale: 0.96,
      y: 12
    }} animate={{
      opacity: 1,
      scale: 1,
      y: 0
    }} exit={{
      opacity: 0,
      scale: 0.96,
      y: 8
    }} transition={{
      duration: 0.22,
      ease: 'easeOut' as const
    }} className="w-full max-w-md bg-card border border-border rounded-2xl shadow-[0_24px_48px_-8px_rgba(0,0,0,0.18),0_0_0_1px_rgba(255,255,255,0.6)_inset] overflow-hidden">
        <div className="flex items-center justify-between px-6 py-5 border-b border-border bg-muted/30">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-stone-900 flex items-center justify-center"><Plus className="w-3.5 h-3.5 text-white" /></div>
            <div>
              <h2 className="font-sans font-bold text-sm text-foreground">Add New Term</h2>
              <p className="font-mono text-[9px] text-muted-foreground uppercase tracking-widest">Vocabulary Manager</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-md text-muted-foreground hover:text-accent-foreground hover:bg-accent transition-colors"><X className="w-4 h-4" /></button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div>
            <label className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground block mb-1.5">Term *</label>
            <input autoFocus value={term} onChange={e => setTerm(e.target.value)} placeholder="e.g. Marcus Aurelius" className={cn('w-full px-3.5 py-2.5 rounded-lg font-mono text-sm text-foreground placeholder:text-muted-foreground/80 bg-card border focus:outline-none focus:shadow-[0_0_0_3px_rgba(120,113,108,0.1)] transition-all shadow-[0_1px_3px_rgba(0,0,0,0.04)]', duplicate ? 'border-amber-400 focus:border-amber-500' : 'border-border focus:border-stone-400')} />
            <AnimatePresence>
              {duplicate && <motion.p initial={{
              opacity: 0,
              y: -4
            }} animate={{
              opacity: 1,
              y: 0
            }} exit={{
              opacity: 0
            }} className="flex items-center gap-1 font-sans text-[10px] text-amber-600 mt-1.5">
                  <AlertTriangle className="w-3 h-3" />Term already exists in your vocabulary.
                </motion.p>}
            </AnimatePresence>
          </div>

          <div>
            <label className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground block mb-1.5">Phonetic Hint</label>
            <input value={phonetic} onChange={e => setPhonetic(e.target.value)} placeholder="e.g. MAR-kus aw-REE-lee-us" className="w-full px-3.5 py-2.5 rounded-lg font-mono text-sm text-foreground placeholder:text-muted-foreground/80 bg-card border border-border focus:outline-none focus:border-stone-400 focus:shadow-[0_0_0_3px_rgba(120,113,108,0.1)] transition-all shadow-[0_1px_3px_rgba(0,0,0,0.04)]" />
            <p className="font-sans text-[10px] text-muted-foreground mt-1.5">Use syllable-CAPS notation for AI accuracy.</p>
          </div>

          <div>
            <label className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground block mb-1.5">Category</label>
            <div className="grid grid-cols-3 gap-1.5">
              {(Object.keys(CATEGORY_CONFIG) as TermCategory[]).filter(c => c !== 'Custom').map(cat => {
              const cfg = CATEGORY_CONFIG[cat];
              const Icon = getCategoryIcon(cat);
              return <button key={cat} type="button" onClick={() => setCategory(cat)} className={cn('flex items-center gap-1.5 px-3 py-2 rounded-lg border text-[11px] font-sans font-semibold transition-all', category === cat ? cn('shadow-[0_2px_6px_-2px_rgba(0,0,0,0.1)]', cfg.color, cfg.bg, cfg.border) : 'text-muted-foreground bg-card border-border hover:border-border hover:bg-accent/50')}>
                    <Icon className="w-3 h-3 flex-shrink-0" />{cat}
                  </button>;
            })}
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground block mb-1.5">Tags <span className="normal-case font-sans text-muted-foreground">(optional)</span></label>
            <div className="flex items-center gap-1.5">
              <input value={tagInput} onChange={e => setTagInput(e.target.value)} onKeyDown={e => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addTag();
              }
              if (e.key === ',') {
                e.preventDefault();
                addTag();
              }
            }} placeholder="e.g. stoic, philosophy" className="flex-1 px-3 py-2 rounded-lg font-mono text-sm text-foreground placeholder:text-muted-foreground/80 bg-card border border-border focus:outline-none focus:border-stone-400 transition-all text-[11px]" />
              <button type="button" onClick={addTag} className="px-2.5 py-2 rounded-lg bg-muted border border-border text-muted-foreground hover:bg-accent transition-colors text-[11px] font-medium">Add</button>
            </div>
            {tags.length > 0 && <div className="flex flex-wrap gap-1 mt-2">
                {tags.map(tag => <span key={tag} className="inline-flex items-center gap-1 font-mono text-[9px] font-bold uppercase tracking-widest px-2 py-1 rounded-full bg-muted border border-border text-muted-foreground">
                    #{tag}
                    <button type="button" onClick={() => setTags(p => p.filter(t => t !== tag))} className="hover:text-rose-500 transition-colors"><X className="w-2 h-2" /></button>
                  </span>)}
              </div>}
          </div>

          <div>
            <label className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground block mb-1.5">Notes <span className="normal-case font-sans text-muted-foreground">(optional)</span></label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder="Any pronunciation notes or context…" className="w-full px-3.5 py-2.5 rounded-lg font-sans text-sm text-foreground placeholder:text-muted-foreground/80 bg-card border border-border focus:outline-none focus:border-stone-400 focus:shadow-[0_0_0_3px_rgba(120,113,108,0.1)] transition-all shadow-[0_1px_3px_rgba(0,0,0,0.04)] resize-none" />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-lg border border-border text-muted-foreground text-[12px] font-sans font-semibold hover:bg-accent/50 hover:border-border transition-all">Cancel</button>
            <button type="submit" disabled={!term.trim() || submitting || !!duplicate} className={cn('flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-[12px] font-sans font-semibold transition-all shadow-sm', term.trim() && !submitting && !duplicate ? 'bg-stone-900 text-white hover:bg-stone-800' : 'bg-muted text-muted-foreground cursor-not-allowed')}>
              {submitting ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />Adding…</> : <><Wand2 className="w-3.5 h-3.5" />Add Term</>}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>;
};

// ─── Bulk Import Modal ────────────────────────────────────────────────────────

const BulkImportModal = ({
  onClose
}: {
  onClose: () => void;
}) => {
  const [text, setText] = useState('');
  const [importing, setImporting] = useState(false);
  const [done, setDone] = useState(false);
  const lineCount = text.trim() ? text.trim().split('\n').filter(l => l.trim()).length : 0;
  const handleImport = () => {
    if (!lineCount) return;
    setImporting(true);
    setTimeout(() => {
      setDone(true);
      setTimeout(onClose, 1000);
    }, 1400);
  };
  return <motion.div initial={{
    opacity: 0
  }} animate={{
    opacity: 1
  }} exit={{
    opacity: 0
  }} className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{
    background: 'rgba(41,37,34,0.35)',
    backdropFilter: 'blur(4px)'
  }}>
      <motion.div initial={{
      opacity: 0,
      scale: 0.96,
      y: 12
    }} animate={{
      opacity: 1,
      scale: 1,
      y: 0
    }} exit={{
      opacity: 0,
      scale: 0.96,
      y: 8
    }} transition={{
      duration: 0.22,
      ease: 'easeOut' as const
    }} className="w-full max-w-lg bg-card border border-border rounded-2xl shadow-[0_24px_48px_-8px_rgba(0,0,0,0.18),0_0_0_1px_rgba(255,255,255,0.6)_inset] overflow-hidden">
        <div className="flex items-center justify-between px-6 py-5 border-b border-border bg-muted/30">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-stone-900 flex items-center justify-center"><Upload className="w-3.5 h-3.5 text-white" /></div>
            <div>
              <h2 className="font-sans font-bold text-sm text-foreground">Bulk Import</h2>
              <p className="font-mono text-[9px] text-muted-foreground uppercase tracking-widest">One term per line</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-md text-muted-foreground hover:text-accent-foreground hover:bg-accent transition-colors"><X className="w-4 h-4" /></button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground block mb-1.5">Terms List</label>
            <textarea value={text} onChange={e => setText(e.target.value)} rows={8} placeholder={'Seneca\nEpictetus\nMarcus Aurelius\nZeno of Citium\n…'} className="w-full px-3.5 py-3 rounded-lg font-mono text-sm text-foreground placeholder:text-muted-foreground/80 bg-card border border-border focus:outline-none focus:border-stone-400 focus:shadow-[0_0_0_3px_rgba(120,113,108,0.1)] transition-all shadow-[0_1px_3px_rgba(0,0,0,0.04)] resize-none leading-relaxed" />
          </div>
          {lineCount > 0 && <motion.div initial={{
          opacity: 0,
          y: 4
        }} animate={{
          opacity: 1,
          y: 0
        }} className="flex items-center gap-2 px-3.5 py-2.5 bg-sky-50 border border-sky-200/60 rounded-lg">
              <Hash className="w-3.5 h-3.5 text-sky-500 flex-shrink-0" />
              <span className="font-sans text-[12px] text-sky-700">
                <span className="font-bold">{lineCount}</span> term{lineCount !== 1 ? 's' : ''} detected — will be added as <span className="font-semibold">Pending</span> for review.
              </span>
            </motion.div>}
          <div className="flex items-center gap-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-lg border border-border text-muted-foreground text-[12px] font-sans font-semibold hover:bg-accent/50 hover:border-border transition-all">Cancel</button>
            <button onClick={handleImport} disabled={!lineCount || importing || done} className={cn('flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-[12px] font-sans font-semibold transition-all shadow-sm', lineCount && !importing && !done ? 'bg-stone-900 text-white hover:bg-stone-800' : 'bg-muted text-muted-foreground cursor-not-allowed')}>
              {done ? <><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />Imported!</> : importing ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />Importing…</> : <><Upload className="w-3.5 h-3.5" />Import {lineCount > 0 ? `${lineCount} Terms` : 'Terms'}</>}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>;
};

// ─── Stats Bar ────────────────────────────────────────────────────────────────

const StatsBar = ({
  totalTerms,
  avgBoost,
  pendingCount
}: {
  totalTerms: number;
  avgBoost: number;
  pendingCount: number;
}) => <div className="flex items-center gap-2 overflow-x-auto scrollbar-none">
    {[{
    icon: BookOpen,
    label: 'Total Terms',
    value: totalTerms.toString(),
    accent: 'text-foreground/80',
    bg: 'bg-muted border-border'
  }, {
    icon: TrendingUp,
    label: 'Avg. Accuracy Boost',
    value: `+${avgBoost}%`,
    accent: 'text-emerald-700',
    bg: 'bg-emerald-50 border-emerald-200/60'
  }, {
    icon: Target,
    label: 'Categories',
    value: '4',
    accent: 'text-sky-700',
    bg: 'bg-sky-50 border-sky-200/60'
  }, {
    icon: AlertCircle,
    label: 'Need Review',
    value: pendingCount.toString(),
    accent: 'text-amber-700',
    bg: 'bg-amber-50 border-amber-200/60'
  }].map(stat => {
    const Icon = stat.icon;
    return <div key={stat.label} className={cn('flex items-center gap-2 px-3 py-2 rounded-lg border flex-shrink-0', stat.bg)}>
          <Icon className={cn('w-3.5 h-3.5 flex-shrink-0', stat.accent)} />
          <div>
            <span className={cn('font-mono text-sm font-bold', stat.accent)}>{stat.value}</span>
            <p className="font-sans text-[9px] text-muted-foreground uppercase tracking-widest leading-none mt-0.5">{stat.label}</p>
          </div>
        </div>;
  })}
  </div>;

// ─── Bulk Action Bar ──────────────────────────────────────────────────────────

const BulkActionBar = ({
  selectedCount,
  totalCount,
  onSelectAll,
  onDeselectAll,
  onBulkDelete,
  onBulkExport
}: {
  selectedCount: number;
  totalCount: number;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onBulkDelete: () => void;
  onBulkExport: () => void;
}) => <motion.div initial={{
  opacity: 0,
  y: -8
}} animate={{
  opacity: 1,
  y: 0
}} exit={{
  opacity: 0,
  y: -8
}} transition={{
  duration: 0.18
}} className="flex items-center gap-3 px-4 py-2.5 bg-sky-50 border border-sky-200/80 rounded-xl shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
    <div className="flex items-center gap-2 flex-1">
      <CheckSquare className="w-4 h-4 text-sky-500 flex-shrink-0" />
      <span className="font-sans text-[12px] font-semibold text-sky-700">
        <span className="font-bold">{selectedCount}</span> of {totalCount} selected
      </span>
    </div>
    <button onClick={selectedCount === totalCount ? onDeselectAll : onSelectAll} className="font-mono text-[10px] font-bold uppercase tracking-widest text-sky-600 hover:text-sky-800 transition-colors px-2 py-1 rounded-md hover:bg-sky-100">
      {selectedCount === totalCount ? 'Deselect All' : 'Select All'}
    </button>
    <div className="w-px h-4 bg-sky-200" />
    <button onClick={onBulkExport} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-sky-200 bg-card text-sky-700 text-[11px] font-sans font-semibold hover:bg-sky-50 transition-colors">
      <Download className="w-3 h-3" />Export Selected
    </button>
    <button onClick={onBulkDelete} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-rose-200 bg-card text-rose-600 text-[11px] font-sans font-semibold hover:bg-rose-50 transition-colors">
      <Trash2 className="w-3 h-3" />Delete Selected
    </button>
    <button onClick={onDeselectAll} className="p-1 rounded-md text-sky-400 hover:text-sky-700 transition-colors">
      <X className="w-3.5 h-3.5" />
    </button>
  </motion.div>;

// ─── Sort Header Button ───────────────────────────────────────────────────────

const SortButton = ({
  field,
  label,
  sortField,
  sortDir,
  onSort
}: {
  field: SortField;
  label: string;
  sortField: SortField;
  sortDir: SortDir;
  onSort: (f: SortField) => void;
}) => {
  const active = sortField === field;
  return <button onClick={() => onSort(field)} className={cn('flex items-center gap-1 font-mono text-[9px] font-bold uppercase tracking-widest transition-colors', active ? 'text-foreground/80' : 'text-muted-foreground hover:text-accent-foreground')}>
      {label}
      {active ? sortDir === 'asc' ? <ChevronUp className="w-2.5 h-2.5" /> : <ChevronDown className="w-2.5 h-2.5" /> : <ArrowUpDown className="w-2.5 h-2.5 opacity-40" />}
    </button>;
};

// ─── Main Component ───────────────────────────────────────────────────────────

export const VocabularyPage = () => {
  // ── API hooks ──────────────────────────────────────────────────────────────
  const { shows } = useShows();
  const activeShowId = shows?.[0]?.id;
  const {
    terms: apiTerms,
    isLoading: apiLoading,
    error: apiError,
    addTerm: apiAddTerm,
    deleteTerm: apiDeleteTerm,
    refetch,
  } = useVocabulary({ showId: activeShowId });

  // Map API terms to the component's VocabTerm format
  const mappedTerms = useMemo(() => {
    return apiTerms.map((t): VocabTerm => ({
      id: t.id,
      term: t.term,
      phonetic: undefined,
      category: 'Custom' as TermCategory,
      usageCount: t.occurrence_count,
      accuracyBoost: 0,
      status: 'active' as TermStatus,
      notes: t.alternatives.length > 0 ? `Alternatives: ${t.alternatives.join(', ')}` : undefined,
      addedDate: t.created_at,
      tags: t.alternatives,
      pronunciationValidated: false,
    }));
  }, [apiTerms]);

  const [terms, setTerms] = useState<VocabTerm[]>([]);
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<TermCategory | 'All'>('All');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [sortField, setSortField] = useState<SortField>('addedDate');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [historyIdx, setHistoryIdx] = useState(-1);
  const [confidenceMin, setConfidenceMin] = useState(0);
  const [validationPending, setValidationPending] = useState<Set<string>>(new Set());
  const searchRef = useRef<HTMLInputElement>(null);

  // ── Sync API terms to local state ──────────────────────────────────────────
  useEffect(() => {
    if (mappedTerms.length > 0 || (!apiLoading && apiTerms.length === 0)) {
      setTerms(mappedTerms);
    }
  }, [mappedTerms, apiLoading, apiTerms.length]);

  // ── Debounced search ──────────────────────────────────────────────────────
  useEffect(() => {
    const id = setTimeout(() => setDebouncedQuery(searchQuery), 200);
    return () => clearTimeout(id);
  }, [searchQuery]);

  // ── Toast helpers ─────────────────────────────────────────────────────────
  const addToast = useCallback((msg: string, type: Toast['type'] = 'success', undoFn?: () => void) => {
    const id = String(Date.now());
    setToasts(p => [...p.slice(-3), {
      id,
      message: msg,
      type,
      undoFn
    }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), undoFn ? 6000 : 3000);
  }, []);
  const dismissToast = useCallback((id: string) => setToasts(p => p.filter(t => t.id !== id)), []);

  // ── History / undo-redo ───────────────────────────────────────────────────
  const pushHistory = useCallback((entry: HistoryEntry) => {
    setHistory(prev => [...prev.slice(0, historyIdx + 1), entry]);
    setHistoryIdx(prev => prev + 1);
  }, [historyIdx]);
  const handleUndo = useCallback(() => {
    if (historyIdx < 0) return;
    const entry = history[historyIdx];
    if (entry.type === 'delete' || entry.type === 'bulk_delete') {
      setTerms(prev => [...entry.terms, ...prev]);
      addToast(`Restored "${entry.terms.map(t => t.term).join(', ')}"`, 'info');
    }
    setHistoryIdx(prev => prev - 1);
  }, [history, historyIdx, addToast]);
  const handleRedo = useCallback(() => {
    if (historyIdx >= history.length - 1) return;
    const next = historyIdx + 1;
    const entry = history[next];
    if (entry.type === 'delete' || entry.type === 'bulk_delete') {
      setTerms(prev => prev.filter(t => !entry.terms.find(r => r.id === t.id)));
      addToast(`Re-deleted ${entry.terms.length} term(s)`, 'info');
    }
    setHistoryIdx(next);
  }, [history, historyIdx, addToast]);

  // ── Filtering + Sorting ───────────────────────────────────────────────────
  const filteredTerms = useMemo(() => {
    let arr = terms.filter(t => {
      const q = debouncedQuery.toLowerCase();
      const matchesSearch = !q || t.term.toLowerCase().includes(q) || t.phonetic?.toLowerCase().includes(q) || t.tags?.some(tag => tag.includes(q));
      const matchesCat = selectedCategory === 'All' || t.category === selectedCategory;
      return matchesSearch && matchesCat;
    });
    arr = [...arr].sort((a, b) => {
      let cmp = 0;
      if (sortField === 'term') cmp = a.term.localeCompare(b.term);
      if (sortField === 'usageCount') cmp = a.usageCount - b.usageCount;
      if (sortField === 'accuracyBoost') cmp = a.accuracyBoost - b.accuracyBoost;
      if (sortField === 'addedDate') cmp = new Date(a.addedDate).getTime() - new Date(b.addedDate).getTime();
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return arr;
  }, [terms, debouncedQuery, selectedCategory, sortField, sortDir]);
  const filteredSuggestions = useMemo(() => suggestions.filter(s => s.confidence >= confidenceMin), [suggestions, confidenceMin]);
  const avgBoost = useMemo(() => {
    if (!terms.length) return 0;
    return Math.round(terms.reduce((sum, t) => sum + t.accuracyBoost, 0) / terms.length);
  }, [terms]);
  const pendingCount = terms.filter(t => t.status === 'pending' || t.status === 'review').length;

  // ── Sort toggle ───────────────────────────────────────────────────────────
  const handleSort = (field: SortField) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');else {
      setSortField(field);
      setSortDir('desc');
    }
  };

  // ── Selection ─────────────────────────────────────────────────────────────
  const handleSelect = (id: string, multi: boolean) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (multi) {
        next.has(id) ? next.delete(id) : next.add(id);
      } else {
        next.clear();
        if (!prev.has(id) || prev.size > 1) next.add(id);
      }
      return next;
    });
  };

  // ── Export CSV ────────────────────────────────────────────────────────────
  const handleExport = useCallback((ids?: Set<string>) => {
    const source = ids && ids.size > 0 ? filteredTerms.filter(t => ids.has(t.id)) : filteredTerms;
    const csv = ['Term,Phonetic,Category,Status,Usage Count,Accuracy Boost,Added Date,Tags', ...source.map(t => `"${t.term}","${t.phonetic || ''}","${t.category}","${t.status}",${t.usageCount},${t.accuracyBoost},"${t.addedDate}","${(t.tags || []).join(';')}"`)].join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], {
      type: 'text/csv'
    }));
    a.download = `vocabulary-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    addToast(`Exported ${source.length} term${source.length !== 1 ? 's' : ''} as CSV`, 'success');
  }, [filteredTerms, addToast]);

  // ── Delete ────────────────────────────────────────────────────────────────
  const handleDelete = useCallback(async (id: string) => {
    const target = terms.find(t => t.id === id)!;

    // Call API to delete if we have an active show
    if (activeShowId) {
      try {
        await apiDeleteTerm(id);
      } catch {
        addToast(`Failed to delete "${target.term}" from server`, 'error');
        return;
      }
    }

    pushHistory({
      type: 'delete',
      terms: [target],
      label: target.term
    });
    setTerms(prev => prev.filter(t => t.id !== id));
    setSelectedIds(prev => {
      const n = new Set(prev);
      n.delete(id);
      return n;
    });
    addToast(`Deleted "${target.term}"`, 'undo', () => {
      setTerms(prev => [target, ...prev]);
    });
  }, [terms, pushHistory, addToast, activeShowId, apiDeleteTerm]);
  const handleBulkDelete = useCallback(async () => {
    const targets = terms.filter(t => selectedIds.has(t.id));
    if (!targets.length) return;

    // Call API to delete each term if we have an active show
    if (activeShowId) {
      try {
        await Promise.all(targets.map(t => apiDeleteTerm(t.id)));
      } catch {
        addToast('Failed to delete some terms from server', 'error');
        return;
      }
    }

    pushHistory({
      type: 'bulk_delete',
      terms: targets,
      label: `${targets.length} terms`
    });
    setTerms(prev => prev.filter(t => !selectedIds.has(t.id)));
    setSelectedIds(new Set());
    addToast(`Deleted ${targets.length} term${targets.length !== 1 ? 's' : ''}`, 'undo', () => {
      setTerms(prev => [...targets, ...prev]);
    });
  }, [terms, selectedIds, pushHistory, addToast, activeShowId, apiDeleteTerm]);

  // ── Add term ──────────────────────────────────────────────────────────────
  const handleAddTerm = useCallback(async (newTerm: Omit<VocabTerm, 'id' | 'usageCount' | 'accuracyBoost' | 'addedDate'>) => {
    // Build alternatives from tags if present
    const alternatives = newTerm.tags || [];

    // Try the API first if we have an active show
    if (activeShowId) {
      try {
        const apiResult = await apiAddTerm(newTerm.term, alternatives);
        if (apiResult) {
          // Map the API result back to VocabTerm for local state
          const term: VocabTerm = {
            ...newTerm,
            id: apiResult.id,
            usageCount: apiResult.occurrence_count,
            accuracyBoost: 0,
            addedDate: apiResult.created_at,
            usageTrend: [0, 0, 0, 0, 0, 0, 0],
          };
          pushHistory({ type: 'add', terms: [term], label: term.term });
          setTerms(prev => [term, ...prev]);
          addToast(`Added "${term.term}" to vocabulary`, 'success');
          return;
        }
      } catch {
        addToast('Failed to save term to server', 'error');
        return;
      }
    }

    // Fallback to local-only if no show is active
    const term: VocabTerm = {
      ...newTerm,
      id: `v${Date.now()}`,
      usageCount: 0,
      accuracyBoost: Math.floor(Math.random() * 15) + 8,
      addedDate: new Date().toISOString().slice(0, 10),
      usageTrend: [0, 0, 0, 0, 0, 0, 0]
    };
    pushHistory({
      type: 'add',
      terms: [term],
      label: term.term
    });
    setTerms(prev => [term, ...prev]);
    addToast(`Added "${term.term}" to vocabulary`, 'success');
  }, [pushHistory, addToast, activeShowId, apiAddTerm]);

  // ── Suggestions ───────────────────────────────────────────────────────────
  const handleAcceptSuggestion = useCallback((id: string) => {
    const suggestion = suggestions.find(s => s.id === id);
    if (suggestion) {
      const term: VocabTerm = {
        id: `v${Date.now()}`,
        term: suggestion.term,
        phonetic: suggestion.phonetic,
        category: suggestion.category,
        usageCount: suggestion.detectedCount,
        accuracyBoost: Math.round(suggestion.confidence / 5),
        status: 'active',
        addedDate: new Date().toISOString().slice(0, 10),
        usageTrend: [0, 0, 0, 0, 0, 0, suggestion.detectedCount]
      };
      setTerms(prev => [term, ...prev]);
      addToast(`Added "${suggestion.term}" from AI suggestion`, 'success');
    }
    setSuggestions(prev => prev.filter(s => s.id !== id));
  }, [suggestions, addToast]);
  const handleDismissSuggestion = useCallback((id: string) => {
    const s = suggestions.find(sg => sg.id === id);
    setSuggestions(prev => prev.filter(sg => sg.id !== id));
    if (s) addToast(`Dismissed "${s.term}"`, 'info');
  }, [suggestions, addToast]);
  const handleRefreshSuggestions = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
      addToast('Suggestions refreshed', 'success');
    }, 1200);
  };

  // ── Batch pronunciation validation ────────────────────────────────────────
  const handleValidateAll = () => {
    const unvalidated = filteredTerms.filter(t => !t.pronunciationValidated);
    if (!unvalidated.length) {
      addToast('All visible terms already validated', 'info');
      return;
    }
    const ids = new Set(unvalidated.map(t => t.id));
    setValidationPending(ids);
    setTimeout(() => {
      setTerms(prev => prev.map(t => ids.has(t.id) ? {
        ...t,
        pronunciationValidated: true
      } : t));
      setValidationPending(new Set());
      addToast(`Validated ${unvalidated.length} pronunciation${unvalidated.length !== 1 ? 's' : ''}`, 'success');
    }, 1800);
  };

  // ── Keyboard shortcuts ────────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const meta = e.metaKey || e.ctrlKey;
      if (meta && e.key === 'k') {
        e.preventDefault();
        searchRef.current?.focus();
      }
      if (meta && e.key === 'n') {
        e.preventDefault();
        setShowAddModal(true);
      }
      if (meta && e.key === 'i') {
        e.preventDefault();
        setShowBulkImport(true);
      }
      if (meta && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      }
      if (meta && e.key === 'z' && e.shiftKey) {
        e.preventDefault();
        handleRedo();
      }
      if (meta && e.key === 'a') {
        e.preventDefault();
        setSelectedIds(prev => prev.size === filteredTerms.length ? new Set() : new Set(filteredTerms.map(t => t.id)));
      }
      if (meta && e.key === 'e') {
        e.preventDefault();
        handleExport();
      }
      if (meta && e.key === '?') {
        e.preventDefault();
        setShowShortcuts(true);
      }
      if (e.key === 'Escape') {
        setSelectedIds(new Set());
        setSearchQuery('');
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [handleUndo, handleRedo]);

  const categories: Array<TermCategory | 'All'> = ['All', 'Person', 'Brand', 'Technical', 'Acronym'];
  const hasSelection = selectedIds.size > 0;
  return <>
      {/* ── Main Layout ── */}
      <div className="flex-1 h-full overflow-y-auto">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-5 sm:py-7">

          {/* ── Page Header ── */}
          <div className="mb-5 sm:mb-6">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 sm:gap-6">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2.5 flex-wrap">
                  <div className="w-8 h-8 rounded-lg bg-stone-900 flex items-center justify-center shadow-md flex-shrink-0">
                    <BookOpen className="w-4 h-4 text-stone-100" />
                  </div>
                  <div>
                    <h1 className="font-sans font-bold text-[22px] text-foreground tracking-tight leading-none">Vocabulary</h1>
                    <p className="font-mono text-[9px] font-bold uppercase tracking-widest text-muted-foreground leading-none mt-0.5">Custom Transcription Dictionary</p>
                  </div>
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 border border-emerald-200/60">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.5)]" />
                    <span className="font-sans text-[10px] font-bold text-emerald-700 uppercase tracking-wider">Active</span>
                  </div>
                </div>
                <p className="font-serif text-sm text-muted-foreground leading-relaxed mb-4">
                  Teach PodBrain how to spell and transcribe domain-specific terms, proper nouns, and brand names accurately.
                </p>
                <StatsBar totalTerms={terms.length} avgBoost={avgBoost} pendingCount={pendingCount} />
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button onClick={() => setShowShortcuts(true)} title="Keyboard shortcuts (⌘?)" className="p-2 rounded-lg border border-border bg-card text-muted-foreground hover:text-accent-foreground hover:bg-card text-[12px] transition-all shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
                  <Keyboard className="w-3.5 h-3.5" />
                </button>
                <button onClick={handleValidateAll} title="Batch validate pronunciations" className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-border bg-card text-muted-foreground hover:text-accent-foreground hover:border-border hover:bg-card text-[12px] font-sans font-semibold transition-all shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
                  <ShieldCheck className="w-3.5 h-3.5" /><span>Validate All</span>
                </button>
                <button onClick={() => setShowBulkImport(true)} className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-border bg-card text-muted-foreground hover:text-accent-foreground hover:border-border hover:bg-card text-[12px] font-sans font-semibold transition-all shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
                  <Upload className="w-3.5 h-3.5" /><span>Bulk Import</span>
                </button>
                <button onClick={() => setShowAddModal(true)} className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-stone-900 text-white text-[12px] font-sans font-semibold hover:bg-stone-800 transition-colors shadow-sm">
                  <Plus className="w-3.5 h-3.5" /><span className="sm:inline">Add Term</span>
                </button>
              </div>
            </div>
          </div>

          {/* ── Main Content Grid ── */}
          <div className="flex flex-col lg:flex-row gap-5">

            {/* ── Left: Term List ── */}
            <div className="flex-1 min-w-0 space-y-3">

              {/* Bulk action bar */}
              <AnimatePresence>
                {hasSelection && <BulkActionBar selectedCount={selectedIds.size} totalCount={filteredTerms.length} onSelectAll={() => setSelectedIds(new Set(filteredTerms.map(t => t.id)))} onDeselectAll={() => setSelectedIds(new Set())} onBulkDelete={handleBulkDelete} onBulkExport={() => handleExport(selectedIds)} />}
              </AnimatePresence>

              {/* Search + Filter Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
                  <input ref={searchRef} type="text" placeholder="Search terms, phonetics, or tags… (⌘K)" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full pl-9 pr-4 py-2 rounded-lg text-sm font-sans text-foreground placeholder:text-muted-foreground bg-card border border-border focus:outline-none focus:border-stone-400 focus:shadow-[0_0_0_3px_rgba(120,113,108,0.1)] transition-all shadow-[0_1px_3px_rgba(0,0,0,0.04)]" />
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
                  }} onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded text-muted-foreground hover:text-accent-foreground transition-colors">
                        <X className="w-3 h-3" />
                      </motion.button>}
                  </AnimatePresence>
                </div>

                <div className="flex items-center gap-1 bg-muted/40 rounded-lg p-1 border border-border overflow-x-auto scrollbar-none">
                  {categories.map(cat => <button key={cat} onClick={() => setSelectedCategory(cat)} className={cn('px-3 py-1.5 rounded-md text-[11px] font-sans font-medium transition-all whitespace-nowrap flex-shrink-0', selectedCategory === cat ? 'bg-card text-foreground shadow-[0_1px_4px_rgba(0,0,0,0.08)] border border-border' : 'text-muted-foreground hover:text-accent-foreground hover:bg-accent/50')}>
                      {cat}
                    </button>)}
                </div>
              </div>

              {/* Terms Table */}
              <div className="bg-card border border-border rounded-xl overflow-hidden shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
                {/* Table Header */}
                <div className="flex items-center gap-4 px-3 sm:px-5 py-3 border-b border-border bg-muted/30">
                  {/* Checkbox placeholder */}
                  <div className="w-3.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <SortButton field="term" label="Term / Phonetic" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                  </div>
                  <div className="w-24 flex-shrink-0 hidden xl:block">
                    <span className="font-mono text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Category</span>
                  </div>
                  <div className="w-20 flex-shrink-0">
                    <SortButton field="usageCount" label="Usage" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                  </div>
                  <div className="w-28 flex-shrink-0 hidden xl:block">
                    <SortButton field="accuracyBoost" label="Accuracy Boost" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                  </div>
                  <div className="w-16 flex-shrink-0 text-right hidden sm:block">
                    <SortButton field="addedDate" label="Added" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                  </div>
                  <div className="w-16 flex-shrink-0 hidden sm:block" />
                </div>

                {/* Validation banner */}
                <AnimatePresence>
                  {validationPending.size > 0 && <motion.div initial={{
                  opacity: 0,
                  height: 0
                }} animate={{
                  opacity: 1,
                  height: 'auto'
                }} exit={{
                  opacity: 0,
                  height: 0
                }} className="flex items-center gap-2.5 px-5 py-2.5 bg-sky-50 border-b border-sky-100">
                      <Loader2 className="w-3.5 h-3.5 text-sky-500 animate-spin flex-shrink-0" />
                      <span className="font-sans text-[12px] text-sky-700">
                        Validating {validationPending.size} pronunciation{validationPending.size !== 1 ? 's' : ''}…
                      </span>
                    </motion.div>}
                </AnimatePresence>

                {/* Rows */}
                <AnimatePresence mode="wait">
                  {filteredTerms.length === 0 ? <motion.div key="empty" initial={{
                  opacity: 0
                }} animate={{
                  opacity: 1
                }} exit={{
                  opacity: 0
                }} className="flex flex-col items-center justify-center py-14 gap-3">
                      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                        <BookOpen className="w-5 h-5 text-muted-foreground/80" />
                      </div>
                      {terms.length === 0 && !debouncedQuery && selectedCategory === 'All' ? <>
                        <p className="font-sans text-sm text-muted-foreground text-center">
                          Your vocabulary is empty
                        </p>
                        <p className="font-sans text-[11px] text-muted-foreground/70 text-center max-w-xs leading-relaxed">
                          Add custom terms to improve transcription accuracy for names, brands, and technical jargon.
                        </p>
                        <button onClick={() => setShowAddModal(true)} className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-stone-900 text-white text-[12px] font-sans font-semibold hover:bg-stone-800 transition-colors shadow-sm mt-1">
                          <Plus className="w-3.5 h-3.5" />Add Your First Term
                        </button>
                      </> : <>
                        <p className="font-sans text-sm text-muted-foreground">
                          No terms match{' '}
                          {debouncedQuery ? <><span className="font-semibold text-muted-foreground">&quot;{debouncedQuery}&quot;</span></> : <span className="font-semibold text-muted-foreground">{selectedCategory}</span>}
                        </p>
                        <button onClick={() => {
                      setSearchQuery('');
                      setSelectedCategory('All');
                    }} className="font-sans text-[11px] text-muted-foreground hover:text-accent-foreground underline underline-offset-2 transition-colors">
                          Clear filters
                        </button>
                      </>}
                    </motion.div> : <motion.div key={`${debouncedQuery}-${selectedCategory}-${sortField}-${sortDir}`} variants={listVariants} initial="hidden" animate="visible">
                      {filteredTerms.map((term, i) => <TermRow key={term.id} term={term} index={i} onDelete={handleDelete} selected={selectedIds.has(term.id)} onSelect={handleSelect} />)}
                    </motion.div>}
                </AnimatePresence>

                {/* Footer */}
                {filteredTerms.length > 0 && <div className="flex items-center justify-between px-5 py-3 border-t border-border/50bg-muted/30">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-[10px] text-muted-foreground">
                        {filteredTerms.length} of {terms.length} terms
                      </span>
                      {historyIdx >= 0 && <div className="flex items-center gap-1">
                          <button onClick={handleUndo} disabled={historyIdx < 0} title="Undo (⌘Z)" className="p-1 rounded-md text-muted-foreground hover:text-accent-foreground hover:bg-accent disabled:opacity-30 transition-all">
                            <RotateCcw className="w-3 h-3" />
                          </button>
                          <button onClick={handleRedo} disabled={historyIdx >= history.length - 1} title="Redo (⌘⇧Z)" className="p-1 rounded-md text-muted-foreground hover:text-accent-foreground hover:bg-accent disabled:opacity-30 transition-all">
                            <RotateCw className="w-3 h-3" />
                          </button>
                        </div>}
                    </div>
                    <button onClick={() => handleExport(hasSelection ? selectedIds : undefined)} className="flex items-center gap-1.5 font-sans text-[11px] text-muted-foreground hover:text-accent-foreground transition-colors">
                      <Download className="w-3 h-3" />
                      {hasSelection ? `Export ${selectedIds.size} selected` : 'Export filtered CSV'}
                    </button>
                  </div>}
              </div>
            </div>

            {/* ── Right: AI Suggestions + Charts ── */}
            <div className="w-full lg:w-[260px] lg:flex-shrink-0 space-y-3">

              {/* Suggestions panel */}
              <div className="bg-card border border-border rounded-xl overflow-hidden shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
                <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-md bg-amber-100 border border-amber-200/60 flex items-center justify-center">
                      <Sparkles className="w-3 h-3 text-amber-600" />
                    </div>
                    <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">AI Suggestions</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {suggestions.length > 0 && <span className="font-mono text-[9px] font-bold text-amber-700 bg-amber-100 border border-amber-200/60 px-1.5 py-0.5 rounded-full">
                        {filteredSuggestions.length}
                      </span>}
                    <button onClick={handleRefreshSuggestions} aria-label="Refresh AI suggestions" className="p-1 rounded-md text-muted-foreground hover:text-accent-foreground hover:bg-accent transition-colors">
                      <RefreshCw className={cn('w-3 h-3', refreshing && 'animate-spin')} />
                    </button>
                  </div>
                </div>

                {/* Confidence filter */}
                <div className="px-4 py-2.5 border-b border-border/50bg-muted/30">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-mono text-[9px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1">
                      <Sliders className="w-2.5 h-2.5" />Min. Confidence
                    </span>
                    <span className="font-mono text-[10px] font-bold text-muted-foreground">{confidenceMin}%</span>
                  </div>
                  <input type="range" min={0} max={95} step={5} value={confidenceMin} onChange={e => setConfidenceMin(Number(e.target.value))} className="w-full h-1 accent-amber-500 cursor-pointer" />
                </div>

                <div className="p-3">
                  {filteredSuggestions.length === 0 ? <motion.div initial={{
                  opacity: 0
                }} animate={{
                  opacity: 1
                }} className="flex flex-col items-center py-8 gap-2">
                      <CheckCircle2 className="w-7 h-7 text-emerald-400" />
                      <p className="font-sans text-[11px] text-muted-foreground text-center leading-relaxed">
                        {suggestions.length > 0 ? `${suggestions.length - filteredSuggestions.length} hidden by confidence filter.` : 'All suggestions reviewed!'}
                        <br /><span className="text-muted-foreground/80">New terms appear after next transcription.</span>
                      </p>
                    </motion.div> : <motion.div className="space-y-2" variants={listVariants} initial="hidden" animate="visible">
                      <AnimatePresence>
                        {filteredSuggestions.map(s => <SuggestionCard key={s.id} suggestion={s} onAccept={handleAcceptSuggestion} onDismiss={handleDismissSuggestion} />)}
                      </AnimatePresence>
                    </motion.div>}
                </div>

                <div className="px-3 pb-3">
                  <p className="font-sans text-[9px] text-muted-foreground text-center leading-relaxed">
                    Identified from recent transcripts using NLP entity detection.
                  </p>
                </div>
              </div>

              {/* Category distribution donut */}
              <div className="bg-card border border-border rounded-xl p-4 shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
                <div className="flex items-center gap-2 mb-3">
                  <BarChart2 className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Distribution</span>
                </div>
                <DonutChart terms={filteredTerms} />
              </div>

              {/* Pro Tips */}
              <div className="bg-gradient-to-br from-stone-900 to-stone-800 rounded-xl p-4 border border-stone-700/50 shadow-md">
                <div className="flex items-center gap-2 mb-3">
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-stone-400">Pro Tips</span>
                </div>
                <ul className="space-y-2.5">
                  {['Use syllable-CAPS phonetics for best AI accuracy.', 'Brand names with unusual spelling benefit most.', 'Terms appear in transcripts within 60 seconds.'].map((tip, i) => <li key={i} className="flex items-start gap-2">
                      <span className="font-mono text-[10px] text-stone-600 mt-0.5 flex-shrink-0">{String(i + 1).padStart(2, '0')}</span>
                      <span className="font-sans text-[11px] text-stone-400 leading-relaxed">{tip}</span>
                    </li>)}
                </ul>
              </div>
            </div>
          </div>

          <div className="h-12" />
        </div>
      </div>

      {/* ── Modals ── */}
      <AnimatePresence>
        {showAddModal && <AddTermModal onClose={() => setShowAddModal(false)} onAdd={handleAddTerm} existingTerms={terms} />}
      </AnimatePresence>
      <AnimatePresence>
        {showBulkImport && <BulkImportModal onClose={() => setShowBulkImport(false)} />}
      </AnimatePresence>
      <AnimatePresence>
        {showShortcuts && <ShortcutsModal onClose={() => setShowShortcuts(false)} />}
      </AnimatePresence>

      {/* ── Toast Notifications ── */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </>;
};
