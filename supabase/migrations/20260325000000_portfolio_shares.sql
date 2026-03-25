-- Create portfolio_shares table for shareable application package links
CREATE TABLE public.portfolio_shares (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  share_token text NOT NULL UNIQUE DEFAULT replace(replace(encode(extensions.gen_random_bytes(18), 'base64'), '+', '-'), '/', '_'),
  label text NOT NULL DEFAULT 'My Application Portfolio',
  is_active boolean NOT NULL DEFAULT true,
  include_essays boolean NOT NULL DEFAULT true,
  include_materials boolean NOT NULL DEFAULT true,
  include_profile boolean NOT NULL DEFAULT true,
  view_count integer NOT NULL DEFAULT 0,
  last_viewed_at timestamp with time zone,
  expires_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.portfolio_shares ENABLE ROW LEVEL SECURITY;

-- Owners can do everything with their own shares
CREATE POLICY "Users can manage their own portfolio shares"
  ON public.portfolio_shares
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Anyone can read an active share by token (for public share page)
CREATE POLICY "Anyone can view active portfolio shares"
  ON public.portfolio_shares
  FOR SELECT
  USING (is_active = true AND (expires_at IS NULL OR expires_at > now()));

-- Index for fast token lookups
CREATE INDEX idx_portfolio_shares_token ON public.portfolio_shares (share_token);
CREATE INDEX idx_portfolio_shares_user ON public.portfolio_shares (user_id);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.update_portfolio_shares_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER portfolio_shares_updated_at
  BEFORE UPDATE ON public.portfolio_shares
  FOR EACH ROW EXECUTE FUNCTION public.update_portfolio_shares_updated_at();
