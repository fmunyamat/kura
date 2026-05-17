# Kura — Session Memory

## Current task: Supabase auth setup (magic link OTP) — COMPLETE

Branch: `feat/supabase-auth-otp` (auth phases), `feat/phase-12-security` (phase 12 + security fixes)

---

## Phases complete

| Phase | What was done |
|---|---|
| 1 | Installed `@supabase/supabase-js`, `expo-secure-store`, `zustand`, `expo-auth-session` |
| 2 | Created `.env.example`; `.env.local` populated by user (git-ignored) |
| 3 | Created `src/shared/lib/supabase.ts` — Supabase client with SecureStore session adapter; Zod env validation enforcing `https://` on URL |
| 4 | Created `src/features/auth/stores/authStore.ts` — Zustand store (session, user, hasCompletedOnboarding, isLoading) |
| 5 | Created `src/features/auth/services/authService.ts` — signInWithMagicLink, createSessionFromUrl, checkUserProfile, signOut |
| 6 | Created `src/app/providers/AuthProvider.tsx` — restores session on launch, onAuthStateChange listener, AppState auto-refresh |
| 7 | Restructured routes into `(auth)/` and `(app)/` segment groups; created group layouts with routing guards; removed root `index.tsx` |
| 8 | Created `app/auth/callback.tsx` — deep link handler using `Linking.useLinkingURL()` + `createSessionFromUrl` |
| 9 | Wired sign-in screen: `signInWithMagicLink` called on submit, `isSubmitting` spinner, generic error message on failure, link-expired query param handling; 6 new tests added |
| 10 | Supabase dashboard configured: `kura://**` added to Redirect URLs (done manually by user) |
| 11 | Ran full DB schema migration on Supabase project "Kura Backend" (pdpqvojftsusqvgzccax): `user_profiles`, `tasks`, `task_completions`, `lawn_photos`, `recommendation_events`, `weather_cache`, `soil_temp_streaks` — all RLS enabled; private `lawn-photos` storage bucket |
| 12 | Onboarding store + service: `onboardingStore.ts` accumulates zip/lawnSize/grassType/effortLevel across steps; `onboardingService.createUserProfile` geocodes ZIP via Zippopotam.us then INSERTs `user_profiles`; PhotoCapture calls it on Take Photo and Skip, sets `hasCompletedOnboarding: true` immediately |

### Security fixes (on `feat/phase-12-security`)
- `app.json`: `NSAllowsArbitraryLoads: false` (iOS ATS), `allowBackup: false`, `usesCleartextTraffic: false` via expo-build-properties
- `src/shared/lib/supabase.ts`: Zod schema validates env vars at startup, enforcing `https://` on URL

---

## Remaining security items (implement when feature is built)

| # | Item | When |
|---|---|---|
| 4 | Create `eas.json` with production profile (`debuggable: false`) | Before first EAS build |
| 5 | Apply `useScreenshotGuard` to authenticated screens | When building authenticated tab screens |
| 6 | Implement `useDeviceIntegrity` jailbreak detection hook | Pre-launch |
| 7 | `PhotoCapture.tsx` needs `exif: false` when camera is wired up | When camera integration is added |
| 8 | Sentry `beforeSend` PII stripping | When Sentry is integrated |
| 9 | Google/Apple OAuth must use `react-native-app-auth` with PKCE | When OAuth is implemented |

---

## How auth routing works (for reference)

```
App launch
  └─ AuthProvider restores session from SecureStore
       ├─ No session  →  (auth)/_layout.tsx redirects to /sign-in
       └─ Session exists
             ├─ No user_profiles row  →  (app)/_layout.tsx redirects to /onboarding
             └─ user_profiles row exists  →  shows /(tabs) dashboard

Onboarding flow
  1. Location screen: saves zipCode + lawnSize to onboardingStore
  2. GrassType screen: saves grassType to onboardingStore
  3. EffortLevel screen: saves effortLevel to onboardingStore
  4. PhotoCapture screen: calls createUserProfile → geocodes ZIP → INSERTs user_profiles
     → sets hasCompletedOnboarding: true in authStore
     → resets onboardingStore
     → router.replace('/') → home tabs

Magic link flow
  1. User enters email on /sign-in
  2. signInWithMagicLink() → Supabase sends email
  3. User taps link → OS opens kura:// → Expo Router → app/auth/callback.tsx
  4. createSessionFromUrl() exchanges tokens → session established
  5. AuthProvider.onAuthStateChange fires → Zustand store updated
  6. (app)/_layout.tsx re-renders → routes to /onboarding or /(tabs)
```
