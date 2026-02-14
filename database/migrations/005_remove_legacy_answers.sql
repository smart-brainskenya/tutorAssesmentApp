-- SBK Tutor Intelligence - V005 Remove Legacy Answers System
-- Permanently removes the flat answers table and associated RLS policies.
-- This is a destructive cleanup following the migration to the Hybrid Assessment Model (v3/v4).

BEGIN;

-- 1. Drop RLS Policies
DROP POLICY IF EXISTS "Tutors view answers for their own attempts" ON public.answers;
DROP POLICY IF EXISTS "Admins can view all answers" ON public.answers;
DROP POLICY IF EXISTS "Tutors can insert answers for their own attempts" ON public.answers;
DROP POLICY IF EXISTS "Tutors manage own answers" ON public.answers;
DROP POLICY IF EXISTS "Admins view all answers" ON public.answers;

-- 2. Drop the Table
-- CASCADE ensures that any dependent views or foreign keys are also handled.
DROP TABLE IF EXISTS public.answers CASCADE;

COMMIT;
