import { z } from 'zod';
import type { Expert, ExpertCategory } from './types';
import { getSupabaseClient } from '@/lib/supabase-client';

const safeUrlRegex = /^https?:\/\/[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(\/[a-zA-Z0-9._~:/?#[\]@!$&'()*+,;=-]*)?$/;
const twitterHandleRegex = /^@?[A-Za-z0-9_]{1,15}$/;

const ExpertSchema = z.object({
  name: z.string(),
  expertise: z.array(z.string()),
  affiliation: z.string().optional(),
  bio: z.string().optional(),
  appearanceCount: z.number().nonnegative(),
  recentAppearances: z.number().nonnegative(),
  website: z.string().regex(safeUrlRegex, 'Invalid website URL').optional(),
  twitter: z.string().regex(twitterHandleRegex, 'Invalid Twitter handle').optional(),
  linkedin: z.string().regex(safeUrlRegex, 'Invalid LinkedIn URL').optional(),
});

const DiscoveryResponseSchema = z.object({
  experts: z.array(ExpertSchema),
});

export async function discoverExperts(topic: string, showId: string): Promise<Expert[]> {
  const supabase = await getSupabaseClient();
  const cacheKey = `${showId}:${topic.toLowerCase()}`;
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const { data: cached } = await supabase
    .from('experts')
    .select('*')
    .eq('show_id', showId)
    .gte('cached_at', sevenDaysAgo.toISOString())
    .contains('metadata', { topic: topic.toLowerCase() })
    .limit(20);

  if (cached && cached.length > 0) {
    return cached.map((row) => ({
      id: row.id,
      name: row.name,
      category: row.category as ExpertCategory,
      freshnessScore: row.freshness_score,
      expertise: (row.metadata as { expertise?: string[] })?.expertise || [],
      appearanceCount: (row.metadata as { appearanceCount?: number })?.appearanceCount || 0,
      recentAppearances:
        (row.metadata as { recentAppearances?: number })?.recentAppearances || 0,
      contactHints: {
        website: (row.metadata as { website?: string })?.website,
        twitter: (row.metadata as { twitter?: string })?.twitter,
        linkedin: (row.metadata as { linkedin?: string })?.linkedin,
      },
      metadata: row.metadata as {
        affiliation?: string;
        bio?: string;
        lastAppearanceDate?: string;
      },
    }));
  }

  const { createGrokClient } = await import('@/lib/xai-client');
  const grokClient = createGrokClient();

  const systemPrompt = `You are an expert at discovering podcast guests in specific niches.

TASK: Find podcast guests in the requested topic who are:
1. Knowledgeable and credible
2. Have varying levels of podcast exposure (fresh to established)
3. Currently active and relevant

FRESHNESS CALCULATION:
- Fresh: <5 podcast appearances in last 12 months
- Established: 5-20 appearances in last 12 months
- Oversaturated: >20 appearances in last 12 months

Return JSON with expert details including name, expertise areas, affiliation, appearance counts, and contact hints.`;

  const userPrompt = `Find podcast guests in the "${topic}" niche.

Include:
- Name and credentials
- Expertise areas (array of strings)
- Affiliation/organization
- Estimated appearance count (total)
- Recent appearances (last 12 months)
- Contact information (website, Twitter, LinkedIn if available)
- Brief bio

Return 10-15 experts with varying freshness levels.

JSON structure:
{
  "experts": [
    {
      "name": "Dr. Jane Smith",
      "expertise": ["gut health", "microbiome"],
      "affiliation": "Stanford University",
      "bio": "Brief bio...",
      "appearanceCount": 15,
      "recentAppearances": 3,
      "website": "https://...",
      "twitter": "@...",
      "linkedin": "https://..."
    }
  ]
}`;

  const response = await grokClient.chat.completions.create({
    model: 'grok-beta',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    response_format: { type: 'json_object' } as { type: 'json_object' },
    temperature: 0.8,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error('No response from Grok API');
  }

  const MAX_AI_RESPONSE_SIZE = 500000;
  if (content.length > MAX_AI_RESPONSE_SIZE) {
    throw new Error(`AI response exceeds maximum allowed size of ${MAX_AI_RESPONSE_SIZE} characters`);
  }

  let validated;
  try {
    const parsed = JSON.parse(content);
    validated = DiscoveryResponseSchema.parse(parsed);
  } catch (parseError) {
    throw new Error('Invalid API response format');
  }

  const experts: Expert[] = validated.experts
    .filter((expert) => {
      if (expert.website && !safeUrlRegex.test(expert.website)) return false;
      if (expert.linkedin && !safeUrlRegex.test(expert.linkedin)) return false;
      if (expert.twitter && !twitterHandleRegex.test(expert.twitter)) return false;
      return true;
    })
    .map((expert) => {
      const freshnessScore = calculateFreshnessScore(
        expert.appearanceCount,
        expert.recentAppearances
      );
      const category = categorizeExpert(expert.recentAppearances);

      return {
        id: crypto.randomUUID(),
        name: expert.name,
        category,
        freshnessScore,
        expertise: expert.expertise,
        appearanceCount: expert.appearanceCount,
        recentAppearances: expert.recentAppearances,
        contactHints: {
          website: expert.website,
          twitter: expert.twitter,
          linkedin: expert.linkedin,
        },
        metadata: {
          affiliation: expert.affiliation,
          bio: expert.bio,
        },
      };
    });

  await Promise.all(
    experts.map((expert) =>
      supabase.from('experts').insert({
        show_id: showId,
        name: expert.name,
        category: expert.category,
        freshness_score: expert.freshnessScore,
        metadata: {
          topic,
          expertise: expert.expertise,
          appearanceCount: expert.appearanceCount,
          recentAppearances: expert.recentAppearances,
          website: expert.contactHints.website,
          twitter: expert.contactHints.twitter,
          linkedin: expert.contactHints.linkedin,
          affiliation: expert.metadata.affiliation,
          bio: expert.metadata.bio,
        },
      })
    )
  );

  return experts.sort((a, b) => b.freshnessScore - a.freshnessScore);
}

function calculateFreshnessScore(totalAppearances: number, recentAppearances: number): number {
  if (recentAppearances === 0) return 95;
  if (recentAppearances < 5) return 85 + (5 - recentAppearances) * 2;
  if (recentAppearances < 10) return 60 + (10 - recentAppearances) * 2;
  if (recentAppearances < 20) return 30 + (20 - recentAppearances);
  return Math.max(10, 30 - (recentAppearances - 20));
}

function categorizeExpert(recentAppearances: number): ExpertCategory {
  if (recentAppearances < 5) return 'fresh';
  if (recentAppearances <= 20) return 'established';
  return 'oversaturated';
}
