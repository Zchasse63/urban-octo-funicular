/**
 * Vocabulary Learning Service for PodBrain
 * Manages custom vocabulary terms for improved transcription accuracy
 */

import { createAdminClient } from '@/lib/supabase/server';
import type { VocabularyTerm } from '@/types/database';
import { logger } from '@/lib/logger';

interface AddTermOptions {
  showId: string;
  term: string;
  alternatives?: string[];
}

interface SearchResult {
  term: VocabularyTerm;
  similarity: number;
}

interface VocabularyStats {
  totalTerms: number;
  termsWithEmbeddings: number;
  topTerms: Array<{ term: string; count: number }>;
}

/**
 * Add a new vocabulary term for a show
 */
export async function addVocabularyTerm(
  options: AddTermOptions
): Promise<VocabularyTerm | null> {
  const { showId, term, alternatives = [] } = options;
  const supabase = createAdminClient();

  // Check if term already exists
  const { data: existing } = await supabase
    .from('vocabulary_terms')
    .select('id, occurrence_count')
    .eq('show_id', showId)
    .eq('term', term.toLowerCase())
    .single();

  if (existing) {
    // Increment occurrence count
    const { data: updated, error } = await supabase
      .from('vocabulary_terms')
      .update({
        occurrence_count: existing.occurrence_count + 1,
        alternatives: alternatives.length > 0 ? alternatives : undefined,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id)
      .select()
      .single();

    if (error) {
      logger.error('Failed to update vocabulary term', { error });
      return null;
    }

    return updated;
  }

  // Insert new term
  const { data: newTerm, error } = await supabase
    .from('vocabulary_terms')
    .insert({
      show_id: showId,
      term: term.toLowerCase(),
      alternatives,
      occurrence_count: 1,
    })
    .select()
    .single();

  if (error) {
    logger.error('Failed to add vocabulary term', { error });
    return null;
  }

  logger.info('Added vocabulary term', { showId, term });
  return newTerm;
}

/**
 * Get all vocabulary terms for a show
 */
export async function getShowVocabulary(
  showId: string
): Promise<VocabularyTerm[]> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('vocabulary_terms')
    .select('*')
    .eq('show_id', showId)
    .order('occurrence_count', { ascending: false });

  if (error) {
    logger.error('Failed to get vocabulary', { error, showId });
    return [];
  }

  return data || [];
}

/**
 * Get vocabulary terms formatted for AssemblyAI word boost
 */
export async function getWordBoostTerms(showId: string): Promise<string[]> {
  const vocabulary = await getShowVocabulary(showId);

  const terms: string[] = [];
  for (const item of vocabulary) {
    terms.push(item.term);
    if (item.alternatives) {
      terms.push(...item.alternatives);
    }
  }

  // AssemblyAI has a limit of ~1000 boost words
  return terms.slice(0, 1000);
}

/**
 * Delete a vocabulary term
 */
export async function deleteVocabularyTerm(termId: string): Promise<boolean> {
  const supabase = createAdminClient();

  const { error } = await supabase
    .from('vocabulary_terms')
    .delete()
    .eq('id', termId);

  if (error) {
    logger.error('Failed to delete vocabulary term', { error, termId });
    return false;
  }

  return true;
}

/**
 * Update a vocabulary term
 */
export async function updateVocabularyTerm(
  termId: string,
  updates: Partial<Pick<VocabularyTerm, 'term' | 'alternatives'>>
): Promise<VocabularyTerm | null> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('vocabulary_terms')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', termId)
    .select()
    .single();

  if (error) {
    logger.error('Failed to update vocabulary term', { error, termId });
    return null;
  }

  return data;
}

/**
 * Learn vocabulary from transcript corrections
 */
export async function learnFromCorrections(
  showId: string,
  corrections: Array<{ original: string; corrected: string }>
): Promise<number> {
  let learned = 0;

  for (const { original, corrected } of corrections) {
    // Add the corrected term with the original as an alternative
    const result = await addVocabularyTerm({
      showId,
      term: corrected,
      alternatives: [original],
    });

    if (result) {
      learned++;
    }
  }

  logger.info('Learned from corrections', { showId, learned });
  return learned;
}

/**
 * Extract potential vocabulary terms from transcript
 */
export function extractPotentialTerms(
  transcript: string,
  existingTerms: string[]
): string[] {
  const existingSet = new Set(existingTerms.map(t => t.toLowerCase()));
  const potentialTerms: Map<string, number> = new Map();

  // Look for capitalized words (proper nouns)
  const capitalizedPattern = /\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/g;
  const matches = transcript.match(capitalizedPattern) || [];

  for (const match of matches) {
    const lower = match.toLowerCase();
    if (!existingSet.has(lower) && match.length > 2) {
      potentialTerms.set(lower, (potentialTerms.get(lower) || 0) + 1);
    }
  }

  // Look for technical terms (camelCase, PascalCase, acronyms)
  const technicalPattern = /\b(?:[A-Z]{2,}|[a-z]+[A-Z][a-z]+)\b/g;
  const techMatches = transcript.match(technicalPattern) || [];

  for (const match of techMatches) {
    const lower = match.toLowerCase();
    if (!existingSet.has(lower)) {
      potentialTerms.set(lower, (potentialTerms.get(lower) || 0) + 1);
    }
  }

  // Return terms that appear at least twice, sorted by frequency
  return Array.from(potentialTerms.entries())
    .filter(([, count]) => count >= 2)
    .sort((a, b) => b[1] - a[1])
    .map(([term]) => term)
    .slice(0, 50);
}

/**
 * Get vocabulary statistics for a show
 */
export async function getVocabularyStats(
  showId: string
): Promise<VocabularyStats> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('vocabulary_terms')
    .select('term, occurrence_count, embedding')
    .eq('show_id', showId)
    .order('occurrence_count', { ascending: false });

  if (error || !data) {
    return {
      totalTerms: 0,
      termsWithEmbeddings: 0,
      topTerms: [],
    };
  }

  return {
    totalTerms: data.length,
    termsWithEmbeddings: data.filter(t => t.embedding !== null).length,
    topTerms: data.slice(0, 10).map(t => ({
      term: t.term,
      count: t.occurrence_count,
    })),
  };
}

/**
 * Apply vocabulary corrections to transcript text
 */
export function applyVocabularyCorrections(
  transcript: string,
  vocabulary: VocabularyTerm[]
): string {
  let corrected = transcript;

  for (const term of vocabulary) {
    if (term.alternatives && term.alternatives.length > 0) {
      for (const alt of term.alternatives) {
        // Case-insensitive replacement with proper casing
        const regex = new RegExp(`\\b${escapeRegex(alt)}\\b`, 'gi');
        corrected = corrected.replace(regex, term.term);
      }
    }
  }

  return corrected;
}

/**
 * Escape special regex characters
 */
function escapeRegex(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Merge duplicate vocabulary terms
 */
export async function mergeDuplicateTerms(showId: string): Promise<number> {
  const supabase = createAdminClient();

  const { data: terms, error } = await supabase
    .from('vocabulary_terms')
    .select('*')
    .eq('show_id', showId);

  if (error || !terms) {
    return 0;
  }

  // Group by normalized term
  const grouped = new Map<string, VocabularyTerm[]>();
  for (const term of terms) {
    const normalized = term.term.toLowerCase().trim();
    if (!grouped.has(normalized)) {
      grouped.set(normalized, []);
    }
    grouped.get(normalized)!.push(term);
  }

  let merged = 0;

  for (const [, group] of grouped) {
    if (group.length > 1) {
      // Keep the one with highest occurrence count
      group.sort((a, b) => b.occurrence_count - a.occurrence_count);
      const keeper = group[0];
      const toDelete = group.slice(1);

      // Merge alternatives and occurrence counts
      const allAlternatives = new Set<string>(keeper.alternatives || []);
      let totalCount = keeper.occurrence_count;

      for (const term of toDelete) {
        totalCount += term.occurrence_count;
        if (term.alternatives) {
          term.alternatives.forEach(alt => allAlternatives.add(alt));
        }
      }

      // Update keeper
      await supabase
        .from('vocabulary_terms')
        .update({
          occurrence_count: totalCount,
          alternatives: Array.from(allAlternatives),
          updated_at: new Date().toISOString(),
        })
        .eq('id', keeper.id);

      // Delete duplicates
      for (const term of toDelete) {
        await supabase.from('vocabulary_terms').delete().eq('id', term.id);
        merged++;
      }
    }
  }

  logger.info('Merged duplicate terms', { showId, merged });
  return merged;
}
