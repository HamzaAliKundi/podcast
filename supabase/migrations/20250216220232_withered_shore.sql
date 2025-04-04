/*
  # Content Extraction Enhancement

  1. New Tables
    - `content_extractions`
      - `id` (uuid, primary key)
      - `source_id` (uuid, references content_sources)
      - `content_type` (text: 'video' or 'playlist')
      - `content_id` (text, e.g., YouTube video/playlist ID)
      - `metadata` (jsonb, stores all extracted metadata)
      - `transcript` (text, for video transcripts)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on `content_extractions` table
    - Add policies for authenticated users to manage their extractions
*/

-- Create content_extractions table
CREATE TABLE IF NOT EXISTS content_extractions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id uuid REFERENCES content_sources ON DELETE CASCADE NOT NULL,
  content_type text NOT NULL,
  content_id text NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  transcript text,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT valid_content_type CHECK (content_type IN ('video', 'playlist'))
);

-- Enable RLS
ALTER TABLE content_extractions ENABLE ROW LEVEL SECURITY;

-- Policies for content_extractions
CREATE POLICY "Users can create extractions for their content"
  ON content_extractions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM content_sources
      WHERE content_sources.id = content_extractions.source_id
      AND content_sources.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view their content extractions"
  ON content_extractions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM content_sources
      WHERE content_sources.id = content_extractions.source_id
      AND content_sources.user_id = auth.uid()
    )
  );

-- Index for faster lookups
CREATE INDEX idx_content_extractions_source_id ON content_extractions(source_id);
CREATE INDEX idx_content_extractions_content_id ON content_extractions(content_id);