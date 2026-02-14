-- SBK Tutor Intelligence - V003 Review Queue System
-- Introduces Manual Reviews, Rubrics, and Automated Score Finalization.

BEGIN;

-- 1. Structured Rubric Support
ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS rubric_criteria JSONB DEFAULT '[]'::jsonb;

-- 2. Reviews Table
CREATE TABLE IF NOT EXISTS public.reviews (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    submission_id UUID REFERENCES public.section_b_submissions(id) ON DELETE CASCADE UNIQUE,
    reviewer_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    score INTEGER NOT NULL,
    criteria_scores JSONB DEFAULT '[]'::jsonb,
    feedback TEXT,
    graded_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Review Queue View (FIFO)
-- Use DROP CASCADE to ensure we can change the column structure safely
DROP VIEW IF EXISTS public.review_queue CASCADE;
CREATE VIEW public.review_queue AS
SELECT 
    a.id as attempt_id,
    u.full_name as tutor_name,
    c.name as category_name,
    a.completed_at as submitted_at,
    (SELECT COUNT(*) FROM public.section_b_submissions WHERE attempt_id = a.id) as pending_questions
FROM 
    public.attempts a
JOIN 
    public.users u ON a.user_id = u.id
JOIN 
    public.categories c ON a.category_id = c.id
WHERE 
    a.status = 'submitted'
ORDER BY 
    a.completed_at ASC;

-- 4. Score Finalization Function
CREATE OR REPLACE FUNCTION public.finalize_attempt_review(p_attempt_id UUID)
RETURNS VOID AS $$
DECLARE
    v_a_score INTEGER;
    v_b_score INTEGER;
    v_max_a INTEGER;
    v_max_b INTEGER;
    v_final_pct FLOAT;
BEGIN
    SELECT COALESCE(raw_score, 0), COALESCE(max_score, 0) INTO v_a_score, v_max_a 
    FROM public.section_a_scores WHERE attempt_id = p_attempt_id;

    SELECT COALESCE(SUM(r.score), 0), COALESCE(SUM(q.points), 0)
    INTO v_b_score, v_max_b
    FROM public.section_b_submissions sbs
    JOIN public.questions q ON sbs.question_id = q.id
    LEFT JOIN public.reviews r ON sbs.id = r.submission_id
    WHERE sbs.attempt_id = p_attempt_id;

    v_final_pct := CASE WHEN (v_max_a + v_max_b) > 0 
        THEN ((v_a_score + v_b_score)::FLOAT / (v_max_a + v_max_b)::FLOAT) * 100 
        ELSE 0 END;

    UPDATE public.attempts 
    SET score = v_a_score + v_b_score, percentage = v_final_pct, status = 'graded'
    WHERE id = p_attempt_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage reviews" ON public.reviews;
CREATE POLICY "Admins manage reviews" ON public.reviews FOR ALL USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS "Tutors view own reviews" ON public.reviews;
CREATE POLICY "Tutors view own reviews" ON public.reviews FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.section_b_submissions sbs
        JOIN public.attempts a ON sbs.attempt_id = a.id
        WHERE sbs.id = submission_id AND a.user_id = auth.uid()
    )
);

COMMIT;
