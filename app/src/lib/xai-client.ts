/**
 * xAI Grok API Client
 *
 * This client wraps the xAI chat completions endpoint. xAI has never
 * offered an embeddings API, so there is no `createEmbedding` here —
 * semantic embeddings are handled by `@/lib/cross-episode/embeddings.ts`
 * which calls OpenAI `text-embedding-3-small` directly.
 * See `specs/bugs/processing-pipeline-bugs.md#bug-6` for the history.
 */

import { xaiCircuitBreaker } from '@/lib/circuit-breaker';

const XAI_API_URL = 'https://api.x.ai/v1';
const DEFAULT_MODEL = process.env.XAI_MODEL || 'grok-4-1-fast';

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface ChatCompletionOptions {
  model?: string;
  messages: ChatMessage[];
  temperature?: number;
  max_tokens?: number;
  response_format?: { type: 'json_object' | 'text' };
}

interface ChatCompletionResponse {
  id: string;
  choices: Array<{
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

function getApiKey(): string {
  const apiKey = process.env.XAI_API_KEY;
  if (!apiKey) {
    throw new Error('XAI_API_KEY environment variable is not set');
  }
  return apiKey;
}

/**
 * Create chat completion with xAI Grok
 */
export async function createChatCompletion(
  options: ChatCompletionOptions
): Promise<ChatCompletionResponse> {
  const apiKey = getApiKey();

  return xaiCircuitBreaker.execute(async () => {
    const response = await fetch(`${XAI_API_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: options.model || DEFAULT_MODEL,
        messages: options.messages,
        temperature: options.temperature ?? 0.7,
        max_tokens: options.max_tokens ?? 4000,
        ...(options.response_format && { response_format: options.response_format }),
      }),
      signal: AbortSignal.timeout(30000),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`xAI API error: ${response.status} - ${errorText}`);
    }

    return response.json();
  });
}

/**
 * Grok client interface — chat completions only.
 * Embeddings are handled separately by `cross-episode/embeddings.ts`.
 */
interface GrokClient {
  chat: {
    completions: {
      create: typeof createChatCompletion;
    };
  };
}

/**
 * Create a Grok client instance.
 * Used by viral-moments/detector, guest-intel/service, experts/discovery
 * via dynamic import.
 */
export function createGrokClient(): GrokClient {
  return {
    chat: {
      completions: {
        create: createChatCompletion,
      },
    },
  };
}
