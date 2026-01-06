-- Add profile_extras JSONB column for extensible profile data
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS profile_extras jsonb DEFAULT '{}'::jsonb;

-- Add a comment explaining the structure
COMMENT ON COLUMN public.profiles.profile_extras IS 'Extensible profile data: activities, honors, links, themes, etc.';