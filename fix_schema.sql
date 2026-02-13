-- Fix missing columns in existing tables
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='categories' AND column_name='published') THEN
        ALTER TABLE public.categories ADD COLUMN published BOOLEAN DEFAULT false;
    END IF;

    -- Ensure other v2 columns exist if needed
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='questions' AND column_name='option_a') THEN
        ALTER TABLE public.questions ADD COLUMN option_a TEXT;
        ALTER TABLE public.questions ADD COLUMN option_b TEXT;
        ALTER TABLE public.questions ADD COLUMN option_c TEXT;
        ALTER TABLE public.questions ADD COLUMN option_d TEXT;
        ALTER TABLE public.questions ADD COLUMN correct_option TEXT;
        ALTER TABLE public.questions ADD COLUMN explanation TEXT;
    END IF;
END $$;
