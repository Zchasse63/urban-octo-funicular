/**
 * Content Generation Service for PodBrain
 * Generates 30+ asset types using xAI Grok
 */

import type { AssetType, Episode, GeneratedAsset } from '@/types/database';
import { getAssetPrompt, type AssetContext } from './asset-prompts';
import { logger } from '@/lib/logger';

const XAI_API_URL = 'https://api.x.ai/v1/chat/completions';
const DEFAULT_MODEL = process.env.XAI_MODEL || 'grok-4-1-fast';
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 1000;

interface GenerationOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

interface GenerationResult {
  success: boolean;
  content: string;
  parsedContent: Record<string, unknown>;
  assetType: AssetType;
  tokensUsed?: number;
  error?: string;
}

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Generate a single asset using xAI Grok
 */
export async function generateAsset(
  assetType: AssetType,
  context: AssetContext,
  options: GenerationOptions = {}
): Promise<GenerationResult> {
  const promptConfig = getAssetPrompt(assetType);

  if (!promptConfig) {
    return {
      success: false,
      content: '',
      parsedContent: {},
      assetType,
      error: `Unknown asset type: ${assetType}`,
    };
  }

  const apiKey = process.env.XAI_API_KEY;
  if (!apiKey) {
    return {
      success: false,
      content: '',
      parsedContent: {},
      assetType,
      error: 'XAI_API_KEY environment variable is not set',
    };
  }

  const systemPrompt = promptConfig.systemPrompt;
  const userPrompt = promptConfig.userPrompt(context);
  const temperature = options.temperature ?? promptConfig.temperature ?? 0.7;
  const maxTokens = options.maxTokens ?? promptConfig.maxTokens ?? 2000;
  const model = options.model ?? DEFAULT_MODEL;

  let lastError: Error | null = null;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      logger.info('Generating asset', {
        assetType,
        attempt: attempt + 1,
        model,
      });

      const response = await fetch(XAI_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          temperature,
          max_tokens: maxTokens,
          response_format: { type: 'json_object' },
        }),
      });

      if (response.status === 429) {
        const delay = INITIAL_RETRY_DELAY * Math.pow(2, attempt);
        logger.warn('Rate limited, retrying', { delay, attempt });
        await sleep(delay);
        continue;
      }

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`xAI API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      const content = data.choices[0]?.message?.content;

      if (!content) {
        throw new Error('No content in xAI response');
      }

      const parsedContent = JSON.parse(content);

      logger.info('Asset generated successfully', {
        assetType,
        tokensUsed: data.usage?.total_tokens,
      });

      return {
        success: true,
        content,
        parsedContent,
        assetType,
        tokensUsed: data.usage?.total_tokens,
      };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error');
      logger.error('Asset generation failed', lastError, {
        assetType,
        attempt: attempt + 1,
      });

      if (attempt < MAX_RETRIES - 1) {
        const delay = INITIAL_RETRY_DELAY * Math.pow(2, attempt);
        await sleep(delay);
        continue;
      }
    }
  }

  return {
    success: false,
    content: '',
    parsedContent: {},
    assetType,
    error: `Generation failed after ${MAX_RETRIES} attempts: ${lastError?.message}`,
  };
}

/**
 * Generate multiple assets in parallel
 */
export async function generateMultipleAssets(
  assetTypes: AssetType[],
  context: AssetContext,
  options: GenerationOptions = {}
): Promise<GenerationResult[]> {
  const results = await Promise.all(
    assetTypes.map(assetType => generateAsset(assetType, context, options))
  );
  return results;
}

/**
 * Build asset context from episode data
 */
export function buildAssetContext(
  episode: Episode,
  showName: string,
  options: Partial<AssetContext> = {}
): AssetContext {
  return {
    transcript: episode.transcript || '',
    episodeTitle: episode.title || 'Untitled Episode',
    showName,
    guestName: episode.guest_name || undefined,
    guestBio: episode.guest_bio || undefined,
    viralMoments: episode.viral_moments?.map(m => ({
      text: m.text,
      score: m.score,
      type: m.type,
    })),
    ...options,
  };
}

/**
 * Format generated content for storage
 */
export function formatAssetForStorage(
  episodeId: string,
  result: GenerationResult
): Omit<GeneratedAsset, 'id' | 'created_at' | 'updated_at'> {
  // Determine the primary content string based on asset type
  let content = result.content;
  const parsed = result.parsedContent;

  // Extract the main content field based on asset type patterns
  if (parsed.content) {
    content = parsed.content as string;
  } else if (parsed.markdown) {
    content = parsed.markdown as string;
  } else if (parsed.body) {
    content = parsed.body as string;
  } else if (parsed.text) {
    content = parsed.text as string;
  }

  return {
    episode_id: episodeId,
    asset_type: result.assetType,
    content,
    metadata: {
      raw_response: result.parsedContent,
      tokens_used: result.tokensUsed,
      generated_at: new Date().toISOString(),
      model: DEFAULT_MODEL,
    },
    file_url: null,
  };
}

/**
 * Get recommended assets for an episode based on context
 */
export function getRecommendedAssets(episode: Episode): AssetType[] {
  const recommendations: AssetType[] = [];

  // Always recommend core content
  recommendations.push('show_notes', 'key_takeaways', 'chapter_markers');

  // If episode has a guest, recommend guest-specific content
  if (episode.guest_name) {
    recommendations.push(
      'guest_bio_short',
      'guest_promo_kit',
      'linkedin_post_guest'
    );
  }

  // Recommend social media content
  recommendations.push(
    'linkedin_post',
    'twitter_thread',
    'instagram_caption'
  );

  // If viral moments detected, recommend short-form content
  if (episode.viral_moments && episode.viral_moments.length > 0) {
    recommendations.push(
      'tiktok_hooks',
      'quote_cards',
      'youtube_shorts_script'
    );
  }

  // Always recommend SEO and distribution content
  recommendations.push(
    'seo_description',
    'youtube_description',
    'blog_post'
  );

  return recommendations;
}

/**
 * Estimate generation cost based on transcript length and asset types
 */
export function estimateGenerationCost(
  transcriptLength: number,
  assetTypes: AssetType[]
): {
  estimatedInputTokens: number;
  estimatedOutputTokens: number;
  estimatedCost: number;
} {
  // Rough estimate: 1 token ≈ 4 characters
  const baseInputTokens = Math.ceil(transcriptLength / 4);

  let totalOutputTokens = 0;
  for (const assetType of assetTypes) {
    const config = getAssetPrompt(assetType);
    totalOutputTokens += config?.maxTokens || 2000;
  }

  // xAI pricing (approximate): $0.002 per 1K input, $0.006 per 1K output
  const inputCost = (baseInputTokens * assetTypes.length / 1000) * 0.002;
  const outputCost = (totalOutputTokens / 1000) * 0.006;

  return {
    estimatedInputTokens: baseInputTokens * assetTypes.length,
    estimatedOutputTokens: totalOutputTokens,
    estimatedCost: inputCost + outputCost,
  };
}
