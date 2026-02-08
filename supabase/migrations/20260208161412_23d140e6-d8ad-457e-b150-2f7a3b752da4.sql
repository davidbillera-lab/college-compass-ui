
-- Create analytics tables for tracking visitor behavior and events

CREATE TABLE public.analytics_page_views (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  page_path TEXT NOT NULL,
  page_title TEXT,
  referrer TEXT,
  session_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.analytics_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  event_name TEXT NOT NULL,
  event_data JSONB DEFAULT '{}',
  session_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.analytics_page_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies for page_views
CREATE POLICY "Anyone can insert page views" 
  ON public.analytics_page_views 
  FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Users can view own page views" 
  ON public.analytics_page_views 
  FOR SELECT 
  USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Admins can view all page views" 
  ON public.analytics_page_views 
  FOR SELECT 
  USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for events
CREATE POLICY "Anyone can insert events" 
  ON public.analytics_events 
  FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Users can view own events" 
  ON public.analytics_events 
  FOR SELECT 
  USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Admins can view all events" 
  ON public.analytics_events 
  FOR SELECT 
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Create indexes for better query performance
CREATE INDEX idx_analytics_page_views_user_id ON public.analytics_page_views(user_id);
CREATE INDEX idx_analytics_page_views_created_at ON public.analytics_page_views(created_at DESC);
CREATE INDEX idx_analytics_page_views_page_path ON public.analytics_page_views(page_path);
CREATE INDEX idx_analytics_events_user_id ON public.analytics_events(user_id);
CREATE INDEX idx_analytics_events_created_at ON public.analytics_events(created_at DESC);
CREATE INDEX idx_analytics_events_name ON public.analytics_events(event_name);
CREATE INDEX idx_analytics_events_session_id ON public.analytics_events(session_id);
