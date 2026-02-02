-- Phase 7: External Integrations Database Schema

-- Create subscriptions table for Stripe subscriptions
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  stripe_customer_id TEXT NOT NULL,
  stripe_subscription_id TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL,
  price_id TEXT NOT NULL,
  current_period_start TIMESTAMPTZ NOT NULL,
  current_period_end TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create hosting_connections table for podcast hosting integrations
CREATE TABLE IF NOT EXISTS hosting_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  provider TEXT NOT NULL,
  credentials JSONB NOT NULL,
  show_id UUID,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create users table if not exists (for Phase 7 single-user mode)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT,
  subscription_tier TEXT DEFAULT 'free',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add subscription_tier column to existing users table if it doesn't already have it
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'subscription_tier'
  ) THEN
    ALTER TABLE users ADD COLUMN subscription_tier TEXT DEFAULT 'free';
  END IF;
END $$;

-- Add foreign key constraints (will fail gracefully if users table already exists with different schema)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'subscriptions_user_id_fkey'
  ) THEN
    ALTER TABLE subscriptions ADD CONSTRAINT subscriptions_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'hosting_connections_user_id_fkey'
  ) THEN
    ALTER TABLE hosting_connections ADD CONSTRAINT hosting_connections_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_subscription_id ON subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_hosting_connections_user_id ON hosting_connections(user_id);

-- Insert default user for single-user mode
-- Using placeholder email since existing schema has NOT NULL constraint
INSERT INTO users (id, email, subscription_tier)
VALUES ('00000000-0000-0000-0000-000000000001', 'default@podbrain.local', 'free')
ON CONFLICT (id) DO UPDATE SET subscription_tier = COALESCE(users.subscription_tier, 'free');

-- Enable Row Level Security (RLS)
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE hosting_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for single-user mode (allow all operations)
CREATE POLICY "Allow all operations for default user on subscriptions" ON subscriptions
  FOR ALL USING (user_id = '00000000-0000-0000-0000-000000000001'::uuid);

CREATE POLICY "Allow all operations for default user on hosting_connections" ON hosting_connections
  FOR ALL USING (user_id = '00000000-0000-0000-0000-000000000001'::uuid);

CREATE POLICY "Allow all operations for default user on users" ON users
  FOR ALL USING (id = '00000000-0000-0000-0000-000000000001'::uuid);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers
CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_hosting_connections_updated_at BEFORE UPDATE ON hosting_connections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
