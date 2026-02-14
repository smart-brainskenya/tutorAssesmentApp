-- SBK Tutor Intelligence - V002 Hybrid Assessment Restructure
-- Introduces Sections, Section A Scores, and Section B Submissions.

BEGIN;

-- 1. Sections Table
CREATE TABLE IF NOT EXISTS public.sections (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    category_id UUID REFERENCES public.categories(id) ON DELETE CASCADE,
    section_type TEXT CHECK (section_type IN ('A', 'B')) NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(category_id, section_type)
);

-- 2. Link Questions to Sections
ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS section_id UUID REFERENCES public.sections(id) ON DELETE CASCADE;
ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS points INTEGER DEFAULT 10;
ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS options JSONB DEFAULT '[]'::jsonb;

-- 3. Section A Scores (Instant Results)
CREATE TABLE IF NOT EXISTS public.section_a_scores (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    attempt_id UUID REFERENCES public.attempts(id) ON DELETE CASCADE,
    raw_score INTEGER NOT NULL,
    max_score INTEGER NOT NULL,
    answers_snapshot JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Section B Submissions (Text for Review)
CREATE TABLE IF NOT EXISTS public.section_b_submissions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    attempt_id UUID REFERENCES public.attempts(id) ON DELETE CASCADE,
    question_id UUID REFERENCES public.questions(id) ON DELETE CASCADE,
    answer_text TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS
ALTER TABLE public.sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.section_a_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.section_b_submissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Sections viewable by authenticated" ON public.sections;
CREATE POLICY "Sections viewable by authenticated" ON public.sections FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Admins manage sections" ON public.sections;
CREATE POLICY "Admins manage sections" ON public.sections FOR ALL USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS "Tutors view own A scores" ON public.section_a_scores;
CREATE POLICY "Tutors view own A scores" ON public.section_a_scores FOR SELECT USING (EXISTS (SELECT 1 FROM public.attempts WHERE id = attempt_id AND user_id = auth.uid()));

DROP POLICY IF EXISTS "Tutors view own B submissions" ON public.section_b_submissions;
CREATE POLICY "Tutors view own B submissions" ON public.section_b_submissions FOR SELECT USING (EXISTS (SELECT 1 FROM public.attempts WHERE id = attempt_id AND user_id = auth.uid()));

DROP POLICY IF EXISTS "Admins view all scores/subs" ON public.section_a_scores;
CREATE POLICY "Admins view all scores/subs" ON public.section_a_scores FOR SELECT USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS "Admins view all B subs" ON public.section_b_submissions;
CREATE POLICY "Admins view all B subs" ON public.section_b_submissions FOR SELECT USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

-- Performance
CREATE INDEX IF NOT EXISTS idx_questions_section ON public.questions(section_id);
CREATE INDEX IF NOT EXISTS idx_sections_category ON public.sections(category_id);

COMMIT;
