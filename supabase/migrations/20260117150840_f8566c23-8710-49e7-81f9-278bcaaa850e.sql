-- Scholarships Intel Migration - IDEMPOTENT
-- Adds missing columns to existing scholarships table and creates new tables

-- 1) Add missing columns to scholarships table if they don't exist
DO $$
BEGIN
  -- provider
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'scholarships' AND column_name = 'provider') THEN
    ALTER TABLE public.scholarships ADD COLUMN provider text NULL;
  END IF;
  
  -- amount_min_usd
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'scholarships' AND column_name = 'amount_min_usd') THEN
    ALTER TABLE public.scholarships ADD COLUMN amount_min_usd integer NULL;
  END IF;
  
  -- amount_max_usd
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'scholarships' AND column_name = 'amount_max_usd') THEN
    ALTER TABLE public.scholarships ADD COLUMN amount_max_usd integer NULL;
  END IF;
  
  -- deadline_date
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'scholarships' AND column_name = 'deadline_date') THEN
    ALTER TABLE public.scholarships ADD COLUMN deadline_date date NULL;
  END IF;
  
  -- rolling_deadline
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'scholarships' AND column_name = 'rolling_deadline') THEN
    ALTER TABLE public.scholarships ADD COLUMN rolling_deadline boolean DEFAULT false;
  END IF;
  
  -- location_scope
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'scholarships' AND column_name = 'location_scope') THEN
    ALTER TABLE public.scholarships ADD COLUMN location_scope text NULL;
  END IF;
  
  -- education_level
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'scholarships' AND column_name = 'education_level') THEN
    ALTER TABLE public.scholarships ADD COLUMN education_level text NULL;
  END IF;
  
  -- major_tags
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'scholarships' AND column_name = 'major_tags') THEN
    ALTER TABLE public.scholarships ADD COLUMN major_tags text NULL;
  END IF;
  
  -- career_tags
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'scholarships' AND column_name = 'career_tags') THEN
    ALTER TABLE public.scholarships ADD COLUMN career_tags text NULL;
  END IF;
  
  -- raw_eligibility_text
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'scholarships' AND column_name = 'raw_eligibility_text') THEN
    ALTER TABLE public.scholarships ADD COLUMN raw_eligibility_text text NULL;
  END IF;
  
  -- normalized_criteria
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'scholarships' AND column_name = 'normalized_criteria') THEN
    ALTER TABLE public.scholarships ADD COLUMN normalized_criteria jsonb DEFAULT '{}'::jsonb;
  END IF;
  
  -- source_type
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'scholarships' AND column_name = 'source_type') THEN
    ALTER TABLE public.scholarships ADD COLUMN source_type text NULL;
  END IF;
  
  -- source_url
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'scholarships' AND column_name = 'source_url') THEN
    ALTER TABLE public.scholarships ADD COLUMN source_url text NULL;
  END IF;
  
  -- last_crawled_at
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'scholarships' AND column_name = 'last_crawled_at') THEN
    ALTER TABLE public.scholarships ADD COLUMN last_crawled_at timestamptz NULL;
  END IF;
  
  -- status
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'scholarships' AND column_name = 'status') THEN
    ALTER TABLE public.scholarships ADD COLUMN status text DEFAULT 'active';
  END IF;
  
  -- updated_at
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'scholarships' AND column_name = 'updated_at') THEN
    ALTER TABLE public.scholarships ADD COLUMN updated_at timestamptz DEFAULT now();
  END IF;
END $$;

-- 2) Create scholarship_questions table (global question bank)
CREATE TABLE IF NOT EXISTS public.scholarship_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  question_text text NOT NULL,
  answer_type text NOT NULL,
  options jsonb NULL,
  applies_to jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.scholarship_questions ENABLE ROW LEVEL SECURITY;

-- Drop and recreate policy for idempotency
DROP POLICY IF EXISTS "Scholarship questions are publicly readable" ON public.scholarship_questions;
CREATE POLICY "Scholarship questions are publicly readable" ON public.scholarship_questions
  FOR SELECT USING (true);

-- 3) Create scholarship_user_answers table (per user)
CREATE TABLE IF NOT EXISTS public.scholarship_user_answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question_key text NOT NULL,
  answer_json jsonb NOT NULL,
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, question_key)
);

ALTER TABLE public.scholarship_user_answers ENABLE ROW LEVEL SECURITY;

-- RLS policies for scholarship_user_answers
DROP POLICY IF EXISTS "Users can view own answers" ON public.scholarship_user_answers;
CREATE POLICY "Users can view own answers" ON public.scholarship_user_answers
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own answers" ON public.scholarship_user_answers;
CREATE POLICY "Users can insert own answers" ON public.scholarship_user_answers
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own answers" ON public.scholarship_user_answers;
CREATE POLICY "Users can update own answers" ON public.scholarship_user_answers
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own answers" ON public.scholarship_user_answers;
CREATE POLICY "Users can delete own answers" ON public.scholarship_user_answers
  FOR DELETE USING (auth.uid() = user_id);

-- 4) Create scholarship_matches table (per user cached matches)
CREATE TABLE IF NOT EXISTS public.scholarship_matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  scholarship_id uuid NOT NULL REFERENCES public.scholarships(id) ON DELETE CASCADE,
  score integer NOT NULL,
  eligibility_status text NOT NULL,
  reasons text NOT NULL,
  missing_fields jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, scholarship_id)
);

ALTER TABLE public.scholarship_matches ENABLE ROW LEVEL SECURITY;

-- RLS policies for scholarship_matches
DROP POLICY IF EXISTS "Users can view own matches" ON public.scholarship_matches;
CREATE POLICY "Users can view own matches" ON public.scholarship_matches
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own matches" ON public.scholarship_matches;
CREATE POLICY "Users can insert own matches" ON public.scholarship_matches
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own matches" ON public.scholarship_matches;
CREATE POLICY "Users can update own matches" ON public.scholarship_matches
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own matches" ON public.scholarship_matches;
CREATE POLICY "Users can delete own matches" ON public.scholarship_matches
  FOR DELETE USING (auth.uid() = user_id);

-- 5) Insert default scholarship questions
INSERT INTO public.scholarship_questions (key, question_text, answer_type, options, applies_to)
VALUES
  ('first_gen', 'Are you a first-generation college student?', 'boolean', null, '{}'),
  ('state_resident', 'What state do you currently reside in?', 'select', '["Alabama","Alaska","Arizona","Arkansas","California","Colorado","Connecticut","Delaware","Florida","Georgia","Hawaii","Idaho","Illinois","Indiana","Iowa","Kansas","Kentucky","Louisiana","Maine","Maryland","Massachusetts","Michigan","Minnesota","Mississippi","Missouri","Montana","Nebraska","Nevada","New Hampshire","New Jersey","New Mexico","New York","North Carolina","North Dakota","Ohio","Oklahoma","Oregon","Pennsylvania","Rhode Island","South Carolina","South Dakota","Tennessee","Texas","Utah","Vermont","Virginia","Washington","West Virginia","Wisconsin","Wyoming"]', '{}'),
  ('volunteer_hours', 'Approximately how many volunteer hours have you completed?', 'number', null, '{}'),
  ('need_based', 'Do you have demonstrated financial need?', 'boolean', null, '{}'),
  ('athletics', 'Do you participate in any athletics? (Select all that apply)', 'multiselect', '["Basketball","Football","Soccer","Baseball","Softball","Tennis","Swimming","Track & Field","Golf","Volleyball","Cross Country","Wrestling","Lacrosse","Hockey","Other","None"]', '{}'),
  ('career_goals', 'What are your career goals? (Select all that apply)', 'multiselect', '["Healthcare/Medicine","Engineering","Business/Finance","Education","Technology/Computer Science","Arts/Design","Law","Science/Research","Social Services","Government/Public Policy","Journalism/Communications","Other"]', '{}'),
  ('race_ethnicity', 'What is your race/ethnicity? (Optional - for matching only)', 'multiselect', '["Asian","Black/African American","Hispanic/Latino","Native American/Alaska Native","Native Hawaiian/Pacific Islander","White","Two or More Races","Prefer not to say"]', '{"sensitive": true}'),
  ('religion', 'What is your religious affiliation? (Optional - for matching only)', 'select', '["Christian","Jewish","Muslim","Hindu","Buddhist","Sikh","None/Secular","Prefer not to say","Other"]', '{"sensitive": true}')
ON CONFLICT (key) DO NOTHING;

-- 6) Create trigger for updated_at on scholarship_user_answers
DROP TRIGGER IF EXISTS set_scholarship_user_answers_updated_at ON public.scholarship_user_answers;
CREATE TRIGGER set_scholarship_user_answers_updated_at
  BEFORE UPDATE ON public.scholarship_user_answers
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- 7) Create trigger for updated_at on scholarships
DROP TRIGGER IF EXISTS set_scholarships_updated_at ON public.scholarships;
CREATE TRIGGER set_scholarships_updated_at
  BEFORE UPDATE ON public.scholarships
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();