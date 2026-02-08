-- Add share_token column to college_lists for public sharing
ALTER TABLE public.college_lists 
ADD COLUMN share_token TEXT UNIQUE DEFAULT NULL;

-- Create index for faster lookups by share_token
CREATE INDEX idx_college_lists_share_token ON public.college_lists(share_token) WHERE share_token IS NOT NULL;

-- Create a policy to allow public read access to shared lists
CREATE POLICY "Anyone can view shared lists" 
ON public.college_lists 
FOR SELECT 
USING (share_token IS NOT NULL);

-- Create a policy to allow public read access to items in shared lists
CREATE POLICY "Anyone can view items in shared lists" 
ON public.college_list_items 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM college_lists 
  WHERE college_lists.id = college_list_items.list_id 
  AND college_lists.share_token IS NOT NULL
));