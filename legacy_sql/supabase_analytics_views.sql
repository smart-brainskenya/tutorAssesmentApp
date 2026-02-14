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
