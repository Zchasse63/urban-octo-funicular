-- Webhooks table for Zapier/external service integration
-- Allows users to receive HTTP notifications when episodes are processed

CREATE TABLE IF NOT EXISTS webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  events TEXT[] NOT NULL DEFAULT '{}',
  secret TEXT, -- for HMAC-SHA256 signing
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index for querying active webhooks by user
CREATE INDEX IF NOT EXISTS idx_webhooks_user_id_active ON webhooks (user_id, active);

-- Enable RLS
ALTER TABLE webhooks ENABLE ROW LEVEL SECURITY;

-- Users can only manage their own webhooks
CREATE POLICY "Users manage own webhooks" ON webhooks
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
