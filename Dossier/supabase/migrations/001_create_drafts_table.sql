-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create drafts table
CREATE TABLE IF NOT EXISTS public.drafts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(500) NOT NULL,
  prompt TEXT NOT NULL,
  enhanced_prompt TEXT,
  outline JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create index on updated_at for sorting
CREATE INDEX IF NOT EXISTS idx_drafts_updated_at ON public.drafts(updated_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE public.drafts ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations for now (we'll add auth later)
-- For now, allow service role to do everything
CREATE POLICY "Allow service role all access on drafts"
  ON public.drafts
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Create policy to allow public read access (for now, before auth)
CREATE POLICY "Allow public read access on drafts"
  ON public.drafts
  FOR SELECT
  TO public
  USING (true);

-- Function to automatically update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
CREATE TRIGGER update_drafts_updated_at
  BEFORE UPDATE ON public.drafts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions
GRANT ALL ON public.drafts TO service_role;
GRANT SELECT ON public.drafts TO anon;
GRANT SELECT ON public.drafts TO authenticated;
