-- SBK Tutor Intelligence - Structured Short Answer Migration
-- 1. Standardize expected_keywords as JSONB
ALTER TABLE public.questions DROP COLUMN IF EXISTS rubric;
ALTER TABLE public.questions DROP COLUMN IF EXISTS expected_keywords;
ALTER TABLE public.questions ADD COLUMN expected_keywords JSONB DEFAULT '[]'::jsonb;

-- 2. Cleanup Answer matched_keywords to match
ALTER TABLE public.answers DROP COLUMN IF EXISTS matched_keywords;
ALTER TABLE public.answers ADD COLUMN matched_keywords JSONB DEFAULT '[]'::jsonb;
