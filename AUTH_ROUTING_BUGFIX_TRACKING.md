# Bug Fix Tracking: Auth Race Condition & Routing Resolution

This document tracks the analysis, implementation, and resolutions for authorization race conditions and broken navigation routes identified in the SBK Tutor Intelligence System.

## 1. Identified Issues

### A. Auth Initialization Lag (5s Delay)
- **Problem**: When a guest or unauthenticated user visited the app, the interface hung on the loading spinner for exactly 5 seconds before redirecting to `/login`.
- **Cause**: In `store/AuthContext.tsx`, `onAuthStateChange` handled successful sessions but failed to update status to `UNAUTHENTICATED` if the session was null on load. This forced the app to rely on the 5-second safety fallback timeout.

### B. Profile Fetch RLS Race Condition
- **Problem**: Users would occasionally be logged in, but refreshing the page or visiting a protected route directly would throw an error or redirect them back to the login screen.
- **Cause**: On initial page load, `onAuthStateChange` fires immediately. If a session exists, it triggers `fetchProfile` to query the `users` table. However, because the Supabase client headers are updated asynchronously, the query occasionally executes before the JWT is fully set. The Row Level Security (RLS) policy on the database blocks the request, resulting in an auth failure.

### C. State Closure Capturing Bug
- **Problem**: The auth listener closure captured the initial state (where `profile` was `null`), causing it to constantly fetch the profile on token updates even if the profile was already loaded.

### D. Broken "Assessments" Route
- **Problem**: Clicking the "Assessments" link in the header loaded `/assessments`, which returned a silent redirect/not found because no such path existed in `App.tsx`. Tutors had no way to direct-link or refresh on the assessments page.

---

## 2. Implemented Solutions

### A. Instant Guest Transition
- **What was done**: Updated `onAuthStateChange` to immediately set state to `UNAUTHENTICATED` if `session` or `session.user` is null. This bypasses the safety timeout entirely and loads the login page instantly.

### B. Robust Retry & Refactoring
- **What was done**:
  - Implemented an automated single-retry policy in `fetchProfile`. If a profile fetch fails (common when client RLS headers are propagating), it waits 400ms and tries one more time before failing.
  - Added state reference trackers (`userRef`, `profileRef`, `statusRef`) to the auth context. The listener now references these refs to inspect the current state correctly without resubscribing.
  - Deduplicated profile requests in the auth listener, skipping the fetch if the profile for the user is already present.

### C. Dynamic Route & State Syncing
- **What was done**:
  - Added a redirect route for `/assessments` in `App.tsx` that routes to `/dashboard` with `{ initialView: 'tests' }` state.
  - Updated the navigation link in `Layout.tsx` to go directly to `/dashboard` with the corresponding state.
  - Added a `useEffect` inside `Dashboard.tsx` to watch for `location.state` changes. This ensures that clicking "Assessments" while already on the dashboard correctly toggles the active view tab.
