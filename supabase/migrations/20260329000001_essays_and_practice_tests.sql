-- ============================================================
-- Essays table: stores student essay drafts linked to their profile
-- ============================================================
CREATE TABLE IF NOT EXISTS public.essays (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title         TEXT NOT NULL,
  essay_type    TEXT NOT NULL DEFAULT 'personal_statement'
                  CHECK (essay_type IN ('personal_statement','scholarship','short_answer','supplemental','other')),
  prompt        TEXT,
  content       TEXT NOT NULL DEFAULT '',
  word_count    INTEGER GENERATED ALWAYS AS (
                  array_length(string_to_array(trim(content), ' '), 1)
                ) STORED,
  status        TEXT NOT NULL DEFAULT 'draft'
                  CHECK (status IN ('draft','in_progress','complete')),
  tags          TEXT[] DEFAULT '{}',
  college_id    UUID REFERENCES public.colleges(id) ON DELETE SET NULL,
  scholarship_id UUID REFERENCES public.scholarships(id) ON DELETE SET NULL,
  ai_feedback   JSONB,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.essays ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own essays"
  ON public.essays FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_essays_user_id ON public.essays(user_id);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS essays_updated_at ON public.essays;
CREATE TRIGGER essays_updated_at
  BEFORE UPDATE ON public.essays
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- Practice test infrastructure: SAT & ACT rotating questions
-- ============================================================

-- Question bank
CREATE TABLE IF NOT EXISTS public.practice_test_questions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_type       TEXT NOT NULL CHECK (test_type IN ('SAT','ACT')),
  section         TEXT NOT NULL,
  -- SAT sections: 'reading_writing', 'math'
  -- ACT sections: 'english', 'math', 'reading', 'science'
  difficulty      TEXT NOT NULL DEFAULT 'medium'
                    CHECK (difficulty IN ('easy','medium','hard')),
  question_text   TEXT NOT NULL,
  passage_text    TEXT,                    -- for reading/science questions
  answer_choices  JSONB NOT NULL,          -- [{"key":"A","text":"..."},...]
  correct_answer  TEXT NOT NULL,           -- "A", "B", "C", or "D"
  explanation     TEXT NOT NULL,
  skill_tag       TEXT,                    -- e.g. "algebra", "grammar", "inference"
  source_note     TEXT DEFAULT 'College Compass Question Bank',
  active          BOOLEAN NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_ptq_type_section ON public.practice_test_questions(test_type, section, difficulty);
CREATE INDEX idx_ptq_active ON public.practice_test_questions(active);

-- No RLS on questions — all authenticated users can read
ALTER TABLE public.practice_test_questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "All authenticated users can read questions"
  ON public.practice_test_questions FOR SELECT
  USING (auth.role() = 'authenticated');

-- Student test attempts
CREATE TABLE IF NOT EXISTS public.student_test_attempts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  test_type       TEXT NOT NULL CHECK (test_type IN ('SAT','ACT')),
  test_mode       TEXT NOT NULL DEFAULT 'practice'
                    CHECK (test_mode IN ('practice','timed','full')),
  section         TEXT,                    -- null = full test
  questions       JSONB NOT NULL,          -- [{question_id, user_answer, correct, time_spent_sec}]
  score_raw       INTEGER,                 -- number correct
  score_scaled    INTEGER,                 -- SAT: 200-800 per section, ACT: 1-36
  total_questions INTEGER NOT NULL,
  time_limit_sec  INTEGER,
  time_spent_sec  INTEGER,
  completed       BOOLEAN NOT NULL DEFAULT false,
  completed_at    TIMESTAMPTZ,
  section_scores  JSONB,                   -- {section: {raw, scaled, pct}}
  skill_breakdown JSONB,                   -- {skill_tag: {correct, total}}
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.student_test_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own test attempts"
  ON public.student_test_attempts FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_sta_user_id ON public.student_test_attempts(user_id);
CREATE INDEX idx_sta_type ON public.student_test_attempts(test_type, completed);

DROP TRIGGER IF EXISTS sta_updated_at ON public.student_test_attempts;
CREATE TRIGGER sta_updated_at
  BEFORE UPDATE ON public.student_test_attempts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
