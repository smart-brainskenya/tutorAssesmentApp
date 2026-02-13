# SBK Tutor Intelligence System - Deployment Guide

This document outlines the steps to deploy the SBK Tutor Intelligence System to production using Supabase and Vercel.

## 1. Supabase Production Setup

1.  **Create Project**: Log in to [Supabase](https://supabase.com) and create a new project.
2.  **Initialize Database**:
    -   Open the **SQL Editor**.
    -   Copy and run the contents of `final_seed_fix.sql`. This script:
        -   Sets up the `users`, `categories`, `questions`, `attempts`, and `answers` tables.
        -   Configures Row Level Security (RLS) policies.
        -   Creates the automatic profile trigger for new signups.
        -   Seeds initial assessment categories and questions.
3.  **URL Configuration**:
    -   Go to **Authentication > URL Configuration**.
    -   Set **Site URL** to your Vercel production domain (e.g., `https://sbk-intelligence.vercel.app`).
4.  **Auth Providers**:
    -   Ensure **Email** provider is enabled.
    -   (Optional) Disable "Confirm Email" if you want immediate access for tutors without email verification.

## 2. Environment Variables

Configure the following variables in your Vercel Project Settings and local `.env` file:

| Key | Description |
| :--- | :--- |
| `VITE_SUPABASE_URL` | Your Supabase Project URL (Settings > API) |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase Anon Key (Settings > API) |
| `VITE_SBK_ACCESS_CODE` | Secret passcode required for tutor registration |

## 3. Vercel Deployment

1.  **Import Project**: Connect your repository to Vercel.
2.  **Framework Preset**: Select **Vite**.
3.  **Build Settings**:
    -   Build Command: `npm run build`
    -   Output Directory: `dist`
4.  **Environment Variables**: Add the keys listed in Section 2.
5.  **Deploy**: Click "Deploy".

## 4. Production Build Command

To test the production build locally:
```bash
npm install
npm run build
```

## 5. Administrative Management

### Manually Creating the First Admin
1.  Register a new account on the live site using an `@smartbrainskenya.com` email.
2.  Open the **Supabase Dashboard**.
3.  Go to **Table Editor > users**.
4.  Locate your user record and change the `role` column from `tutor` to `admin`.
5.  Save changes. Log out and log back in to access the Admin Dashboard.

## 6. Post-Deployment Checklist

- [ ] **Auth**: Verify that registration only works with `@smartbrainskenya.com` emails and the correct `VITE_SBK_ACCESS_CODE`.
- [ ] **Security**: Ensure `/admin/dashboard` is inaccessible to users with the `tutor` role.
- [ ] **Database**: Verify that categories and questions appear correctly in the "Take Tests" section.
- [ ] **Functionality**: Complete a test and verify that results are correctly saved and rankings are generated.
- [ ] **Analytics**: Verify that the Admin Dashboard displays aggregated global metrics.
