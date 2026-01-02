-- Create presentations table for authenticated users
CREATE TABLE IF NOT EXISTS public.presentations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  title VARCHAR(500) NOT NULL,
  prompt TEXT NOT NULL,
  enhanced_prompt TEXT,
  outline JSONB NOT NULL,
  slides JSONB NOT NULL,
  citation_style VARCHAR(20) DEFAULT 'inline' CHECK (citation_style IN ('inline', 'footnote', 'speaker_notes')),
  theme VARCHAR(20) DEFAULT 'minimal' CHECK (theme IN ('minimal', 'corporate', 'bold', 'modern', 'classic')),
  token_usage JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create index on user_id for faster user queries
CREATE INDEX IF NOT EXISTS idx_presentations_user_id ON public.presentations(user_id);

-- Create index on updated_at for sorting
CREATE INDEX IF NOT EXISTS idx_presentations_updated_at ON public.presentations(updated_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE public.presentations ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only read their own presentations
CREATE POLICY "Users can read own presentations"
  ON public.presentations
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own presentations
CREATE POLICY "Users can insert own presentations"
  ON public.presentations
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own presentations
CREATE POLICY "Users can update own presentations"
  ON public.presentations
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own presentations
CREATE POLICY "Users can delete own presentations"
  ON public.presentations
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy: Service role has full access
CREATE POLICY "Service role full access on presentations"
  ON public.presentations
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Trigger to auto-update updated_at
CREATE TRIGGER update_presentations_updated_at
  BEFORE UPDATE ON public.presentations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions
GRANT ALL ON public.presentations TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.presentations TO authenticated;
