-- Expand colleges table with comprehensive matching fields
ALTER TABLE public.colleges 
ADD COLUMN IF NOT EXISTS city text,
ADD COLUMN IF NOT EXISTS type text, -- 'public', 'private', 'community'
ADD COLUMN IF NOT EXISTS setting text, -- 'urban', 'suburban', 'rural'
ADD COLUMN IF NOT EXISTS acceptance_rate numeric,
ADD COLUMN IF NOT EXISTS sat_range_low integer,
ADD COLUMN IF NOT EXISTS sat_range_high integer,
ADD COLUMN IF NOT EXISTS act_range_low integer,
ADD COLUMN IF NOT EXISTS act_range_high integer,
ADD COLUMN IF NOT EXISTS avg_gpa numeric,
ADD COLUMN IF NOT EXISTS tuition_in_state integer,
ADD COLUMN IF NOT EXISTS tuition_out_state integer,
ADD COLUMN IF NOT EXISTS avg_financial_aid integer,
ADD COLUMN IF NOT EXISTS student_population integer,
ADD COLUMN IF NOT EXISTS student_faculty_ratio numeric,
ADD COLUMN IF NOT EXISTS graduation_rate numeric,
ADD COLUMN IF NOT EXISTS retention_rate numeric,
ADD COLUMN IF NOT EXISTS athletics_division text, -- 'D1', 'D2', 'D3', 'NAIA', 'none'
ADD COLUMN IF NOT EXISTS sports text[], -- available sports programs
ADD COLUMN IF NOT EXISTS notable_programs text[], -- strong academic programs
ADD COLUMN IF NOT EXISTS religious_affiliation text,
ADD COLUMN IF NOT EXISTS website_url text,
ADD COLUMN IF NOT EXISTS logo_url text,
ADD COLUMN IF NOT EXISTS source_type text,
ADD COLUMN IF NOT EXISTS source_url text,
ADD COLUMN IF NOT EXISTS last_crawled_at timestamptz,
ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Create college_matches tracking for individual user preferences
ALTER TABLE public.college_matches
ADD COLUMN IF NOT EXISTS academic_match_score integer,
ADD COLUMN IF NOT EXISTS financial_match_score integer,
ADD COLUMN IF NOT EXISTS location_match_score integer,
ADD COLUMN IF NOT EXISTS activities_match_score integer;

-- Expand scholarships normalized_criteria to include more matching fields
-- (This is already JSONB so no migration needed, we'll just use more fields)

-- Add more profile fields for comprehensive matching
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS city text,
ADD COLUMN IF NOT EXISTS state text,
ADD COLUMN IF NOT EXISTS zip_code text,
ADD COLUMN IF NOT EXISTS citizenship text,
ADD COLUMN IF NOT EXISTS first_gen_college boolean,
ADD COLUMN IF NOT EXISTS financial_need boolean,
ADD COLUMN IF NOT EXISTS estimated_efc integer, -- Expected Family Contribution
ADD COLUMN IF NOT EXISTS psat_score integer,
ADD COLUMN IF NOT EXISTS ap_courses text[],
ADD COLUMN IF NOT EXISTS honors_courses text[],
ADD COLUMN IF NOT EXISTS class_size integer,
ADD COLUMN IF NOT EXISTS preferred_college_type text, -- 'public', 'private', 'any'
ADD COLUMN IF NOT EXISTS preferred_setting text, -- 'urban', 'suburban', 'rural', 'any'
ADD COLUMN IF NOT EXISTS max_distance_miles integer,
ADD COLUMN IF NOT EXISTS sports_played text[],
ADD COLUMN IF NOT EXISTS volunteer_hours integer,
ADD COLUMN IF NOT EXISTS work_experience_hours integer,
ADD COLUMN IF NOT EXISTS leadership_roles text[],
ADD COLUMN IF NOT EXISTS awards text[],
ADD COLUMN IF NOT EXISTS special_talents text[];

-- Create updated_at trigger for colleges
CREATE TRIGGER update_colleges_updated_at
  BEFORE UPDATE ON public.colleges
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();