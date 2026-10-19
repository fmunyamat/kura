# Weekly Dependency Audit — 2026-10-19

Automated audit completed. Report published at: https://claude.ai/artifact/J6rXA9TVEKKuDND1dSMd19

## Findings summary
- 2 CRITICAL CVEs: `tar` (6 advisories, file smuggling + DoS) and `shell-quote` (command injection + DoS). Both transitive build-tool deps. Fix: `npm audit fix`.
- 3 HIGH MASVS-relevant CVEs: `fast-uri` SSRF (MASVS-NETWORK-1), `xmldom` injection (MASVS-CODE-4), `form-data` CRLF injection (MASVS-CODE-4). Fix: `npm audit fix`.
- 3 Expo SDK 54 mismatches: `@sentry/react-native` (8.x vs expected ~7.2.0), `expo-linear-gradient` (55.x vs ~15.0.8), `jest-expo` (55 vs ~54). Fix: `npx expo install @sentry/react-native expo-linear-gradient jest-expo`.
- 3 copyleft license flags: `lightningcss` (MPL-2.0, build-tool only, likely OK), `node-forge` (BSD-3-Clause OR GPL-2.0, use BSD-3-Clause).
- expo SDK 54 is 4 versions behind current (58). All expo-* packages need coordinated upgrade.
- Security-relevant minor updates needed: supabase 2.105→2.118, sentry 8.11→8.31, zod 4.4→4.6.

## Action items created
Fix Now: npm audit fix, expo SDK mismatches
This Sprint: supabase, sentry, zod, patch updates
Backlog: SDK 54→58 upgrade, RN 0.81→0.88, jest 29→30, TS 5→7

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
