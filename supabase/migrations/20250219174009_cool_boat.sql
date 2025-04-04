/*
  # Fix subscription policies and add insert policy

  1. Changes
    - Add policy for users to create their own subscriptions
    - Ensure features are stored correctly in subscription plans
*/

-- Add policy for users to create their own subscriptions
DO $$ BEGIN
  CREATE POLICY "Users can create their own subscriptions"
    ON user_subscriptions
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Update subscription plans to ensure features are stored correctly
UPDATE subscription_plans
SET features = jsonb_build_object('features', features->'features')
WHERE jsonb_typeof(features->'features') = 'array'
  AND jsonb_typeof(features) = 'object';

-- Ensure all active subscriptions have proper RLS policies
DO $$ BEGIN
  CREATE POLICY "Users can update their own subscriptions"
    ON user_subscriptions
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;