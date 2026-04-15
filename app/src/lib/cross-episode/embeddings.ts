/**
 * Generate semantic embeddings for podcast content.
 *
 * History: this file originally called xAI's `grok-embedding-small` model,
 * but xAI has never offered embeddings (only chat + image). That bug broke
 * cross-episode similarity search for the entire lifetime of the codebase.
 * See `specs/bugs/processing-pipeline-bugs.md#bug-6` for full details.
 *
 * Current provider: **OpenAI `text-embedding-3-small`** (1536 dim, matches
 * the existing pgvector column without a schema migration).
 *
 * If `OPENAI_API_KEY` is not set, this function throws a descriptive error
 * and the caller in `save-processing-results.ts` catches it and stores
 * `NULL` for that segment's embedding — the pipeline degrades gracefully
 * instead of failing outright. Cross-episode similarity search still
 * returns empty results in that state (better than the pre-fix behavior,
 * which returned arbitrary non-matching sections with a hardcoded 0.5
 * similarity score).
 */

const EXPECTED_EMBEDDING_DIMENSION = 1536;
const EMBEDDING_MODEL = 'text-embedding-3-small';
const EMBEDDING_API_URL = 'https://api.openai.com/v1/embeddings';
const EMBEDDING_TIMEOUT_MS = 30_000;

export async function generateEmbeddings(content: string): Promise<number[]> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error(
      'OPENAI_API_KEY not set — embeddings unavailable. Add the key to ' +
        '.env.local to enable cross-episode similarity search.'
    );
  }

  const response = await fetch(EMBEDDING_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: EMBEDDING_MODEL,
      input: content,
    }),
    signal: AbortSignal.timeout(EMBEDDING_TIMEOUT_MS),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `OpenAI Embeddings API error: ${response.status} - ${errorText.slice(0, 200)}`
    );
  }

  const data = (await response.json()) as {
    data?: Array<{ embedding?: number[] }>;
  };

  const embedding = data?.data?.[0]?.embedding;

  if (!Array.isArray(embedding)) {
    throw new Error('Invalid embedding response from OpenAI API');
  }

  if (embedding.length !== EXPECTED_EMBEDDING_DIMENSION) {
    throw new Error(
      `Embedding dimension mismatch: expected ${EXPECTED_EMBEDDING_DIMENSION}, got ${embedding.length}`
    );
  }

  return embedding;
}
