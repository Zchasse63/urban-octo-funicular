import { NextRequest } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { requireAuth, verifyEpisodeOwnership, isValidUUID } from '@/lib/auth';
import { errorResponse, successResponse, handleApiError } from '@/lib/api/helpers';
import { checkRateLimit } from '@/lib/rate-limit';
import { searchGuestAppearances } from '@/lib/taddy/search';
import { createChatCompletion } from '@/lib/xai-client';

// ---------------------------------------------------------------------------
// Zod schemas for validation
// ---------------------------------------------------------------------------

const PostBodySchema = z.object({
  guestName: z.string().min(1).max(200),
  guestBio: z.string().max(2000).optional(),
  topics: z.array(z.string().max(200)).max(20).optional(),
});

const PreInterviewDataSchema = z.object({
  guestName: z.string(),
  guestSummary: z.string(),
  appearanceCount: z.number(),
  appearances: z.array(
    z.object({
      podcastName: z.string(),
      episodeName: z.string(),
      datePublished: z.string().nullable(),
      topicsDiscussed: z.array(z.string()),
    })
  ),
  suggestedQuestions: z.array(z.string()),
  topicGaps: z.array(z.string()),
  talkingPoints: z.array(z.string()),
  icebreakers: z.array(z.string()),
  avoidTopics: z.array(z.string()),
});

type PreInterviewData = z.infer<typeof PreInterviewDataSchema>;

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CACHE_TTL_DAYS = 7;
const MAX_AI_RESPONSE_LENGTH = 500_000;

// ---------------------------------------------------------------------------
// GET /api/episodes/[id]/pre-interview
// Returns cached pre-interview data if available
// ---------------------------------------------------------------------------

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await requireAuth();
    const { id: episodeId } = await params;

    if (!isValidUUID(episodeId)) {
      return errorResponse('Invalid episode ID format', 400);
    }

    const hasAccess = await verifyEpisodeOwnership(episodeId, userId);
    if (!hasAccess) {
      return errorResponse('Episode not found', 404);
    }

    const supabase = await createClient();

    const { data: cached, error: cacheError } = await supabase
      .from('pre_interview_cache')
      .select('*')
      .eq('episode_id', episodeId)
      .eq('user_id', userId)
      .order('cached_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (cacheError) {
      return errorResponse('Failed to fetch pre-interview data', 500);
    }

    if (!cached) {
      return errorResponse('No pre-interview data found', 404);
    }

    // Reconstruct the response from the cache columns
    const responseData = buildResponseFromCache(cached);

    return successResponse<PreInterviewData>(responseData);
  } catch (error) {
    return handleApiError(error, 'fetching pre-interview data');
  }
}

// ---------------------------------------------------------------------------
// POST /api/episodes/[id]/pre-interview
// Triggers pre-interview generation
// ---------------------------------------------------------------------------

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await requireAuth();

    // Rate limit: 10 requests per minute for AI generation
    const rateLimitResult = await checkRateLimit(`pre-interview:${userId}`, 10);
    if (!rateLimitResult.success) {
      return errorResponse('Rate limit exceeded. Please try again shortly.', 429);
    }

    const { id: episodeId } = await params;

    if (!isValidUUID(episodeId)) {
      return errorResponse('Invalid episode ID format', 400);
    }

    const hasAccess = await verifyEpisodeOwnership(episodeId, userId);
    if (!hasAccess) {
      return errorResponse('Episode not found', 404);
    }

    // Parse and validate request body
    const body = await request.json();
    const parsed = PostBodySchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse('Invalid request body: ' + parsed.error.issues[0]?.message, 400);
    }

    const { guestName, guestBio, topics } = parsed.data;
    const supabase = await createClient();

    // Check for fresh cached data (< 7 days old)
    const cutoff = new Date(Date.now() - CACHE_TTL_DAYS * 24 * 60 * 60 * 1000).toISOString();
    const { data: existingCache } = await supabase
      .from('pre_interview_cache')
      .select('*')
      .eq('episode_id', episodeId)
      .eq('user_id', userId)
      .eq('guest_name', guestName)
      .gte('cached_at', cutoff)
      .order('cached_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existingCache) {
      const responseData = buildResponseFromCache(existingCache);
      return successResponse<PreInterviewData>(responseData);
    }

    // Search for guest appearances via Taddy
    const searchResult = await searchGuestAppearances(guestName, userId, {
      maxResults: 25,
    });

    // Build appearance summaries for the AI prompt
    const appearanceSummaries = searchResult.appearances.map((a) => ({
      podcastName: a.podcastName || 'Unknown Podcast',
      episodeName: a.episodeName || 'Unknown Episode',
      datePublished: a.datePublished,
    }));

    // Generate intelligence via Grok AI
    const intelligence = await generatePreInterviewIntelligence({
      guestName,
      guestBio,
      topics,
      appearances: appearanceSummaries,
    });

    // Cache the result
    await supabase.from('pre_interview_cache').upsert(
      {
        user_id: userId,
        episode_id: episodeId,
        guest_name: guestName,
        appearances: intelligence.appearances,
        common_questions: {
          suggestedQuestions: intelligence.suggestedQuestions,
          topicGaps: intelligence.topicGaps,
          icebreakers: intelligence.icebreakers,
          avoidTopics: intelligence.avoidTopics,
        },
        talking_points: {
          guestSummary: intelligence.guestSummary,
          talkingPoints: intelligence.talkingPoints,
          appearanceCount: intelligence.appearanceCount,
        },
        cached_at: new Date().toISOString(),
      },
      {
        onConflict: 'episode_id,user_id',
      }
    );

    return successResponse<PreInterviewData>(intelligence);
  } catch (error) {
    return handleApiError(error, 'generating pre-interview intelligence');
  }
}

// ---------------------------------------------------------------------------
// Grok AI: Generate pre-interview intelligence
// ---------------------------------------------------------------------------

async function generatePreInterviewIntelligence(input: {
  guestName: string;
  guestBio?: string;
  topics?: string[];
  appearances: Array<{
    podcastName: string;
    episodeName: string;
    datePublished: string | null;
  }>;
}): Promise<PreInterviewData> {
  const { guestName, guestBio, topics, appearances } = input;

  const appearanceList =
    appearances.length > 0
      ? appearances
          .map(
            (a, i) =>
              `${i + 1}. "${a.episodeName}" on ${a.podcastName}${a.datePublished ? ` (${a.datePublished})` : ''}`
          )
          .join('\n')
      : 'No previous podcast appearances found.';

  const systemPrompt = `You are a podcast research assistant. Given information about a podcast guest, generate comprehensive pre-interview intelligence to help the host prepare.

Respond in valid JSON matching this exact schema:
{
  "guestName": "string",
  "guestSummary": "string (2-3 sentence bio based on available information)",
  "appearanceCount": number,
  "appearances": [
    {
      "podcastName": "string",
      "episodeName": "string",
      "datePublished": "string or null",
      "topicsDiscussed": ["string"]
    }
  ],
  "suggestedQuestions": ["string (5-8 unique, thoughtful questions)"],
  "topicGaps": ["string (3-5 topics the guest likely hasn't been asked about)"],
  "talkingPoints": ["string (4-6 key areas to explore in the interview)"],
  "icebreakers": ["string (3-4 conversational openers referencing their work)"],
  "avoidTopics": ["string (2-3 things likely asked too many times)"]
}

Guidelines:
- Questions should be specific, open-ended, and insightful — not generic
- Topic gaps should represent unique angles that differentiate this interview
- Icebreakers should feel natural and show you've done your research
- Avoid topics are things that have been covered extensively in other interviews
- If there are no known appearances, base your analysis on the guest bio and name
- For appearances, infer likely topics from episode names
- Keep the guest summary to 2-3 sentences`;

  const userPrompt = `Guest Name: ${guestName}
${guestBio ? `\nGuest Bio: ${guestBio}` : ''}
${topics && topics.length > 0 ? `\nEpisode Topics: ${topics.join(', ')}` : ''}

Previous Podcast Appearances (${appearances.length} found):
${appearanceList}

Generate comprehensive pre-interview intelligence for this guest.`;

  const response = await createChatCompletion({
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.7,
    max_tokens: 4000,
    response_format: { type: 'json_object' },
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error('Empty response from AI');
  }

  if (content.length > MAX_AI_RESPONSE_LENGTH) {
    throw new Error('AI response exceeded maximum allowed length');
  }

  // Parse and validate with zod
  const parsed = JSON.parse(content);
  const validated = PreInterviewDataSchema.parse(parsed);

  return validated;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Reconstruct a PreInterviewData from the cached database row.
 */
function buildResponseFromCache(row: Record<string, unknown>): PreInterviewData {
  const appearances = (row.appearances ?? []) as PreInterviewData['appearances'];
  const commonQuestions = (row.common_questions ?? {}) as Record<string, unknown>;
  const talkingPointsData = (row.talking_points ?? {}) as Record<string, unknown>;

  return {
    guestName: (row.guest_name as string) || '',
    guestSummary: (talkingPointsData.guestSummary as string) || '',
    appearanceCount:
      (talkingPointsData.appearanceCount as number) ?? appearances.length,
    appearances,
    suggestedQuestions: (commonQuestions.suggestedQuestions as string[]) || [],
    topicGaps: (commonQuestions.topicGaps as string[]) || [],
    talkingPoints: (talkingPointsData.talkingPoints as string[]) || [],
    icebreakers: (commonQuestions.icebreakers as string[]) || [],
    avoidTopics: (commonQuestions.avoidTopics as string[]) || [],
  };
}
