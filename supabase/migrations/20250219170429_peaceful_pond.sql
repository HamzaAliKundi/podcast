/*
  # Add subscription and usage tracking system
  
  1. New Tables
    - `subscription_plans` - Defines available subscription tiers
    - `user_subscriptions` - Tracks user subscriptions
    - `content_tokens` - Tracks token usage per user
  
  2. Changes
    - Add token tracking to content generation
    - Add subscription status checks
    
  3. Security
    - Enable RLS on all new tables
    - Add policies for secure access
*/

-- Create subscription_plans table
CREATE TABLE subscription_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  price decimal(10,2) NOT NULL,
  tokens_per_month integer NOT NULL,
  features jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Create user_subscriptions table
CREATE TABLE user_subscriptions (
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
CREATE TABLE content_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  source_id uuid REFERENCES content_sources NOT NULL,
  tokens_used integer NOT NULL DEFAULT 0,
  action text NOT NULL,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT valid_action CHECK (action IN ('transcription', 'generation', 'analysis'))
);

-- Enable RLS
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_tokens ENABLE ROW LEVEL SECURITY;

-- Policies for subscription_plans
CREATE POLICY "Anyone can view subscription plans"
  ON subscription_plans FOR SELECT
  TO authenticated
  USING (true);

-- Policies for user_subscriptions
CREATE POLICY "Users can view their own subscriptions"
  ON user_subscriptions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policies for content_tokens
CREATE POLICY "Users can view their token usage"
  ON content_tokens FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create token usage records"
  ON content_tokens FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Insert default subscription plans
INSERT INTO subscription_plans (name, price, tokens_per_month, features) VALUES
  ('Starter', 9.99, 5, '{"features": ["5 content pieces per month", "Basic AI generation", "Email support"]}'),
  ('Professional', 24.99, 15, '{"features": ["15 content pieces per month", "Advanced AI generation", "Priority support", "Custom templates"]}'),
  ('Enterprise', 49.99, 30, '{"features": ["30 content pieces per month", "Premium AI generation", "24/7 support", "Custom templates", "API access"]}');

-- Create indexes for better performance
CREATE INDEX idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX idx_content_tokens_user_id ON content_tokens(user_id);
CREATE INDEX idx_content_tokens_source_id ON content_tokens(source_id);