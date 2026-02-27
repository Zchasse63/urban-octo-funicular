import { z } from 'zod';
import type { Expert, ExpertCategory, ExpertSource, AppearanceRecord } from './types';
import { createClient } from '@/lib/supabase/server';
import { isTaddyAvailable } from '@/lib/taddy/client';
import { searchEpisodesWithCache, cacheGuestAppearances } from '@/lib/taddy/cache';
import type { TaddyEpisode, TaddyPerson } from '@/lib/taddy/types';

// --------------------------------------------------------------------------
// Grok validation schemas (used only for the Grok fallback path)
// --------------------------------------------------------------------------

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

const GrokDiscoveryResponseSchema = z.object({
  experts: z.array(ExpertSchema),
});

// --------------------------------------------------------------------------
// Public API
// --------------------------------------------------------------------------

/**
 * Discover experts for a given topic.
 *
 * Primary path: Taddy podcast search -> extract real persons -> score
 * Fallback: xAI Grok generation (only when Taddy is not configured)
 *
 * The `forceSource` parameter can be used to explicitly choose a path.
 */
export async function discoverExperts(
  topic: string,
  showId: string,
  forceSource?: ExpertSource
): Promise<{ experts: Expert[]; source: ExpertSource }> {
  // Determine which source to use
  const useTaddy =
    forceSource === 'taddy' ||
    (forceSource !== 'grok' && isTaddyAvailable());

  if (useTaddy) {
    try {
      const experts = await discoverFromTaddy(topic, showId);
      return { experts, source: 'taddy' };
    } catch (error) {
      // If Taddy fails and we weren't explicitly forced, try Grok as fallback
      if (forceSource === 'taddy') throw error;
      console.error('Taddy discovery failed, falling back to Grok:', error);
    }
  }

  // Grok fallback
  const experts = await discoverFromGrok(topic, showId);
  return { experts, source: 'grok' };
}

// --------------------------------------------------------------------------
// Taddy-based discovery
// --------------------------------------------------------------------------

interface PersonAccumulator {
  name: string;
  nameNormalized: string;
  imageUrl: string | null;
  profileUrl: string | null;
  roles: Set<string>;
  appearances: AppearanceRecord[];
  totalCount: number;
  recentCount: number; // within last 12 months
  latestDate: number; // unix ms
}

async function discoverFromTaddy(topic: string, showId: string): Promise<Expert[]> {
  const supabase = await createClient();

  // 1. Check cached guest appearances for this topic first
  const cachedExperts = await getCachedExpertsForTopic(topic, showId);

  // 2. Search Taddy for fresh episode results
  const episodes = await searchEpisodesWithCache(topic, 1, 50);

  // 3. Extract persons and accumulate into a map keyed by normalized name
  const personMap = new Map<string, PersonAccumulator>();
  const twelveMonthsAgo = Date.now() - 365 * 24 * 60 * 60 * 1000;

  for (const episode of episodes) {
    if (!episode.persons || episode.persons.length === 0) continue;

    for (const person of episode.persons) {
      if (!person.name || !person.name.trim()) continue;

      const normalized = normalizeName(person.name);
      const existing = personMap.get(normalized);

      const pubDateMs = episode.datePublished
        ? episode.datePublished * 1000
        : 0;
      const isRecent = pubDateMs > twelveMonthsAgo;

      const appearance: AppearanceRecord = {
        podcastName: episode.podcastSeries?.name || 'Unknown Podcast',
        episodeName: episode.name,
        datePublished: pubDateMs
          ? new Date(pubDateMs).toISOString()
          : null,
        podcastImageUrl: episode.podcastSeries?.imageUrl || undefined,
        episodeUrl: episode.audioUrl || undefined,
        role: person.role?.toLowerCase() || 'guest',
      };

      if (existing) {
        existing.totalCount++;
        if (isRecent) existing.recentCount++;
        existing.roles.add(person.role?.toLowerCase() || 'guest');
        existing.appearances.push(appearance);
        if (pubDateMs > existing.latestDate) {
          existing.latestDate = pubDateMs;
        }
        // Prefer non-null image/profile
        if (!existing.imageUrl && person.img) existing.imageUrl = person.img;
        if (!existing.profileUrl && person.href) existing.profileUrl = person.href;
      } else {
        personMap.set(normalized, {
          name: person.name.trim(),
          nameNormalized: normalized,
          imageUrl: person.img || null,
          profileUrl: person.href || null,
          roles: new Set([person.role?.toLowerCase() || 'guest']),
          appearances: [appearance],
          totalCount: 1,
          recentCount: isRecent ? 1 : 0,
          latestDate: pubDateMs,
        });
      }
    }
  }

  // 4. Cache guest appearances in background (userId from auth context via show)
  const { data: showData } = await supabase
    .from('shows')
    .select('user_id')
    .eq('id', showId)
    .single();

  if (showData?.user_id && episodes.length > 0) {
    cacheGuestAppearances(episodes, showData.user_id).catch(() => {
      // Silently ignore cache write failures
    });
  }

  // 5. Merge cached experts with fresh Taddy results
  for (const cached of cachedExperts) {
    const normalized = normalizeName(cached.name);
    if (!personMap.has(normalized)) {
      personMap.set(normalized, {
        name: cached.name,
        nameNormalized: normalized,
        imageUrl: null,
        profileUrl: cached.contactHints.website || null,
        roles: new Set([cached.category]),
        appearances: cached.appearances || [],
        totalCount: cached.appearanceCount,
        recentCount: cached.recentAppearances,
        latestDate: cached.metadata.lastAppearanceDate
          ? new Date(cached.metadata.lastAppearanceDate).getTime()
          : 0,
      });
    }
  }

  // 6. Convert accumulated persons to Expert objects
  const experts: Expert[] = Array.from(personMap.values())
    // Filter out hosts — we want guests and notable persons
    .filter((p) => {
      const isOnlyHost = p.roles.size === 1 && p.roles.has('host');
      return !isOnlyHost;
    })
    .map((person) => {
      const freshnessScore = calculateFreshnessScore(
        person.totalCount,
        person.recentCount
      );
      const category = categorizeExpert(person.recentCount);

      // Derive expertise tags from podcast/episode names
      const expertiseTags = deriveExpertiseTags(person.appearances, topic);

      return {
        id: crypto.randomUUID(),
        name: person.name,
        category,
        freshnessScore,
        expertise: expertiseTags,
        appearanceCount: person.totalCount,
        recentAppearances: person.recentCount,
        contactHints: {
          website: person.profileUrl || undefined,
        },
        metadata: {
          lastAppearanceDate: person.latestDate
            ? new Date(person.latestDate).toISOString()
            : undefined,
          notableShows: person.appearances
            .slice(0, 5)
            .map((a) => a.podcastName)
            .filter((v, i, arr) => arr.indexOf(v) === i),
        },
        source: 'taddy' as const,
        appearances: person.appearances
          .sort((a, b) => {
            const da = a.datePublished ? new Date(a.datePublished).getTime() : 0;
            const db = b.datePublished ? new Date(b.datePublished).getTime() : 0;
            return db - da;
          })
          .slice(0, 10),
      };
    });

  // 7. Cache in the experts table for next time
  await cacheExpertsInDb(experts, showId, topic).catch(() => {
    // Silently ignore cache write failures
  });

  // 8. Sort by freshness (fresh guests surface first) and return top 15
  return experts
    .sort((a, b) => b.freshnessScore - a.freshnessScore)
    .slice(0, 15);
}

// --------------------------------------------------------------------------
// Grok-based discovery (fallback when Taddy not configured)
// --------------------------------------------------------------------------

async function discoverFromGrok(topic: string, showId: string): Promise<Expert[]> {
  const supabase = await createClient();

  // Check DB cache first
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
      appearanceCount:
        (row.metadata as { appearanceCount?: number })?.appearanceCount || 0,
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
      source: 'grok' as const,
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
    model: process.env.XAI_MODEL || 'grok-4-1-fast',
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
    throw new Error(
      `AI response exceeds maximum allowed size of ${MAX_AI_RESPONSE_SIZE} characters`
    );
  }

  let validated;
  try {
    const parsed = JSON.parse(content);
    validated = GrokDiscoveryResponseSchema.parse(parsed);
  } catch {
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
        source: 'grok' as const,
      };
    });

  // Cache in experts table
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

// --------------------------------------------------------------------------
// DB cache helpers
// --------------------------------------------------------------------------

async function getCachedExpertsForTopic(
  topic: string,
  showId: string
): Promise<Expert[]> {
  const supabase = await createClient();
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const { data: cached } = await supabase
    .from('experts')
    .select('*')
    .eq('show_id', showId)
    .gte('cached_at', sevenDaysAgo.toISOString())
    .contains('metadata', { topic: topic.toLowerCase(), source: 'taddy' })
    .limit(20);

  if (!cached || cached.length === 0) return [];

  return cached.map((row) => ({
    id: row.id,
    name: row.name,
    category: row.category as ExpertCategory,
    freshnessScore: row.freshness_score,
    expertise: (row.metadata as { expertise?: string[] })?.expertise || [],
    appearanceCount:
      (row.metadata as { appearanceCount?: number })?.appearanceCount || 0,
    recentAppearances:
      (row.metadata as { recentAppearances?: number })?.recentAppearances || 0,
    contactHints: {
      website: (row.metadata as { website?: string })?.website,
    },
    metadata: {
      lastAppearanceDate: (row.metadata as { lastAppearanceDate?: string })
        ?.lastAppearanceDate,
      notableShows: (row.metadata as { notableShows?: string[] })?.notableShows,
    },
    source: 'cached' as const,
    appearances:
      (row.metadata as { appearances?: AppearanceRecord[] })?.appearances || [],
  }));
}

async function cacheExpertsInDb(
  experts: Expert[],
  showId: string,
  topic: string
): Promise<void> {
  const supabase = await createClient();

  const rows = experts.slice(0, 15).map((expert) => ({
    show_id: showId,
    name: expert.name,
    category: expert.category,
    freshness_score: expert.freshnessScore,
    metadata: {
      topic: topic.toLowerCase(),
      source: 'taddy',
      expertise: expert.expertise,
      appearanceCount: expert.appearanceCount,
      recentAppearances: expert.recentAppearances,
      website: expert.contactHints.website,
      lastAppearanceDate: expert.metadata.lastAppearanceDate,
      notableShows: expert.metadata.notableShows,
      appearances: expert.appearances?.slice(0, 5),
    },
  }));

  if (rows.length > 0) {
    await supabase.from('experts').insert(rows);
  }
}

// --------------------------------------------------------------------------
// Scoring helpers
// --------------------------------------------------------------------------

function calculateFreshnessScore(
  totalAppearances: number,
  recentAppearances: number
): number {
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

// --------------------------------------------------------------------------
// Name normalization (mirrors taddy/cache.ts normalizeName)
// --------------------------------------------------------------------------

function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/^(dr\.?|mr\.?|mrs\.?|ms\.?|prof\.?)\s+/i, '')
    .replace(/\s+(jr\.?|sr\.?|ii|iii|iv|phd|md|esq\.?)$/i, '');
}

// --------------------------------------------------------------------------
// Expertise tag derivation from real appearance data
// --------------------------------------------------------------------------

/**
 * Derive expertise tags from a person's appearance records and the search topic.
 * Uses podcast and episode names to extract relevant keywords.
 */
function deriveExpertiseTags(
  appearances: AppearanceRecord[],
  topic: string
): string[] {
  const tagSet = new Set<string>();

  // Always include the search topic itself
  tagSet.add(capitalizeTag(topic));

  // Extract notable keywords from podcast/episode names
  for (const app of appearances.slice(0, 10)) {
    const text = `${app.podcastName} ${app.episodeName}`.toLowerCase();

    // Common topic keywords to extract
    const keywords = extractKeywords(text);
    for (const kw of keywords) {
      tagSet.add(kw);
      if (tagSet.size >= 6) break;
    }
    if (tagSet.size >= 6) break;
  }

  // Add role-based tag if they have a specific role
  const roles = new Set(appearances.map((a) => a.role));
  if (roles.has('guest')) tagSet.add('Guest Speaker');
  if (roles.has('host')) tagSet.add('Podcast Host');

  return Array.from(tagSet).slice(0, 6);
}

/**
 * Extract meaningful keywords from text.
 * Simple heuristic: look for capitalized phrases and common topic words.
 */
function extractKeywords(text: string): string[] {
  const stopWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'by', 'from', 'is', 'was', 'are', 'were', 'be', 'been',
    'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
    'could', 'should', 'may', 'might', 'can', 'this', 'that', 'these',
    'those', 'it', 'its', 'my', 'your', 'his', 'her', 'our', 'their',
    'podcast', 'episode', 'ep', 'show', 'interview', 'talk', 'about', 'how',
    'what', 'why', 'when', 'who', 'which', 'part', 'vol', 'ft', 'featuring',
  ]);

  const words = text
    .replace(/[^a-zA-Z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !stopWords.has(w));

  // Group consecutive meaningful words into 1-2 word tags
  const tags: string[] = [];
  for (let i = 0; i < words.length && tags.length < 4; i++) {
    const word = words[i];
    if (word.length > 3) {
      tags.push(capitalizeTag(word));
    }
  }

  return tags;
}

function capitalizeTag(tag: string): string {
  return tag
    .split(' ')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}
