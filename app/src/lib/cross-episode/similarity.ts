import type { RelatedEpisode, SimilarityResult, EpisodeContext } from './types';
import { generateEmbeddings } from './embeddings';
import { createClient } from '@/lib/supabase/server';

export async function findSimilarSections(
  episodeId: string,
  threshold: number = 0.75
): Promise<SimilarityResult[]> {
  const supabase = await createClient();

  // Fetch the first usable section (non-null embedding) from this episode
  // to use as the query vector. Filtering in SQL avoids the case where the
  // first section happens to have NULL embedding and we'd pass NULL to the
  // RPC — which used to silently return nothing and fall through to a
  // lying fallback. See specs/bugs/processing-pipeline-bugs.md#bug-17.
  const { data: querySections, error: sectionsError } = await supabase
    .from('episode_sections')
    .select('id, content, embedding')
    .eq('episode_id', episodeId)
    .not('embedding', 'is', null)
    .limit(1);

  if (sectionsError || !querySections || querySections.length === 0) {
    return [];
  }

  const queryEmbedding = querySections[0].embedding;
  if (!queryEmbedding) {
    // Defensive: the .not('embedding','is',null) filter should guarantee
    // this, but handle the edge case rather than passing NULL to the RPC.
    return [];
  }

  const { data: similarSections, error: similarityError } = await supabase.rpc(
    'find_similar_sections',
    {
      query_embedding: queryEmbedding,
      match_threshold: threshold,
      match_count: 10,
      exclude_episode_id: episodeId,
    }
  );

  if (similarityError || !similarSections) {
    // HISTORICAL BUG #17 (fixed 2026-04-15): the original fallback here
    // returned 10 arbitrary non-matching sections with a hardcoded
    // similarity of 0.5. This showed users "Related Episodes" at 50%
    // confidence that had no actual semantic relationship to the source.
    // An honest empty return is strictly better than a confident lie.
    return [];
  }

  return similarSections.map((section: Record<string, unknown>) => ({
    episodeId: section.episode_id as string,
    sectionId: section.id as string,
    content: section.content as string,
    startTime: section.start_time as number,
    endTime: section.end_time as number,
    similarity: section.similarity as number,
    speaker: section.speaker as string | undefined,
  }));
}

export async function groupByEpisode(
  similarSections: SimilarityResult[]
): Promise<RelatedEpisode[]> {
  if (similarSections.length === 0) return [];

  const episodeIds = [...new Set(similarSections.map((s) => s.episodeId))];
  const supabase = await createClient();
  const { data: episodes } = await supabase
    .from('episodes')
    .select('id, title, metadata')
    .in('id', episodeIds);

  if (!episodes) return [];

  const episodeMap = new Map<string, EpisodeContext>(
    episodes.map((ep) => [
      ep.id,
      {
        id: ep.id,
        title: ep.title || 'Untitled Episode',
        episodeNumber: (ep.metadata as { episodeNumber?: number })?.episodeNumber,
      },
    ])
  );

  const grouped = similarSections.reduce((acc, section) => {
    const existing = acc.find((rel) => rel.episodeId === section.episodeId);
    if (existing) {
      existing.matchedSections.push({
        sectionId: section.sectionId,
        content: section.content,
        startTime: section.startTime,
        endTime: section.endTime,
        similarity: section.similarity,
      });
      existing.similarityScore = Math.max(existing.similarityScore, section.similarity);
    } else {
      const episodeContext = episodeMap.get(section.episodeId);
      if (episodeContext) {
        acc.push({
          episodeId: section.episodeId,
          episodeTitle: episodeContext.title,
          episodeNumber: episodeContext.episodeNumber,
          similarityScore: section.similarity,
          extractedTopic: extractTopic(section.content),
          matchedSections: [
            {
              sectionId: section.sectionId,
              content: section.content,
              startTime: section.startTime,
              endTime: section.endTime,
              similarity: section.similarity,
            },
          ],
        });
      }
    }
    return acc;
  }, [] as RelatedEpisode[]);

  return grouped.sort((a, b) => b.similarityScore - a.similarityScore);
}

function extractTopic(content: string): string {
  const words = content.split(' ').slice(0, 8).join(' ');
  return words.length > 60 ? words.slice(0, 60) + '...' : words;
}
