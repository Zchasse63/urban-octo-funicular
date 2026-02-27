/**
 * xAI Grok API Client
 */

import { xaiCircuitBreaker } from '@/lib/circuit-breaker';

const XAI_API_URL = 'https://api.x.ai/v1';
const DEFAULT_MODEL = process.env.XAI_MODEL || 'grok-4-1-fast';
const DEFAULT_EMBEDDING_MODEL = 'grok-embedding-small';

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

interface EmbeddingOptions {
  model?: string;
  input: string | string[];
}

interface EmbeddingResponse {
  data: Array<{
    embedding: number[];
    index: number;
  }>;
  usage: {
    prompt_tokens: number;
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
 * Create embeddings with xAI
 */
export async function createEmbedding(
  options: EmbeddingOptions
): Promise<EmbeddingResponse> {
  const apiKey = getApiKey();

  return xaiCircuitBreaker.execute(async () => {
    const response = await fetch(`${XAI_API_URL}/embeddings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: options.model || DEFAULT_EMBEDDING_MODEL,
        input: options.input,
      }),
      signal: AbortSignal.timeout(30000),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`xAI Embeddings API error: ${response.status} - ${errorText}`);
    }

    return response.json();
  });
}

/**
 * Grok client interface
 */
interface GrokClient {
  chat: {
    completions: {
      create: typeof createChatCompletion;
    };
  };
  embeddings: {
    create: typeof createEmbedding;
  };
}

/**
 * Create a Grok client instance
 */
export function createGrokClient(): GrokClient {
  return {
    chat: {
      completions: {
        create: createChatCompletion,
      },
    },
    embeddings: {
      create: createEmbedding,
    },
  };
}

/**
 * Simple interface for grok client (default export)
 */
export const grokClient = createGrokClient();

export default grokClient;
