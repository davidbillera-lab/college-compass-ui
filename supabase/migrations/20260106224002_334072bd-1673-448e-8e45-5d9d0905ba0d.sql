-- Create enum types as text for simplicity
-- ShortlistStatus: INTERESTED, APPLYING, APPLIED, NOT_NOW
-- PipelineStatus: NOT_STARTED, DRAFTING, SUBMITTED

-- Colleges table (public reference data)
CREATE TABLE public.colleges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  state TEXT,
  region TEXT,
  size TEXT,
  majors TEXT,
  sticker_usd INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS but allow public read
ALTER TABLE public.colleges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Colleges are publicly readable"
ON public.colleges FOR SELECT
USING (true);

-- College matches (student-specific)
CREATE TABLE public.college_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  college_id UUID NOT NULL REFERENCES public.colleges(id) ON DELETE CASCADE,
  fit_score INTEGER NOT NULL CHECK (fit_score >= 0 AND fit_score <= 100),
  bucket TEXT NOT NULL CHECK (bucket IN ('Likely', 'Target', 'Reach')),
  why_fit TEXT,
  shortlist_status TEXT CHECK (shortlist_status IN ('INTERESTED', 'APPLYING', 'APPLIED', 'NOT_NOW')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(student_id, college_id)
);

ALTER TABLE public.college_matches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own college matches"
ON public.college_matches FOR SELECT
USING (auth.uid() = student_id);

CREATE POLICY "Users can insert own college matches"
ON public.college_matches FOR INSERT
WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Users can update own college matches"
ON public.college_matches FOR UPDATE
USING (auth.uid() = student_id);

CREATE POLICY "Users can delete own college matches"
ON public.college_matches FOR DELETE
USING (auth.uid() = student_id);

CREATE INDEX idx_college_matches_student ON public.college_matches(student_id);

-- Scholarships table (public reference data)
CREATE TABLE public.scholarships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  amount_usd INTEGER,
  deadline TIMESTAMPTZ,
  url TEXT,
  description TEXT,
  tags TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.scholarships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Scholarships are publicly readable"
ON public.scholarships FOR SELECT
USING (true);

-- Scholarship pipeline items (student-specific tracking)
CREATE TABLE public.scholarship_pipeline_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  scholarship_id UUID NOT NULL REFERENCES public.scholarships(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'NOT_STARTED' CHECK (status IN ('NOT_STARTED', 'DRAFTING', 'SUBMITTED')),
  notes TEXT,
  due_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(student_id, scholarship_id)
);

ALTER TABLE public.scholarship_pipeline_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own scholarship items"
ON public.scholarship_pipeline_items FOR SELECT
USING (auth.uid() = student_id);

CREATE POLICY "Users can insert own scholarship items"
ON public.scholarship_pipeline_items FOR INSERT
WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Users can update own scholarship items"
ON public.scholarship_pipeline_items FOR UPDATE
USING (auth.uid() = student_id);

CREATE POLICY "Users can delete own scholarship items"
ON public.scholarship_pipeline_items FOR DELETE
USING (auth.uid() = student_id);

CREATE INDEX idx_scholarship_pipeline_student ON public.scholarship_pipeline_items(student_id);

-- Tasks table (student-specific)
CREATE TABLE public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  due_at TIMESTAMPTZ,
  priority INTEGER NOT NULL DEFAULT 2 CHECK (priority >= 1 AND priority <= 3),
  source TEXT CHECK (source IN ('profile', 'college', 'scholarship')),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own tasks"
ON public.tasks FOR SELECT
USING (auth.uid() = student_id);

CREATE POLICY "Users can insert own tasks"
ON public.tasks FOR INSERT
WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Users can update own tasks"
ON public.tasks FOR UPDATE
USING (auth.uid() = student_id);

CREATE POLICY "Users can delete own tasks"
ON public.tasks FOR DELETE
USING (auth.uid() = student_id);

CREATE INDEX idx_tasks_student ON public.tasks(student_id);

-- Add update triggers for updated_at columns
CREATE TRIGGER update_college_matches_updated_at
  BEFORE UPDATE ON public.college_matches
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_scholarship_pipeline_updated_at
  BEFORE UPDATE ON public.scholarship_pipeline_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();