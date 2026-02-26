-- SBK Tutor Intelligence - V008 Fix RLS Policies for Admin Visibility
-- Replaces metadata-based policies with SECURITY DEFINER function to ensure accurate role checks.

BEGIN;

-- 1. Create helper function to check admin role without recursion
-- defined as SECURITY DEFINER to bypass RLS on the query inside
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.users
    WHERE id = auth.uid()
    AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Update Users Table Policies
-- Drop the metadata-based policies from 004
DROP POLICY IF EXISTS "users_read_policy" ON public.users;
DROP POLICY IF EXISTS "users_update_policy" ON public.users;
DROP POLICY IF EXISTS "users_delete_policy" ON public.users;

-- Create new policies using is_admin()
CREATE POLICY "users_read_policy" ON public.users
FOR SELECT TO authenticated
USING (
    auth.uid() = id
    OR public.is_admin()
);

CREATE POLICY "users_update_policy" ON public.users
FOR UPDATE TO authenticated
USING (
    auth.uid() = id
    OR public.is_admin()
)
WITH CHECK (
    auth.uid() = id
    OR public.is_admin()
);

CREATE POLICY "users_delete_policy" ON public.users
FOR DELETE TO authenticated
USING (public.is_admin());

COMMIT;
