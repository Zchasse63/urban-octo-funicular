-- Phase 6: Advanced AI Features Migration
-- Adds viral_moments column, HNSW index, and experts table

-- Add viral_moments JSONB column to episodes table for caching detection results
ALTER TABLE episodes
ADD COLUMN IF NOT EXISTS viral_moments JSONB;

-- Create HNSW index on episode_sections.embedding for fast similarity search
-- Using vector_cosine_ops for cosine distance (optimal for semantic similarity)
-- Note: CONCURRENTLY cannot be used with IF NOT EXISTS in migrations
-- Run this separately if you need non-blocking index creation
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes
        WHERE indexname = 'episode_sections_embedding_hnsw_idx'
    ) THEN
        CREATE INDEX episode_sections_embedding_hnsw_idx
        ON episode_sections
        USING hnsw (embedding vector_cosine_ops);
    END IF;
END $$;

-- Create experts table for caching expert discovery results
CREATE TABLE IF NOT EXISTS experts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    show_id UUID NOT NULL REFERENCES shows(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('fresh', 'established', 'oversaturated')),
    freshness_score INTEGER NOT NULL CHECK (freshness_score >= 0 AND freshness_score <= 100),
    metadata JSONB DEFAULT '{}',
    cached_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for experts table
CREATE INDEX IF NOT EXISTS experts_show_id_idx ON experts(show_id);
CREATE INDEX IF NOT EXISTS experts_cached_at_idx ON experts(cached_at);
CREATE INDEX IF NOT EXISTS experts_category_idx ON experts(category);

-- Enable Row Level Security on experts table
ALTER TABLE experts ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only read experts for shows they own
CREATE POLICY experts_read ON experts
    FOR SELECT
    USING (
        show_id IN (
            SELECT id FROM shows WHERE user_id = auth.uid()
        )
    );

-- RLS Policy: Users can only insert experts for shows they own
CREATE POLICY experts_insert ON experts
    FOR INSERT
    WITH CHECK (
        show_id IN (
            SELECT id FROM shows WHERE user_id = auth.uid()
        )
    );

-- RLS Policy: Users can only update experts for shows they own
CREATE POLICY experts_update ON experts
    FOR UPDATE
    USING (
        show_id IN (
            SELECT id FROM shows WHERE user_id = auth.uid()
        )
    );

-- RLS Policy: Users can only delete experts for shows they own
CREATE POLICY experts_delete ON experts
    FOR DELETE
    USING (
        show_id IN (
            SELECT id FROM shows WHERE user_id = auth.uid()
        )
    );

-- Comment for documentation
COMMENT ON COLUMN episodes.viral_moments IS 'Cached viral moment detection results with timestamps, scores, and reasoning';
COMMENT ON TABLE experts IS 'Cached expert discovery results with freshness scores and 7-day TTL';
COMMENT ON INDEX episode_sections_embedding_hnsw_idx IS 'HNSW index for sub-50ms pgvector similarity queries on 10k+ sections';
