-- SBK Tutor Intelligence - V004 Fix Users RLS Recursion
-- Removes recursive table lookups and uses JWT metadata for role verification.

BEGIN;

-- 1. Cleanup existing policies
DROP POLICY IF EXISTS "Users viewable by authenticated" ON public.users;
DROP POLICY IF EXISTS "Users update own profile" ON public.users;
DROP POLICY IF EXISTS "Admins manage users" ON public.users;
DROP POLICY IF EXISTS "Users can view all user profiles" ON public.users;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
DROP POLICY IF EXISTS "Admins can update all user profiles" ON public.users;
DROP POLICY IF EXISTS "users_read_policy" ON public.users;
DROP POLICY IF EXISTS "users_update_policy" ON public.users;
DROP POLICY IF EXISTS "users_delete_policy" ON public.users;

-- 2. Create non-recursive policies using auth.jwt()
-- We use user_metadata which is populated by Supabase during registration

CREATE POLICY "users_read_policy" ON public.users
FOR SELECT TO authenticated
USING (
    auth.uid() = id 
    OR (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
);

CREATE POLICY "users_update_policy" ON public.users
FOR UPDATE TO authenticated
USING (
    auth.uid() = id 
    OR (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
)
WITH CHECK (
    auth.uid() = id 
    OR (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
);

CREATE POLICY "users_delete_policy" ON public.users
FOR DELETE TO authenticated
USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

-- 3. Ensure RLS is active
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

COMMIT;
