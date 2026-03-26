-- Fix: Allow public (unauthenticated) read of application_materials for shared portfolios
-- The existing policy only allows auth.uid() = user_id, which blocks the public share page.
-- We add a policy that allows SELECT when the user_id has an active portfolio share.

CREATE POLICY "Public can view materials for active portfolio shares"
  ON public.application_materials
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.portfolio_shares ps
      WHERE ps.user_id = application_materials.user_id
        AND ps.is_active = true
        AND (ps.expires_at IS NULL OR ps.expires_at > now())
    )
  );

-- Fix: Allow public read of profiles for shared portfolios
-- The existing policy only allows auth.uid() = id, blocking the public share page.
CREATE POLICY "Public can view profile for active portfolio shares"
  ON public.profiles
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.portfolio_shares ps
      WHERE ps.user_id = profiles.id
        AND ps.is_active = true
        AND (ps.expires_at IS NULL OR ps.expires_at > now())
    )
  );
