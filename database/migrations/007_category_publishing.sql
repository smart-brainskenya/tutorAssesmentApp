-- SBK Tutor Intelligence - V007 Category Publishing Control (Idempotent)
-- Standardizes naming to is_published and adds published_at timestamp.
-- Uses conditional logic to prevent "column does not exist" errors on re-run.

DO $$
BEGIN
    -- 1. Rename 'published' to 'is_published' ONLY if the old name exists
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='categories' AND column_name='published'
    ) THEN
        ALTER TABLE public.categories RENAME COLUMN published TO is_published;
    END IF;

    -- 2. Add 'published_at' if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='categories' AND column_name='published_at'
    ) THEN
        ALTER TABLE public.categories ADD COLUMN published_at TIMESTAMP WITH TIME ZONE NULL;
    END IF;
END $$;

-- 3. Update existing published categories to have a timestamp if missing
UPDATE public.categories 
SET published_at = now() 
WHERE is_published = true AND published_at IS NULL;
