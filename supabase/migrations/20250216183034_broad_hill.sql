/*
  # Content Sources Schema

  1. New Tables
    - `content_sources`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `type` (text) - youtube, rss, blog, etc.
      - `metadata` (jsonb) - source-specific metadata
      - `status` (text) - pending, processing, completed, error
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `processing_history`
      - `id` (uuid, primary key)
      - `source_id` (uuid, references content_sources)
      - `action` (text) - import, transform, export
      - `status` (text) - success, error
      - `details` (text)
      - `metadata` (jsonb)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Create content_sources table
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

-- Create processing_history table
CREATE TABLE IF NOT EXISTS processing_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id uuid REFERENCES content_sources ON DELETE CASCADE NOT NULL,
  action text NOT NULL,
  status text NOT NULL,
  details text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT valid_action CHECK (action IN ('import', 'transform', 'export')),
  CONSTRAINT valid_status CHECK (status IN ('success', 'error'))
);

-- Enable RLS
ALTER TABLE content_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE processing_history ENABLE ROW LEVEL SECURITY;

-- Policies for content_sources
CREATE POLICY "Users can create their own content sources"
  ON content_sources
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own content sources"
  ON content_sources
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own content sources"
  ON content_sources
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Policies for processing_history
CREATE POLICY "Users can view processing history for their content"
  ON processing_history
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM content_sources
      WHERE content_sources.id = processing_history.source_id
      AND content_sources.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create processing history for their content"
  ON processing_history
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM content_sources
      WHERE content_sources.id = processing_history.source_id
      AND content_sources.user_id = auth.uid()
    )
  );

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_content_sources_updated_at
  BEFORE UPDATE ON content_sources
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();