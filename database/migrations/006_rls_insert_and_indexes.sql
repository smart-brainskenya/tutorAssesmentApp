-- SBK Tutor Intelligence - V006 Stabilization & Hardening
-- 1. Atomic Submission RPC
-- 2. RLS Insert Policies for Tutors
-- 3. Performance Indexes
-- 4. Lifecycle Transition Enforcement

BEGIN;

-- 1. ATOMIC SUBMISSION RPC
-- Ensures an attempt and its scores/submissions are created in a single transaction.
CREATE OR REPLACE FUNCTION public.create_and_submit_hybrid_attempt(
    p_category_id UUID,
    p_section_a JSONB, -- { "raw_score": int, "max_score": int, "snapshot": jsonb }
    p_section_b JSONB  -- Array of { "question_id": uuid, "answer_text": text }
)
RETURNS UUID AS $$
DECLARE
    v_attempt_id UUID;
    v_item JSONB;
BEGIN
    -- Insert Attempt
    INSERT INTO public.attempts (user_id, category_id, status, score, percentage)
    VALUES (auth.uid(), p_category_id, 'submitted', 0, 0)
    RETURNING id INTO v_attempt_id;

    -- Insert Section A Score
    INSERT INTO public.section_a_scores (attempt_id, raw_score, max_score, answers_snapshot)
    VALUES (
        v_attempt_id, 
        (p_section_a->>'raw_score')::INTEGER, 
        (p_section_a->>'max_score')::INTEGER, 
        (p_section_a->'snapshot')
    );

    -- Insert Section B Submissions
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_section_b)
    LOOP
        INSERT INTO public.section_b_submissions (attempt_id, question_id, answer_text)
        VALUES (
            v_attempt_id, 
            (v_item->>'question_id')::UUID, 
            (v_item->>'answer_text')
        );
    END LOOP;

    RETURN v_attempt_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. FIX RLS INSERT POLICIES
-- Allow tutors to insert scores/submissions only for their own attempts.
DROP POLICY IF EXISTS "Tutors insert own A scores" ON public.section_a_scores;
CREATE POLICY "Tutors insert own A scores" ON public.section_a_scores
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM public.attempts WHERE id = attempt_id AND user_id = auth.uid())
    );

DROP POLICY IF EXISTS "Tutors insert own B submissions" ON public.section_b_submissions;
CREATE POLICY "Tutors insert own B submissions" ON public.section_b_submissions
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM public.attempts WHERE id = attempt_id AND user_id = auth.uid())
    );

-- 3. PERFORMANCE INDEXES
-- Indexing high-traffic foreign keys to optimize joins for Review Queue and History.
CREATE INDEX IF NOT EXISTS idx_section_a_scores_attempt_id ON public.section_a_scores(attempt_id);
CREATE INDEX IF NOT EXISTS idx_section_b_submissions_attempt_id ON public.section_b_submissions(attempt_id);
CREATE INDEX IF NOT EXISTS idx_reviews_submission_id ON public.reviews(submission_id);
CREATE INDEX IF NOT EXISTS idx_attempts_user_category ON public.attempts(user_id, category_id);
CREATE INDEX IF NOT EXISTS idx_attempts_status ON public.attempts(status);

-- 4. LIFECYCLE ENFORCEMENT (Data Integrity)
-- Prevent status from being changed back to in_progress once submitted.
ALTER TABLE public.attempts DROP CONSTRAINT IF EXISTS check_status_flow;
ALTER TABLE public.attempts ADD CONSTRAINT check_status_flow 
    CHECK (status IN ('in_progress', 'submitted', 'graded'));

-- Trigger to prevent manual status tampering by unauthorized updates
CREATE OR REPLACE FUNCTION public.enforce_attempt_status_progression()
RETURNS TRIGGER AS $$
BEGIN
    -- Prevent downgrading from graded/submitted to in_progress
    IF OLD.status = 'submitted' AND NEW.status = 'in_progress' THEN
        RAISE EXCEPTION 'Cannot revert a submitted assessment to in-progress.';
    END IF;
    IF OLD.status = 'graded' AND NEW.status != 'graded' THEN
        RAISE EXCEPTION 'Cannot modify a finalized grade.';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_status_enforcement ON public.attempts;
CREATE TRIGGER trigger_status_enforcement
    BEFORE UPDATE ON public.attempts
    FOR EACH ROW EXECUTE PROCEDURE public.enforce_attempt_status_progression();

COMMIT;
