"use client"

import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { UploadCloud, Link2, X, FileAudio, Music, Check, Mic2, Youtube, Rss, AlertCircle, ArrowRight, Plus, Trash2, FileText, Twitter, Linkedin, Mail, BookOpen, Volume2, Hash, AlignLeft, Zap, Package, Users, ChevronRight, Sparkles, Brain, Wand2, Target, Globe, ChevronDown, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { extractErrorMessage } from '@/lib/errors';
import { safeParseError } from '@/lib/api/safe-parse-error';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import useShows from '@/hooks/use-shows';
import { useUsage } from '@/hooks/use-usage';
import { UpgradePrompt } from '@/components/ui/upgrade-prompt';
import { createClient as createSupabaseBrowserClient } from '@/lib/supabase/client';

// ─── Types ────────────────────────────────────────────────────────────────────

type UploadTab = 'file' | 'url';
interface SelectedFile {
  name: string;
  size: number;
  type: string;
  lastModified: number;
}
interface QueueItem {
  localId: string;
  file?: SelectedFile;
  rawFile?: File;
  url?: string;
  sourceType: 'file' | 'url';
}

type ContentStyle = 'educational' | 'conversational' | 'interview' | 'storytelling' | 'news';
type ToneStyle = 'professional' | 'casual' | 'inspirational' | 'technical' | 'humorous';

type EpisodeLanguage = 'en' | 'es' | 'pt' | 'fr' | 'de';

interface ExpertContext {
  showName: string;
  episodeTitle: string;
  description: string;
  guestName: string;
  guestBio: string;
  language: EpisodeLanguage;
  topics: string[];
}

interface StyleSelection {
  contentStyle: ContentStyle;
  toneStyle: ToneStyle;
  targetAudience: string;
  assetsToGenerate: string[];
}

// ─── Step Indicator ───────────────────────────────────────────────────────────

const STEPS = [{
  id: 1,
  label: 'Select Audio'
}, {
  id: 2,
  label: 'Expert Context'
}, {
  id: 3,
  label: 'Style & Assets'
}];
const StepIndicator = ({
  currentStep
}: {
  currentStep: number;
}) => <div className="flex items-center gap-0">
    {STEPS.map((step, i) => {
    const isDone = step.id < currentStep;
    const isActive = step.id === currentStep;
    const isPending = step.id > currentStep;
    return <React.Fragment key={step.id}>
          <div className="flex flex-col items-center gap-1.5">
            <div className={cn('w-7 h-7 rounded-full flex items-center justify-center border transition-all duration-300', isDone && 'bg-emerald-500 border-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.4)]', isActive && 'bg-stone-900 border-stone-800 shadow-[0_0_12px_rgba(0,0,0,0.25)]', isPending && 'bg-muted border-border')}>
              {isDone ? <Check className="w-3.5 h-3.5 text-white" /> : <span className={cn('font-mono text-[11px] font-bold', isActive ? 'text-white' : 'text-muted-foreground')}>
                  {step.id}
                </span>}
            </div>
            <span className={cn('font-sans text-[11px] font-medium whitespace-nowrap', isActive ? 'text-foreground' : 'text-muted-foreground')}>
              {step.label}
            </span>
          </div>
          {i < STEPS.length - 1 && <div className={cn('h-[2px] w-12 mb-4 rounded-full mx-1 transition-all duration-300', step.id < currentStep ? 'bg-emerald-300' : 'bg-border')} />}
        </React.Fragment>;
  })}
  </div>;

// ─── Format helpers ───────────────────────────────────────────────────────────

const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};
const getFileIcon = (type: string) => {
  if (type.includes('wav')) return Music;
  if (type.includes('m4a') || type.includes('mp4')) return FileAudio;
  return Mic2;
};
const ACCEPTED_FORMATS = [{
  ext: 'MP3',
  mime: 'audio/mpeg',
  color: 'text-orange-500',
  bg: 'bg-orange-50 border-orange-200/60'
}, {
  ext: 'WAV',
  mime: 'audio/wav',
  color: 'text-sky-500',
  bg: 'bg-sky-50 border-sky-200/60'
}, {
  ext: 'M4A',
  mime: 'audio/mp4',
  color: 'text-violet-500',
  bg: 'bg-violet-50 border-violet-200/60'
}];

// ─── URL Import Panel ─────────────────────────────────────────────────────────

const UrlImportPanel = ({
  onUrlSubmit
}: {
  onUrlSubmit: (url: string) => void;
}) => {
  const [url, setUrl] = useState('');
  const [urlError, setUrlError] = useState('');
  const detectUrlType = (val: string) => {
    if (val.includes('youtube.com') || val.includes('youtu.be')) return {
      type: 'YouTube',
      icon: Youtube,
      color: 'text-red-500'
    };
    if (val.includes('rss') || val.includes('.xml') || val.includes('feed')) return {
      type: 'RSS Feed',
      icon: Rss,
      color: 'text-orange-500'
    };
    if (val.startsWith('http')) return {
      type: 'Direct Link',
      icon: Link2,
      color: 'text-sky-500'
    };
    return null;
  };
  const detected = url ? detectUrlType(url) : null;
  const handleSubmit = () => {
    if (!url.trim()) {
      setUrlError('Please enter a URL');
      return;
    }
    if (!url.startsWith('http')) {
      setUrlError('Please enter a valid URL starting with http:// or https://');
      return;
    }
    setUrlError('');
    onUrlSubmit(url.trim());
    setUrl('');
  };
  return <div className="space-y-4">
      <div className="space-y-1.5">
        <label className="font-sans text-[12px] font-medium text-muted-foreground block">Paste a YouTube video or RSS feed URL</label>
        <div className="relative">
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
            {detected ? <detected.icon className={cn('w-4 h-4', detected.color)} /> : <Link2 className="w-4 h-4 text-muted-foreground" />}
          </div>
          <input type="url" value={url} onChange={e => {
          setUrl(e.target.value);
          setUrlError('');
        }} placeholder="https://youtube.com/watch?v=… or feed URL" className={cn('w-full pl-10 pr-4 py-3 rounded-xl text-sm font-sans text-foreground placeholder:text-muted-foreground', 'bg-card border focus:outline-none transition-all shadow-[0_1px_3px_rgba(0,0,0,0.04)]', urlError ? 'border-red-300 focus:border-red-400 focus:shadow-[0_0_0_3px_rgba(239,68,68,0.08)]' : 'border-border focus:border-stone-400 focus:shadow-[0_0_0_3px_rgba(120,113,108,0.1)]')} />
          {detected && <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
              <span className={cn('font-mono text-[9px] font-bold uppercase tracking-widest px-2 py-1 rounded-full border', detected.color === 'text-red-500' ? 'text-red-600 bg-red-50 border-red-200/60' : detected.color === 'text-orange-500' ? 'text-orange-600 bg-orange-50 border-orange-200/60' : 'text-sky-600 bg-sky-50 border-sky-200/60')}>
                {detected.type}
              </span>
            </div>}
        </div>
        {urlError && <div className="flex items-center gap-1.5 text-red-500">
            <AlertCircle className="w-3 h-3" />
            <span className="font-sans text-[11px]">{urlError}</span>
          </div>}
      </div>
      <div className="flex items-center gap-3">
        {[{
        icon: Youtube,
        label: 'YouTube',
        color: 'text-red-500'
      }, {
        icon: Rss,
        label: 'RSS Feed',
        color: 'text-orange-500'
      }, {
        icon: Link2,
        label: 'Direct Link',
        color: 'text-sky-500'
      }].map(({
        icon: Icon,
        label,
        color
      }) => <div key={label} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-muted/50 border border-border">
            <Icon className={cn('w-3 h-3', color)} />
            <span className="font-sans text-[11px] text-muted-foreground">{label}</span>
          </div>)}
      </div>
      <button onClick={handleSubmit} disabled={!url.trim()} className={cn('flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-sans font-semibold transition-all', url.trim() ? 'bg-stone-900 text-white hover:bg-stone-800 shadow-sm' : 'bg-muted text-muted-foreground cursor-not-allowed')}>
        <Link2 className="w-4 h-4" />
        Add to Queue
      </button>
    </div>;
};

// ─── Queue Item Row ───────────────────────────────────────────────────────────

const QueueItemRow = ({
  item,
  onRemove
}: {
  item: QueueItem;
  onRemove: () => void;
}) => {
  const FileIcon = item.file ? getFileIcon(item.file.type) : Link2;
  const ext = item.file ? item.file.name.split('.').pop()?.toUpperCase() ?? 'AUDIO' : 'URL';
  const formatConfig = item.file ? ACCEPTED_FORMATS.find(f => item.file!.type.toLowerCase().includes(f.ext.toLowerCase())) ?? ACCEPTED_FORMATS[0] : {
    color: 'text-sky-500',
    bg: 'bg-sky-50 border-sky-200/60'
  };
  return <motion.div layout initial={{
    opacity: 0,
    scale: 0.97,
    y: 8
  }} animate={{
    opacity: 1,
    scale: 1,
    y: 0
  }} exit={{
    opacity: 0,
    scale: 0.96,
    y: -4
  }} transition={{
    duration: 0.2,
    ease: 'easeOut'
  }} className="flex items-center gap-3 bg-muted/50 border border-border rounded-xl px-4 py-3 group">
      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-stone-700 to-stone-900 flex items-center justify-center flex-shrink-0 shadow-sm">
        <FileIcon className="w-4 h-4 text-stone-100" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="font-sans text-[13px] font-medium text-foreground truncate">
            {item.file ? item.file.name : item.url}
          </span>
          <span className={cn('font-mono text-[8px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-full border flex-shrink-0', formatConfig.color, formatConfig.bg)}>
            {ext}
          </span>
        </div>
        {item.file && <span className="font-mono text-[10px] text-muted-foreground">{formatBytes(item.file.size)}</span>}
      </div>
      <div className="flex items-center gap-1.5 flex-shrink-0">
        <div className="flex items-center gap-1">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.5)]" />
          <span className="font-mono text-[9px] font-bold text-emerald-600">Queued</span>
        </div>
        <button onClick={onRemove} className="p-1.5 rounded-md text-muted-foreground/80 hover:text-red-500 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100 border border-transparent hover:border-red-200/60">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </motion.div>;
};

// ─── Drop Zone ────────────────────────────────────────────────────────────────

const DropZone = ({
  onFileSelect,
  isDragOver,
  onDragOver,
  onDragLeave,
  onDrop,
  hasItems
}: {
  onFileSelect: (file: File) => void;
  isDragOver: boolean;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  hasItems: boolean;
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  return <motion.div data-testid="upload-drop-zone" onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop} onClick={() => inputRef.current?.click()} animate={{
    scale: isDragOver ? 1.015 : 1,
    borderColor: isDragOver ? 'rgba(28,25,23,0.5)' : 'rgba(214,211,209,0.8)'
  }} whileHover={{
    scale: 1.005
  }} transition={{
    duration: 0.18,
    ease: 'easeOut'
  }} className={cn('relative cursor-pointer rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-4 transition-colors', hasItems ? 'p-5' : 'p-10', isDragOver ? 'bg-muted/70' : 'bg-card hover:bg-muted/50')}>
      <input data-testid="upload-file-input" ref={inputRef} type="file" accept=".mp3,.wav,.m4a,audio/mpeg,audio/wav,audio/mp4" multiple className="hidden" onChange={e => {
      Array.from(e.target.files ?? []).forEach(f => onFileSelect(f));
      e.target.value = '';
    }} />
      <motion.div animate={isDragOver ? {
      y: -4,
      scale: 1.08
    } : {
      y: 0,
      scale: 1
    }} transition={{
      duration: 0.2,
      ease: 'easeOut'
    }} className={cn('w-12 h-12 rounded-xl flex items-center justify-center shadow-md transition-colors', isDragOver ? 'bg-stone-900' : 'bg-gradient-to-br from-stone-800 to-stone-900')}>
        <Plus className="w-6 h-6 text-stone-100" />
      </motion.div>
      <div className="text-center space-y-1">
        <p className="font-sans font-semibold text-foreground text-[14px] tracking-tight">
          {isDragOver ? 'Drop files here' : hasItems ? 'Add more files' : 'Drag & drop audio files'}
        </p>
        <p className="font-sans text-xs text-muted-foreground">
          or <span className="text-foreground/80 font-medium underline underline-offset-2 decoration-border">click to browse</span> · MP3, WAV, M4A
        </p>
      </div>
      <AnimatePresence>
        {isDragOver && <motion.div initial={{
        opacity: 0
      }} animate={{
        opacity: 1
      }} exit={{
        opacity: 0
      }} className="absolute inset-0 rounded-2xl border-2 border-stone-900/30 pointer-events-none" />}
      </AnimatePresence>
    </motion.div>;
};

// ─── Step 1: Select Audio ─────────────────────────────────────────────────────

const Step1 = ({
  queue,
  onAddFile,
  onAddUrl,
  onRemove
}: {
  queue: QueueItem[];
  onAddFile: (file: File) => void;
  onAddUrl: (url: string) => void;
  onRemove: (id: string) => void;
}) => {
  const [activeTab, setActiveTab] = useState<UploadTab>('file');
  const [isDragOver, setIsDragOver] = useState(false);
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);
  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    Array.from(e.dataTransfer.files ?? []).forEach(f => onAddFile(f));
  }, [onAddFile]);
  return <div className="space-y-5">
      {/* Queue */}
      {queue.length > 0 && <div className="space-y-2">
          <div className="flex items-center justify-between px-0.5">
            <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Queue · {queue.length} {queue.length === 1 ? 'episode' : 'episodes'}
            </span>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.4)]" />
              <span className="font-mono text-[9px] text-emerald-600 font-bold">Ready to process</span>
            </div>
          </div>
          <AnimatePresence>
            {queue.map(item => <QueueItemRow key={item.localId} item={item} onRemove={() => onRemove(item.localId)} />)}
          </AnimatePresence>
        </div>}

      {/* Input Card */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-[0_4px_24px_-6px_rgba(0,0,0,0.08),0_1px_0_rgba(255,255,255,1)_inset]">
        <div className="flex border-b border-border bg-muted/30">
          {([{
          id: 'file' as UploadTab,
          label: 'File Upload',
          icon: UploadCloud
        }, {
          id: 'url' as UploadTab,
          label: 'URL Import',
          icon: Link2
        }] as const).map(({
          id,
          label,
          icon: Icon
        }) => <button key={id} onClick={() => setActiveTab(id)} className={cn('relative flex items-center gap-2 px-6 py-3.5 text-[12px] font-sans font-medium transition-all duration-150 flex-1 justify-center', activeTab === id ? 'text-foreground bg-card' : 'text-muted-foreground hover:text-foreground/80 hover:bg-accent/50')}>
              <Icon className={cn('w-3.5 h-3.5', activeTab === id ? 'text-foreground' : 'text-muted-foreground')} />
              {label}
              {activeTab === id && <motion.div layoutId="uploadTabIndicator" className="absolute bottom-0 left-0 right-0 h-[2px] bg-stone-900 rounded-t-full" />}
            </button>)}
        </div>
        <div className="p-6">
          <AnimatePresence mode="wait">
            {activeTab === 'file' ? <motion.div key="file" initial={{
            opacity: 0,
            y: 6
          }} animate={{
            opacity: 1,
            y: 0
          }} exit={{
            opacity: 0,
            y: -4
          }} transition={{
            duration: 0.18
          }}>
                <DropZone onFileSelect={onAddFile} isDragOver={isDragOver} onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop} hasItems={queue.length > 0} />
              </motion.div> : <motion.div key="url" initial={{
            opacity: 0,
            y: 6
          }} animate={{
            opacity: 1,
            y: 0
          }} exit={{
            opacity: 0,
            y: -4
          }} transition={{
            duration: 0.18
          }}>
                <UrlImportPanel onUrlSubmit={onAddUrl} />
              </motion.div>}
          </AnimatePresence>
        </div>
      </div>
    </div>;
};

// ─── Step 2: Expert Context ───────────────────────────────────────────────────

const TOPIC_SUGGESTIONS = ['Entrepreneurship', 'Mindset', 'Productivity', 'Leadership', 'Philosophy', 'Technology', 'Health & Wellness', 'Finance', 'Creativity', 'Science'];
const LANGUAGE_OPTIONS: { value: EpisodeLanguage; label: string; flag: string }[] = [
  { value: 'en', label: 'English', flag: '🇺🇸' },
  { value: 'es', label: 'Spanish', flag: '🇪🇸' },
  { value: 'pt', label: 'Portuguese', flag: '🇧🇷' },
  { value: 'fr', label: 'French', flag: '🇫🇷' },
  { value: 'de', label: 'German', flag: '🇩🇪' },
];
const Step2 = ({
  context,
  onChange
}: {
  context: ExpertContext;
  onChange: (c: ExpertContext) => void;
}) => {
  const [topicInput, setTopicInput] = useState('');
  const addTopic = (t: string) => {
    const trimmed = t.trim();
    if (!trimmed || context.topics.includes(trimmed) || context.topics.length >= 8) return;
    onChange({
      ...context,
      topics: [...context.topics, trimmed]
    });
    setTopicInput('');
  };
  const removeTopic = (t: string) => onChange({
    ...context,
    topics: context.topics.filter(x => x !== t)
  });
  const field = (label: string, key: keyof ExpertContext, placeholder: string, multiline = false) => <div className="space-y-1.5">
      <label className="font-sans text-[12px] font-medium text-muted-foreground block">{label}</label>
      {multiline ? <textarea value={context[key] as string} onChange={e => onChange({
      ...context,
      [key]: e.target.value
    })} placeholder={placeholder} rows={3} className="w-full px-3.5 py-3 rounded-xl text-sm font-sans text-foreground placeholder:text-muted-foreground bg-card border border-border focus:outline-none focus:border-stone-400 focus:shadow-[0_0_0_3px_rgba(120,113,108,0.1)] transition-all shadow-[0_1px_3px_rgba(0,0,0,0.04)] resize-none" /> : <input type="text" value={context[key] as string} onChange={e => onChange({
      ...context,
      [key]: e.target.value
    })} placeholder={placeholder} className="w-full px-3.5 py-3 rounded-xl text-sm font-sans text-foreground placeholder:text-muted-foreground bg-card border border-border focus:outline-none focus:border-stone-400 focus:shadow-[0_0_0_3px_rgba(120,113,108,0.1)] transition-all shadow-[0_1px_3px_rgba(0,0,0,0.04)]" />}
    </div>;
  return <div className="space-y-5">
      <div className="bg-amber-50 border border-amber-200/60 rounded-xl px-4 py-3 flex items-start gap-3">
        <Brain className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
        <p className="font-sans text-[12px] text-amber-700 leading-relaxed">
          This context shapes every generated asset — show notes, social posts, SEO keywords, and more. The more detail you provide, the better the output.
        </p>
      </div>

      <div className="bg-card border border-border rounded-2xl p-5 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.06)] space-y-4">
        <div className="grid grid-cols-2 gap-4">
          {field('Show Name', 'showName', 'e.g. The Daily Focus')}
          {field('Episode Title', 'episodeTitle', 'e.g. Lessons from Marcus Aurelius')}
        </div>
        {field('Episode Description', 'description', 'Brief summary of what this episode covers…', true)}
        <div className="grid grid-cols-2 gap-4">
          {field("Guest Name", 'guestName', 'Full name or "Solo Episode"')}
          {field('Guest Bio / Role', 'guestBio', 'e.g. Author & Stoic philosopher')}
        </div>
        <div className="space-y-1.5">
          <label className="font-sans text-[12px] font-medium text-muted-foreground block flex items-center gap-1.5">
            <Globe className="w-3 h-3" />
            Episode Language
          </label>
          <select
            value={context.language}
            onChange={e => onChange({ ...context, language: e.target.value as EpisodeLanguage })}
            className="w-full px-3.5 py-3 rounded-xl text-sm font-sans text-foreground bg-card border border-border focus:outline-none focus:border-stone-400 focus:shadow-[0_0_0_3px_rgba(120,113,108,0.1)] transition-all shadow-[0_1px_3px_rgba(0,0,0,0.04)] appearance-none cursor-pointer"
          >
            {LANGUAGE_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>
                {opt.flag} {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Topics */}
      <div className="bg-card border border-border rounded-2xl p-5 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.06)] space-y-3">
        <div className="flex items-center gap-2">
          <Target className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="font-sans text-[12px] font-semibold text-foreground/80">Key Topics</span>
          <span className="font-mono text-[9px] text-muted-foreground ml-auto">{context.topics.length}/8</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {context.topics.map(t => <motion.span key={t} layout initial={{
          opacity: 0,
          scale: 0.85
        }} animate={{
          opacity: 1,
          scale: 1
        }} exit={{
          opacity: 0,
          scale: 0.85
        }} className="flex items-center gap-1.5 font-sans text-[11px] text-foreground/80 bg-muted border border-border px-2.5 py-1 rounded-full">
              {t}
              <button onClick={() => removeTopic(t)} className="text-muted-foreground hover:text-red-400 transition-colors">
                <X className="w-2.5 h-2.5" />
              </button>
            </motion.span>)}
          {context.topics.length < 8 && <div className="flex items-center gap-1">
              <input type="text" value={topicInput} onChange={e => setTopicInput(e.target.value)} onKeyDown={e => {
            if (e.key === 'Enter' || e.key === ',') {
              e.preventDefault();
              addTopic(topicInput);
            }
          }} placeholder="Add topic…" className="font-sans text-[11px] text-foreground/80 placeholder:text-muted-foreground/80 bg-transparent border-none outline-none w-24" />
            </div>}
        </div>
        <div className="flex flex-wrap gap-1.5 pt-1 border-t border-border/50">
          <span className="font-mono text-[9px] text-muted-foreground/80 uppercase tracking-widest w-full mb-1">Suggestions</span>
          {TOPIC_SUGGESTIONS.filter(s => !context.topics.includes(s)).slice(0, 6).map(s => <button key={s} onClick={() => addTopic(s)} className="font-sans text-[10px] text-muted-foreground bg-muted/50 hover:bg-accent border border-border px-2 py-0.5 rounded-full transition-colors">
              + {s}
            </button>)}
        </div>
      </div>
    </div>;
};

// ─── Step 3: Style & Asset Preview ───────────────────────────────────────────

const CONTENT_STYLES: {
  id: ContentStyle;
  label: string;
  desc: string;
}[] = [{
  id: 'educational',
  label: 'Educational',
  desc: 'Deep-dive teaching format'
}, {
  id: 'conversational',
  label: 'Conversational',
  desc: 'Casual, relatable tone'
}, {
  id: 'interview',
  label: 'Interview',
  desc: 'Guest-focused Q&A'
}, {
  id: 'storytelling',
  label: 'Storytelling',
  desc: 'Narrative-driven arc'
}, {
  id: 'news',
  label: 'News / Analysis',
  desc: 'Timely, analytical take'
}];
const TONE_STYLES: {
  id: ToneStyle;
  label: string;
}[] = [{
  id: 'professional',
  label: 'Professional'
}, {
  id: 'casual',
  label: 'Casual'
}, {
  id: 'inspirational',
  label: 'Inspirational'
}, {
  id: 'technical',
  label: 'Technical'
}, {
  id: 'humorous',
  label: 'Humorous'
}];
const ALL_ASSETS: {
  id: string;
  label: string;
  icon: React.ElementType;
  category: string;
  accentColor: string;
}[] = [{
  id: 'show-notes',
  label: 'Show Notes',
  icon: FileText,
  category: 'Core',
  accentColor: 'text-emerald-600'
}, {
  id: 'episode-desc',
  label: 'Episode Description',
  icon: AlignLeft,
  category: 'Core',
  accentColor: 'text-emerald-600'
}, {
  id: 'chapter-markers',
  label: 'Chapter Markers',
  icon: Hash,
  category: 'Core',
  accentColor: 'text-emerald-600'
}, {
  id: 'twitter-thread',
  label: 'Twitter/X Thread',
  icon: Twitter,
  category: 'Social',
  accentColor: 'text-sky-600'
}, {
  id: 'linkedin-post',
  label: 'LinkedIn Post',
  icon: Linkedin,
  category: 'Social',
  accentColor: 'text-sky-600'
}, {
  id: 'blog-post',
  label: 'Blog Article',
  icon: BookOpen,
  category: 'Long-form',
  accentColor: 'text-violet-600'
}, {
  id: 'newsletter',
  label: 'Newsletter Issue',
  icon: Mail,
  category: 'Long-form',
  accentColor: 'text-violet-600'
}, {
  id: 'audiogram-script',
  label: 'Audiogram Script',
  icon: Volume2,
  category: 'Visual',
  accentColor: 'text-rose-600'
}, {
  id: 'one-liner',
  label: 'One-liner Summary',
  icon: Zap,
  category: 'AI Summary',
  accentColor: 'text-muted-foreground'
}, {
  id: 'tldr',
  label: 'TL;DR Bullets',
  icon: AlignLeft,
  category: 'AI Summary',
  accentColor: 'text-muted-foreground'
}, {
  id: 'guest-bio',
  label: 'Guest Bio',
  icon: Users,
  category: 'Guest',
  accentColor: 'text-amber-600'
}, {
  id: 'guest-email',
  label: 'Post-show Email',
  icon: Mail,
  category: 'Guest',
  accentColor: 'text-amber-600'
}];
const DEFAULT_ASSETS = ['show-notes', 'episode-desc', 'chapter-markers', 'twitter-thread', 'one-liner', 'tldr'];
const Step3 = ({
  style,
  onChange
}: {
  style: StyleSelection;
  onChange: (s: StyleSelection) => void;
}) => {
  const toggleAsset = (id: string) => {
    const next = style.assetsToGenerate.includes(id) ? style.assetsToGenerate.filter(a => a !== id) : [...style.assetsToGenerate, id];
    onChange({
      ...style,
      assetsToGenerate: next
    });
  };
  const grouped = ALL_ASSETS.reduce<Record<string, typeof ALL_ASSETS>>((acc, a) => {
    if (!acc[a.category]) acc[a.category] = [];
    acc[a.category].push(a);
    return acc;
  }, {});
  return <div className="space-y-5">
      {/* Content Style */}
      <div className="bg-card border border-border rounded-2xl p-5 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.06)] space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <Wand2 className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="font-sans text-[12px] font-semibold text-foreground/80">Content Style</span>
        </div>
        <div className="grid grid-cols-5 gap-2">
          {CONTENT_STYLES.map(cs => <button key={cs.id} onClick={() => onChange({
          ...style,
          contentStyle: cs.id
        })} className={cn('flex flex-col items-center gap-1.5 px-2 py-3 rounded-xl border text-center transition-all', style.contentStyle === cs.id ? 'bg-stone-900 border-stone-800 text-white shadow-md' : 'bg-muted/50 border-border text-muted-foreground hover:border-border hover:bg-accent')}>
              <span className={cn('font-sans text-[11px] font-semibold leading-tight', style.contentStyle === cs.id ? 'text-white' : 'text-foreground')}>
                {cs.label}
              </span>
              <span className={cn('font-sans text-[9px] leading-tight', style.contentStyle === cs.id ? 'text-stone-300' : 'text-muted-foreground')}>
                {cs.desc}
              </span>
            </button>)}
        </div>
      </div>

      {/* Tone + Audience */}
      <div className="bg-card border border-border rounded-2xl p-5 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.06)] space-y-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Globe className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="font-sans text-[12px] font-semibold text-foreground/80">Tone</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {TONE_STYLES.map(ts => <button key={ts.id} onClick={() => onChange({
            ...style,
            toneStyle: ts.id
          })} className={cn('px-3 py-1.5 rounded-full border text-[11px] font-sans font-medium transition-all', style.toneStyle === ts.id ? 'bg-stone-900 border-stone-800 text-white shadow-sm' : 'bg-muted/50 border-border text-muted-foreground hover:border-border')}>
                {ts.label}
              </button>)}
          </div>
        </div>
        <div className="space-y-1.5">
          <label className="font-sans text-[12px] font-medium text-muted-foreground block">Target Audience</label>
          <input type="text" value={style.targetAudience} onChange={e => onChange({
          ...style,
          targetAudience: e.target.value
        })} placeholder="e.g. Founders, entrepreneurs, people interested in Stoicism" className="w-full px-3.5 py-3 rounded-xl text-sm font-sans text-foreground placeholder:text-muted-foreground bg-card border border-border focus:outline-none focus:border-stone-400 focus:shadow-[0_0_0_3px_rgba(120,113,108,0.1)] transition-all shadow-[0_1px_3px_rgba(0,0,0,0.04)]" />
        </div>
      </div>

      {/* Asset Selection */}
      <div className="bg-card border border-border rounded-2xl p-5 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.06)] space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Package className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="font-sans text-[12px] font-semibold text-foreground/80">Assets to Generate</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] text-muted-foreground">{style.assetsToGenerate.length} selected</span>
            <button onClick={() => onChange({
            ...style,
            assetsToGenerate: ALL_ASSETS.map(a => a.id)
          })} className="font-sans text-[10px] text-muted-foreground hover:text-foreground transition-colors underline underline-offset-2">
              Select all
            </button>
          </div>
        </div>
        {Object.entries(grouped).map(([category, assets]) => <div key={category}>
            <span className="font-mono text-[9px] font-bold uppercase tracking-widest text-muted-foreground block mb-1.5">{category}</span>
            <div className="grid grid-cols-2 gap-2">
              {assets.map(asset => {
            const Icon = asset.icon;
            const selected = style.assetsToGenerate.includes(asset.id);
            return <button key={asset.id} onClick={() => toggleAsset(asset.id)} className={cn('flex items-center gap-2.5 px-3 py-2.5 rounded-lg border text-left transition-all', selected ? 'bg-stone-900 border-stone-800 text-white shadow-sm' : 'bg-muted/50 border-border hover:border-border hover:bg-accent/60')}>
                    <Icon className={cn('w-3.5 h-3.5 flex-shrink-0', selected ? 'text-stone-300' : asset.accentColor)} />
                    <span className={cn('font-sans text-[11px] font-medium leading-tight', selected ? 'text-stone-100' : 'text-foreground/80')}>
                      {asset.label}
                    </span>
                    {selected && <Check className="w-3 h-3 text-emerald-400 ml-auto flex-shrink-0" />}
                  </button>;
          })}
            </div>
          </div>)}
      </div>

      {/* Preview banner */}
      <div className="bg-gradient-to-br from-stone-900 to-stone-800 rounded-2xl p-5 text-stone-50 shadow-lg">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-4 h-4 text-amber-300" />
          <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-stone-300">What happens next</span>
        </div>
        <div className="space-y-2">
          {[{
          icon: Mic2,
          label: 'Transcription via Whisper v3',
          detail: '~2–4 min'
        }, {
          icon: Brain,
          label: 'AI context & intelligence analysis',
          detail: 'Topics, sentiment, entities'
        }, {
          icon: Sparkles,
          label: `${style.assetsToGenerate.length} assets generated`,
          detail: style.assetsToGenerate.length > 0 ? style.assetsToGenerate.slice(0, 2).join(', ') + (style.assetsToGenerate.length > 2 ? `… +${style.assetsToGenerate.length - 2} more` : '') : 'None selected'
        }].map(({
          icon: Icon,
          label,
          detail
        }) => <div key={label} className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-md bg-white/10 flex items-center justify-center flex-shrink-0">
                <Icon className="w-3 h-3 text-stone-300" />
              </div>
              <div className="flex-1">
                <span className="font-sans text-[12px] text-stone-200">{label}</span>
              </div>
              <span className="font-mono text-[10px] text-stone-400">{detail}</span>
            </div>)}
        </div>
      </div>
    </div>;
};

// ─── Main Upload Wizard Component ─────────────────────────────────────────────

export const UploadWizard = ({
  onComplete
}: {
  onComplete?: (episodeId: string) => void;
}) => {
  const router = useRouter();
  const { shows } = useShows();
  const { usage } = useUsage();
  const [currentStep, setCurrentStep] = useState(1);
  const [localQueue, setLocalQueue] = useState<QueueItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [expertContext, setExpertContext] = useState<ExpertContext>({
    showName: '',
    episodeTitle: '',
    description: '',
    guestName: '',
    guestBio: '',
    language: 'en',
    topics: []
  });
  const [styleSelection, setStyleSelection] = useState<StyleSelection>({
    contentStyle: 'educational',
    toneStyle: 'professional',
    targetAudience: '',
    assetsToGenerate: DEFAULT_ASSETS
  });
  const addFile = useCallback((file: File) => {
    const allowed = ['audio/mpeg', 'audio/wav', 'audio/mp4', 'audio/x-m4a'];
    const allowedExts = ['.mp3', '.wav', '.m4a'];
    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!allowed.includes(file.type) && !allowedExts.includes(ext)) return;
    setLocalQueue(prev => [...prev, {
      localId: `local_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      file: {
        name: file.name,
        size: file.size,
        type: file.type || `audio/${ext.replace('.', '')}`,
        lastModified: file.lastModified
      },
      rawFile: file,
      sourceType: 'file'
    }]);
  }, []);
  const addUrl = useCallback((url: string) => {
    setLocalQueue(prev => [...prev, {
      localId: `local_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      url,
      sourceType: 'url'
    }]);
  }, []);
  const removeItem = useCallback((localId: string) => {
    setLocalQueue(prev => prev.filter(i => i.localId !== localId));
  }, []);
  const audioLimitReached = usage ? usage.audioHours.percentage >= 100 : false;
  const audioLimitApproaching = usage ? usage.audioHours.percentage >= 80 && usage.audioHours.percentage < 100 : false;
  const canProceed = localQueue.length > 0 && !audioLimitReached;
  /**
   * Process a single queue item: upload (if file source), create episode
   * record, trigger processing. Throws on any failure. Returns the created
   * episode id.
   */
  const processQueueItem = useCallback(
    async (item: QueueItem, showId: string): Promise<string> => {
      let audioUrl = '';

      // ── Step 1: For file sources, get a pre-signed upload URL and upload
      // directly to Supabase Storage. This bypasses Netlify Functions entirely
      // (which would otherwise impose a 6 MB body size limit and 10 s timeout
      // that break real podcast audio uploads).
      if (item.sourceType === 'file' && item.rawFile) {
        const file = item.rawFile;

        const signedRes = await fetch('/api/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileName: file.name,
            fileSize: file.size,
            mimeType: file.type || 'audio/mpeg',
          }),
        });

        if (!signedRes.ok) {
          throw new Error(await safeParseError(signedRes, 'Could not start upload'));
        }

        const signed = (await signedRes.json()) as {
          filePath: string;
          token: string;
          uploadUrl: string;
          publicUrl: string;
        };

        // Direct browser → Storage upload
        const supabase = createSupabaseBrowserClient();
        const { error: uploadError } = await supabase.storage
          .from('episodes')
          .uploadToSignedUrl(signed.filePath, signed.token, file, {
            contentType: file.type || 'audio/mpeg',
            upsert: false,
          });

        if (uploadError) {
          throw new Error(uploadError.message || 'Storage upload failed');
        }

        audioUrl = signed.publicUrl;
      } else if (item.sourceType === 'url' && item.url) {
        audioUrl = item.url;
      }

      if (!audioUrl) throw new Error('No audio source available');

      // ── Step 2: Create episode record
      // NOTE: `CreateEpisodeSchema` treats optional string fields with
      // `.optional()` which accepts `undefined` but NOT `null`. Sending
      // `null` for empty fields results in a 400 Zod validation error.
      // For multi-file uploads: the expert context (title/description/guest)
      // only applies to the first item. Subsequent items use the file name
      // as the title and leave context fields empty.
      const fallbackTitle = item.file?.name?.replace(/\.[^.]+$/, '') || 'Untitled Episode';
      const isFirstItem = localQueue[0]?.localId === item.localId;
      const createRes = await fetch('/api/episodes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          show_id: showId,
          title: isFirstItem && expertContext.episodeTitle ? expertContext.episodeTitle : fallbackTitle,
          description: isFirstItem ? expertContext.description || undefined : undefined,
          audio_url: audioUrl,
          guest_name: isFirstItem ? expertContext.guestName || undefined : undefined,
          guest_bio: isFirstItem ? expertContext.guestBio || undefined : undefined,
          language: expertContext.language || 'en',
        }),
      });
      if (!createRes.ok) {
        throw new Error(await safeParseError(createRes, 'Failed to create episode'));
      }
      const { data: episode } = await createRes.json();

      // ── Step 3: Trigger processing. A failure here is soft — the episode
      // row exists and the user can retry from the episode page.
      const processRes = await fetch(`/api/episodes/${episode.id}/process`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      if (!processRes.ok) {
        console.warn(`Processing dispatch failed for episode ${episode.id}`);
      }

      return episode.id as string;
    },
    [expertContext, localQueue]
  );

  const handleFinish = useCallback(async () => {
    if (localQueue.length === 0 || isSubmitting) return;

    const showId = shows[0]?.id;
    if (!showId) {
      toast.error('No show found. Create a show before uploading.');
      return;
    }

    setIsSubmitting(true);

    const total = localQueue.length;
    const createdEpisodeIds: string[] = [];
    const failures: { localId: string; name: string; error: string }[] = [];

    try {
      for (let i = 0; i < localQueue.length; i++) {
        const item = localQueue[i];
        const itemLabel = item.file?.name || item.url || `item ${i + 1}`;
        try {
          const episodeId = await processQueueItem(item, showId);
          createdEpisodeIds.push(episodeId);
        } catch (err) {
          failures.push({
            localId: item.localId,
            name: itemLabel,
            error: extractErrorMessage(err, 'Upload failed'),
          });
          // Continue processing remaining items — a single failure should
          // not block an otherwise-successful batch.
        }
      }

      // ── Summary toast ──
      if (createdEpisodeIds.length === total) {
        toast.success(
          total === 1
            ? 'Episode uploaded! Processing has started.'
            : `${total} episodes uploaded! Processing has started.`
        );
      } else if (createdEpisodeIds.length > 0) {
        toast.warning(
          `Uploaded ${createdEpisodeIds.length} of ${total}. ${failures.length} failed — see console for details.`
        );
        for (const f of failures) {
          console.error(`Upload failed for "${f.name}":`, f.error);
        }
      } else {
        toast.error(failures[0]?.error || 'Upload failed');
      }

      // ── Navigate to the first successfully-created episode ──
      if (createdEpisodeIds.length > 0) {
        const firstId = createdEpisodeIds[0];
        if (onComplete) onComplete(firstId);
        router.push(`/episodes/${firstId}`);
      }
    } finally {
      // CRITICAL: Always reset isSubmitting to avoid the stale-closure trap
      // where the Start Processing button stays permanently disabled after a
      // failed upload, requiring a full page reload.
      setIsSubmitting(false);
    }
  }, [localQueue, isSubmitting, shows, processQueueItem, onComplete, router]);
  const stepLabels = ['Select Audio', 'Expert Context', 'Style & Assets'];
  return <div className="flex-1 h-full overflow-y-auto relative">
      <div className="max-w-2xl mx-auto px-6 py-10">

        {/* ── Header ── */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-7">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-stone-800 to-black flex items-center justify-center shadow-md">
              <Mic2 className="w-4 h-4 text-stone-100" />
            </div>
            <div>
              <span className="font-bold text-sm text-foreground leading-none block tracking-tighter">PodBrain</span>
              <span className="font-mono text-[9px] font-bold uppercase tracking-widest text-muted-foreground leading-none">Upload Episode</span>
            </div>
          </div>

          <div className="bg-card border border-border rounded-2xl px-6 py-5 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.06),0_1px_0_rgba(255,255,255,1)_inset]">
            <div className="flex items-center justify-between mb-4">
              <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Progress</span>
              <span className="font-mono text-[10px] text-muted-foreground">Step {currentStep} of {STEPS.length}</span>
            </div>
            <div className="flex justify-center">
              <StepIndicator currentStep={currentStep} />
            </div>
          </div>
        </div>

        {/* ── Step Title ── */}
        <AnimatePresence mode="wait">
          <motion.div key={currentStep} initial={{
          opacity: 0,
          y: 8
        }} animate={{
          opacity: 1,
          y: 0
        }} exit={{
          opacity: 0,
          y: -6
        }} transition={{
          duration: 0.2,
          ease: 'easeOut'
        }} className="mb-6">
            {currentStep === 1 && <>
                <h1 className="font-sans font-bold text-[22px] text-foreground tracking-tight leading-tight mb-1.5">Select your audio</h1>
                <p className="font-serif text-sm text-muted-foreground leading-relaxed">Upload one or more audio files, or import from a URL. Batch-process multiple episodes at once.</p>
              </>}
            {currentStep === 2 && <>
                <h1 className="font-sans font-bold text-[22px] text-foreground tracking-tight leading-tight mb-1.5">Expert context</h1>
                <p className="font-serif text-sm text-muted-foreground leading-relaxed">Tell PodBrain about your episode — this shapes every AI-generated asset.</p>
              </>}
            {currentStep === 3 && <>
                <h1 className="font-sans font-bold text-[22px] text-foreground tracking-tight leading-tight mb-1.5">Style & asset selection</h1>
                <p className="font-serif text-sm text-muted-foreground leading-relaxed">Choose your content style, tone, and which assets to generate. Preview what's coming before you commit.</p>
              </>}
          </motion.div>
        </AnimatePresence>

        {/* ── Step Content ── */}
        <AnimatePresence mode="wait">
          <motion.div key={currentStep} initial={{
          opacity: 0,
          x: 16
        }} animate={{
          opacity: 1,
          x: 0
        }} exit={{
          opacity: 0,
          x: -12
        }} transition={{
          duration: 0.22,
          ease: 'easeOut'
        }}>
            {currentStep === 1 && <>
              {audioLimitReached && (
                <UpgradePrompt
                  title="Audio hours limit reached"
                  description="Upgrade your plan to continue processing episodes."
                  currentUsage={usage!.audioHours.used}
                  limit={usage!.audioHours.limit}
                  variant="banner"
                  className="mb-4"
                />
              )}
              {audioLimitApproaching && (
                <UpgradePrompt
                  title="Approaching audio hours limit"
                  description={`You've used ${usage!.audioHours.used} of ${usage!.audioHours.limit} audio hours this period.`}
                  currentUsage={usage!.audioHours.used}
                  limit={usage!.audioHours.limit}
                  variant="banner"
                  className="mb-4"
                />
              )}
              <Step1 queue={localQueue} onAddFile={audioLimitReached ? () => {} : addFile} onAddUrl={audioLimitReached ? () => {} : addUrl} onRemove={removeItem} />
            </>}
            {currentStep === 2 && <Step2 context={expertContext} onChange={setExpertContext} />}
            {currentStep === 3 && <Step3 style={styleSelection} onChange={setStyleSelection} />}
          </motion.div>
        </AnimatePresence>

        {/* ── Info strip (step 1 only) ── */}
        {currentStep === 1 && <div className="mt-4 flex items-center gap-2 px-1">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.5)]" />
              <span className="font-mono text-[10px]">Transcription via Whisper v3</span>
            </div>
            <span className="text-muted-foreground/80">·</span>
            <span className="font-mono text-[10px] text-muted-foreground">~2–4 min processing</span>
            <span className="text-muted-foreground/80">·</span>
            <span className="font-mono text-[10px] text-muted-foreground">End-to-end encrypted</span>
          </div>}

        {/* ── Navigation ── */}
        <div className="mt-6 flex items-center gap-3">
          {currentStep > 1 && <button data-testid="upload-back-button" onClick={() => setCurrentStep(s => s - 1)} className="flex items-center gap-2 px-5 py-3.5 rounded-xl text-sm font-sans font-semibold text-muted-foreground hover:text-foreground bg-card border border-border hover:border-border transition-all shadow-sm">
              <ChevronRight className="w-4 h-4 rotate-180" />
              Back
            </button>}

          {currentStep < STEPS.length ? <motion.button data-testid="upload-next-button" disabled={currentStep === 1 && !canProceed} onClick={() => setCurrentStep(s => s + 1)} whileHover={currentStep === 1 && !canProceed ? {} : {
          scale: 1.01
        }} whileTap={currentStep === 1 && !canProceed ? {} : {
          scale: 0.99
        }} className={cn('flex-1 flex items-center justify-center gap-3 py-3.5 rounded-xl text-sm font-sans font-semibold transition-all duration-200', currentStep === 1 && !canProceed ? 'bg-muted text-muted-foreground cursor-not-allowed border border-border' : 'bg-stone-900 text-white hover:bg-stone-800 shadow-[0_4px_16px_-4px_rgba(0,0,0,0.3)]')}>
              <span>Continue to {stepLabels[currentStep]}</span>
              <ArrowRight className="w-4 h-4" />
            </motion.button> : <motion.button data-testid="upload-submit-button" onClick={handleFinish} disabled={isSubmitting} whileHover={{
          scale: isSubmitting ? 1 : 1.01
        }} whileTap={{
          scale: isSubmitting ? 1 : 0.99
        }} className={cn("flex-1 flex items-center justify-center gap-3 py-3.5 rounded-xl text-sm font-sans font-semibold shadow-[0_4px_16px_-4px_rgba(16,185,129,0.4)] transition-all duration-200", isSubmitting ? "bg-emerald-600/70 text-white/80 cursor-not-allowed" : "bg-emerald-600 text-white hover:bg-emerald-500")}>
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 text-emerald-200" />}
              <span>{isSubmitting ? 'Uploading & Processing…' : `Start Processing ${localQueue.length > 1 ? `${localQueue.length} Episodes` : 'Episode'}`}</span>
            </motion.button>}
        </div>

        {currentStep === 1 && !canProceed && (
          <p className="text-center font-sans text-[11px] text-muted-foreground mt-2.5">
            {audioLimitReached
              ? 'Upgrade your plan to process more audio'
              : 'Select a file or import a URL to continue'}
          </p>
        )}

        <div className="h-10" />
      </div>
    </div>;
};
