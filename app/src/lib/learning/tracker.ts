/**
 * Learning Tracker for PodBrain
 * Analyzes what PodBrain learned from processing each episode.
 * Compares vocabulary before/after and tracks corrections applied.
 */

import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';

export interface LearningInsight {
  type: 'new_term' | 'correction_applied' | 'accuracy_improved' | 'pattern_detected';
  description: string;
  confidence: number; // 0-1
  metadata?: Record<string, unknown>;
}

export interface EpisodeLearnings {
  episodeId: string;
  insights: LearningInsight[];
  newTermsCount: number;
  correctionsApplied: number;
  vocabularyGrowth: number; // percentage
}

/**
 * Analyze what PodBrain learned from processing an episode.
 * Compares vocabulary before/after and tracks corrections.
 */
export async function getEpisodeLearnings(
  episodeId: string,
  showId: string
): Promise<EpisodeLearnings> {
  const supabase = await createClient();
  const insights: LearningInsight[] = [];

  // 1. Get the episode's processing time window
  const { data: episode } = await supabase
    .from('episodes')
    .select('created_at, updated_at')
    .eq('id', episodeId)
    .single();

  if (!episode) {
    return {
      episodeId,
      insights: [],
      newTermsCount: 0,
      correctionsApplied: 0,
      vocabularyGrowth: 0,
    };
  }

  const episodeCreatedAt = episode.created_at;
  const episodeUpdatedAt = episode.updated_at;

  // 2. Query vocabulary_terms created/updated around the episode's processing time
  const { data: newTerms } = await supabase
    .from('vocabulary_terms')
    .select('id, term, created_at, updated_at, occurrence_count')
    .eq('show_id', showId)
    .gte('created_at', episodeCreatedAt)
    .lte('created_at', episodeUpdatedAt)
    .order('created_at', { ascending: false });

  const newTermsList = newTerms ?? [];

  // 3. Query vocabulary terms that were updated (not new) during processing
  const { data: updatedTerms } = await supabase
    .from('vocabulary_terms')
    .select('id, term, updated_at, occurrence_count')
    .eq('show_id', showId)
    .lt('created_at', episodeCreatedAt)
    .gte('updated_at', episodeCreatedAt)
    .lte('updated_at', episodeUpdatedAt);

  const updatedTermsList = updatedTerms ?? [];

  // 4. Query corrections applied during this episode
  const { data: corrections } = await supabase
    .from('corrections')
    .select('id, original_text, corrected_text, applied_to_vocabulary, created_at')
    .eq('episode_id', episodeId)
    .order('created_at', { ascending: false });

  const correctionsList = corrections ?? [];
  const correctionsApplied = correctionsList.length;

  // 5. Get total vocabulary count for growth calculation
  const { count: totalTermsAfter } = await supabase
    .from('vocabulary_terms')
    .select('id', { count: 'exact', head: true })
    .eq('show_id', showId);

  const totalAfter = totalTermsAfter ?? 0;
  const newTermsCount = newTermsList.length;
  const totalBefore = totalAfter - newTermsCount;
  const vocabularyGrowth = totalBefore > 0
    ? Math.round((newTermsCount / totalBefore) * 100 * 10) / 10
    : newTermsCount > 0 ? 100 : 0;

  // 6. Build insight messages
  if (newTermsCount > 0) {
    const termNames = newTermsList.slice(0, 5).map(t => t.term);
    const suffix = newTermsCount > 5 ? ` and ${newTermsCount - 5} more` : '';
    insights.push({
      type: 'new_term',
      description: `Learned ${newTermsCount} new term${newTermsCount !== 1 ? 's' : ''}: ${termNames.join(', ')}${suffix}`,
      confidence: 0.95,
      metadata: {
        terms: newTermsList.map(t => t.term),
        count: newTermsCount,
      },
    });
  }

  if (correctionsApplied > 0) {
    insights.push({
      type: 'correction_applied',
      description: `Applied ${correctionsApplied} correction${correctionsApplied !== 1 ? 's' : ''} from your vocabulary`,
      confidence: 1.0,
      metadata: {
        corrections: correctionsList.map(c => ({
          original: c.original_text,
          corrected: c.corrected_text,
        })),
      },
    });
  }

  if (vocabularyGrowth > 0) {
    insights.push({
      type: 'accuracy_improved',
      description: `Vocabulary grew by ${vocabularyGrowth}% with this episode`,
      confidence: 0.9,
      metadata: {
        previousTotal: totalBefore,
        currentTotal: totalAfter,
        growthPercent: vocabularyGrowth,
      },
    });
  }

  if (updatedTermsList.length > 0) {
    const reinforcedNames = updatedTermsList.slice(0, 3).map(t => t.term);
    insights.push({
      type: 'pattern_detected',
      description: `Reinforced ${updatedTermsList.length} existing term${updatedTermsList.length !== 1 ? 's' : ''}: ${reinforcedNames.join(', ')}`,
      confidence: 0.85,
      metadata: {
        terms: updatedTermsList.map(t => t.term),
        count: updatedTermsList.length,
      },
    });
  }

  logger.info('Generated episode learnings', {
    episodeId,
    showId,
    insightCount: insights.length,
    newTermsCount,
    correctionsApplied,
  });

  return {
    episodeId,
    insights,
    newTermsCount,
    correctionsApplied,
    vocabularyGrowth,
  };
}
