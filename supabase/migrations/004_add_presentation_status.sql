-- Add status and error_message columns to presentations table
-- This enables async presentation generation

-- Add status column with default 'completed' for existing presentations
ALTER TABLE public.presentations 
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'completed' 
CHECK (status IN ('generating', 'completed', 'failed'));

-- Add error_message column for failed generations
ALTER TABLE public.presentations 
ADD COLUMN IF NOT EXISTS error_message TEXT;

-- Update existing presentations to have 'completed' status
UPDATE public.presentations 
SET status = 'completed' 
WHERE status IS NULL;

-- Make status NOT NULL after setting defaults
ALTER TABLE public.presentations 
ALTER COLUMN status SET NOT NULL;

-- Create index on status for filtering generating presentations
CREATE INDEX IF NOT EXISTS idx_presentations_status 
ON public.presentations(status) 
WHERE status = 'generating';

-- Add comment for documentation
COMMENT ON COLUMN public.presentations.status IS 'Status of presentation generation: generating, completed, or failed';
COMMENT ON COLUMN public.presentations.error_message IS 'Error message if generation failed';

