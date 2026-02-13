# SBK Tutor Intelligence - Production Deployment Checklist

Follow these steps exactly to ensure a secure and optimized production release.

## 1. Database Migration (Supabase)

Run the following SQL scripts in the **Supabase SQL Editor** in this order:

1.  **Schema & Seed**:
    -   Run `final_seed_fix.sql` (Sets up tables, RLS, and initial content).
    -   *Note: This script cleans existing data. If updating an existing prod DB, use migration files instead.*

2.  **Account Management**:
    -   Run `supabase_account_mgmt.sql` (Adds `is_active`, `last_login`, etc.).

3.  **Performance Optimization**:
    -   Run `production_optimization.sql` (Creates indexes and aggregated views).

## 2. RLS Policy Verification

Go to **Authentication > Policies** in Supabase and verify:

-   [ ] **public.users**:
    -   Enable Read for All Authenticated Users.
    -   Enable Update ONLY for Admins.
-   [ ] **public.attempts**:
    -   Tutors can view OWN rows.
    -   Admins can view ALL rows.
-   [ ] **public.questions**:
    -   Read-only for Tutors.
    -   Write access for Admins.

## 3. Environment Variables (Vercel)

Ensure these variables are set in the Vercel Project Settings:

| Key | Value Description |
| :--- | :--- |
| `VITE_SUPABASE_URL` | Your production Supabase URL (`https://xyz.supabase.co`) |
| `VITE_SUPABASE_ANON_KEY` | Your production `anon` / `public` key |
| `VITE_SBK_ACCESS_CODE` | A strong, secret passcode for tutor registration |

**SECURITY CRITICAL:** Never use the `service_role` key in Vercel environment variables exposed to the client.

## 4. Admin User Creation

Since registration is open to anyone with the code, the first admin must be promoted manually:

1.  Go to your production URL (`https://your-app.vercel.app/register`).
2.  Register a new account.
3.  Go to Supabase Dashboard > **Table Editor** > **users**.
4.  Find your user row.
5.  Change the `role` column from `tutor` to `admin`.
6.  Log out and log back in.

## 5. Post-Deployment Verification

-   [ ] **Login Flow**: Verify `/login` redirects to the correct dashboard.
-   [ ] **Performance**: Check that the Dashboard loads without a long spinner.
-   [ ] **Security**: Try accessing `/admin/dashboard` as a Tutor (should auto-redirect).
-   [ ] **Analytics**: Verify the "Admin Intelligence" page loads stats.
