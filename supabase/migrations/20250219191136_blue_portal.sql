/*
  # Fix processing history action constraint

  1. Changes
    - Update valid_action constraint to include all needed actions
    - Add missing action types
*/

-- Update the valid_action constraint for processing_history
ALTER TABLE processing_history 
  DROP CONSTRAINT IF EXISTS valid_action;

ALTER TABLE processing_history 
  ADD CONSTRAINT valid_action 
  CHECK (action IN ('import', 'transform', 'export', 'status_update', 'analysis', 'generation'));