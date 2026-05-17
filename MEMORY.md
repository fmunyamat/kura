# Kura — Session Memory

## Current task: Supabase auth setup (magic link OTP)

Branch: `feat/supabase-auth-otp`

---

## Phases complete

| Phase | What was done |
|---|---|
| 1 | Installed `@supabase/supabase-js`, `expo-secure-store`, `zustand`, `expo-auth-session` |
| 2 | Created `.env.example`; `.env.local` populated by user (git-ignored) |
| 3 | Created `src/shared/lib/supabase.ts` — Supabase client with SecureStore session adapter |
| 4 | Created `src/features/auth/stores/authStore.ts` — Zustand store (session, user, hasCompletedOnboarding, isLoading) |
| 5 | Created `src/features/auth/services/authService.ts` — signInWithMagicLink, createSessionFromUrl, checkUserProfile, signOut |
| 6 | Created `src/app/providers/AuthProvider.tsx` — restores session on launch, onAuthStateChange listener, AppState auto-refresh |
| 7 | Restructured routes into `(auth)/` and `(app)/` segment groups; created group layouts with routing guards; removed root `index.tsx` |
| 8 | Created `app/auth/callback.tsx` — deep link handler using `Linking.useLinkingURL()` + `createSessionFromUrl` |
| 9 | Wired sign-in screen: `signInWithMagicLink` called on submit, `isSubmitting` spinner, generic error message on failure, link-expired query param handling; 6 new tests added |
| 11 | Ran full DB schema migration on Supabase project "Kura Backend" (pdpqvojftsusqvgzccax): `user_profiles`, `tasks`, `task_completions`, `lawn_photos`, `recommendation_events`, `weather_cache`, `soil_temp_streaks` — all RLS enabled; private `lawn-photos` storage bucket |

All changes committed on `feat/supabase-auth-otp`.

---

## Phases remaining

### Phase 10 — Supabase dashboard config (manual — user must do this)
In Supabase dashboard → Authentication → URL Configuration:
- Add `kura://**` to Redirect URLs

Without this, the magic link email will not be allowed to redirect back to the app.

---

### Phase 12 — Confirm onboarding writes user_profiles
When the user completes onboarding (after photo-capture or skip), the app must INSERT a row into `user_profiles`. This is what flips `hasCompletedOnboarding` to `true` and lets the routing guard stop redirecting to onboarding.

This is a separate task — the auth setup assumes the row will be written during onboarding. The table exists and RLS is in place. Just need the INSERT wired up when onboarding completes.

---

## How auth routing works (for reference)

```
App launch
  └─ AuthProvider restores session from SecureStore
       ├─ No session  →  (auth)/_layout.tsx redirects to /sign-in
       └─ Session exists
             ├─ No user_profiles row  →  (app)/_layout.tsx redirects to /onboarding
             └─ user_profiles row exists  →  shows /(tabs) dashboard

Magic link flow
  1. User enters email on /sign-in
  2. signInWithMagicLink() → Supabase sends email
  3. User taps link → OS opens kura:// → Expo Router → app/auth/callback.tsx
  4. createSessionFromUrl() exchanges tokens → session established
  5. AuthProvider.onAuthStateChange fires → Zustand store updated
  6. (app)/_layout.tsx re-renders → routes to /onboarding or /(tabs)
```
