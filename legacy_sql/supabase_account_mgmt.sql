-- SBK Tutor Intelligence - Account Management Extensions
-- 1. Update public.users table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS last_login TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS retake_allowed_at TIMESTAMP WITH TIME ZONE;

-- 2. Update RLS for Admin Management
-- Allow admins to update any user record (role, is_active, retake_allowed_at)
DROP POLICY IF EXISTS "Admins can update all user profiles" ON public.users;
CREATE POLICY "Admins can update all user profiles" ON public.users
    FOR UPDATE USING (
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
    );

-- 3. Inactive Check (Logic for AuthContext)
-- We'll handle the "Prevent Login" by checking is_active in the AuthProvider
-- and signing the user out if they are deactivated.
