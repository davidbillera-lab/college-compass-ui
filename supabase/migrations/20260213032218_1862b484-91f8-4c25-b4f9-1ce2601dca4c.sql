
-- Create webhook events table for audit trail
CREATE TABLE public.stripe_webhook_events (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  stripe_event_id text NOT NULL UNIQUE,
  event_type text NOT NULL,
  customer_email text,
  customer_id text,
  subscription_id text,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  processed boolean NOT NULL DEFAULT false,
  error_message text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.stripe_webhook_events ENABLE ROW LEVEL SECURITY;

-- Only admins can view webhook events (no public access)
CREATE POLICY "Admins can view webhook events"
  ON public.stripe_webhook_events
  FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Service role inserts via edge function (no user-facing insert policy needed)
-- The edge function uses SUPABASE_SERVICE_ROLE_KEY which bypasses RLS

-- Index for lookups
CREATE INDEX idx_stripe_webhook_events_type ON public.stripe_webhook_events (event_type);
CREATE INDEX idx_stripe_webhook_events_created ON public.stripe_webhook_events (created_at DESC);
