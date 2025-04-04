/*
  # Subscription and Token Management

  1. New Tables
    - subscription_plans
    - user_subscriptions 
    - content_tokens

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
    - Add indexes for performance

  3. Data
    - Insert default subscription plans
*/

-- Create subscription_plans table
CREATE TABLE IF NOT EXISTS subscription_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  price decimal(10,2) NOT NULL,
  tokens_per_month integer NOT NULL,
  features jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Create user_subscriptions table
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

-- Create content_tokens table
CREATE TABLE IF NOT EXISTS content_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  source_id uuid REFERENCES content_sources NOT NULL,
  tokens_used integer NOT NULL DEFAULT 0,
  action text NOT NULL,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT valid_action CHECK (action IN ('transcription', 'generation', 'analysis'))
);

-- Enable RLS with error handling
DO $$ BEGIN
  ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE content_tokens ENABLE ROW LEVEL SECURITY;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Create policies with error handling
DO $$ BEGIN
  CREATE POLICY "Anyone can view subscription plans"
    ON subscription_plans FOR SELECT
    TO authenticated
    USING (true);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users can view their own subscriptions"
    ON user_subscriptions FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users can view their token usage"
    ON content_tokens FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users can create token usage records"
    ON content_tokens FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Create indexes with error handling
DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON user_subscriptions(user_id);
  CREATE INDEX IF NOT EXISTS idx_content_tokens_user_id ON content_tokens(user_id);
  CREATE INDEX IF NOT EXISTS idx_content_tokens_source_id ON content_tokens(source_id);
EXCEPTION
  WHEN duplicate_object THEN NULL;
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