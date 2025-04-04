/*
  # Add free tokens for testing

  1. Changes
    - Update Professional plan to include 1 million tokens for testing
    - Ensure existing subscriptions get the updated token count
*/

-- Update Professional plan to include 1 million tokens
UPDATE subscription_plans
SET tokens_per_month = 1000000
WHERE name = 'Professional';

-- Update Enterprise plan to include 2 million tokens
UPDATE subscription_plans
SET tokens_per_month = 2000000
WHERE name = 'Enterprise';

-- Reset token usage for testing
DELETE FROM content_tokens;

-- Ensure all active subscriptions have their period extended
UPDATE user_subscriptions
SET 
  current_period_end = NOW() + INTERVAL '30 days',
  status = 'active'
WHERE status != 'canceled';