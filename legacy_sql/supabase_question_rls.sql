-- SBK Tutor Intelligence - Question Management RLS
-- 1. Ensure Admin has full control
DROP POLICY IF EXISTS "Only admins can modify questions" ON public.questions;
CREATE POLICY "Admins have full control over questions" ON public.questions
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
    );

-- 2. Ensure Tutors can only read questions
DROP POLICY IF EXISTS "Questions are viewable by authenticated users" ON public.questions;
CREATE POLICY "Tutors can read questions" ON public.questions
    FOR SELECT USING (
        auth.role() = 'authenticated'
    );

-- 3. Answers table check policy (needed for delete check)
DROP POLICY IF EXISTS "Admins can view all answers" ON public.answers;
CREATE POLICY "Admins can view all answers" ON public.answers
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
    );
