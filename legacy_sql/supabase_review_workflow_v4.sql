-- SBK Tutor Intelligence - Manual Review Workflow (v4)
-- Adds structured rubrics and finalized state management

BEGIN;

-- 1. Enhance Questions with Structured Rubrics
-- Instead of just a single 'max_score', we allow multiple criteria
ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS rubric_criteria JSONB DEFAULT '[]'::jsonb;
-- Example: [{"label": "Content Accuracy", "max": 5}, {"label": "Professionalism", "max": 5}]

-- 2. Enhance Reviews with Criteria Breakdown
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS criteria_scores JSONB DEFAULT '[]'::jsonb;
-- Example: [{"label": "Content Accuracy", "score": 4}, {"label": "Professionalism", "score": 5}]

-- 3. Function to Calculate Final Score
-- This sums Section A and Section B then updates the attempt status
CREATE OR REPLACE FUNCTION public.finalize_attempt_review(p_attempt_id UUID)
RETURNS VOID AS $$
DECLARE
    v_a_score INTEGER;
    v_b_score INTEGER;
    v_max_a INTEGER;
    v_max_b INTEGER;
    v_final_pct FLOAT;
BEGIN
    -- Get Section A Score
    SELECT raw_score, max_score INTO v_a_score, v_max_a 
    FROM public.section_a_scores WHERE attempt_id = p_attempt_id;

    -- Sum Section B Scores from Reviews
    SELECT COALESCE(SUM(r.score), 0), COALESCE(SUM(q.points), 0)
    INTO v_b_score, v_max_b
    FROM public.section_b_submissions sbs
    JOIN public.questions q ON sbs.question_id = q.id
    LEFT JOIN public.reviews r ON sbs.id = r.submission_id
    WHERE sbs.attempt_id = p_attempt_id;

    -- Calculate Percentage
    v_final_pct := ((v_a_score + v_b_score)::FLOAT / (v_max_a + v_max_b)::FLOAT) * 100;

    -- Update Attempt
    UPDATE public.attempts 
    SET 
        score = v_a_score + v_b_score,
        percentage = v_final_pct,
        status = 'graded'
    WHERE id = p_attempt_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Refined Review Queue View (Strict FIFO)
CREATE OR REPLACE VIEW public.review_queue AS
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
    a.completed_at ASC; -- FIFO Fairness

COMMIT;
