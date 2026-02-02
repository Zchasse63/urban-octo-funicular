const EXPECTED_EMBEDDING_DIMENSION = 1536;

export async function generateEmbeddings(content: string): Promise<number[]> {
  try {
    const { createGrokClient } = await import('@/lib/xai-client');
    const grokClient = createGrokClient();

    const response = await grokClient.embeddings.create({
      model: 'grok-embedding-small',
      input: content,
    });

    if (!response.data?.[0]?.embedding) {
      throw new Error('Invalid embedding response from xAI API');
    }

    const embedding = response.data[0].embedding;

    if (embedding.length !== EXPECTED_EMBEDDING_DIMENSION) {
      throw new Error(
        `Embedding dimension mismatch: expected ${EXPECTED_EMBEDDING_DIMENSION}, got ${embedding.length}`
      );
    }

    return embedding;
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Failed to generate embeddings:', error);
    }
    throw new Error(
      `Embedding generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}
