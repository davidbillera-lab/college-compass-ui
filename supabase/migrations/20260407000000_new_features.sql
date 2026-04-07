-- =============================================================================
-- Migration: New Full-Service Consultant Features
-- Date: 2026-04-07
-- Features: Financial Aid Comparison, Appeal Letters, Task Timeline,
--           Career Assessment Results, Brag Sheets
-- =============================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. Financial Aid Award Comparisons
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.aid_comparisons (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  college_name  TEXT NOT NULL,
  tuition       NUMERIC DEFAULT 0,
  room_board    NUMERIC DEFAULT 0,
  fees          NUMERIC DEFAULT 0,
  books         NUMERIC DEFAULT 0,
  grants        NUMERIC DEFAULT 0,
  scholarships  NUMERIC DEFAULT 0,
  subsidized_loans    NUMERIC DEFAULT 0,
  unsubsidized_loans  NUMERIC DEFAULT 0,
  work_study    NUMERIC DEFAULT 0,
  parent_plus_loans   NUMERIC DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.aid_comparisons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own aid comparisons"
  ON public.aid_comparisons
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. Appeal Letters
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.appeal_letters (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  college_name        TEXT NOT NULL,
  appeal_type         TEXT NOT NULL,
  current_aid         TEXT,
  requested_aid       TEXT,
  competing_school    TEXT,
  competing_offer     TEXT,
  circumstance_details TEXT,
  generated_letter    TEXT,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.appeal_letters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own appeal letters"
  ON public.appeal_letters
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. Task Timeline
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.timeline_tasks (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  category    TEXT NOT NULL DEFAULT 'general',
  due_date    DATE NOT NULL,
  college_id  UUID,
  completed   BOOLEAN DEFAULT FALSE,
  priority    TEXT DEFAULT 'medium',
  description TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.timeline_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own timeline tasks"
  ON public.timeline_tasks
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.college_deadlines (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  type        TEXT NOT NULL DEFAULT 'RD',
  deadline    DATE NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.college_deadlines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own college deadlines"
  ON public.college_deadlines
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. Career Assessment Results
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.career_assessments (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  scores        JSONB NOT NULL DEFAULT '{}',
  top_codes     TEXT[] NOT NULL DEFAULT '{}',
  analysis      TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.career_assessments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own career assessments"
  ON public.career_assessments
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. Brag Sheets
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.brag_sheets (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  student_name        TEXT,
  school              TEXT,
  gpa                 TEXT,
  sat_score           TEXT,
  act_score           TEXT,
  intended_major      TEXT,
  personal_statement  TEXT,
  activities          JSONB DEFAULT '[]',
  awards              JSONB DEFAULT '[]',
  community_service   TEXT,
  work_experience     TEXT,
  unique_qualities    TEXT,
  teacher_context     TEXT,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.brag_sheets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own brag sheets"
  ON public.brag_sheets
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- 6. FAFSA Assistant Conversations
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.fafsa_conversations (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  messages    JSONB NOT NULL DEFAULT '[]',
  form_type   TEXT DEFAULT 'FAFSA',
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.fafsa_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own FAFSA conversations"
  ON public.fafsa_conversations
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
