import type { RelatedEpisode, SimilarityResult, EpisodeContext } from './types';
import { generateEmbeddings } from './embeddings';
import { getSupabaseClient } from '@/lib/supabase-client';

export async function findSimilarSections(
  episodeId: string,
  threshold: number = 0.75
): Promise<SimilarityResult[]> {
  const supabase = await getSupabaseClient();
  const { data: querySections, error: sectionsError } = await supabase
    .from('episode_sections')
    .select('id, content, embedding')
    .eq('episode_id', episodeId)
    .limit(10);

  if (sectionsError || !querySections || querySections.length === 0) {
    return [];
  }

  const queryEmbedding = querySections[0].embedding;

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
    const { data: fallbackResults } = await supabase
      .from('episode_sections')
      .select('episode_id, id, content, start_time, end_time, speaker, embedding')
      .neq('episode_id', episodeId)
      .limit(10);

    if (!fallbackResults) return [];

    return fallbackResults.map((section) => ({
      episodeId: section.episode_id,
      sectionId: section.id,
      content: section.content,
      startTime: section.start_time,
      endTime: section.end_time,
      similarity: 0.5,
      speaker: section.speaker,
    }));
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
  const supabase = await getSupabaseClient();
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
