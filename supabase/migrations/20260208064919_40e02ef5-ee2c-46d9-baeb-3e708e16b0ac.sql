-- Add unique constraint for upsert on scholarship_matches
ALTER TABLE public.scholarship_matches 
  ADD CONSTRAINT scholarship_matches_user_scholarship_unique 
  UNIQUE (user_id, scholarship_id);