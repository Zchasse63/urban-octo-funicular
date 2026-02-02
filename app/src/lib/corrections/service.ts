/**
 * Corrections Service for PodBrain
 * Handles transcript corrections and vocabulary learning
 */

import { createAdminClient } from '@/lib/supabase/server';
import type { Correction, Episode, TranscriptSegment } from '@/types/database';
import { learnFromCorrections } from '@/lib/vocabulary/service';
import { logger } from '@/lib/logger';

interface CreateCorrectionOptions {
  episodeId: string;
  originalText: string;
  correctedText: string;
  applyToVocabulary?: boolean;
}

interface CorrectionStats {
  totalCorrections: number;
  appliedToVocabulary: number;
  byEpisode: Array<{ episodeId: string; count: number }>;
}

/**
 * Create a new transcript correction
 */
export async function createCorrection(
  options: CreateCorrectionOptions
): Promise<Correction | null> {
  const {
    episodeId,
    originalText,
    correctedText,
    applyToVocabulary = false,
  } = options;

  const supabase = createAdminClient();

  // Insert the correction record
  const { data: correction, error } = await supabase
    .from('corrections')
    .insert({
      episode_id: episodeId,
      original_text: originalText,
      corrected_text: correctedText,
      applied_to_vocabulary: applyToVocabulary,
    })
    .select()
    .single();

  if (error) {
    logger.error('Failed to create correction', { error, episodeId });
    return null;
  }

  // Apply correction to the episode transcript
  await applyCorrectionsToEpisode(episodeId, [
    { original: originalText, corrected: correctedText },
  ]);

  // Learn from correction if requested
  if (applyToVocabulary) {
    const { data: episode } = await supabase
      .from('episodes')
      .select('show_id')
      .eq('id', episodeId)
      .single();

    if (episode) {
      await learnFromCorrections(episode.show_id, [
        { original: originalText, corrected: correctedText },
      ]);
    }
  }

  logger.info('Created correction', { episodeId, applyToVocabulary });
  return correction;
}

/**
 * Get all corrections for an episode
 */
export async function getEpisodeCorrections(
  episodeId: string
): Promise<Correction[]> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('corrections')
    .select('*')
    .eq('episode_id', episodeId)
    .order('created_at', { ascending: false });

  if (error) {
    logger.error('Failed to get corrections', { error, episodeId });
    return [];
  }

  return data || [];
}

/**
 * Get corrections for a show
 */
export async function getShowCorrections(showId: string): Promise<Correction[]> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('corrections')
    .select('*, episodes!inner(show_id)')
    .eq('episodes.show_id', showId)
    .order('created_at', { ascending: false });

  if (error) {
    logger.error('Failed to get show corrections', { error, showId });
    return [];
  }

  return data || [];
}

/**
 * Delete a correction
 */
export async function deleteCorrection(correctionId: string): Promise<boolean> {
  const supabase = createAdminClient();

  const { error } = await supabase
    .from('corrections')
    .delete()
    .eq('id', correctionId);

  if (error) {
    logger.error('Failed to delete correction', { error, correctionId });
    return false;
  }

  return true;
}

/**
 * Apply corrections to an episode's transcript
 */
export async function applyCorrectionsToEpisode(
  episodeId: string,
  corrections: Array<{ original: string; corrected: string }>
): Promise<boolean> {
  const supabase = createAdminClient();

  // Get current transcript
  const { data: episode, error: fetchError } = await supabase
    .from('episodes')
    .select('transcript, transcript_segments')
    .eq('id', episodeId)
    .single();

  if (fetchError || !episode) {
    logger.error('Failed to fetch episode for corrections', {
      error: fetchError,
      episodeId,
    });
    return false;
  }

  let transcript = episode.transcript || '';
  let segments: TranscriptSegment[] = episode.transcript_segments || [];

  // Apply each correction
  for (const { original, corrected } of corrections) {
    // Apply to full transcript
    const regex = new RegExp(escapeRegex(original), 'gi');
    transcript = transcript.replace(regex, corrected);

    // Apply to segments
    segments = segments.map((segment: TranscriptSegment) => ({
      ...segment,
      text: segment.text.replace(regex, corrected),
    }));
  }

  // Update episode
  const { error: updateError } = await supabase
    .from('episodes')
    .update({
      transcript,
      transcript_segments: segments,
      updated_at: new Date().toISOString(),
    })
    .eq('id', episodeId);

  if (updateError) {
    logger.error('Failed to apply corrections', {
      error: updateError,
      episodeId,
    });
    return false;
  }

  logger.info('Applied corrections to episode', {
    episodeId,
    correctionCount: corrections.length,
  });
  return true;
}

/**
 * Apply all corrections from a show to a new episode
 */
export async function applyShowCorrectionsToEpisode(
  showId: string,
  episodeId: string
): Promise<number> {
  const corrections = await getShowCorrections(showId);

  if (corrections.length === 0) {
    return 0;
  }

  const correctionPairs = corrections.map(c => ({
    original: c.original_text,
    corrected: c.corrected_text,
  }));

  const success = await applyCorrectionsToEpisode(episodeId, correctionPairs);
  return success ? correctionPairs.length : 0;
}

/**
 * Mark a correction as applied to vocabulary
 */
export async function markCorrectionAppliedToVocabulary(
  correctionId: string
): Promise<boolean> {
  const supabase = createAdminClient();

  const { data: correction, error: fetchError } = await supabase
    .from('corrections')
    .select('*, episodes!inner(show_id)')
    .eq('id', correctionId)
    .single();

  if (fetchError || !correction) {
    return false;
  }

  // Learn from this correction
  const episodeData = correction.episodes as { show_id: string };
  await learnFromCorrections(episodeData.show_id, [
    { original: correction.original_text, corrected: correction.corrected_text },
  ]);

  // Update the correction record
  const { error: updateError } = await supabase
    .from('corrections')
    .update({ applied_to_vocabulary: true })
    .eq('id', correctionId);

  if (updateError) {
    logger.error('Failed to mark correction applied', {
      error: updateError,
      correctionId,
    });
    return false;
  }

  return true;
}

/**
 * Get correction statistics for a show
 */
export async function getCorrectionStats(showId: string): Promise<CorrectionStats> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('corrections')
    .select('id, applied_to_vocabulary, episode_id, episodes!inner(show_id)')
    .eq('episodes.show_id', showId);

  if (error || !data) {
    return {
      totalCorrections: 0,
      appliedToVocabulary: 0,
      byEpisode: [],
    };
  }

  // Group by episode
  const byEpisode = new Map<string, number>();
  let appliedToVocabulary = 0;

  for (const correction of data) {
    const count = byEpisode.get(correction.episode_id) || 0;
    byEpisode.set(correction.episode_id, count + 1);

    if (correction.applied_to_vocabulary) {
      appliedToVocabulary++;
    }
  }

  return {
    totalCorrections: data.length,
    appliedToVocabulary,
    byEpisode: Array.from(byEpisode.entries())
      .map(([episodeId, count]) => ({ episodeId, count }))
      .sort((a, b) => b.count - a.count),
  };
}

/**
 * Find similar corrections that might already exist
 */
export async function findSimilarCorrections(
  episodeId: string,
  originalText: string
): Promise<Correction[]> {
  const supabase = createAdminClient();

  // Get episode's show_id
  const { data: episode } = await supabase
    .from('episodes')
    .select('show_id')
    .eq('id', episodeId)
    .single();

  if (!episode) {
    return [];
  }

  // Look for similar corrections in the same show
  const { data, error } = await supabase
    .from('corrections')
    .select('*, episodes!inner(show_id)')
    .eq('episodes.show_id', episode.show_id)
    .ilike('original_text', `%${originalText}%`)
    .limit(5);

  if (error) {
    return [];
  }

  return data || [];
}

/**
 * Bulk create corrections
 */
export async function bulkCreateCorrections(
  episodeId: string,
  corrections: Array<{ original: string; corrected: string }>,
  applyToVocabulary = false
): Promise<number> {
  const supabase = createAdminClient();

  const records = corrections.map(c => ({
    episode_id: episodeId,
    original_text: c.original,
    corrected_text: c.corrected,
    applied_to_vocabulary: applyToVocabulary,
  }));

  const { data, error } = await supabase
    .from('corrections')
    .insert(records)
    .select();

  if (error) {
    logger.error('Failed to bulk create corrections', { error, episodeId });
    return 0;
  }

  // Apply corrections to transcript
  await applyCorrectionsToEpisode(episodeId, corrections);

  // Learn from corrections if requested
  if (applyToVocabulary) {
    const { data: episode } = await supabase
      .from('episodes')
      .select('show_id')
      .eq('id', episodeId)
      .single();

    if (episode) {
      await learnFromCorrections(episode.show_id, corrections);
    }
  }

  return data?.length || 0;
}

/**
 * Escape special regex characters
 */
function escapeRegex(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
