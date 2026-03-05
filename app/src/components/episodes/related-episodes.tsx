"use client"

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Link2, ChevronRight, Loader2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { extractErrorMessage } from '@/lib/errors';
import Link from 'next/link';

// ─── Types ──────────────────────────────────────────────────────────────────

interface MatchedSection {
  sectionId: string;
  content: string;
  startTime: number;
  endTime: number;
  similarity: number;
}

interface RelatedEpisodeData {
  episodeId: string;
  episodeTitle: string;
  episodeNumber?: number;
  similarityScore: number;
  extractedTopic: string;
  matchedSections: MatchedSection[];
}

interface RelatedEpisodesProps {
  episodeId: string;
}

// ─── Component ──────────────────────────────────────────────────────────────

const RelatedEpisodes: React.FC<RelatedEpisodesProps> = ({ episodeId }) => {
  const [relatedEpisodes, setRelatedEpisodes] = useState<RelatedEpisodeData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRelated = useCallback(async () => {
    if (!episodeId) return;
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/episodes/${episodeId}/related?limit=5`);
      if (!res.ok) {
        if (res.status === 404) {
          setRelatedEpisodes([]);
          return;
        }
        throw new Error('Failed to fetch related episodes');
      }
      const data = await res.json();
      setRelatedEpisodes(data.relatedEpisodes || []);
    } catch (err) {
      setError(extractErrorMessage(err, 'Failed to load related episodes'));
    } finally {
      setIsLoading(false);
    }
  }, [episodeId]);

  useEffect(() => {
    fetchRelated();
  }, [fetchRelated]);

  const formatSimilarity = (score: number): string => {
    return `${Math.round(score * 100)}%`;
  };

  const truncateText = (text: string, maxLen: number = 120): string => {
    if (text.length <= maxLen) return text;
    return text.slice(0, maxLen).trim() + '...';
  };

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
      {/* Header */}
      <div className="flex items-center gap-2.5 px-4 sm:px-5 py-3 border-b border-border bg-muted/50">
        <Link2 className="w-3.5 h-3.5 text-muted-foreground" />
        <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          Related Episodes
        </span>
        {!isLoading && relatedEpisodes.length > 0 && (
          <span className="ml-auto font-mono text-[9px] font-bold text-muted-foreground bg-muted border border-border px-1.5 py-0.5 rounded-full">
            {relatedEpisodes.length} found
          </span>
        )}
      </div>

      {/* Content */}
      <div className="px-4 sm:px-5 py-4">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-8 gap-3">
            <Loader2 className="w-5 h-5 text-muted-foreground animate-spin" />
            <p className="font-sans text-[12px] text-muted-foreground">
              Searching for similar episodes...
            </p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-8 gap-3">
            <AlertCircle className="w-5 h-5 text-muted-foreground" />
            <p className="font-sans text-[12px] text-muted-foreground">
              {error}
            </p>
          </div>
        ) : relatedEpisodes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 gap-3">
            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
              <Link2 className="w-5 h-5 text-muted-foreground" />
            </div>
            <div className="text-center">
              <p className="font-sans text-[13px] font-medium text-muted-foreground">
                No related episodes found
              </p>
              <p className="font-sans text-[11px] text-muted-foreground/70 mt-1">
                Related episodes appear when multiple episodes share similar content topics.
              </p>
            </div>
          </div>
        ) : (
          <motion.div
            className="space-y-2"
            initial="hidden"
            animate="visible"
            variants={{
              hidden: {},
              visible: { transition: { staggerChildren: 0.06 } },
            }}
          >
            {relatedEpisodes.map((ep) => (
              <motion.div
                key={ep.episodeId}
                variants={{
                  hidden: { opacity: 0, y: 8 },
                  visible: { opacity: 1, y: 0, transition: { duration: 0.2 } },
                }}
              >
                <Link
                  href={`/episodes/${ep.episodeId}`}
                  className="group flex items-start gap-3 py-3 px-3 rounded-lg hover:bg-accent/50 transition-colors border border-transparent hover:border-border"
                >
                  {/* Similarity badge */}
                  <div className="flex-shrink-0 mt-0.5">
                    <span
                      className={cn(
                        'inline-flex items-center font-mono text-[10px] font-bold px-2 py-1 rounded-md border',
                        ep.similarityScore >= 0.9
                          ? 'text-emerald-700 bg-emerald-50 border-emerald-200/60'
                          : ep.similarityScore >= 0.8
                            ? 'text-sky-700 bg-sky-50 border-sky-200/60'
                            : 'text-amber-700 bg-amber-50 border-amber-200/60'
                      )}
                    >
                      {formatSimilarity(ep.similarityScore)}
                    </span>
                  </div>

                  {/* Episode info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {ep.episodeNumber != null && (
                        <span className="font-mono text-[9px] font-bold text-muted-foreground bg-muted border border-border px-1.5 py-0.5 rounded-full">
                          EP {ep.episodeNumber}
                        </span>
                      )}
                      <span className="font-sans text-[13px] font-medium text-foreground group-hover:text-foreground truncate">
                        {ep.episodeTitle}
                      </span>
                    </div>
                    {ep.matchedSections.length > 0 && (
                      <p className="font-serif text-[11px] text-muted-foreground leading-relaxed line-clamp-2">
                        {truncateText(ep.matchedSections[0].content)}
                      </p>
                    )}
                  </div>

                  {/* Arrow */}
                  <ChevronRight className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 mt-1" />
                </Link>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default RelatedEpisodes;
