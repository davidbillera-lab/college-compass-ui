-- Create storage bucket for profile media (videos, documents)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'profile-media', 
  'profile-media', 
  false,
  104857600, -- 100MB limit for videos
  ARRAY['video/mp4', 'video/webm', 'video/quicktime', 'application/pdf', 'image/jpeg', 'image/png']
);

-- RLS policies for profile-media bucket
CREATE POLICY "Users can view their own profile media"
ON storage.objects FOR SELECT
USING (bucket_id = 'profile-media' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload their own profile media"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'profile-media' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own profile media"
ON storage.objects FOR UPDATE
USING (bucket_id = 'profile-media' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own profile media"
ON storage.objects FOR DELETE
USING (bucket_id = 'profile-media' AND auth.uid()::text = (storage.foldername(name))[1]);