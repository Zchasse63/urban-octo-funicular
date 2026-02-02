import { z } from 'zod';
import type { DetectionResponse, TranscriptSegment, ViralMoment } from './types';

const safeTextRegex = /^[a-zA-Z0-9\s.,!?":;()&%$@\u2018-\u201F\u2013\u2014]+$/;

const ViralMomentSchema = z.object({
  id: z.string().regex(/^[a-zA-Z0-9-_]+$/),
  quote: z
    .string()
    .min(1)
    .max(500)
    .regex(safeTextRegex, 'Quote contains unsafe characters')
    .transform((val) =>
      val
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/\//g, '&#x2F;')
        .replace(/\[/g, '&#91;')
        .replace(/\]/g, '&#93;')
    ),
  startTime: z.number().nonnegative(),
  endTime: z.number().nonnegative(),
  score: z.number().min(0).max(100),
  category: z.enum(['controversial', 'emotional', 'quotable', 'surprising', 'counterintuitive']),
  reasoning: z
    .string()
    .min(1)
    .max(1000)
    .regex(safeTextRegex, 'Reasoning contains unsafe characters')
    .transform((val) =>
      val
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/\//g, '&#x2F;')
        .replace(/\[/g, '&#91;')
        .replace(/\]/g, '&#93;')
    ),
  suggestedPlatforms: z.array(z.enum(['tiktok', 'instagram', 'twitter', 'linkedin'])).min(1),
}).refine((data) => data.endTime > data.startTime, {
  message: 'endTime must be greater than startTime',
  path: ['endTime'],
});

export const DetectionResponseSchema = z.object({
  viralMoments: z.array(ViralMomentSchema).max(5),
  topMoment: ViralMomentSchema,
});

const MAX_TRANSCRIPT_SIZE = 500000;
const MAX_SEGMENTS = 10000;

export async function detectViralMoments(
  transcript: string,
  segments: TranscriptSegment[]
): Promise<DetectionResponse> {
  const normalizedTranscript = transcript.normalize('NFC');

  if (normalizedTranscript.length > MAX_TRANSCRIPT_SIZE) {
    throw new Error(`Transcript exceeds maximum size of ${MAX_TRANSCRIPT_SIZE} characters`);
  }

  if (segments.length > MAX_SEGMENTS) {
    throw new Error(`Segment count exceeds maximum of ${MAX_SEGMENTS}`);
  }

  const { createGrokClient } = await import('@/lib/xai-client');
  const grokClient = createGrokClient();

  const systemPrompt = `You are an expert at identifying viral moments in podcast transcripts.

VIRAL CRITERIA:
1. CONTROVERSIAL: Challenges conventional wisdom or mainstream views
2. EMOTIONAL: Contains laughter keywords, passionate language, or frustration markers
3. QUOTABLE: Concise statements (<15 words) that are highly shareable
4. SURPRISING: Unexpected revelations or counterintuitive facts
5. COUNTERINTUITIVE: Advice that goes against common sense

SCORING ALGORITHM:
- Base score from keyword density (controversial terms, emotion words)
- Bonus for brevity (shorter = more shareable)
- Bonus for emotional markers (laughter, exclamation, strong adjectives)
- Consider sentence structure (one-liners score higher)

PLATFORM RECOMMENDATIONS:
- TikTok: <30 seconds, high emotion, surprising content
- Instagram: Visual quotes, inspiring/motivational content
- Twitter: Controversial takes, sharp one-liners
- LinkedIn: Professional insights, counterintuitive business advice

Return JSON with top 5 moments sorted by score, including timestamps, reasoning, and platform suggestions.`;

  const userPrompt = `Analyze this podcast transcript and identify the top 5 viral moments:

TRANSCRIPT:
${normalizedTranscript}

TIMESTAMPS:
${segments.map((s) => `[${s.startTime}s - ${s.endTime}s] ${s.text}`).join('\n')}

Return a JSON object with this exact structure:
{
  "viralMoments": [
    {
      "id": "unique-id",
      "quote": "exact quote from transcript",
      "startTime": number,
      "endTime": number,
      "score": number (0-100),
      "category": "controversial|emotional|quotable|surprising|counterintuitive",
      "reasoning": "why this is viral-worthy",
      "suggestedPlatforms": ["tiktok"|"instagram"|"twitter"|"linkedin"]
    }
  ],
  "topMoment": { same structure as above }
}`;

  const response = await grokClient.chat.completions.create({
    model: 'grok-beta',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.7,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error('No response from Grok API');
  }

  const MAX_AI_RESPONSE_SIZE = 500000;
  if (content.length > MAX_AI_RESPONSE_SIZE) {
    throw new Error(`AI response exceeds maximum allowed size of ${MAX_AI_RESPONSE_SIZE} characters`);
  }

  try {
    const parsed = JSON.parse(content);
    return DetectionResponseSchema.parse(parsed);
  } catch (parseError) {
    throw new Error('Invalid API response format');
  }
}
