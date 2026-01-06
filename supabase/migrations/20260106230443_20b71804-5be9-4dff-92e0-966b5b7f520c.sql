
-- =========================
-- 0) ENUMS (create if missing)
-- =========================
DO $$ BEGIN
  CREATE TYPE public.shortlist_status AS ENUM ('INTERESTED','APPLYING','APPLIED','NOT_NOW');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.pipeline_status AS ENUM ('NOT_STARTED','DRAFTING','SUBMITTED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- =========================
-- 1) PROFILES: add missing columns
-- =========================
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS full_name text,
  ADD COLUMN IF NOT EXISTS grad_year int,
  ADD COLUMN IF NOT EXISTS test_policy text,
  ADD COLUMN IF NOT EXISTS budget_max_usd int,
  ADD COLUMN IF NOT EXISTS campus_size text,
  ADD COLUMN IF NOT EXISTS proud_moment text,
  ADD COLUMN IF NOT EXISTS challenge text,
  ADD COLUMN IF NOT EXISTS impact text;

-- Updated_at trigger for profiles
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_profiles_updated_at ON public.profiles;
CREATE TRIGGER trg_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =========================
-- 2) COLLEGE_MATCHES: add shortlist enum column + unique constraint
-- =========================
ALTER TABLE public.college_matches
  ADD COLUMN IF NOT EXISTS shortlist public.shortlist_status;

-- Add unique constraint for (student_id, college_id) if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'college_matches_student_college_unique'
  ) THEN
    ALTER TABLE public.college_matches
      ADD CONSTRAINT college_matches_student_college_unique UNIQUE (student_id, college_id);
  END IF;
END $$;

-- =========================
-- 3) SCHOLARSHIP_PIPELINE_ITEMS: add pipeline_status enum
-- =========================
ALTER TABLE public.scholarship_pipeline_items
  ADD COLUMN IF NOT EXISTS pipeline_status public.pipeline_status DEFAULT 'NOT_STARTED';

-- Add unique constraint for (student_id, scholarship_id) if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'scholarship_pipeline_student_scholarship_unique'
  ) THEN
    ALTER TABLE public.scholarship_pipeline_items
      ADD CONSTRAINT scholarship_pipeline_student_scholarship_unique UNIQUE (student_id, scholarship_id);
  END IF;
END $$;

-- =========================
-- 4) INDEXES (safe to create)
-- =========================
CREATE INDEX IF NOT EXISTS idx_college_matches_student ON public.college_matches(student_id);
CREATE INDEX IF NOT EXISTS idx_pipeline_student ON public.scholarship_pipeline_items(student_id);
CREATE INDEX IF NOT EXISTS idx_tasks_student ON public.tasks(student_id);
