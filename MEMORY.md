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

## Already correct — do not change
- `SignIn.tsx handleSubmit` — try/catch, generic message, finally block ✅
- `PhotoCapture.tsx handleComplete` — try/catch, generic message, finally block ✅
- `onboardingService.ts geocodeZip` — validates API response with Zod ✅
- `supabase.ts` — validates env vars at startup with Zod, fails fast ✅
- Secure token storage via `expo-secure-store` ✅
