/*
  # Add transcription support

  1. New Tables
    - `content_transcriptions`
      - `id` (uuid, primary key)
      - `source_id` (uuid, references content_sources)
      - `content_id` (text, e.g. video ID)
      - `transcript` (jsonb, stores transcript data with timestamps)
      - `metadata` (jsonb, additional metadata)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on `content_transcriptions` table
    - Add policies for authenticated users to manage their transcriptions
*/

-- Create content_transcriptions table
CREATE TABLE IF NOT EXISTS content_transcriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id uuid REFERENCES content_sources ON DELETE CASCADE NOT NULL,
  content_id text NOT NULL,
  transcript jsonb NOT NULL DEFAULT '{}'::jsonb,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE content_transcriptions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can create transcriptions for their content"
  ON content_transcriptions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM content_sources
      WHERE content_sources.id = content_transcriptions.source_id
      AND content_sources.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view their content transcriptions"
  ON content_transcriptions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM content_sources
      WHERE content_sources.id = content_transcriptions.source_id
      AND content_sources.user_id = auth.uid()
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_content_transcriptions_source_id 
  ON content_transcriptions(source_id);
CREATE INDEX IF NOT EXISTS idx_content_transcriptions_content_id 
  ON content_transcriptions(content_id);