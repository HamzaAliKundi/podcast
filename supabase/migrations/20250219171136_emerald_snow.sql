/*
  # Fix Database Schema and Migrations

  1. Changes
    - Consolidate all tables into a single migration
    - Fix SQL syntax errors
    - Ensure proper table creation order
    - Add proper constraints and indexes

  2. Tables
    - content_sources: Main content table
    - processing_history: Track processing status
    - content_transcriptions: Store transcripts
    - subscription_plans: Available plans
    - user_subscriptions: User subscriptions
    - content_tokens: Token usage tracking

  3. Security
    - Enable RLS on all tables
    - Add appropriate policies
*/

-- Create extension if not exists
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create tables with proper error handling
DO $$ 
BEGIN
  -- Content Sources
  CREATE TABLE IF NOT EXISTS content_sources (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users NOT NULL,
    type text NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb,
    status text NOT NULL DEFAULT 'pending',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    CONSTRAINT valid_type CHECK (type IN ('youtube', 'rss', 'blog', 'file')),
    CONSTRAINT valid_status CHECK (status IN ('pending', 'processing', 'completed', 'error'))
  );

  -- Processing History
  CREATE TABLE IF NOT EXISTS processing_history (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    source_id uuid REFERENCES content_sources ON DELETE CASCADE NOT NULL,
    action text NOT NULL,
    status text NOT NULL,
    details text,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamptz DEFAULT now(),
    CONSTRAINT valid_action CHECK (action IN ('import', 'transform', 'export', 'status_update')),
    CONSTRAINT valid_status CHECK (status IN ('success', 'error'))
  );

  -- Content Transcriptions
  CREATE TABLE IF NOT EXISTS content_transcriptions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    content_id text NOT NULL,
    transcript jsonb NOT NULL DEFAULT '{}'::jsonb,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamptz DEFAULT now()
  );

  -- Subscription Plans
  CREATE TABLE IF NOT EXISTS subscription_plans (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    price decimal(10,2) NOT NULL,
    tokens_per_month integer NOT NULL,
    features jsonb DEFAULT '{}'::jsonb,
    created_at timestamptz DEFAULT now()
  );

  -- User Subscriptions
  CREATE TABLE IF NOT EXISTS user_subscriptions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users NOT NULL,
    plan_id uuid REFERENCES subscription_plans NOT NULL,
    status text NOT NULL DEFAULT 'active',
    current_period_start timestamptz NOT NULL,
    current_period_end timestamptz NOT NULL,
    created_at timestamptz DEFAULT now(),
    CONSTRAINT valid_status CHECK (status IN ('active', 'canceled', 'past_due'))
  );

  -- Content Tokens
  CREATE TABLE IF NOT EXISTS content_tokens (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users NOT NULL,
    source_id uuid REFERENCES content_sources NOT NULL,
    tokens_used integer NOT NULL DEFAULT 0,
    action text NOT NULL,
    created_at timestamptz DEFAULT now(),
    CONSTRAINT valid_action CHECK (action IN ('transcription', 'generation', 'analysis'))
  );

EXCEPTION
  WHEN duplicate_table THEN 
    RAISE NOTICE 'Table already exists, skipping creation';
END $$;

-- Enable RLS on all tables
DO $$ 
BEGIN
  ALTER TABLE content_sources ENABLE ROW LEVEL SECURITY;
  ALTER TABLE processing_history ENABLE ROW LEVEL SECURITY;
  ALTER TABLE content_transcriptions ENABLE ROW LEVEL SECURITY;
  ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
  ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
  ALTER TABLE content_tokens ENABLE ROW LEVEL SECURITY;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Create policies with error handling
DO $$ 
BEGIN
  -- Content Sources Policies
  CREATE POLICY "Users can create their own content sources"
    ON content_sources FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = user_id);

  CREATE POLICY "Users can view their own content sources"
    ON content_sources FOR SELECT TO authenticated
    USING (auth.uid() = user_id);

  CREATE POLICY "Users can update their own content sources"
    ON content_sources FOR UPDATE TO authenticated
    USING (auth.uid() = user_id);

  CREATE POLICY "Users can delete their own content sources"
    ON content_sources FOR DELETE TO authenticated
    USING (auth.uid() = user_id);

  -- Processing History Policies
  CREATE POLICY "Users can view processing history for their content"
    ON processing_history FOR SELECT TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM content_sources
        WHERE content_sources.id = processing_history.source_id
        AND content_sources.user_id = auth.uid()
      )
    );

  CREATE POLICY "Users can create processing history for their content"
    ON processing_history FOR INSERT TO authenticated
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM content_sources
        WHERE content_sources.id = processing_history.source_id
        AND content_sources.user_id = auth.uid()
      )
    );

  -- Content Transcriptions Policies
  CREATE POLICY "Anyone can view transcriptions"
    ON content_transcriptions FOR SELECT TO authenticated
    USING (true);

  CREATE POLICY "Authenticated users can create transcriptions"
    ON content_transcriptions FOR INSERT TO authenticated
    WITH CHECK (true);

  -- Subscription Plans Policies
  CREATE POLICY "Anyone can view subscription plans"
    ON subscription_plans FOR SELECT TO authenticated
    USING (true);

  -- User Subscriptions Policies
  CREATE POLICY "Users can view their own subscriptions"
    ON user_subscriptions FOR SELECT TO authenticated
    USING (auth.uid() = user_id);

  -- Content Tokens Policies
  CREATE POLICY "Users can view their token usage"
    ON content_tokens FOR SELECT TO authenticated
    USING (auth.uid() = user_id);

  CREATE POLICY "Users can create token usage records"
    ON content_tokens FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = user_id);

EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Create or replace updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger if it doesn't exist
DO $$ 
BEGIN
  CREATE TRIGGER update_content_sources_updated_at
    BEFORE UPDATE ON content_sources
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Create indexes for better performance
DO $$
BEGIN
  CREATE INDEX IF NOT EXISTS idx_content_sources_user_id 
    ON content_sources(user_id);
  CREATE INDEX IF NOT EXISTS idx_processing_history_source_id 
    ON processing_history(source_id);
  CREATE INDEX IF NOT EXISTS idx_content_transcriptions_content_id 
    ON content_transcriptions(content_id);
  CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id 
    ON user_subscriptions(user_id);
  CREATE INDEX IF NOT EXISTS idx_content_tokens_user_id 
    ON content_tokens(user_id);
  CREATE INDEX IF NOT EXISTS idx_content_tokens_source_id 
    ON content_tokens(source_id);
END $$;

-- Insert default subscription plans if they don't exist
INSERT INTO subscription_plans (name, price, tokens_per_month, features)
SELECT 'Starter', 9.99, 5, '{"features": ["5 content pieces per month", "Basic AI generation", "Email support"]}'
WHERE NOT EXISTS (SELECT 1 FROM subscription_plans WHERE name = 'Starter');

INSERT INTO subscription_plans (name, price, tokens_per_month, features)
SELECT 'Professional', 24.99, 15, '{"features": ["15 content pieces per month", "Advanced AI generation", "Priority support", "Custom templates"]}'
WHERE NOT EXISTS (SELECT 1 FROM subscription_plans WHERE name = 'Professional');

INSERT INTO subscription_plans (name, price, tokens_per_month, features)
SELECT 'Enterprise', 49.99, 30, '{"features": ["30 content pieces per month", "Premium AI generation", "24/7 support", "Custom templates", "API access"]}'
WHERE NOT EXISTS (SELECT 1 FROM subscription_plans WHERE name = 'Enterprise');