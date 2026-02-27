"use client"

import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Users, Search, Sparkles, X, Plus, Bookmark, BookmarkCheck, MapPin, Globe, Linkedin, Twitter, ChevronRight, Star, Zap, CheckCircle2, Loader2, SlidersHorizontal, Mic2, ArrowRight, Building2, Clock, BarChart2, MessageCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import useExperts from '@/hooks/use-experts';
import useShows from '@/hooks/use-shows';
import type { Expert as ApiExpert, AppearanceRecord, ExpertSource } from '@/lib/experts/types';

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
  linkedIn?: string;
  twitter?: string;
  website?: string;
  initials: string;
  avatarColor: string;
  featured?: boolean;
  source: ExpertSource;
  appearances?: AppearanceRecord[];
}
type FilterOption = string;
type AvailabilityFilter = 'All' | 'Available' | 'Limited' | 'Busy';
type SortOption = 'match' | 'recent' | 'popular';

// ─── Data ───────────────────────────────────────────────────────────────────────

const EXAMPLE_QUERIES = ['AI researcher in edge computing', 'Fintech Series A founder', 'Climate tech policy expert', 'Behavioral economist turned VC', 'Ex-NASA engineer in deep tech', 'Neurotech startup CEO'];

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

// ─── API → UI Mapping ────────────────────────────────────────────────────────────

const AVATAR_COLORS = [
  'from-violet-500 to-purple-600',
  'from-sky-500 to-blue-600',
  'from-emerald-500 to-teal-600',
  'from-amber-500 to-orange-500',
  'from-rose-500 to-pink-600',
  'from-lime-500 to-green-600',
  'from-cyan-500 to-teal-500',
  'from-fuchsia-500 to-purple-600',
];

function mapApiExpert(apiExpert: ApiExpert, index: number): Expert {
  const nameParts = apiExpert.name.split(' ');
  const initials = nameParts.length >= 2
    ? `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}`
    : apiExpert.name.substring(0, 2).toUpperCase();

  const availability: Expert['availability'] =
    apiExpert.category === 'fresh' ? 'available' :
    apiExpert.category === 'established' ? 'limited' : 'busy';

  // Build organization from notable shows or affiliation
  const notableShows = apiExpert.metadata?.notableShows;
  const organization = apiExpert.metadata?.affiliation
    || (notableShows && notableShows.length > 0 ? notableShows[0] : '');

  // Build AI insight from appearances or bio
  const appearances = apiExpert.appearances || [];
  const aiInsight = apiExpert.metadata?.bio
    || (appearances.length > 0
      ? `Appeared on ${appearances.length} podcast${appearances.length !== 1 ? 's' : ''} including ${appearances.slice(0, 2).map(a => a.podcastName).join(', ')}.`
      : `${apiExpert.appearanceCount} podcast appearance${apiExpert.appearanceCount !== 1 ? 's' : ''} found.`);

  return {
    id: apiExpert.id,
    name: apiExpert.name,
    title: apiExpert.metadata?.bio?.split('.')[0] || (apiExpert.source === 'taddy' ? 'Podcast Guest' : 'Expert'),
    organization,
    location: '',
    matchScore: apiExpert.freshnessScore,
    aiInsight,
    expertise: apiExpert.expertise,
    availability,
    pastAppearances: apiExpert.appearanceCount,
    linkedIn: apiExpert.contactHints?.linkedin,
    twitter: apiExpert.contactHints?.twitter,
    website: apiExpert.contactHints?.website,
    initials,
    avatarColor: AVATAR_COLORS[index % AVATAR_COLORS.length],
    featured: index === 0 && apiExpert.freshnessScore > 90,
    source: apiExpert.source || 'grok',
    appearances: apiExpert.appearances,
  };
}

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
        {score}% Fresh
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
              <Building2 aria-hidden="true" className="w-3 h-3 text-muted-foreground/80 flex-shrink-0" />
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
          {expert.location && <div className="flex items-center gap-1 ml-auto">
            <MapPin aria-hidden="true" className="w-3 h-3 text-muted-foreground/80" />
            <span className="font-sans text-[10px] text-muted-foreground">{expert.location}</span>
          </div>}
        </div>

        {/* AI Insight / Appearances */}
        <div className="bg-muted/50 border border-border rounded-lg p-2.5">
          <div className="flex items-center gap-1.5 mb-1.5">
            <div aria-hidden="true" className="w-4 h-4 rounded bg-amber-100 border border-amber-200/60 flex items-center justify-center flex-shrink-0">
              {expert.source === 'taddy' ? <Mic2 className="w-2.5 h-2.5 text-amber-600" /> : <Sparkles className="w-2.5 h-2.5 text-amber-600" />}
            </div>
            <span className="font-mono text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
              {expert.source === 'taddy' ? 'Podcast Appearances' : 'Why This Match?'}
            </span>
            {expert.source === 'taddy' && (
              <span className="ml-auto font-mono text-[8px] font-bold uppercase tracking-widest text-emerald-600 bg-emerald-50 border border-emerald-200/60 px-1.5 py-0.5 rounded-full">
                Verified
              </span>
            )}
          </div>
          {expert.source === 'taddy' && expert.appearances && expert.appearances.length > 0 ? (
            <ul className="space-y-1.5 list-none p-0 m-0">
              {expert.appearances.slice(0, 3).map((app, i) => (
                <li key={i} className="flex items-start gap-2">
                  <div aria-hidden="true" className="w-1 h-1 rounded-full bg-muted-foreground/40 mt-1.5 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="font-sans text-[11px] text-foreground/80 leading-tight truncate">
                      {app.podcastName}
                    </p>
                    <p className="font-serif text-[10px] text-muted-foreground leading-tight truncate">
                      {app.episodeName}
                      {app.datePublished && (
                        <span className="ml-1.5 font-mono text-[9px] text-muted-foreground/60">
                          {new Date(app.datePublished).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                        </span>
                      )}
                    </p>
                  </div>
                </li>
              ))}
              {expert.appearances.length > 3 && (
                <li className="font-mono text-[9px] text-muted-foreground/70 pl-3">
                  +{expert.appearances.length - 3} more appearance{expert.appearances.length - 3 !== 1 ? 's' : ''}
                </li>
              )}
            </ul>
          ) : (
            <p className="font-serif text-[12px] text-muted-foreground leading-relaxed">{expert.aiInsight}</p>
          )}
        </div>

        {/* Expertise tags */}
        <ul aria-label="Expertise areas" className="flex flex-wrap gap-1.5 list-none p-0 m-0">
          {expert.expertise.map(tag => <li key={tag} className="font-mono text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-muted border border-border text-muted-foreground">
              {tag}
            </li>)}
        </ul>

        {/* Footer row */}
        <div className="flex items-center justify-between gap-2 pt-1 border-t border-border/50">
          {/* Social links + appearance count */}
          <div className="flex items-center gap-1" role="list" aria-label="Social links">
            {expert.linkedIn && expert.linkedIn !== '#' && <a href={expert.linkedIn} aria-label={`${expert.name} on LinkedIn`} role="listitem" target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-md text-muted-foreground/80 hover:text-[#0A66C2] hover:bg-blue-50 transition-all focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:outline-none">
                <Linkedin className="w-3.5 h-3.5" />
              </a>}
            {expert.twitter && expert.twitter !== '#' && <a href={expert.twitter} aria-label={`${expert.name} on X / Twitter`} role="listitem" target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-md text-muted-foreground/80 hover:text-foreground hover:bg-accent transition-all focus-visible:ring-2 focus-visible:ring-stone-400 focus-visible:outline-none">
                <Twitter className="w-3.5 h-3.5" />
              </a>}
            {expert.website && expert.website !== '#' && <a href={expert.website} aria-label={`${expert.name}'s website`} role="listitem" target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-md text-muted-foreground/80 hover:text-muted-foreground hover:bg-accent transition-all focus-visible:ring-2 focus-visible:ring-stone-400 focus-visible:outline-none">
                <Globe className="w-3.5 h-3.5" />
              </a>}
            {expert.pastAppearances > 0 && <span className="ml-1 flex items-center gap-1 font-mono text-[9px] text-muted-foreground" aria-label={`${expert.pastAppearances} podcast appearances`}>
                <Mic2 aria-hidden="true" className="w-3 h-3" />
                {expert.pastAppearances} appearance{expert.pastAppearances !== 1 ? 's' : ''}
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
              <Bookmark className="w-4 h-4 text-muted-foreground/80" />
            </div>
            <p className="font-sans text-[11px] text-muted-foreground text-center leading-relaxed">
              No experts saved yet.
              <br />
              <span className="text-muted-foreground/80">Add from the grid below.</span>
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
                    <p className="font-sans text-[10px] text-muted-foreground truncate leading-tight">{expert.organization}</p>
                  </div>
                  <button onClick={() => onRemove(expert.id)} aria-label={`Remove ${expert.name} from shortlist`} className="p-1 rounded text-muted-foreground/80 hover:text-rose-400 hover:bg-rose-50 opacity-0 group-hover:opacity-100 transition-all flex-shrink-0 focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-rose-300 focus-visible:outline-none">
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
  resultCount,
  expertiseFilters
}: {
  activeFilter: FilterOption;
  availabilityFilter: AvailabilityFilter;
  sortOption: SortOption;
  onFilterChange: (f: FilterOption) => void;
  onAvailabilityChange: (a: AvailabilityFilter) => void;
  onSortChange: (s: SortOption) => void;
  resultCount: number;
  expertiseFilters: FilterOption[];
}) => {
  const availabilityOptions: AvailabilityFilter[] = ['All', 'Available', 'Limited', 'Busy'];
  return <div className="flex flex-col gap-2">
      {/* Expertise pills */}
      <div role="group" aria-label="Filter by expertise" className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-0.5 -mx-1 px-1">
        <div className="flex items-center gap-1.5 flex-shrink-0 bg-muted/40 rounded-lg p-1 border border-border">
          {expertiseFilters.map(f => <button key={f} onClick={() => onFilterChange(f)} aria-pressed={activeFilter === f} className={cn('px-3 py-1.5 rounded-md text-[11px] font-sans font-medium transition-all whitespace-nowrap flex-shrink-0 focus-visible:ring-2 focus-visible:ring-stone-400 focus-visible:outline-none', activeFilter === f ? 'bg-card text-foreground shadow-[0_1px_4px_rgba(0,0,0,0.08)] border border-border' : 'text-muted-foreground hover:text-foreground/80 hover:bg-accent/50')}>
              {f}
            </button>)}
        </div>
      </div>

      {/* Second row: availability + sort + result count */}
      <div className="flex items-center gap-2 flex-wrap overflow-x-auto scrollbar-none">
        <div role="group" aria-label="Filter by availability" className="flex items-center gap-1 bg-card border border-border rounded-lg p-1">
          <Clock aria-hidden="true" className="w-3.5 h-3.5 text-muted-foreground ml-1.5" />
          {availabilityOptions.map(a => <button key={a} onClick={() => onAvailabilityChange(a)} aria-pressed={availabilityFilter === a} className={cn('px-2.5 py-1 rounded-md text-[10px] font-sans font-medium transition-all focus-visible:ring-2 focus-visible:ring-stone-400 focus-visible:outline-none', availabilityFilter === a ? 'bg-muted text-foreground border border-border' : 'text-muted-foreground hover:text-muted-foreground')}>
              {a}
            </button>)}
        </div>

        <div role="group" aria-label="Sort experts" className="flex items-center gap-1 bg-card border border-border rounded-lg p-1">
          <BarChart2 aria-hidden="true" className="w-3.5 h-3.5 text-muted-foreground ml-1.5" />
          {([['match', 'Best Match'], ['popular', 'Popular'], ['recent', 'Recent']] as [SortOption, string][]).map(([val, label]) => <button key={val} onClick={() => onSortChange(val)} aria-pressed={sortOption === val} className={cn('px-2.5 py-1 rounded-md text-[10px] font-sans font-medium transition-all focus-visible:ring-2 focus-visible:ring-stone-400 focus-visible:outline-none', sortOption === val ? 'bg-muted text-foreground border border-border' : 'text-muted-foreground hover:text-muted-foreground')}>
              {label}
            </button>)}
        </div>

        <span className="ml-auto font-mono text-[10px] text-muted-foreground" aria-live="polite" aria-atomic="true">
          {resultCount} expert{resultCount !== 1 ? 's' : ''} found
        </span>
      </div>
    </div>;
};

// ─── Stats Bar ──────────────────────────────────────────────────────────────────

const StatsBar = ({ expertCount, source }: { expertCount: number; source: ExpertSource | null }) => <dl className="grid grid-cols-2 sm:flex sm:items-center gap-2 sm:gap-3 sm:flex-wrap">
    {[{
    icon: Users,
    label: 'Experts Found',
    value: expertCount > 0 ? String(expertCount) : '--',
    accent: 'text-foreground/80',
    bg: 'bg-muted border-border'
  }, {
    icon: Mic2,
    label: 'Data Source',
    value: source === 'taddy' ? 'Taddy' : source === 'grok' ? 'AI' : 'Search',
    accent: source === 'taddy' ? 'text-emerald-700' : 'text-sky-700',
    bg: source === 'taddy' ? 'bg-emerald-50 border-emerald-200/60' : 'bg-sky-50 border-sky-200/60'
  }, {
    icon: CheckCircle2,
    label: 'Verified',
    value: source === 'taddy' ? 'Real Data' : 'AI-Enriched',
    accent: source === 'taddy' ? 'text-emerald-700' : 'text-violet-700',
    bg: source === 'taddy' ? 'bg-emerald-50 border-emerald-200/60' : 'bg-violet-50 border-violet-200/60'
  }].map(stat => {
    const Icon = stat.icon;
    return <div key={stat.label} className={cn('flex items-center gap-2 px-3 py-2 rounded-lg border', stat.bg)}>
          <Icon aria-hidden="true" className={cn('w-3.5 h-3.5 flex-shrink-0', stat.accent)} />
          <div>
            <dt className="font-sans text-[9px] text-muted-foreground uppercase tracking-widest leading-none">{stat.label}</dt>
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
          <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Discovery Tips</span>
        </div>
        <ul className="space-y-2.5">
          {['Be specific — mention niche topics, industries, or recent events.', 'Add audience context like "for a B2B SaaS audience" for better matches.', 'Combine roles: "ex-operator turned VC who writes publicly."'].map((tip, i) => <li key={i} className="flex items-start gap-2">
              <span aria-hidden="true" className="font-mono text-[10px] text-muted-foreground mt-0.5 flex-shrink-0">
                {String(i + 1).padStart(2, '0')}
              </span>
              <span className="font-sans text-[11px] text-muted-foreground leading-relaxed">{tip}</span>
            </li>)}
        </ul>
      </div>

      {/* Quick Search Topics */}
      <div className="bg-card border border-border rounded-xl p-4 shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
        <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground block mb-3">
          Quick Search Topics
        </span>
        <ul className="space-y-1.5 list-none p-0 m-0">
          {[{
          label: 'AI & Machine Learning',
          color: 'bg-violet-400'
        }, {
          label: 'Fintech & Venture Capital',
          color: 'bg-sky-400'
        }, {
          label: 'Climate & Energy',
          color: 'bg-emerald-400'
        }, {
          label: 'Health & Biotech',
          color: 'bg-rose-400'
        }, {
          label: 'Leadership & Strategy',
          color: 'bg-amber-400'
        }].map(cat => <li key={cat.label}>
              <button onClick={() => onPillClick(cat.label)} className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-accent/50 group transition-colors text-left focus-visible:ring-2 focus-visible:ring-stone-400 focus-visible:outline-none" aria-label={`Search for ${cat.label} experts`}>
                <div aria-hidden="true" className={cn('w-2 h-2 rounded-full flex-shrink-0', cat.color)} />
                <span className="font-sans text-[11px] text-muted-foreground flex-1 group-hover:text-foreground transition-colors">
                  {cat.label}
                </span>
                <ChevronRight aria-hidden="true" className="w-3 h-3 text-muted-foreground/80 group-hover:text-muted-foreground transition-colors" />
              </button>
            </li>)}
        </ul>
      </div>

      {/* Recent Searches */}
      <div className="bg-card border border-border rounded-xl p-4 shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
        <div className="flex items-center justify-between mb-3">
          <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Recent Searches</span>
          <button aria-label="Clear recent searches" className="font-sans text-[10px] text-muted-foreground hover:text-muted-foreground transition-colors focus-visible:ring-2 focus-visible:ring-stone-400 focus-visible:outline-none rounded">
            Clear
          </button>
        </div>
        <ul className="space-y-1.5 list-none p-0 m-0">
          {['Neurotech startup CEO', 'Ex-NASA deep tech', 'Behavioral economist'].map(s => <li key={s}>
              <button onClick={() => onPillClick(s)} aria-label={`Search for: ${s}`} className="w-full flex items-center gap-2 text-left px-2 py-1.5 rounded-lg hover:bg-accent/50 group transition-colors focus-visible:ring-2 focus-visible:ring-stone-400 focus-visible:outline-none">
                <Search aria-hidden="true" className="w-3 h-3 text-muted-foreground/80 flex-shrink-0" />
                <span className="font-mono text-[10px] text-muted-foreground group-hover:text-foreground/80 truncate transition-colors">
                  {s}
                </span>
                <ArrowRight aria-hidden="true" className="w-3 h-3 text-muted-foreground/80 group-hover:text-muted-foreground ml-auto transition-colors" />
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
                <button onClick={onClose} aria-label="Close panel" className="p-1.5 rounded-md text-muted-foreground hover:text-foreground/80 hover:bg-muted transition-colors">
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
  const { shows } = useShows();
  const activeShowId = shows?.[0]?.id;
  const { experts: apiExperts, isLoading: apiLoading, error: apiError, search: apiSearch, source: apiSource } = useExperts({ showId: activeShowId });

  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [shortlistedIds, setShortlistedIds] = useState<string[]>([]);
  const [activeFilter, setActiveFilter] = useState<FilterOption>('All');
  const [availabilityFilter, setAvailabilityFilter] = useState<AvailabilityFilter>('All');
  const [sortOption, setSortOption] = useState<SortOption>('match');
  const [panelOpen, setPanelOpen] = useState(false);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchInputRef = useRef<HTMLTextAreaElement>(null);
  const debouncedQuery = useDebounce(query, 300);

  const mappedExperts = useMemo(() => {
    return apiExperts.map((e, i) => mapApiExpert(e, i));
  }, [apiExperts]);

  // Derive expertise filter options from actual data
  const expertiseFilters: FilterOption[] = useMemo(() => {
    if (mappedExperts.length === 0) return ['All'];
    const allTags = new Set<string>();
    for (const expert of mappedExperts) {
      for (const tag of expert.expertise) {
        allTags.add(tag);
      }
    }
    // Take top 5 most common tags
    const tagCounts = new Map<string, number>();
    for (const expert of mappedExperts) {
      for (const tag of expert.expertise) {
        tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
      }
    }
    const sorted = Array.from(tagCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([tag]) => tag);
    return ['All', ...sorted];
  }, [mappedExperts]);

  const handleSearch = useCallback(async (q?: string) => {
    const searchQuery = q ?? query;
    if (!searchQuery.trim()) return;
    if (q !== undefined) setQuery(q);

    if (activeShowId) {
      setSearching(true);
      try {
        await apiSearch(searchQuery);
        setHasSearched(true);
      } catch (err) {
        // error handled by hook
      } finally {
        setSearching(false);
      }
    } else {
      // Fallback: original fake search for when no show is selected
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
      setSearching(true);
      searchTimerRef.current = setTimeout(() => {
        setSearching(false);
        setHasSearched(true);
      }, 1100);
    }
  }, [query, activeShowId, apiSearch]);

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
    let result = [...mappedExperts];
    // Filter by expertise tag
    if (activeFilter !== 'All') {
      result = result.filter(e => e.expertise.some(tag =>
        tag.toLowerCase().includes(activeFilter.toLowerCase())
      ));
    }
    if (availabilityFilter !== 'All') {
      result = result.filter(e => e.availability === availabilityFilter.toLowerCase());
    }
    if (sortOption === 'match') result.sort((a, b) => b.matchScore - a.matchScore);
    if (sortOption === 'popular') result.sort((a, b) => b.pastAppearances - a.pastAppearances);
    if (sortOption === 'recent') result.sort((a, b) => {
      const aDate = a.appearances?.[0]?.datePublished || '';
      const bDate = b.appearances?.[0]?.datePublished || '';
      return bDate.localeCompare(aDate);
    });
    return result;
  }, [mappedExperts, activeFilter, availabilityFilter, sortOption]);
  return <>
      <main id="main-content" className="flex-1 h-full overflow-y-auto">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-7">

          {/* ── Page Header ── */}
          <header className="mb-5 sm:mb-6">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 sm:gap-6">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2.5 flex-wrap">
                  <div aria-hidden="true" className="w-8 h-8 rounded-lg bg-stone-900 flex items-center justify-center shadow-md flex-shrink-0">
                    <Users className="w-4 h-4 text-stone-100" />
                  </div>
                  <div>
                    <h1 className="font-sans font-bold text-[22px] text-foreground tracking-tight leading-none">
                      Experts
                    </h1>
                    <p className="font-mono text-[9px] font-bold uppercase tracking-widest text-muted-foreground leading-none mt-0.5">
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
                <p className="font-serif text-sm text-muted-foreground leading-relaxed mb-4">
                  Describe the ideal guest for your next episode and let PodBrain surface the most relevant experts —
                  ranked by topic relevance, audience fit, and availability.
                </p>
                <StatsBar expertCount={mappedExperts.length} source={apiSource} />
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
                <button onClick={() => handleSearch()} disabled={!query.trim() || searching} aria-label={searching ? 'Searching for experts...' : 'Discover experts'} className={cn('flex items-center gap-2 px-4 py-2.5 rounded-xl text-[12px] font-sans font-bold transition-all shadow-sm flex-shrink-0 self-end focus-visible:ring-2 focus-visible:ring-stone-400 focus-visible:outline-none', query.trim() && !searching ? 'bg-stone-900 text-white hover:bg-stone-800' : 'bg-muted text-muted-foreground cursor-not-allowed')}>
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
                <span className="font-mono text-[9px] font-bold uppercase tracking-widest text-muted-foreground flex-shrink-0" aria-hidden="true">
                  Try:
                </span>
                {EXAMPLE_QUERIES.map(pill => <button key={pill} onClick={() => handlePillClick(pill)} aria-label={`Search for: ${pill}`} className="font-mono text-[10px] text-muted-foreground px-2.5 py-1 rounded-full bg-muted border border-border hover:bg-border/60 hover:text-foreground/80 hover:border-border transition-all focus-visible:ring-2 focus-visible:ring-stone-400 focus-visible:outline-none">
                    {pill}
                  </button>)}
              </div>
            </div>
          </section>

          {/* ── Main Content Grid ── */}
          <div className="flex flex-col lg:flex-row gap-5">

            {/* ── Left: Results ── */}
            <div className="flex-1 min-w-0 space-y-3">
              {/* Filter Controls */}
              <FilterBar activeFilter={activeFilter} availabilityFilter={availabilityFilter} sortOption={sortOption} onFilterChange={setActiveFilter} onAvailabilityChange={setAvailabilityFilter} onSortChange={setSortOption} resultCount={filteredExperts.length} expertiseFilters={expertiseFilters} />

              {/* Loading state */}
              <AnimatePresence>
                {(searching || apiLoading) && <motion.div key="loading" role="status" aria-live="polite" aria-label="Searching for experts" initial={{
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
                      <p className="font-sans font-semibold text-muted-foreground text-sm">Searching podcast episodes...</p>
                      <p className="font-serif text-[12px] text-muted-foreground mt-0.5">
                        Finding real guest appearances and ranking by freshness
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
              {!searching && !apiLoading && <motion.div variants={listVariants} initial="hidden" animate="visible" role="feed" aria-label="Expert results" aria-busy={searching || apiLoading} className="grid grid-cols-1 xl:grid-cols-2 gap-3">
                  {filteredExperts.map((expert, i) => <ExpertCard key={expert.id} expert={expert} index={i} shortlisted={shortlistedIds.includes(expert.id)} onToggleShortlist={handleToggleShortlist} />)}
                </motion.div>}

              {/* Empty state (pre-search) */}
              {!searching && !apiLoading && !hasSearched && filteredExperts.length === 0 && <div className="flex flex-col items-center justify-center py-20 gap-3">
                  <div aria-hidden="true" className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                    <Search className="w-5 h-5 text-muted-foreground/80" />
                  </div>
                  <p className="font-sans text-sm text-muted-foreground">Use the search above to discover experts</p>
                </div>}

              {/* Empty state (after search, no results) */}
              {!searching && !apiLoading && hasSearched && filteredExperts.length === 0 && <div className="flex flex-col items-center justify-center py-20 gap-3">
                  <div aria-hidden="true" className="w-12 h-12 rounded-full bg-amber-50 border border-amber-200/60 flex items-center justify-center">
                    <Users className="w-5 h-5 text-amber-500" />
                  </div>
                  <div className="text-center">
                    <p className="font-sans font-semibold text-muted-foreground text-sm">No experts found</p>
                    <p className="font-serif text-[12px] text-muted-foreground mt-1 max-w-sm">
                      Try a broader search term or different topic. Podcast guest data is based on real episode metadata from podcast feeds.
                    </p>
                  </div>
                </div>}

              {/* Error state */}
              {!searching && !apiLoading && apiError && <div className="flex flex-col items-center justify-center py-16 gap-3">
                  <div aria-hidden="true" className="w-12 h-12 rounded-full bg-rose-50 border border-rose-200/60 flex items-center justify-center">
                    <X className="w-5 h-5 text-rose-500" />
                  </div>
                  <div className="text-center">
                    <p className="font-sans font-semibold text-rose-600 text-sm">{apiError}</p>
                    <p className="font-serif text-[12px] text-muted-foreground mt-1">
                      Please try again or adjust your search.
                    </p>
                  </div>
                </div>}

              <div className="h-12" />
            </div>

            {/* ── Right Sidebar ── */}
            <RightPanel experts={mappedExperts} shortlistedIds={shortlistedIds} onRemove={handleToggleShortlist} onPillClick={handlePillClick} isOpen={panelOpen} onClose={() => setPanelOpen(false)} />
          </div>
        </div>
      </main>
    </>;
}

export default ExpertsPage;
