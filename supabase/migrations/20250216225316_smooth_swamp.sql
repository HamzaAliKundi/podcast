-- Create content_sources table if not exists
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'content_sources'
  ) THEN
    CREATE TABLE content_sources (
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

    -- Enable RLS
    ALTER TABLE content_sources ENABLE ROW LEVEL SECURITY;

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

    CREATE POLICY "Users can delete their own content sources"
      ON content_sources
      FOR DELETE
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- Create processing_history table if not exists
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'processing_history'
  ) THEN
    CREATE TABLE processing_history (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      source_id uuid NOT NULL,
      action text NOT NULL,
      status text NOT NULL,
      details text,
      metadata jsonb DEFAULT '{}'::jsonb,
      created_at timestamptz DEFAULT now(),
      CONSTRAINT valid_action CHECK (action IN ('import', 'transform', 'export', 'status_update')),
      CONSTRAINT valid_status CHECK (status IN ('success', 'error')),
      CONSTRAINT fk_source FOREIGN KEY (source_id) 
        REFERENCES content_sources(id) ON DELETE CASCADE
    );

    -- Enable RLS
    ALTER TABLE processing_history ENABLE ROW LEVEL SECURITY;

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
  END IF;
END $$;

-- Create generated_content table if not exists
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'generated_content'
  ) THEN
    CREATE TABLE generated_content (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      source_id uuid NOT NULL,
      content jsonb NOT NULL DEFAULT '{}'::jsonb,
      metadata jsonb DEFAULT '{}'::jsonb,
      created_at timestamptz DEFAULT now(),
      CONSTRAINT fk_source FOREIGN KEY (source_id) 
        REFERENCES content_sources(id) ON DELETE CASCADE
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
  END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_content_sources_user_id ON content_sources(user_id);
CREATE INDEX IF NOT EXISTS idx_processing_history_source_id ON processing_history(source_id);
CREATE INDEX IF NOT EXISTS idx_generated_content_source_id ON generated_content(source_id);

-- Create or replace updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger if it doesn't exist
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_content_sources_updated_at'
  ) THEN
    CREATE TRIGGER update_content_sources_updated_at
      BEFORE UPDATE ON content_sources
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;