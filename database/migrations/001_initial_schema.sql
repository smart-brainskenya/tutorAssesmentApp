-- SBK Tutor Intelligence - V001 Baseline Schema
-- Includes Users, Categories, Questions (MC + SA), Attempts, and Answers.

BEGIN;

-- 1. Users Table
CREATE TABLE IF NOT EXISTS public.users (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    full_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    role TEXT CHECK (role IN ('admin', 'tutor')) DEFAULT 'tutor',
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP WITH TIME ZONE,
    retake_allowed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Categories Table
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    published BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Questions Table (Hybrid Ready)
CREATE TABLE IF NOT EXISTS public.questions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    category_id UUID REFERENCES public.categories(id) ON DELETE CASCADE,
    question_type TEXT CHECK (question_type IN ('multiple_choice', 'short_answer')) DEFAULT 'multiple_choice',
    question_text TEXT NOT NULL,
    -- MC Fields
    option_a TEXT,
    option_b TEXT,
    option_c TEXT,
    option_d TEXT,
    correct_option TEXT CHECK (correct_option IN ('A', 'B', 'C', 'D')),
    -- SA Fields
    min_word_count INTEGER DEFAULT 0,
    expected_keywords JSONB DEFAULT '[]'::jsonb,
    max_score INTEGER DEFAULT 10,
    -- Common
    explanation TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Attempts Table
CREATE TABLE IF NOT EXISTS public.attempts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    category_id UUID REFERENCES public.categories(id) ON DELETE CASCADE,
    score INTEGER DEFAULT 0,
    percentage FLOAT DEFAULT 0,
    status TEXT CHECK (status IN ('in_progress', 'submitted', 'graded')) DEFAULT 'in_progress',
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Answers Table (Legacy/Flat - will be superseded by Section models in v2)
CREATE TABLE IF NOT EXISTS public.answers (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    attempt_id UUID REFERENCES public.attempts(id) ON DELETE CASCADE,
    question_id UUID REFERENCES public.questions(id) ON DELETE CASCADE,
    selected_option TEXT CHECK (selected_option IN ('A', 'B', 'C', 'D')),
    text_response TEXT,
    is_correct BOOLEAN DEFAULT false,
    score INTEGER DEFAULT 0,
    matched_keywords JSONB DEFAULT '[]'::jsonb
);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_questions_category ON public.questions(category_id);
CREATE INDEX IF NOT EXISTS idx_attempts_user ON public.attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_attempts_category ON public.attempts(category_id);
CREATE INDEX IF NOT EXISTS idx_answers_attempt ON public.answers(attempt_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);

-- RLS Enablement
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.answers ENABLE ROW LEVEL SECURITY;

-- Basic Policies
DROP POLICY IF EXISTS "Users viewable by authenticated" ON public.users;
CREATE POLICY "Users viewable by authenticated" ON public.users FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Users update own profile" ON public.users;
CREATE POLICY "Users update own profile" ON public.users FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Admins manage users" ON public.users;
CREATE POLICY "Admins manage users" ON public.users FOR ALL USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS "Categories viewable by everyone" ON public.categories;
CREATE POLICY "Categories viewable by everyone" ON public.categories FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins manage categories" ON public.categories;
CREATE POLICY "Admins manage categories" ON public.categories FOR ALL USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS "Questions viewable by authenticated" ON public.questions;
CREATE POLICY "Questions viewable by authenticated" ON public.questions FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Admins manage questions" ON public.questions;
CREATE POLICY "Admins manage questions" ON public.questions FOR ALL USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS "Tutors manage own attempts" ON public.attempts;
CREATE POLICY "Tutors manage own attempts" ON public.attempts FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins view all attempts" ON public.attempts;
CREATE POLICY "Admins view all attempts" ON public.attempts FOR SELECT USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS "Tutors manage own answers" ON public.answers;
CREATE POLICY "Tutors manage own answers" ON public.answers FOR ALL USING (EXISTS (SELECT 1 FROM public.attempts WHERE id = attempt_id AND user_id = auth.uid()));

DROP POLICY IF EXISTS "Admins view all answers" ON public.answers;
CREATE POLICY "Admins view all answers" ON public.answers FOR SELECT USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

-- Trigger for Auto-Profile Creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, role)
  VALUES (
    new.id, 
    new.email, 
    COALESCE(new.raw_user_meta_data->>'full_name', 'SBK Tutor'), 
    COALESCE(new.raw_user_meta_data->>'role', 'tutor')
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

COMMIT;
