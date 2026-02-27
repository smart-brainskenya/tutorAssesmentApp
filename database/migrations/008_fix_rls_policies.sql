-- SBK Tutor Intelligence - V008 Fix RLS Policies for Admin Visibility & Secure Role Updates
-- Replaces metadata-based policies with SECURITY DEFINER function to ensure accurate role checks.

BEGIN;

-- 1. Create helper function to check admin role without recursion
-- defined as SECURITY DEFINER to bypass RLS on the query inside
-- SET search_path to prevent malicious overrides
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.users
    WHERE id = auth.uid()
    AND role = 'admin'
  );
END;
$$;

-- Grant execution privileges
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO service_role;

-- 2. Create Trigger Function to Prevent Role Updates by Non-Admins
CREATE OR REPLACE FUNCTION public.check_role_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if role is being changed
  IF NEW.role IS DISTINCT FROM OLD.role THEN
    -- Check if the current user is an admin
    IF NOT public.is_admin() THEN
      RAISE EXCEPTION 'Only administrators can change user roles.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- 3. Apply Trigger to Users Table
DROP TRIGGER IF EXISTS on_auth_user_role_update ON public.users;
CREATE TRIGGER on_auth_user_role_update
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.check_role_update();

-- 4. Update Users Table Policies
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
