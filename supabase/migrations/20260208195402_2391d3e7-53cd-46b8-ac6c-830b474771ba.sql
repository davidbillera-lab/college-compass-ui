-- Fix overly permissive RLS policies on analytics tables
-- These policies allow INSERT with WITH CHECK (true) which is flagged as a security warning

-- Drop existing overly permissive INSERT policies
DROP POLICY IF EXISTS "Anyone can insert events" ON public.analytics_events;
DROP POLICY IF EXISTS "Anyone can insert page views" ON public.analytics_page_views;

-- Create new INSERT policies that validate user_id when provided
-- If user_id is provided, it must match the authenticated user
-- If user_id is null, allow anonymous tracking (but only if no user is authenticated, or allow null)
CREATE POLICY "Insert events with valid user_id"
ON public.analytics_events
FOR INSERT
TO public
WITH CHECK (
  user_id IS NULL OR user_id = auth.uid()
);

CREATE POLICY "Insert page views with valid user_id"
ON public.analytics_page_views
FOR INSERT
TO public
WITH CHECK (
  user_id IS NULL OR user_id = auth.uid()
);