/*
  # Add generated content table

  1. New Tables
    - `generated_content`
      - `id` (uuid, primary key)
      - `source_id` (uuid, references content_sources)
      - `content` (jsonb, stores generated content)
      - `metadata` (jsonb, stores generation metadata)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS
    - Add policies for authenticated users
*/

CREATE TABLE IF NOT EXISTS generated_content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id uuid REFERENCES content_sources ON DELETE CASCADE NOT NULL,
  content jsonb NOT NULL DEFAULT '{}'::jsonb,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE generated_content ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can create generated content for their sources"
  ON generated_content
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM content_sources
      WHERE content_sources.id = generated_content.source_id
      AND content_sources.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view their generated content"
  ON generated_content
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM content_sources
      WHERE content_sources.id = generated_content.source_id
      AND content_sources.user_id = auth.uid()
    )
  );

-- Index for faster lookups
CREATE INDEX idx_generated_content_source_id ON generated_content(source_id);