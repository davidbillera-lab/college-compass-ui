-- ============================================================
-- Phase 4: Application Guidance & Tracking
-- ============================================================

-- 1) Add deadline_date to college_matches (if not already present)
ALTER TABLE public.college_matches
  ADD COLUMN IF NOT EXISTS deadline_date date,
  ADD COLUMN IF NOT EXISTS app_type text CHECK (app_type IN ('ED', 'EA', 'RD', 'REA', 'Rolling')) DEFAULT 'RD',
  ADD COLUMN IF NOT EXISTS notes text;

-- 2) Create application_checklist_items table
--    Each row is one checklist step for a student+college pair.
--    Steps are seeded automatically when a student moves a college to APPLYING.
CREATE TABLE IF NOT EXISTS public.application_checklist_items (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  college_id    UUID NOT NULL REFERENCES public.colleges(id) ON DELETE CASCADE,
  step_key      TEXT NOT NULL,
  title         TEXT NOT NULL,
  description   TEXT,
  category      TEXT NOT NULL CHECK (category IN ('essays', 'test_scores', 'recommendations', 'financial_aid', 'transcripts', 'supplements', 'other')),
  sort_order    INTEGER NOT NULL DEFAULT 0,
  completed_at  TIMESTAMPTZ,
  due_date      DATE,
  notes         TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(student_id, college_id, step_key)
);

ALTER TABLE public.application_checklist_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own checklist items"
  ON public.application_checklist_items FOR SELECT
  USING (auth.uid() = student_id);

CREATE POLICY "Users can insert own checklist items"
  ON public.application_checklist_items FOR INSERT
  WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Users can update own checklist items"
  ON public.application_checklist_items FOR UPDATE
  USING (auth.uid() = student_id);

CREATE POLICY "Users can delete own checklist items"
  ON public.application_checklist_items FOR DELETE
  USING (auth.uid() = student_id);

CREATE INDEX idx_checklist_student ON public.application_checklist_items(student_id);
CREATE INDEX idx_checklist_student_college ON public.application_checklist_items(student_id, college_id);

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'set_checklist_updated_at'
  ) THEN
    CREATE TRIGGER set_checklist_updated_at
      BEFORE UPDATE ON public.application_checklist_items
      FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;
END $$;
