-- SBK Tutor Intelligence - Hybrid Assessment Schema (v3)
-- This migration transforms the flat question structure into a Section-based Hybrid model.

BEGIN;

-- 1. Create Sections Table
CREATE TABLE IF NOT EXISTS public.sections (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    category_id UUID REFERENCES public.categories(id) ON DELETE CASCADE,
    section_type TEXT CHECK (section_type IN ('A', 'B')) NOT NULL, -- A = Auto/MC, B = Manual/Text
    title TEXT NOT NULL,
    description TEXT,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(category_id, section_type) -- One Section A and One Section B per category
);

-- 2. Migrate Questions to Sections
-- Add section_id column
ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS section_id UUID REFERENCES public.sections(id) ON DELETE CASCADE;

-- Add refined columns for the new types
ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS points INTEGER DEFAULT 10;
ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS options JSONB DEFAULT '[]'::jsonb; -- Standardized MC options

-- 3. Modify Attempts for Workflow Status
ALTER TABLE public.attempts ADD COLUMN IF NOT EXISTS status TEXT 
    CHECK (status IN ('in_progress', 'submitted', 'graded')) 
    DEFAULT 'in_progress';
ALTER TABLE public.attempts ADD COLUMN IF NOT EXISTS final_feedback TEXT;

-- 4. Create Section A Scores (Auto-Graded Summary)
CREATE TABLE IF NOT EXISTS public.section_a_scores (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    attempt_id UUID REFERENCES public.attempts(id) ON DELETE CASCADE,
    raw_score INTEGER NOT NULL,
    max_score INTEGER NOT NULL,
    answers_snapshot JSONB NOT NULL, -- Stores { "q_id": "selected_opt" } for audit
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Create Section B Submissions (Text Answers for Review)
CREATE TABLE IF NOT EXISTS public.section_b_submissions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    attempt_id UUID REFERENCES public.attempts(id) ON DELETE CASCADE,
    question_id UUID REFERENCES public.questions(id) ON DELETE CASCADE,
    answer_text TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. Create Reviews (Admin Grading)
CREATE TABLE IF NOT EXISTS public.reviews (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    submission_id UUID REFERENCES public.section_b_submissions(id) ON DELETE CASCADE UNIQUE, -- One review per answer
    reviewer_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    score INTEGER NOT NULL,
    feedback TEXT,
    graded_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. Create Review Queue View
-- Finds attempts that are 'submitted' but have ungraded Section B submissions
CREATE OR REPLACE VIEW public.review_queue AS
SELECT 
    a.id as attempt_id,
    a.user_id,
    u.full_name as tutor_name,
    c.name as category_name,
    a.completed_at as submitted_at,
    COUNT(sbs.id) as total_text_answers,
    COUNT(r.id) as graded_count
FROM 
    public.attempts a
JOIN 
    public.users u ON a.user_id = u.id
JOIN 
    public.categories c ON a.category_id = c.id
JOIN 
    public.section_b_submissions sbs ON a.id = sbs.attempt_id
LEFT JOIN 
    public.reviews r ON sbs.id = r.submission_id
WHERE 
    a.status = 'submitted'
GROUP BY 
    a.id, a.user_id, u.full_name, c.name, a.completed_at
HAVING 
    COUNT(sbs.id) > COUNT(r.id); -- Only show attempts with pending reviews

-- 8. RLS Policies

-- Enable RLS
ALTER TABLE public.sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.section_a_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.section_b_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Sections: Visible to everyone
CREATE POLICY "Sections are viewable by everyone" ON public.sections FOR SELECT USING (true);
CREATE POLICY "Admins manage sections" ON public.sections FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);

-- Section A Scores: Tutors view own, Admins view all
CREATE POLICY "Tutors view own A scores" ON public.section_a_scores FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.attempts WHERE id = attempt_id AND user_id = auth.uid())
);
CREATE POLICY "Admins view all A scores" ON public.section_a_scores FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "System inserts A scores" ON public.section_a_scores FOR INSERT WITH CHECK (
    -- Typically done by server, but if client-driven, ensure user owns the attempt
    EXISTS (SELECT 1 FROM public.attempts WHERE id = attempt_id AND user_id = auth.uid())
);

-- Section B Submissions: Tutors insert/view own, Admins view all
CREATE POLICY "Tutors insert own B submissions" ON public.section_b_submissions FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.attempts WHERE id = attempt_id AND user_id = auth.uid())
);
CREATE POLICY "Tutors view own B submissions" ON public.section_b_submissions FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.attempts WHERE id = attempt_id AND user_id = auth.uid())
);
CREATE POLICY "Admins view all B submissions" ON public.section_b_submissions FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);

-- Reviews: Admins manage, Tutors read-only
CREATE POLICY "Admins manage reviews" ON public.reviews FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Tutors view reviews on their work" ON public.reviews FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.section_b_submissions sbs
        JOIN public.attempts a ON sbs.attempt_id = a.id
        WHERE sbs.id = submission_id AND a.user_id = auth.uid()
    )
);

-- Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_questions_section ON public.questions(section_id);
CREATE INDEX IF NOT EXISTS idx_sections_category ON public.sections(category_id);
CREATE INDEX IF NOT EXISTS idx_section_b_attempt ON public.section_b_submissions(attempt_id);
CREATE INDEX IF NOT EXISTS idx_reviews_submission ON public.reviews(submission_id);

COMMIT;
