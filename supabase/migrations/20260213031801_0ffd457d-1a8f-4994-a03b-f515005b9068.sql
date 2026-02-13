
-- Create monitoring_alerts table
CREATE TABLE public.monitoring_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  alert_type TEXT NOT NULL, -- 'auth_error', 'payment_failure', 'edge_function_error', 'system'
  severity TEXT NOT NULL DEFAULT 'warning', -- 'info', 'warning', 'critical'
  title TEXT NOT NULL,
  details TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  resolved BOOLEAN NOT NULL DEFAULT false,
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.monitoring_alerts ENABLE ROW LEVEL SECURITY;

-- Only admins can view alerts
CREATE POLICY "Admins can view all alerts"
ON public.monitoring_alerts FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Only admins can update (resolve) alerts
CREATE POLICY "Admins can update alerts"
ON public.monitoring_alerts FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Service role inserts via edge function (no INSERT policy needed for anon/authenticated)

-- Index for fast querying
CREATE INDEX idx_monitoring_alerts_type ON public.monitoring_alerts(alert_type);
CREATE INDEX idx_monitoring_alerts_created ON public.monitoring_alerts(created_at DESC);
CREATE INDEX idx_monitoring_alerts_resolved ON public.monitoring_alerts(resolved) WHERE resolved = false;

-- Enable pg_cron and pg_net for scheduled monitoring
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;
