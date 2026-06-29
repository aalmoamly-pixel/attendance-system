-- Create lms_site_config table
CREATE TABLE IF NOT EXISTS public.lms_site_config (
  id SERIAL PRIMARY KEY,
  config JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.lms_site_config ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Allow full access to all" ON public.lms_site_config;
CREATE POLICY "Allow full access to all" ON public.lms_site_config FOR ALL USING (true) WITH CHECK (true);
