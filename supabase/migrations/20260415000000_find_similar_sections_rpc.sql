-- ─── find_similar_sections RPC + HNSW index for pgvector similarity search ───
--
-- The cross-episode similarity feature in `lib/cross-episode/similarity.ts`
-- has been calling a `find_similar_sections` RPC since day one, but the
-- function was never actually written to the database. Every call returned
-- an error, triggering a fallback path that returned arbitrary non-matching
-- sections with a hardcoded similarity of 0.5. Users saw "Related Episodes"
-- at 50% confidence that were entirely unrelated.
--
-- See `specs/bugs/processing-pipeline-bugs.md#bug-6` for the full history.
-- This migration restores the intended behavior:
--   1. CREATE FUNCTION find_similar_sections — returns real cosine-similarity
--      matches ordered by distance, filtered by threshold and excluded episode.
--   2. CREATE INDEX idx_episode_sections_embedding_hnsw — HNSW approximate
--      nearest-neighbor index for fast lookups at scale. Cosine distance
--      opclass matches the `<=>` operator used inside the function.
--
-- The `1 - distance` expression converts pgvector's cosine distance
-- (0 = identical, 2 = opposite) to a similarity score in the familiar
-- 0.0–1.0 range that the UI displays as a percentage.

CREATE OR REPLACE FUNCTION public.find_similar_sections(
  query_embedding vector(1536),
  match_threshold float,
  match_count int,
  exclude_episode_id uuid
)
RETURNS TABLE (
  id uuid,
  episode_id uuid,
  content text,
  start_time numeric,
  end_time numeric,
  speaker text,
  similarity float
)
LANGUAGE sql
STABLE
SECURITY INVOKER
-- Include `extensions` in search_path so the `<=>` cosine-distance operator
-- and the `vector` type resolve — Supabase installs pgvector there rather
-- than in `public`. Without this the function fails to parse with
-- "operator does not exist: extensions.vector <=> extensions.vector".
SET search_path = pg_catalog, public, extensions
AS $$
  SELECT
    es.id,
    es.episode_id,
    es.content,
    es.start_time,
    es.end_time,
    es.speaker,
    (1 - (es.embedding <=> query_embedding))::float AS similarity
  FROM public.episode_sections es
  WHERE es.embedding IS NOT NULL
    AND query_embedding IS NOT NULL
    AND es.episode_id != exclude_episode_id
    AND (1 - (es.embedding <=> query_embedding)) > match_threshold
  ORDER BY es.embedding <=> query_embedding ASC
  LIMIT match_count;
$$;

-- HNSW index on cosine distance for fast approximate nearest-neighbor
-- search. pgvector's HNSW index automatically excludes NULL embeddings,
-- so no partial index is needed. m=16 and ef_construction=64 are the
-- pgvector defaults and work well for corpora under 1M vectors.
CREATE INDEX IF NOT EXISTS idx_episode_sections_embedding_hnsw
  ON public.episode_sections
  USING hnsw (embedding vector_cosine_ops);
