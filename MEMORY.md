# Dependency Audit — 2026-11-05

Weekly automated audit completed. Full report at scratchpad/dependency-audit-2026-11-05.md.
Key findings (same critical issues remain unresolved from 2026-11-02):
- 2 CRITICAL CVEs: shell-quote (GHSA-w7jw-789q-3m8p) + tar (GHSA-23hp-3jrh-7fpw) — both transitive, fix with `npm audit fix`
- 19 HIGH CVEs: zod (DIRECT, MASVS-CODE-4, GHSA-mrhx-c7xc-m3w5), undici (MASVS-NETWORK-1), expo-router (fix requires SDK 58 upgrade), + 16 transitive
- NEW: expo-linear-gradient ^55.0.13 is wrong major for SDK 54 — peer mismatch, run `npx expo install expo-linear-gradient` to fix
- Expo SDK 54 vs latest SDK 58 — 4 major versions behind (unchanged)
- node_modules not installed — license check incomplete, expo-doctor could not run
Next: `npm install && npm install zod@^4.6.7 && npm audit fix`, then fix expo-linear-gradient mismatch, then plan SDK 58 upgrade sprint.

---

# Error Handling Implementation — Phase Plan

Audit completed 2026-05-17. Full findings in session history.
Build these phases in order — each one unblocks the next.

---

## Phase 1 — Logger + Sentry foundation (CRITICAL)
**Everything else depends on this existing first.**

- [ ] Install `@sentry/react-native` and run `expo install`
- [ ] Create `src/shared/utils/logger.ts` — `log(msg, data?)` and `error(msg, context)` methods; routes to `Sentry.captureException` in prod, `console.error` in dev
- [ ] Create `src/app/providers/SentryProvider.tsx` — initialise Sentry, configure `beforeSend` to strip email and IP (see SECURITY.md)
- [ ] Add `SentryProvider` to the provider tree in `app/_layout.tsx`
- [ ] Add `SENTRY_DSN` to `.env` and `.env.example`

---

## Phase 2 — Fix `checkUserProfile` silent swallow (CRITICAL)
**Currently routes users back through onboarding if the DB call errors.**

- [ ] `src/features/auth/services/authService.ts` — destructure `{ data, error }` in `checkUserProfile`; throw (with `logger.error`) if error is set
- [ ] `src/app/providers/AuthProvider.tsx` lines 36 and 56 — wrap both `checkUserProfile` calls in try/catch; log and set `isLoading(false)` in the catch so the app doesn't hang

---

## Phase 3 — Add logging context to all service functions (HIGH)
**Services throw but don't log. Production failures are invisible.**

For every service function that touches Supabase or an external API, add before the throw:
```ts
logger.error('serviceName.functionName failed', {
  operation: 'functionName',
  userId,            // where available
  supabaseCode: error.code,  // never error.message
});
```

Files:
- [ ] `src/features/auth/services/authService.ts` — all four functions
- [ ] `src/features/onboarding/services/onboardingService.ts` — both functions

---

## Phase 4 — React Error Boundary (HIGH)
**A rendering crash in any feature currently crashes the whole app.**

- [ ] Create `src/shared/components/ErrorBoundary/ErrorBoundary.tsx` — class component, `componentDidCatch` calls `Sentry.captureException` with `context` + `componentStack`; renders fallback UI
- [ ] Create `src/shared/components/ErrorBoundary/index.tsx` — barrel export
- [ ] Wrap each major route group in `app/_layout.tsx` with `<ErrorBoundary context="...">` 

---

## Phase 5 — Global unhandled error handler (HIGH)
**Background async errors (push token, deep links, etc.) are silently dropped.**

- [ ] `app/_layout.tsx` — add `global.ErrorUtils.setGlobalHandler` at startup, chain to previous handler, log fatal errors to Sentry via `logger.error`

---

## Phase 6 — try/catch on remaining screen handlers (MEDIUM)
**`Location`, `GrassType`, and `EffortLevel` handlers have no error protection.**

- [ ] `src/features/onboarding/screens/Location.tsx` — wrap `handleContinue` in try/catch; add `isSubmitting` + `errorMessage` state; add `finally` reset
- [ ] `src/features/onboarding/screens/GrassType.tsx` — same pattern
- [ ] `src/features/onboarding/screens/EffortLevel.tsx` — same pattern

Pattern to match (already correct in `SignIn.tsx` and `PhotoCapture.tsx`):
```ts
const handleContinue = async () => {
  if (!isValid) return;
  setErrorMessage(null);
  setIsSubmitting(true);
  try {
    // async work
    router.push('/next');
  } catch {
    setErrorMessage('Something went wrong. Please try again.');
  } finally {
    setIsSubmitting(false);
  }
};
```

---

## Phase 7 — Zod input validation on service parameters (MEDIUM)
**Service functions accept raw strings with no schema check before hitting Supabase.**

- [ ] Add `emailSchema` — validate before `signInWithMagicLink(email)`
- [ ] Add `userIdSchema` — validate before `checkUserProfile(userId)`
- [ ] Add `zipCodeSchema` (5-digit US ZIP) — validate before `geocodeZip(zipCode)`
- [ ] Add `urlSchema` — validate before `createSessionFromUrl(url)`
- [ ] Place schemas in `src/shared/utils/validation.ts` (already referenced in ARCHITECTURE.md)

---

## Phase 8 — TanStack Query + QueryProvider (MEDIUM)
**Not installed yet. ARCHITECTURE.md and SettingsScreen both assume it exists.**

- [ ] Install `@tanstack/react-query` and `@tanstack/react-query-devtools`
- [ ] Create `src/app/providers/QueryProvider.tsx` — configure `QueryClient` with global `defaultOptions.mutations.onError` and `defaultOptions.queries.onError` safety nets that call `logger.error`
- [ ] Add `QueryProvider` to provider tree in `app/_layout.tsx`
- [ ] Wire `SettingsScreen` effort level mutation to a real `useUpdateEffortLevel` hook once service layer exists

---

## TODO — Settings screen

- [ ] Make the **"I've moved"** button functional: delete the `user_profiles` row for the current user, set `hasCompletedOnboarding(false)` in the auth store, and show a confirmation alert before doing anything destructive. The `(app)/_layout.tsx` guard will redirect to `/onboarding` automatically once the flag is cleared.

---

## Already correct — do not change
- `SignIn.tsx handleSubmit` — try/catch, generic message, finally block ✅
- `PhotoCapture.tsx handleComplete` — try/catch, generic message, finally block ✅
- `onboardingService.ts geocodeZip` — validates API response with Zod ✅
- `supabase.ts` — validates env vars at startup with Zod, fails fast ✅
- Secure token storage via `expo-secure-store` ✅
