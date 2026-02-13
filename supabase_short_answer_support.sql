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
