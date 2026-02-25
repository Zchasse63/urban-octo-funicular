"use client"

import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Users, Search, Sparkles, X, Plus, Bookmark, BookmarkCheck, MapPin, Globe, Linkedin, Twitter, Filter, ChevronRight, Star, Zap, CheckCircle2, Loader2, SlidersHorizontal, TrendingUp, Award, Mic2, ArrowRight, Building2, Clock, BarChart2, MessageCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── Types ──────────────────────────────────────────────────────────────────────

interface Expert {
  id: string;
  name: string;
  title: string;
  organization: string;
  location: string;
  matchScore: number;
  aiInsight: string;
  expertise: string[];
  availability: 'available' | 'limited' | 'busy';
  pastAppearances: number;
  followers: string;
  linkedIn?: string;
  twitter?: string;
  website?: string;
  initials: string;
  avatarColor: string;
  featured?: boolean;
}
type FilterOption = 'All' | 'AI & Tech' | 'Finance' | 'Health' | 'Leadership' | 'Science';
type AvailabilityFilter = 'All' | 'Available' | 'Limited' | 'Busy';
type SortOption = 'match' | 'recent' | 'popular';

// ─── Data ───────────────────────────────────────────────────────────────────────

const EXAMPLE_QUERIES = ['AI researcher in edge computing', 'Fintech Series A founder', 'Climate tech policy expert', 'Behavioral economist turned VC', 'Ex-NASA engineer in deep tech', 'Neurotech startup CEO'];
const EXPERTS: Expert[] = [{
  id: 'e1',
  name: 'Dr. Priya Nair',
  title: 'Head of AI Research',
  organization: 'DeepMind',
  location: 'London, UK',
  matchScore: 98,
  aiInsight: 'Published 40+ papers on efficient neural architectures; her edge computing work directly aligns with your recent episodes on AI inference.',
  expertise: ['Edge Computing', 'Neural Nets', 'MLOps', 'LLMs'],
  availability: 'available',
  pastAppearances: 0,
  followers: '94k',
  twitter: '#',
  linkedIn: '#',
  initials: 'PN',
  avatarColor: 'from-violet-500 to-purple-600',
  featured: true
}, {
  id: 'e2',
  name: 'Marcus Chen',
  title: 'Founder & General Partner',
  organization: 'Horizon Ventures',
  location: 'San Francisco, CA',
  matchScore: 94,
  aiInsight: 'Led 3 Series A rounds in fintech this year; vocal on regulation and open banking — themes you covered in EP 11.',
  expertise: ['Fintech', 'Venture Capital', 'Open Banking', 'RegTech'],
  availability: 'limited',
  pastAppearances: 2,
  followers: '41k',
  linkedIn: '#',
  twitter: '#',
  website: '#',
  initials: 'MC',
  avatarColor: 'from-sky-500 to-blue-600'
}, {
  id: 'e3',
  name: 'Sofia Reyes',
  title: 'CEO & Co-founder',
  organization: 'NovaBio',
  location: 'Boston, MA',
  matchScore: 91,
  aiInsight: "Bridging CRISPR and consumer health — her TED talk on democratizing diagnostics has 2M views and matches your audience's interests.",
  expertise: ['Biotech', 'CRISPR', 'Health Policy', 'D2C Health'],
  availability: 'available',
  pastAppearances: 0,
  followers: '28k',
  linkedIn: '#',
  website: '#',
  initials: 'SR',
  avatarColor: 'from-emerald-500 to-teal-600'
}, {
  id: 'e4',
  name: 'James Okafor',
  title: 'Chief Economist',
  organization: 'World Economic Forum',
  location: 'Geneva, Switzerland',
  matchScore: 87,
  aiInsight: 'Behavioral economics applied to policy design; co-authored the WEF Future of Work report your audience has referenced multiple times.',
  expertise: ['Behavioral Econ', 'Global Policy', 'Labor Markets', 'Future of Work'],
  availability: 'limited',
  pastAppearances: 1,
  followers: '67k',
  linkedIn: '#',
  twitter: '#',
  initials: 'JO',
  avatarColor: 'from-amber-500 to-orange-500'
}, {
  id: 'e5',
  name: 'Dr. Yuki Tanaka',
  title: 'Principal Engineer, Space Systems',
  organization: 'Relativity Space',
  location: 'Los Angeles, CA',
  matchScore: 85,
  aiInsight: 'Ex-NASA JPL, now building 3D-printed rockets. Perfect for your deep tech crossover episodes — brings rare technical + commercial fluency.',
  expertise: ['Aerospace', 'Deep Tech', 'Manufacturing', 'Systems Eng'],
  availability: 'busy',
  pastAppearances: 0,
  followers: '19k',
  twitter: '#',
  website: '#',
  initials: 'YT',
  avatarColor: 'from-rose-500 to-pink-600'
}, {
  id: 'e6',
  name: 'Amara Diallo',
  title: 'Partner, Climate Tech',
  organization: 'Breakthrough Energy Ventures',
  location: 'New York, NY',
  matchScore: 82,
  aiInsight: 'Focuses on early-stage climate infrastructure; recently closed a $200M fund. Brings a boots-on-ground view of the energy transition.',
  expertise: ['Climate Tech', 'Clean Energy', 'ESG', 'Impact Investing'],
  availability: 'available',
  pastAppearances: 0,
  followers: '33k',
  linkedIn: '#',
  twitter: '#',
  initials: 'AD',
  avatarColor: 'from-lime-500 to-green-600'
}];
const SHORTLISTED_IDS_INIT = ['e1', 'e4'];

// ─── Helpers ────────────────────────────────────────────────────────────────────

const AVAILABILITY_CONFIG = {
  available: {
    label: 'Available',
    color: 'text-emerald-700',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200/60',
    dot: 'bg-emerald-500'
  },
  limited: {
    label: 'Limited',
    color: 'text-amber-700',
    bg: 'bg-amber-50',
    border: 'border-amber-200/60',
    dot: 'bg-amber-400'
  },
  busy: {
    label: 'Busy',
    color: 'text-rose-600',
    bg: 'bg-rose-50',
    border: 'border-rose-200/60',
    dot: 'bg-rose-400'
  }
};
const getScoreStyle = (score: number) => {
  if (score >= 95) return {
    bar: 'bg-emerald-500',
    text: 'text-emerald-700',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200/70'
  };
  if (score >= 85) return {
    bar: 'bg-sky-500',
    text: 'text-sky-700',
    bg: 'bg-sky-50',
    border: 'border-sky-200/70'
  };
  return {
    bar: 'bg-muted-foreground',
    text: 'text-muted-foreground',
    bg: 'bg-muted',
    border: 'border-border'
  };
};

// ─── Debounce hook ──────────────────────────────────────────────────────────────

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debouncedValue;
}

// ─── Animation Variants ─────────────────────────────────────────────────────────

const listVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.055
    }
  }
};
const cardVariants = {
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

// ─── Sub-components ─────────────────────────────────────────────────────────────

const ExpertAvatar = ({
  expert,
  size = 'md'
}: {
  expert: Expert;
  size?: 'sm' | 'md' | 'lg';
}) => {
  const sizes = {
    sm: 'w-8 h-8 text-[10px]',
    md: 'w-11 h-11 text-[13px]',
    lg: 'w-14 h-14 text-base'
  };
  return <div aria-hidden="true" className={cn('rounded-xl bg-gradient-to-br flex items-center justify-center font-sans font-bold text-white flex-shrink-0 shadow-sm', sizes[size], expert.avatarColor)}>
      {expert.initials}
    </div>;
};
const MatchScore = ({
  score,
  delay = 0
}: {
  score: number;
  delay?: number;
}) => {
  const style = getScoreStyle(score);
  return <div className={cn('flex items-center gap-2 px-2.5 py-1.5 rounded-lg border', style.bg, style.border)} title={`Match score: ${score}%`}>
      <div role="progressbar" aria-valuenow={score} aria-valuemin={0} aria-valuemax={100} aria-label={`${score}% match`} className="w-14 h-1 bg-border rounded-full overflow-hidden">
        <motion.div initial={{
        width: 0
      }} animate={{
        width: `${score}%`
      }} transition={{
        duration: 0.7,
        ease: 'easeOut',
        delay
      }} className={cn('h-full rounded-full', style.bar)} />
      </div>
      <span className={cn('font-mono text-[11px] font-bold', style.text)} aria-hidden="true">
        {score}% Match
      </span>
    </div>;
};
const ExpertCard = ({
  expert,
  index,
  shortlisted,
  onToggleShortlist
}: {
  expert: Expert;
  index: number;
  shortlisted: boolean;
  onToggleShortlist: (id: string) => void;
}) => {
  const [adding, setAdding] = useState(false);
  const avail = AVAILABILITY_CONFIG[expert.availability];
  const handleShortlist = useCallback(() => {
    if (shortlisted) {
      onToggleShortlist(expert.id);
      return;
    }
    setAdding(true);
    setTimeout(() => {
      setAdding(false);
      onToggleShortlist(expert.id);
    }, 600);
  }, [shortlisted, onToggleShortlist, expert.id]);
  return <motion.article variants={cardVariants} aria-label={`Expert: ${expert.name}, ${expert.title} at ${expert.organization}`} className={cn('group relative flex flex-col gap-0 bg-card border rounded-xl overflow-hidden transition-all duration-200', 'hover:shadow-[0_4px_20px_-4px_rgba(0,0,0,0.1)] hover:border-border/80', expert.featured ? 'border-border shadow-[0_2px_10px_-2px_rgba(0,0,0,0.07)]' : 'border-border shadow-[0_1px_4px_rgba(0,0,0,0.04)]')}>
      {/* Featured badge */}
      {expert.featured && <div aria-label="Top Match" className="absolute top-3 right-3 z-10 flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 border border-amber-200/80">
          <Star aria-hidden="true" className="w-2.5 h-2.5 text-amber-500 fill-amber-500" />
          <span className="font-mono text-[9px] font-bold text-amber-700 uppercase tracking-wider">Top Match</span>
        </div>}

      {/* Card body */}
      <div className="p-4 flex flex-col gap-3">
        {/* Header row */}
        <div className="flex items-start gap-3">
          <ExpertAvatar expert={expert} />
          <div className="flex-1 min-w-0 pt-0.5">
            <h3 className="font-sans font-bold text-[14px] text-foreground leading-tight tracking-tight truncate">
              {expert.name}
            </h3>
            <p className="font-sans text-[12px] text-muted-foreground leading-tight truncate">{expert.title}</p>
            <div className="flex items-center gap-1.5 mt-1">
              <Building2 aria-hidden="true" className="w-3 h-3 text-muted-foreground/50 flex-shrink-0" />
              <span className="font-sans text-[11px] text-muted-foreground font-medium truncate">{expert.organization}</span>
            </div>
          </div>
        </div>

        {/* Match score + availability */}
        <div className="flex items-center gap-2 flex-wrap">
          <MatchScore score={expert.matchScore} delay={index * 0.05} />
          <div className={cn('flex items-center gap-1.5 px-2 py-1 rounded-md border text-[10px] font-sans font-semibold', avail.bg, avail.border, avail.color)}>
            <div aria-hidden="true" className={cn('w-1.5 h-1.5 rounded-full', avail.dot)} />
            <span>{avail.label}</span>
          </div>
          <div className="flex items-center gap-1 ml-auto">
            <MapPin aria-hidden="true" className="w-3 h-3 text-muted-foreground/50" />
            <span className="font-sans text-[10px] text-muted-foreground/70">{expert.location}</span>
          </div>
        </div>

        {/* AI Insight */}
        <div className="bg-muted/50 border border-border rounded-lg p-2.5">
          <div className="flex items-center gap-1.5 mb-1.5">
            <div aria-hidden="true" className="w-4 h-4 rounded bg-amber-100 border border-amber-200/60 flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-2.5 h-2.5 text-amber-600" />
            </div>
            <span className="font-mono text-[9px] font-bold uppercase tracking-widest text-muted-foreground/70">
              Why This Match?
            </span>
          </div>
          <p className="font-serif text-[12px] text-muted-foreground leading-relaxed">{expert.aiInsight}</p>
        </div>

        {/* Expertise tags */}
        <ul aria-label="Expertise areas" className="flex flex-wrap gap-1.5 list-none p-0 m-0">
          {expert.expertise.map(tag => <li key={tag} className="font-mono text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-muted border border-border text-muted-foreground">
              {tag}
            </li>)}
        </ul>

        {/* Footer row */}
        <div className="flex items-center justify-between gap-2 pt-1 border-t border-border/50">
          {/* Social links */}
          <div className="flex items-center gap-1" role="list" aria-label="Social links">
            {expert.linkedIn && <a href={expert.linkedIn} aria-label={`${expert.name} on LinkedIn`} role="listitem" target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-md text-muted-foreground/50 hover:text-[#0A66C2] hover:bg-blue-50 transition-all focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:outline-none">
                <Linkedin className="w-3.5 h-3.5" />
              </a>}
            {expert.twitter && <a href={expert.twitter} aria-label={`${expert.name} on X / Twitter`} role="listitem" target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-md text-muted-foreground/50 hover:text-foreground hover:bg-accent transition-all focus-visible:ring-2 focus-visible:ring-stone-400 focus-visible:outline-none">
                <Twitter className="w-3.5 h-3.5" />
              </a>}
            {expert.website && <a href={expert.website} aria-label={`${expert.name}'s website`} role="listitem" target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-md text-muted-foreground/50 hover:text-muted-foreground hover:bg-accent transition-all focus-visible:ring-2 focus-visible:ring-stone-400 focus-visible:outline-none">
                <Globe className="w-3.5 h-3.5" />
              </a>}
            {expert.pastAppearances > 0 && <span className="ml-1 flex items-center gap-1 font-mono text-[9px] text-muted-foreground/70" aria-label={`${expert.pastAppearances} past appearances`}>
                <Mic2 aria-hidden="true" className="w-3 h-3" />
                {expert.pastAppearances}x on show
              </span>}
          </div>

          {/* Shortlist button */}
          <button onClick={handleShortlist} aria-label={shortlisted ? `Remove ${expert.name} from shortlist` : `Add ${expert.name} to shortlist`} aria-pressed={shortlisted} disabled={adding} className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-sans font-semibold transition-all focus-visible:ring-2 focus-visible:ring-stone-400 focus-visible:outline-none', shortlisted ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/70 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200/70' : adding ? 'bg-muted text-muted-foreground border border-border cursor-wait' : 'bg-stone-900 text-white hover:bg-stone-800 shadow-sm')}>
            {adding ? <>
                <Loader2 aria-hidden="true" className="w-3 h-3 animate-spin" />
                Adding...
              </> : shortlisted ? <>
                <BookmarkCheck aria-hidden="true" className="w-3 h-3" />
                Shortlisted
              </> : <>
                <Bookmark aria-hidden="true" className="w-3 h-3" />
                Add to Shortlist
              </>}
          </button>
        </div>
      </div>
    </motion.article>;
};

// ─── Shortlist Sidebar ──────────────────────────────────────────────────────────

const ShortlistPanel = ({
  experts,
  shortlistedIds,
  onRemove
}: {
  experts: Expert[];
  shortlistedIds: string[];
  onRemove: (id: string) => void;
}) => {
  const shortlisted = experts.filter(e => shortlistedIds.includes(e.id));
  return <section aria-label="Saved experts shortlist" className="bg-card border border-border rounded-xl overflow-hidden shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
        <div className="flex items-center gap-2">
          <div aria-hidden="true" className="w-5 h-5 rounded-md bg-stone-900 flex items-center justify-center">
            <BookmarkCheck className="w-3 h-3 text-white" />
          </div>
          <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Saved Experts</span>
        </div>
        {shortlisted.length > 0 && <span aria-label={`${shortlisted.length} saved`} className="font-mono text-[9px] font-bold text-muted-foreground bg-muted border border-border px-1.5 py-0.5 rounded-full">
            {shortlisted.length}
          </span>}
      </div>

      <div className="p-3">
        {shortlisted.length === 0 ? <div className="flex flex-col items-center py-7 gap-2">
            <div aria-hidden="true" className="w-9 h-9 rounded-full bg-muted flex items-center justify-center">
              <Bookmark className="w-4 h-4 text-muted-foreground/50" />
            </div>
            <p className="font-sans text-[11px] text-muted-foreground/70 text-center leading-relaxed">
              No experts saved yet.
              <br />
              <span className="text-muted-foreground/50">Add from the grid below.</span>
            </p>
          </div> : <ul aria-label="Shortlisted experts" className="space-y-2 list-none p-0 m-0">
            <AnimatePresence>
              {shortlisted.map(expert => <motion.li key={expert.id} initial={{
            opacity: 0,
            x: -8
          }} animate={{
            opacity: 1,
            x: 0
          }} exit={{
            opacity: 0,
            x: 12,
            transition: {
              duration: 0.15
            }
          }} className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-accent/50 group transition-colors">
                  <ExpertAvatar expert={expert} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="font-sans text-[11px] font-semibold text-foreground truncate leading-tight">
                      {expert.name}
                    </p>
                    <p className="font-sans text-[10px] text-muted-foreground/70 truncate leading-tight">{expert.organization}</p>
                  </div>
                  <button onClick={() => onRemove(expert.id)} aria-label={`Remove ${expert.name} from shortlist`} className="p-1 rounded text-muted-foreground/40 hover:text-rose-400 hover:bg-rose-50 opacity-0 group-hover:opacity-100 transition-all flex-shrink-0 focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-rose-300 focus-visible:outline-none">
                    <X className="w-3 h-3" />
                  </button>
                </motion.li>)}
            </AnimatePresence>
          </ul>}
      </div>

      {shortlisted.length > 0 && <div className="px-3 pb-3">
          <button aria-label={`Pitch shortlist of ${shortlisted.length} experts`} className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-stone-900 text-white text-[11px] font-sans font-semibold hover:bg-stone-800 transition-colors shadow-sm focus-visible:ring-2 focus-visible:ring-stone-400 focus-visible:outline-none">
            <MessageCircle aria-hidden="true" className="w-3.5 h-3.5" />
            Pitch Shortlist ({shortlisted.length})
          </button>
        </div>}
    </section>;
};

// ─── Filter Controls ─────────────────────────────────────────────────────────────

const FilterBar = ({
  activeFilter,
  availabilityFilter,
  sortOption,
  onFilterChange,
  onAvailabilityChange,
  onSortChange,
  resultCount
}: {
  activeFilter: FilterOption;
  availabilityFilter: AvailabilityFilter;
  sortOption: SortOption;
  onFilterChange: (f: FilterOption) => void;
  onAvailabilityChange: (a: AvailabilityFilter) => void;
  onSortChange: (s: SortOption) => void;
  resultCount: number;
}) => {
  const expertiseFilters: FilterOption[] = ['All', 'AI & Tech', 'Finance', 'Health', 'Leadership', 'Science'];
  const availabilityOptions: AvailabilityFilter[] = ['All', 'Available', 'Limited', 'Busy'];
  return <div className="flex flex-col gap-2.5">
      {/* Expertise pills */}
      <div role="group" aria-label="Filter by expertise" className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-0.5">
        <div className="flex items-center gap-1.5 flex-shrink-0 bg-muted/40 rounded-lg p-1 border border-border">
          {expertiseFilters.map(f => <button key={f} onClick={() => onFilterChange(f)} aria-pressed={activeFilter === f} className={cn('px-3 py-1.5 rounded-md text-[11px] font-sans font-medium transition-all whitespace-nowrap flex-shrink-0 focus-visible:ring-2 focus-visible:ring-stone-400 focus-visible:outline-none', activeFilter === f ? 'bg-card text-foreground shadow-[0_1px_4px_rgba(0,0,0,0.08)] border border-border' : 'text-muted-foreground hover:text-foreground/80 hover:bg-accent/50')}>
              {f}
            </button>)}
        </div>
      </div>

      {/* Second row: availability + sort + result count */}
      <div className="flex items-center gap-2 flex-wrap">
        <div role="group" aria-label="Filter by availability" className="flex items-center gap-1 bg-card border border-border rounded-lg p-1">
          <Clock aria-hidden="true" className="w-3.5 h-3.5 text-muted-foreground/70 ml-1.5" />
          {availabilityOptions.map(a => <button key={a} onClick={() => onAvailabilityChange(a)} aria-pressed={availabilityFilter === a} className={cn('px-2.5 py-1 rounded-md text-[10px] font-sans font-medium transition-all focus-visible:ring-2 focus-visible:ring-stone-400 focus-visible:outline-none', availabilityFilter === a ? 'bg-muted text-foreground border border-border' : 'text-muted-foreground/70 hover:text-muted-foreground')}>
              {a}
            </button>)}
        </div>

        <div role="group" aria-label="Sort experts" className="flex items-center gap-1 bg-card border border-border rounded-lg p-1">
          <BarChart2 aria-hidden="true" className="w-3.5 h-3.5 text-muted-foreground/70 ml-1.5" />
          {([['match', 'Best Match'], ['popular', 'Popular'], ['recent', 'Recent']] as [SortOption, string][]).map(([val, label]) => <button key={val} onClick={() => onSortChange(val)} aria-pressed={sortOption === val} className={cn('px-2.5 py-1 rounded-md text-[10px] font-sans font-medium transition-all focus-visible:ring-2 focus-visible:ring-stone-400 focus-visible:outline-none', sortOption === val ? 'bg-muted text-foreground border border-border' : 'text-muted-foreground/70 hover:text-muted-foreground')}>
              {label}
            </button>)}
        </div>

        <span className="ml-auto font-mono text-[10px] text-muted-foreground/70" aria-live="polite" aria-atomic="true">
          {resultCount} expert{resultCount !== 1 ? 's' : ''} found
        </span>
      </div>
    </div>;
};

// ─── Stats Bar ──────────────────────────────────────────────────────────────────

const StatsBar = () => <dl className="flex items-center gap-3 flex-wrap">
    {[{
    icon: Users,
    label: 'Indexed Experts',
    value: '12,400+',
    accent: 'text-foreground/80',
    bg: 'bg-muted border-border'
  }, {
    icon: TrendingUp,
    label: 'Avg. Match Quality',
    value: '91%',
    accent: 'text-emerald-700',
    bg: 'bg-emerald-50 border-emerald-200/60'
  }, {
    icon: Award,
    label: 'Domains Covered',
    value: '38',
    accent: 'text-sky-700',
    bg: 'bg-sky-50 border-sky-200/60'
  }, {
    icon: CheckCircle2,
    label: 'Verified Profiles',
    value: '8,100+',
    accent: 'text-violet-700',
    bg: 'bg-violet-50 border-violet-200/60'
  }].map(stat => {
    const Icon = stat.icon;
    return <div key={stat.label} className={cn('flex items-center gap-2 px-3 py-2 rounded-lg border', stat.bg)}>
          <Icon aria-hidden="true" className={cn('w-3.5 h-3.5 flex-shrink-0', stat.accent)} />
          <div>
            <dt className="font-sans text-[9px] text-muted-foreground/70 uppercase tracking-widest leading-none">{stat.label}</dt>
            <dd className={cn('font-mono text-sm font-bold', stat.accent)}>{stat.value}</dd>
          </div>
        </div>;
  })}
  </dl>;

// ─── Right Sidebar Panel ─────────────────────────────────────────────────────────

interface RightPanelProps {
  experts: Expert[];
  shortlistedIds: string[];
  onRemove: (id: string) => void;
  onPillClick: (s: string) => void;
  isOpen: boolean;
  onClose: () => void;
}
const RightPanel = ({
  experts,
  shortlistedIds,
  onRemove,
  onPillClick,
  isOpen,
  onClose
}: RightPanelProps) => {
  const content = <div className="space-y-3">
      {/* Shortlist panel */}
      <ShortlistPanel experts={experts} shortlistedIds={shortlistedIds} onRemove={onRemove} />

      {/* AI Discovery Tips */}
      <div className="bg-gradient-to-br from-stone-900 to-stone-800 rounded-xl p-4 border border-stone-700/50 shadow-md">
        <div className="flex items-center gap-2 mb-3">
          <Zap aria-hidden="true" className="w-3.5 h-3.5 text-amber-400" />
          <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">Discovery Tips</span>
        </div>
        <ul className="space-y-2.5">
          {['Be specific — mention niche topics, industries, or recent events.', 'Add audience context like "for a B2B SaaS audience" for better matches.', 'Combine roles: "ex-operator turned VC who writes publicly."'].map((tip, i) => <li key={i} className="flex items-start gap-2">
              <span aria-hidden="true" className="font-mono text-[10px] text-muted-foreground mt-0.5 flex-shrink-0">
                {String(i + 1).padStart(2, '0')}
              </span>
              <span className="font-sans text-[11px] text-muted-foreground/70 leading-relaxed">{tip}</span>
            </li>)}
        </ul>
      </div>

      {/* Browse by Domain */}
      <div className="bg-card border border-border rounded-xl p-4 shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
        <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70 block mb-3">
          Browse by Domain
        </span>
        <ul className="space-y-1.5 list-none p-0 m-0">
          {[{
          label: 'AI & Machine Learning',
          count: 3241,
          color: 'bg-violet-400'
        }, {
          label: 'Fintech & Venture',
          count: 2180,
          color: 'bg-sky-400'
        }, {
          label: 'Climate & Energy',
          count: 1840,
          color: 'bg-emerald-400'
        }, {
          label: 'Health & Biotech',
          count: 1560,
          color: 'bg-rose-400'
        }, {
          label: 'Leadership & Strategy',
          count: 1220,
          color: 'bg-amber-400'
        }].map(cat => <li key={cat.label}>
              <button className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-accent/50 group transition-colors text-left focus-visible:ring-2 focus-visible:ring-stone-400 focus-visible:outline-none" aria-label={`Browse ${cat.label}: ${cat.count.toLocaleString()} experts`}>
                <div aria-hidden="true" className={cn('w-2 h-2 rounded-full flex-shrink-0', cat.color)} />
                <span className="font-sans text-[11px] text-muted-foreground flex-1 group-hover:text-foreground transition-colors">
                  {cat.label}
                </span>
                <span className="font-mono text-[9px] text-muted-foreground/70">{cat.count.toLocaleString()}</span>
                <ChevronRight aria-hidden="true" className="w-3 h-3 text-muted-foreground/50 group-hover:text-muted-foreground transition-colors" />
              </button>
            </li>)}
        </ul>
      </div>

      {/* Recent Searches */}
      <div className="bg-card border border-border rounded-xl p-4 shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
        <div className="flex items-center justify-between mb-3">
          <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">Recent Searches</span>
          <button aria-label="Clear recent searches" className="font-sans text-[10px] text-muted-foreground/70 hover:text-muted-foreground transition-colors focus-visible:ring-2 focus-visible:ring-stone-400 focus-visible:outline-none rounded">
            Clear
          </button>
        </div>
        <ul className="space-y-1.5 list-none p-0 m-0">
          {['Neurotech startup CEO', 'Ex-NASA deep tech', 'Behavioral economist'].map(s => <li key={s}>
              <button onClick={() => onPillClick(s)} aria-label={`Search for: ${s}`} className="w-full flex items-center gap-2 text-left px-2 py-1.5 rounded-lg hover:bg-accent/50 group transition-colors focus-visible:ring-2 focus-visible:ring-stone-400 focus-visible:outline-none">
                <Search aria-hidden="true" className="w-3 h-3 text-muted-foreground/50 flex-shrink-0" />
                <span className="font-mono text-[10px] text-muted-foreground group-hover:text-foreground/80 truncate transition-colors">
                  {s}
                </span>
                <ArrowRight aria-hidden="true" className="w-3 h-3 text-muted-foreground/40 group-hover:text-muted-foreground/70 ml-auto transition-colors" />
              </button>
            </li>)}
        </ul>
      </div>
    </div>;
  return <>
      {/* Desktop panel */}
      <div className="w-[260px] flex-shrink-0 hidden lg:block">{content}</div>

      {/* Mobile/tablet slide-in panel */}
      <AnimatePresence>
        {isOpen && <>
            <motion.div initial={{
          opacity: 0
        }} animate={{
          opacity: 1
        }} exit={{
          opacity: 0
        }} onClick={onClose} className="fixed inset-0 z-40 bg-stone-900/40 backdrop-blur-sm lg:hidden" aria-hidden="true" />
            <motion.div role="dialog" aria-modal="true" aria-label="Shortlist and filters panel" initial={{
          x: '100%'
        }} animate={{
          x: 0
        }} exit={{
          x: '100%'
        }} transition={{
          duration: 0.25,
          ease: 'easeOut'
        }} className="fixed top-0 right-0 z-50 h-full w-[300px] bg-background border-l border-border shadow-xl overflow-y-auto p-4 lg:hidden">
              <div className="flex items-center justify-between mb-4">
                <span className="font-mono text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Panel</span>
                <button onClick={onClose} aria-label="Close panel" className="p-1.5 rounded-md text-muted-foreground/70 hover:text-foreground/80 hover:bg-muted transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
              {content}
            </motion.div>
          </>}
      </AnimatePresence>
    </>;
};

// ─── Main Component ─────────────────────────────────────────────────────────────

export function ExpertsPage() {
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [shortlistedIds, setShortlistedIds] = useState<string[]>(SHORTLISTED_IDS_INIT);
  const [activeFilter, setActiveFilter] = useState<FilterOption>('All');
  const [availabilityFilter, setAvailabilityFilter] = useState<AvailabilityFilter>('All');
  const [sortOption, setSortOption] = useState<SortOption>('match');
  const [panelOpen, setPanelOpen] = useState(false);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchInputRef = useRef<HTMLTextAreaElement>(null);
  const debouncedQuery = useDebounce(query, 300);
  const handleSearch = useCallback((q?: string) => {
    const searchQuery = q ?? query;
    if (!searchQuery.trim()) return;
    if (q !== undefined) setQuery(q);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    setSearching(true);
    searchTimerRef.current = setTimeout(() => {
      setSearching(false);
      setHasSearched(true);
    }, 1100);
  }, [query]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    };
  }, []);
  const handlePillClick = useCallback((pill: string) => {
    setQuery(pill);
    handleSearch(pill);
  }, [handleSearch]);
  const handleToggleShortlist = useCallback((id: string) => {
    setShortlistedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  }, []);
  const filteredExperts = useMemo(() => {
    let result = [...EXPERTS];
    if (availabilityFilter !== 'All') {
      result = result.filter(e => e.availability === availabilityFilter.toLowerCase());
    }
    if (sortOption === 'match') result.sort((a, b) => b.matchScore - a.matchScore);
    if (sortOption === 'popular') result.sort((a, b) => parseInt(b.followers) - parseInt(a.followers));
    return result;
  }, [availabilityFilter, sortOption]);
  return <>
      <main id="main-content" className="flex-1 h-full overflow-y-auto dot-bg">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-7">

          {/* ── Page Header ── */}
          <header className="mb-6">
            <div className="flex items-start justify-between gap-4 sm:gap-6">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2.5 flex-wrap">
                  <div aria-hidden="true" className="w-8 h-8 rounded-lg bg-stone-900 flex items-center justify-center shadow-md flex-shrink-0">
                    <Users className="w-4 h-4 text-stone-100" />
                  </div>
                  <div>
                    <h1 className="font-sans font-bold text-[22px] text-foreground tracking-tight leading-none">
                      Experts
                    </h1>
                    <p className="font-mono text-[9px] font-bold uppercase tracking-widest text-muted-foreground/70 leading-none mt-0.5">
                      AI-Powered Guest Discovery
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-violet-50 border border-violet-200/60">
                    <Sparkles aria-hidden="true" className="w-3 h-3 text-violet-500" />
                    <span className="font-sans text-[10px] font-bold text-violet-700 uppercase tracking-wider">
                      AI-Powered
                    </span>
                  </div>
                </div>
                <p className="font-serif text-sm text-muted-foreground/70 leading-relaxed mb-4">
                  Describe the ideal guest for your next episode and let PodBrain surface the most relevant experts —
                  ranked by topic relevance, audience fit, and availability.
                </p>
                <StatsBar />
              </div>

              {/* Right: actions */}
              <div className="flex-shrink-0 flex items-center gap-2">
                {/* Mobile: open right panel */}
                <button onClick={() => setPanelOpen(true)} aria-label="Open shortlist panel" className="flex lg:hidden items-center gap-1.5 px-3 py-2 rounded-lg border border-border bg-card text-muted-foreground hover:text-foreground hover:border-border text-[12px] font-sans font-semibold transition-all shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
                  <Bookmark className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Shortlist</span>
                  {shortlistedIds.length > 0 && <span className="font-mono text-[10px] bg-stone-900 text-white rounded-full px-1.5 py-0.5">
                      {shortlistedIds.length}
                    </span>}
                </button>
                <button aria-label="Open advanced filters" className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-border bg-card text-muted-foreground hover:text-foreground hover:border-border hover:bg-card text-[12px] font-sans font-semibold transition-all shadow-[0_1px_3px_rgba(0,0,0,0.05)] focus-visible:ring-2 focus-visible:ring-stone-400 focus-visible:outline-none">
                  <SlidersHorizontal aria-hidden="true" className="w-3.5 h-3.5" />
                  Advanced Filters
                </button>
                <button aria-label="Add a new expert" className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-stone-900 text-white text-[12px] font-sans font-semibold hover:bg-stone-800 transition-colors shadow-sm focus-visible:ring-2 focus-visible:ring-stone-400 focus-visible:outline-none">
                  <Plus aria-hidden="true" className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Add Expert</span>
                </button>
              </div>
            </div>
          </header>

          {/* ── AI Search Bar ── */}
          <section aria-label="AI expert search" className="mb-5">
            <div className="bg-card border border-border rounded-2xl shadow-[0_2px_12px_-4px_rgba(0,0,0,0.08)] overflow-hidden">
              {/* Search input */}
              <div className="flex items-start gap-3 px-5 py-4">
                <div aria-hidden="true" className="w-7 h-7 rounded-lg bg-amber-100 border border-amber-200/60 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                </div>
                <label htmlFor="expert-search" className="sr-only">
                  Describe your ideal expert guest
                </label>
                <textarea id="expert-search" ref={searchInputRef} value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSearch();
                }
              }} placeholder='Describe your ideal guest... e.g. "A biotech founder working on longevity who can speak to both science and business strategy."' rows={2} aria-describedby="search-hint" className="flex-1 font-serif text-[14px] text-foreground placeholder:text-muted-foreground bg-transparent border-none outline-none resize-none leading-relaxed" />
                <button onClick={() => handleSearch()} disabled={!query.trim() || searching} aria-label={searching ? 'Searching for experts...' : 'Discover experts'} className={cn('flex items-center gap-2 px-4 py-2.5 rounded-xl text-[12px] font-sans font-bold transition-all shadow-sm flex-shrink-0 self-end focus-visible:ring-2 focus-visible:ring-stone-400 focus-visible:outline-none', query.trim() && !searching ? 'bg-stone-900 text-white hover:bg-stone-800' : 'bg-muted text-muted-foreground/70 cursor-not-allowed')}>
                  {searching ? <>
                      <Loader2 aria-hidden="true" className="w-3.5 h-3.5 animate-spin" />
                      Searching...
                    </> : <>
                      <Search aria-hidden="true" className="w-3.5 h-3.5" />
                      Discover
                    </>}
                </button>
              </div>

              {/* Example query pills */}
              <div id="search-hint" className="flex items-center gap-2 px-5 pb-4 flex-wrap" aria-label="Example search queries">
                <span className="font-mono text-[9px] font-bold uppercase tracking-widest text-muted-foreground/70 flex-shrink-0" aria-hidden="true">
                  Try:
                </span>
                {EXAMPLE_QUERIES.map(pill => <button key={pill} onClick={() => handlePillClick(pill)} aria-label={`Search for: ${pill}`} className="font-mono text-[10px] text-muted-foreground px-2.5 py-1 rounded-full bg-muted border border-border hover:bg-border/60 hover:text-foreground/80 hover:border-border transition-all focus-visible:ring-2 focus-visible:ring-stone-400 focus-visible:outline-none">
                    {pill}
                  </button>)}
              </div>
            </div>
          </section>

          {/* ── Main Content Grid ── */}
          <div className="flex gap-5">

            {/* ── Left: Results ── */}
            <div className="flex-1 min-w-0 space-y-3">
              {/* Filter Controls */}
              <FilterBar activeFilter={activeFilter} availabilityFilter={availabilityFilter} sortOption={sortOption} onFilterChange={setActiveFilter} onAvailabilityChange={setAvailabilityFilter} onSortChange={setSortOption} resultCount={filteredExperts.length} />

              {/* Loading state */}
              <AnimatePresence>
                {searching && <motion.div key="loading" role="status" aria-live="polite" aria-label="Searching for experts" initial={{
                opacity: 0
              }} animate={{
                opacity: 1
              }} exit={{
                opacity: 0
              }} className="flex flex-col items-center justify-center py-20 gap-4">
                    <div aria-hidden="true" className="w-12 h-12 rounded-2xl bg-card border border-border flex items-center justify-center shadow-sm">
                      <Sparkles className="w-5 h-5 text-amber-500 animate-pulse" />
                    </div>
                    <div className="text-center">
                      <p className="font-sans font-semibold text-muted-foreground text-sm">Searching 12,400+ experts...</p>
                      <p className="font-serif text-[12px] text-muted-foreground/70 mt-0.5">
                        Ranking by topic relevance and audience fit
                      </p>
                    </div>
                    <div aria-hidden="true" className="flex gap-1.5">
                      {[0, 1, 2].map(i => <motion.div key={i} animate={{
                    opacity: [0.2, 1, 0.2]
                  }} transition={{
                    duration: 1.1,
                    delay: i * 0.22,
                    repeat: Infinity
                  }} className="w-1.5 h-1.5 rounded-full bg-muted-foreground" />)}
                    </div>
                  </motion.div>}
              </AnimatePresence>

              {/* Expert grid */}
              {!searching && <motion.div variants={listVariants} initial="hidden" animate="visible" role="feed" aria-label="Expert results" aria-busy={searching} className="grid grid-cols-1 xl:grid-cols-2 gap-3">
                  {filteredExperts.map((expert, i) => <ExpertCard key={expert.id} expert={expert} index={i} shortlisted={shortlistedIds.includes(expert.id)} onToggleShortlist={handleToggleShortlist} />)}
                </motion.div>}

              {/* Empty state (pre-search) */}
              {!searching && !hasSearched && filteredExperts.length === 0 && <div className="flex flex-col items-center justify-center py-20 gap-3">
                  <div aria-hidden="true" className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                    <Search className="w-5 h-5 text-muted-foreground/50" />
                  </div>
                  <p className="font-sans text-sm text-muted-foreground/70">Use the search above to discover experts</p>
                </div>}

              <div className="h-12" />
            </div>

            {/* ── Right Sidebar ── */}
            <RightPanel experts={EXPERTS} shortlistedIds={shortlistedIds} onRemove={handleToggleShortlist} onPillClick={handlePillClick} isOpen={panelOpen} onClose={() => setPanelOpen(false)} />
          </div>
        </div>
      </main>
    </>;
}

export default ExpertsPage;
