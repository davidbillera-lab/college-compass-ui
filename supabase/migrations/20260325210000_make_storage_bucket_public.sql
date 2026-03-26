-- Make the application-materials storage bucket public
-- This allows file URLs to be accessed directly without auth tokens
-- (needed for shared portfolio page and file viewing)
UPDATE storage.buckets
SET public = true
WHERE id = 'application-materials';

-- Also add a public read policy for the storage objects
-- so unauthenticated users can view files via share links
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Public read application-materials'
  ) THEN
    CREATE POLICY "Public read application-materials"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'application-materials');
  END IF;
END $$;
