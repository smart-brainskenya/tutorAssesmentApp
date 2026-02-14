# NEXT ACTION TRACKING

## Change Summary:
- Locked final scoring to the database by filtering `getTutorAttempts` and `getAdminStats` to only return `graded` attempts.
- Removed any potential for frontend-side percentage calculation for finalized results.
- Verified that `Results.tsx` and `Analytics.tsx` consume `percentage` directly from the `attempts` table.

## SQL Required?
No

## Environment Variable Update?
No

## Build Required?
No

## Manual Testing Required?
Yes (Verify that attempts with status 'submitted' do not appear in Tutor History or contribute to Admin Analytics until they are reviewed).

## Safe to Push?
Yes
