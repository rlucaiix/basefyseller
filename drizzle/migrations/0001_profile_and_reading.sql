ALTER TABLE public.settings
  ADD COLUMN IF NOT EXISTS bio text,
  ADD COLUMN IF NOT EXISTS avatar_url text,
  ADD COLUMN IF NOT EXISTS seller_link text,
  ADD COLUMN IF NOT EXISTS read_chapters jsonb NOT NULL DEFAULT '[]'::jsonb;