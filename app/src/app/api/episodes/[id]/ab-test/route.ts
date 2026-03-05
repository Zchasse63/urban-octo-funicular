import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAuth, isValidUUID } from '@/lib/auth';
import { errorResponse, successResponse, handleApiError } from '@/lib/api/helpers';
import type { Episode } from '@/types/database';

// ─── Types ──────────────────────────────────────────────────────────────────

interface ABVariant {
  id: string;
  text: string;
  charCount: number;
  seoHints: string[];
}

interface ABTestResponse {
  field: 'title' | 'description';
  variants: ABVariant[];
  current: string | null;
  generatedAt: string;
}

interface ABTestPostBody {
  field: 'title' | 'description';
  variantCount?: number;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function generateSeoHints(text: string, field: 'title' | 'description'): string[] {
  const hints: string[] = [];

  if (field === 'title') {
    if (text.length < 30) hints.push('Short title — may lack keywords');
    if (text.length > 60) hints.push('Over 60 chars — may be truncated in search');
    if (text.length >= 30 && text.length <= 60) hints.push('Good length for search results');
    if (/\d/.test(text)) hints.push('Contains numbers — good for click-through');
    if (/[?!]/.test(text)) hints.push('Uses punctuation — may boost engagement');
    if (text.split(' ').length <= 3) hints.push('Very short — consider adding descriptive words');
  }

  if (field === 'description') {
    if (text.length < 100) hints.push('Short description — expand for better SEO');
    if (text.length > 160) hints.push('Over 160 chars — meta description may be truncated');
    if (text.length >= 100 && text.length <= 160) hints.push('Ideal meta description length');
    if (text.includes('...')) hints.push('Contains ellipsis — may appear incomplete');
  }

  return hints;
}

// ─── GET Handler ────────────────────────────────────────────────────────────

/**
 * GET /api/episodes/[id]/ab-test
 * Returns current A/B test variants stored in episode metadata.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await requireAuth();
    const { id: episodeId } = await params;

    if (!isValidUUID(episodeId)) {
      return errorResponse('Invalid ID format', 400);
    }

    const supabase = await createClient();

    const { data: episode, error: fetchError } = await supabase
      .from('episodes')
      .select('id, title, description, metadata, shows!inner(user_id)')
      .eq('id', episodeId)
      .eq('shows.user_id', userId)
      .single();

    if (fetchError || !episode) {
      return errorResponse('Episode not found', 404);
    }

    const metadata = (episode.metadata || {}) as Record<string, unknown>;
    const abVariants = metadata.ab_variants as Record<string, unknown> | undefined;

    if (!abVariants) {
      return successResponse(null);
    }

    return successResponse(abVariants);
  } catch (error) {
    console.error('Error fetching A/B test variants:', error);
return errorResponse('Internal server error', 500)
  }
}

// ─── POST Handler ───────────────────────────────────────────────────────────

/**
 * POST /api/episodes/[id]/ab-test
 * Generate A/B test variants for title or description using AI.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await requireAuth();
    const { id: episodeId } = await params;

    if (!isValidUUID(episodeId)) {
      return errorResponse('Invalid ID format', 400);
    }

    const body: ABTestPostBody = await request.json();
    const { field, variantCount = 3 } = body;

    if (!field || !['title', 'description'].includes(field)) {
      return errorResponse('field must be "title" or "description"', 400);
    }

    const clampedCount = Math.min(Math.max(2, variantCount), 5);

    const supabase = await createClient();

    // Fetch the episode with its show and current data
    const { data: episode, error: fetchError } = await supabase
      .from('episodes')
      .select('*, shows!inner(user_id, name)')
      .eq('id', episodeId)
      .eq('shows.user_id', userId)
      .single();

    if (fetchError || !episode) {
      return errorResponse('Episode not found', 404);
    }

    const ep = episode as unknown as Episode & {
      shows: { user_id: string; name: string } | Array<{ user_id: string; name: string }>;
    };

    const currentValue = field === 'title' ? ep.title : ep.description;
    const showName = Array.isArray(ep.shows) ? ep.shows[0]?.name : ep.shows?.name;

    // Build the AI prompt
    const systemPrompt = `You are a podcast content optimization expert. Generate ${clampedCount} alternative ${field} variants for a podcast episode.

Each variant should:
- Be unique and distinct in angle/approach
- Be optimized for discoverability and engagement
- Use natural language that appeals to podcast listeners
${field === 'title' ? '- Be between 30-60 characters for optimal search display' : '- Be between 100-160 characters for optimal meta description length'}

Respond ONLY with valid JSON in this format:
{
  "variants": [
    { "text": "variant text here" }
  ]
}`;

    const userPrompt = `Podcast: ${showName || 'Unknown Show'}
Current ${field}: ${currentValue || '(none)'}
${ep.description && field === 'title' ? `Description: ${ep.description}` : ''}
${ep.show_notes ? `Show notes excerpt: ${ep.show_notes.slice(0, 500)}` : ''}
${ep.guest_name ? `Guest: ${ep.guest_name}` : ''}

Generate ${clampedCount} ${field} variants.`;

    const apiKey = process.env.XAI_API_KEY;
    if (!apiKey) {
      return errorResponse('AI service not configured', 503);
    }

    const aiResponse = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: process.env.XAI_MODEL || 'grok-4-1-fast',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.8,
        response_format: { type: 'json_object' },
      }),
      signal: AbortSignal.timeout(30_000),
    });

    if (!aiResponse.ok) {
      throw new Error(`AI generation failed: ${aiResponse.status} ${aiResponse.statusText}`);
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('No content in AI response');
    }

    let parsed: { variants: Array<{ text: string }> };
    try {
      parsed = JSON.parse(content);
    } catch {
      throw new Error('Failed to parse AI response as JSON');
    }

    if (!parsed.variants || !Array.isArray(parsed.variants)) {
      throw new Error('Invalid AI response format');
    }

    // Build variant objects with IDs and SEO hints
    const variants: ABVariant[] = parsed.variants
      .slice(0, clampedCount)
      .map((v, i) => ({
        id: `variant-${i + 1}`,
        text: v.text,
        charCount: v.text.length,
        seoHints: generateSeoHints(v.text, field),
      }));

    const generatedAt = new Date().toISOString();
    const abTestData: ABTestResponse = {
      field,
      variants,
      current: currentValue,
      generatedAt,
    };

    // Store variants in episode metadata
    const metadata = (ep.metadata || {}) as Record<string, unknown>;
    metadata.ab_variants = abTestData;

    await supabase
      .from('episodes')
      .update({
        metadata,
        updated_at: new Date().toISOString(),
      })
      .eq('id', episodeId);

    return successResponse<ABTestResponse>(abTestData);
  } catch (error) {
    console.error('Error generating A/B test variants:', error);
return errorResponse('Internal server error', 500)
  }
}
