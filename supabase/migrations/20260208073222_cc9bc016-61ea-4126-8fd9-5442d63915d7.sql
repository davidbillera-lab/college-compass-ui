-- Create application_materials table for storing uploaded content
CREATE TABLE public.application_materials (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  material_type TEXT NOT NULL CHECK (material_type IN ('photo', 'video', 'text', 'document')),
  category TEXT NOT NULL CHECK (category IN ('extracurricular', 'achievement', 'portfolio', 'essay_draft', 'recommendation', 'resume', 'transcript', 'other')),
  title TEXT NOT NULL,
  description TEXT,
  file_url TEXT,
  file_name TEXT,
  file_size INTEGER,
  content_text TEXT,
  ai_analysis JSONB DEFAULT '{}'::jsonb,
  ai_analyzed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.application_materials ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own materials"
  ON public.application_materials FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own materials"
  ON public.application_materials FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own materials"
  ON public.application_materials FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own materials"
  ON public.application_materials FOR DELETE
  USING (auth.uid() = user_id);

-- Update trigger
CREATE TRIGGER update_application_materials_updated_at
  BEFORE UPDATE ON public.application_materials
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for application materials
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'application-materials',
  'application-materials',
  false,
  52428800, -- 50MB limit for videos
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/webm', 'video/quicktime', 'application/pdf']
);

-- Storage policies
CREATE POLICY "Users can upload own materials"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'application-materials' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view own materials"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'application-materials' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update own materials"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'application-materials' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own materials"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'application-materials' AND auth.uid()::text = (storage.foldername(name))[1]);