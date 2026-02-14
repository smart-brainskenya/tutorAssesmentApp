-- SBK Tutor Intelligence System - Updated Schema
-- This script updates the existing schema to match the new requirements.

-- 1. Users table (Profiles)
-- Using public.users as requested, linked to auth.users
CREATE TABLE IF NOT EXISTS public.users (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    full_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    role TEXT CHECK (role IN ('admin', 'tutor')) DEFAULT 'tutor',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Categories table
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    published BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Questions table
CREATE TABLE IF NOT EXISTS public.questions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    category_id UUID REFERENCES public.categories(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    option_a TEXT NOT NULL,
    option_b TEXT NOT NULL,
    option_c TEXT NOT NULL,
    option_d TEXT NOT NULL,
    correct_option TEXT CHECK (correct_option IN ('A', 'B', 'C', 'D')) NOT NULL,
    explanation TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Attempts table
CREATE TABLE IF NOT EXISTS public.attempts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    category_id UUID REFERENCES public.categories(id) ON DELETE CASCADE,
    score INTEGER NOT NULL,
    percentage FLOAT NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Answers table
CREATE TABLE IF NOT EXISTS public.answers (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    attempt_id UUID REFERENCES public.attempts(id) ON DELETE CASCADE,
    question_id UUID REFERENCES public.questions(id) ON DELETE CASCADE,
    selected_option TEXT CHECK (selected_option IN ('A', 'B', 'C', 'D')),
    is_correct BOOLEAN NOT NULL
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_questions_category ON public.questions(category_id);
CREATE INDEX IF NOT EXISTS idx_attempts_user ON public.attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_attempts_category ON public.attempts(category_id);
CREATE INDEX IF NOT EXISTS idx_answers_attempt ON public.answers(attempt_id);

-- Enable Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.answers ENABLE ROW LEVEL SECURITY;

-- RLS POLICIES

-- Users
CREATE POLICY "Users can view all user profiles" ON public.users FOR SELECT USING (true);
CREATE POLICY "Users can update their own profile" ON public.users FOR UPDATE USING (auth.uid() = id);

-- Categories
CREATE POLICY "Categories are viewable by everyone" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Only admins can modify categories" ON public.categories 
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
    );

-- Questions
CREATE POLICY "Questions are viewable by authenticated users" ON public.questions FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Only admins can modify questions" ON public.questions 
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
    );

-- Attempts
CREATE POLICY "Tutors can view their own attempts" ON public.attempts 
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all attempts" ON public.attempts 
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
    );
CREATE POLICY "Tutors can insert their own attempts" ON public.attempts 
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Answers
CREATE POLICY "Tutors can view answers for their own attempts" ON public.answers 
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.attempts WHERE id = attempt_id AND user_id = auth.uid())
    );
CREATE POLICY "Admins can view all answers" ON public.answers 
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
    );
CREATE POLICY "Tutors can insert answers for their own attempts" ON public.answers 
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM public.attempts WHERE id = attempt_id AND user_id = auth.uid())
    );

-- Trigger for public.users on auth.users signup
-- (Note: If this was already run, we replace it to ensure it points to public.users instead of profiles)
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

-- Re-attach trigger if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created') THEN
        CREATE TRIGGER on_auth_user_created
        AFTER INSERT ON auth.users
        FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
    END IF;
END $$;
-- SBK Tutor Intelligence - Short Answer Support
-- 1. Update Questions table
ALTER TABLE public.questions 
ADD COLUMN IF NOT EXISTS question_type TEXT CHECK (question_type IN ('multiple_choice', 'short_answer')) DEFAULT 'multiple_choice';

ALTER TABLE public.questions 
ADD COLUMN IF NOT EXISTS min_word_count INTEGER DEFAULT 0;

-- keywords and weights as JSONB: [{"word": "pedagogy", "weight": 5}, ...]
ALTER TABLE public.questions 
ADD COLUMN IF NOT EXISTS rubric JSONB DEFAULT '[]'::jsonb;

ALTER TABLE public.questions 
ADD COLUMN IF NOT EXISTS max_score INTEGER DEFAULT 10;

-- 2. Update Answers table
ALTER TABLE public.answers 
ADD COLUMN IF NOT EXISTS text_response TEXT;

ALTER TABLE public.answers 
ADD COLUMN IF NOT EXISTS matched_keywords TEXT[];
-- SBK Tutor Intelligence - Structured Short Answer Migration
-- 1. Standardize expected_keywords as JSONB
ALTER TABLE public.questions DROP COLUMN IF EXISTS rubric;
ALTER TABLE public.questions DROP COLUMN IF EXISTS expected_keywords;
ALTER TABLE public.questions ADD COLUMN expected_keywords JSONB DEFAULT '[]'::jsonb;

-- 2. Cleanup Answer matched_keywords to match
ALTER TABLE public.answers DROP COLUMN IF EXISTS matched_keywords;
ALTER TABLE public.answers ADD COLUMN matched_keywords JSONB DEFAULT '[]'::jsonb;
-- SBK Tutor Intelligence - Account Management Extensions
-- 1. Update public.users table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS last_login TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS retake_allowed_at TIMESTAMP WITH TIME ZONE;

-- 2. Update RLS for Admin Management
-- Allow admins to update any user record (role, is_active, retake_allowed_at)
DROP POLICY IF EXISTS "Admins can update all user profiles" ON public.users;
CREATE POLICY "Admins can update all user profiles" ON public.users
    FOR UPDATE USING (
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
    );

-- 3. Inactive Check (Logic for AuthContext)
-- We'll handle the "Prevent Login" by checking is_active in the AuthProvider
-- and signing the user out if they are deactivated.
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
-- SBK Tutor Intelligence - Analytics Views
-- This script creates views to standardize aggregation logic

-- 1. Consolidated Tutor Performance View
-- Handles NULL for untested tutors instead of 0%
CREATE OR REPLACE VIEW v_tutor_performance AS
SELECT 
    u.id as user_id,
    u.full_name,
    u.email,
    COUNT(a.id) as total_attempts,
    AVG(a.percentage) as avg_score,
    MAX(a.percentage) as highest_score,
    CASE 
        WHEN COUNT(a.id) > 0 THEN true 
        ELSE false 
    END as is_active
FROM 
    public.users u
LEFT JOIN 
    public.attempts a ON u.id = a.user_id
WHERE 
    u.role = 'tutor'
GROUP BY 
    u.id, u.full_name, u.email;

-- 2. Global Metrics View
-- Only averages scores from active tutors
CREATE OR REPLACE VIEW v_global_metrics AS
SELECT 
    COUNT(user_id) FILTER (WHERE is_active) as active_tutors,
    COUNT(user_id) FILTER (WHERE NOT is_active) as inactive_tutors,
    AVG(avg_score) as global_avg_score
FROM 
    v_tutor_performance
WHERE 
    is_active = true;

-- 3. Category Performance View
CREATE OR REPLACE VIEW v_category_performance AS
SELECT 
    c.id as category_id,
    c.name as category_name,
    AVG(a.percentage) as avg_category_score,
    COUNT(a.id) as attempt_count
FROM 
    public.categories c
JOIN 
    public.attempts a ON c.id = a.category_id
GROUP BY 
    c.id, c.name;
-- SBK Tutor Intelligence - Production Optimization Script
-- Run this in the Supabase SQL Editor to prepare for production.

-- 1. Create Performance Indexes
-- Optimize filtering by user_id in attempts (Used heavily in Tutor Dashboard)
CREATE INDEX IF NOT EXISTS idx_attempts_user_id ON public.attempts(user_id);

-- Optimize filtering by category_id in attempts (Used in OMI and Category stats)
CREATE INDEX IF NOT EXISTS idx_attempts_category_id ON public.attempts(category_id);

-- Optimize filtering by role in users table (Used in Admin Dashboard)
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);

-- Optimize joining questions to categories
CREATE INDEX IF NOT EXISTS idx_questions_category_id ON public.questions(category_id);

-- 2. Create Aggregated Leaderboard View
-- This view pre-calculates the stats to avoid expensive JS-side aggregation.
-- It can be queried directly via supabase.from('v_tutor_leaderboard').select('*')
CREATE OR REPLACE VIEW v_tutor_leaderboard AS
SELECT 
    u.id as user_id,
    u.full_name,
    u.email,
    COUNT(a.id) as total_tests,
    ROUND(AVG(a.percentage)) as avg_score,
    MAX(a.completed_at) as last_attempt_at,
    u.last_login
FROM 
    public.users u
LEFT JOIN 
    public.attempts a ON u.id = a.user_id
WHERE 
    u.role = 'tutor'
GROUP BY 
    u.id, u.full_name, u.email, u.last_login;

-- 3. Create OMI Base View (Optional Helper)
-- Pre-calculates the latest attempt per category per user
CREATE OR REPLACE VIEW v_latest_attempts AS
SELECT DISTINCT ON (user_id, category_id) 
    user_id,
    category_id,
    percentage,
    completed_at
FROM 
    public.attempts
ORDER BY 
    user_id, category_id, completed_at DESC;
