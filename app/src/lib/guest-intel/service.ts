import { z } from 'zod';
import type { GuestIntelligence } from './types';

const RepeatedStorySchema = z.object({
  story: z.string(),
  count: z.number(),
  examples: z.array(z.string()).optional(),
});

const PositionSchema = z.object({
  topic: z.string(),
  stance: z.string(),
  source: z.string(),
  date: z.string().optional(),
});

const GuestIntelligenceSchema = z.object({
  questionsAskedBefore: z.array(z.string()),
  uniqueAngles: z.array(z.string()),
  repeatedStories: z.array(RepeatedStorySchema),
  publicPositions: z.array(PositionSchema),
  trendingTopics: z.array(z.string()),
});

export async function aggregateGuestIntel(
  guestName: string,
  guestUrl?: string
): Promise<GuestIntelligence> {
  if (!guestName || guestName.trim() === '') {
    return {
      guestName: '',
      questionsAskedBefore: [],
      uniqueAngles: [],
      repeatedStories: [],
      publicPositions: [],
      trendingTopics: [],
    };
  }

  const { createGrokClient } = await import('@/lib/xai-client');
  const grokClient = createGrokClient();

  const systemPrompt = `You are an expert podcast researcher specializing in guest intelligence.

TASK: Research a podcast guest and provide comprehensive pre-interview intelligence.

ANALYSIS CATEGORIES:
1. QUESTIONS ASKED BEFORE: Identify common questions this guest has been asked across podcasts (create a skip list)
2. UNIQUE ANGLES: Novel topics or questions that haven't been explored yet
3. REPEATED STORIES: Anecdotes or stories they frequently tell (track frequency)
4. PUBLIC POSITIONS: Their stated opinions, stances, or positions on key topics
5. TRENDING TOPICS: Current trending topics in their industry or field

Use web search to find:
- Podcast appearances and transcripts
- Social media posts and statements
- Published articles or interviews
- Public speaking engagements

Return structured JSON with actionable intelligence.`;

  const userPrompt = `Research podcast guest: ${guestName}
${guestUrl ? `Guest URL/Website: ${guestUrl}` : ''}

Find:
1. Questions they've been asked frequently (5-10 questions to skip)
2. Unique angles or topics they haven't discussed (3-5 suggestions)
3. Stories they repeat across interviews (if any)
4. Public positions on key topics in their field
5. Trending topics in their industry (3-5 topics)

JSON structure:
{
  "questionsAskedBefore": ["question 1", "question 2", ...],
  "uniqueAngles": ["angle 1", "angle 2", ...],
  "repeatedStories": [
    {
      "story": "story description",
      "count": number,
      "examples": ["podcast name 1", "podcast name 2"]
    }
  ],
  "publicPositions": [
    {
      "topic": "topic name",
      "stance": "their position",
      "source": "where they stated it",
      "date": "YYYY-MM-DD (optional)"
    }
  ],
  "trendingTopics": ["topic 1", "topic 2", ...]
}`;

  const response = await grokClient.chat.completions.create({
    model: 'grok-beta',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    response_format: { type: 'json_object' } as { type: 'json_object' },
    temperature: 0.7,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    return {
      guestName,
      questionsAskedBefore: [],
      uniqueAngles: [],
      repeatedStories: [],
      publicPositions: [],
      trendingTopics: [],
    };
  }

  const MAX_AI_RESPONSE_SIZE = 500000;
  if (content.length > MAX_AI_RESPONSE_SIZE) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('AI response exceeds maximum size, truncating');
    }
    return {
      guestName,
      questionsAskedBefore: [],
      uniqueAngles: [],
      repeatedStories: [],
      publicPositions: [],
      trendingTopics: [],
    };
  }

  try {
    const parsed = JSON.parse(content);
    const validated = GuestIntelligenceSchema.parse(parsed);
    return {
      guestName,
      ...validated,
    };
  } catch (parseError) {
    return {
      guestName,
      questionsAskedBefore: [],
      uniqueAngles: [],
      repeatedStories: [],
      publicPositions: [],
      trendingTopics: [],
    };
  }
}
