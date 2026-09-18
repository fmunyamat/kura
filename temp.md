## "(tabs) not handled by any navigator" error

After moving files, the app threw: `the action 'REPLACE' with payload {"name":"(tabs)"...} was not handled by any navigator`. Initially misdiagnosed as a stale Metro cache — the error returned after `npx expo start --clear`.

**Actual root cause:** a race in PhotoCapture's `handleComplete`. `setHasCompletedOnboarding(true)` updates Zustand synchronously, which re-renders `app/(app)/_layout.tsx`. The guard sees `hasCompletedOnboarding=true, hasSeenWelcome=false` and returns `<Redirect href="/welcome" />` instead of `<Stack>`, unmounting the (app) Stack navigator. The `router.replace('/')` on the next line then dispatches a REPLACE targeting `(tabs)` inside a navigator that no longer exists; the action bubbles to the root Stack (which only has `(auth)`, `(app)`, `dev-launcher`) and fails.

**Fix:** removed the manual `router.replace('/')` (and the unused `router` import) from `handleComplete`. The routing guard owns navigation — it redirects to `/welcome` or tabs on its own, matching the pattern documented in SignIn's `handleVerify` ("Navigation is automatic — routing guard redirects").

## PhotoCapture — handleComplete error logging

Added `if (__DEV__) console.log('[PhotoCapture] handleComplete error:', err)` to the catch block so the raw error is visible in dev builds.

## PhotoCapture — profile upsert fix

**Problem:** After adding check-then-create/update logic, app threw `{"code": "23505" ... "duplicate key value violates unique constraint \"user_profiles_pkey\""}`. Root cause: `checkUserProfile` reads via RLS — if the read returns null (RLS gap, timing issue), `hasProfile` is `false` even when a row exists, so the code falls into the `create` branch and hits the constraint.

**Fix:** Removed the check entirely. Added `upsertUserProfile` to `onboardingService.ts` using Supabase's `upsert` with `onConflict: 'user_id'`. Postgres handles insert-or-update atomically — the 23505 error cannot occur. `handleComplete` now calls `upsertUserProfile` directly.
