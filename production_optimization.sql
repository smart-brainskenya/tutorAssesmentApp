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
