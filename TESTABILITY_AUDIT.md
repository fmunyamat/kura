# Kura — Testability Audit

An audit of how easily the *code itself* can be tested — dependency injection, module-level side effects, hardcoded data, timer/animation coupling, and query-ability of UI elements. This is distinct from [TEST_HARDENING_PLAN.md](./TEST_HARDENING_PLAN.md), which tracks test *coverage*; this file tracks how much friction stands between "I want to test X" and actually doing it.

**Bottom line:** services, stores, and hooks are cleanly testable. Screens concentrate logic, timers, and animation state in ways that make UI testing harder than it needs to be. The two most critical interactions in the app — completing a task, resetting lawn data — are currently the hardest things in the codebase to test.

---

## What's already testable

- **Services are thin and boundary-mockable.** `authService`, `welcomeService`, and the stores all talk to a single imported `supabase` object, so `jest.mock('~/shared/lib/supabase')` cleanly isolates them.
- **Zustand stores are ideal test subjects.** Plain `getState()`/`setState()` access, no persistence, `onboardingStore` even ships a `reset()` action.
- **Accessibility labels are broadly present**, doubling as a query API. `TaskRow`, `TaskRowCta`, `ResetLawnDataCard`, `CtaButton`, `TaskDetailsModal`, and the OTP forms all carry `accessibilityLabel`/`accessibilityRole`/`accessibilityState` — `getByLabelText`/`getByRole` work almost everywhere.
- **Routing guards are pure functions of store state** — render, assert redirect destination, done.

---

## Finding 1 — Supabase module throws at import time

`src/shared/lib/supabase.ts:43-47` validates env vars at module load and **throws if they're missing**. Any test that transitively imports this file without mocking it crashes the whole suite. Nothing in the Jest config (`package.json`) provides those env vars via a setup file. Today every suite survives only because each one remembers to mock the right upstream module — one forgotten mock in a new test produces a confusing env-var crash instead of a test failure.

**Fix:** a `jest.setup.js` that sets dummy `EXPO_PUBLIC_SUPABASE_*` vars, plus a shared manual mock at `src/shared/lib/__mocks__/supabase.ts` so suites can write `jest.mock('~/shared/lib/supabase')` with no factory.

## Finding 2 — No shared test infrastructure; every suite hand-rolls boilerplate

`SignIn.test.tsx` opens with **nine** `jest.mock` calls — expo-blur, expo-image, expo-linear-gradient, expo-router, plus four `virtual: true` mocks for SVG/JPG assets. There's no `moduleNameMapper` for image/SVG assets and no central setup file mocking common Expo modules, so every future screen test must copy this block. Every component test also hand-writes the same `ThemeProvider` wrapper.

**Fix:** asset mappings in the Jest config, common Expo mocks in a setup file, `react-native-reanimated`'s official jest setup, an `expo-haptics` mock, and a shared `renderWithTheme()` helper in a `test-utils` file.

## Finding 3 — The hold-to-confirm pattern is nearly untestable as written

The most serious finding. `TaskRowCta.tsx` (task completion) and `ResetLawnDataCard.tsx` (destructive data reset) share the same structure, with three compounding problems:

1. **A layout gate blocks the interaction entirely in tests.** `handlePressIn` starts with `if (fullWidth.value === 0) return` (`TaskRowCta.tsx:162`, similarly in `ResetLawnDataCard.tsx`). In RNTL, `onLayout` never fires with real dimensions, so pressing the button in a test is silently a no-op unless the test manually fires the `onLayout` event with fake dimensions first. This isn't documented anywhere.
2. **Magic timing constants are private.** `HOLD_MS = 2000` is a local `const` in both files; completion involves a hidden chain (2000ms hold → 220ms retreat → 400ms pause → callback). Tests need fake timers and all three numbers, none of which are exported.
3. **Side effects are baked in.** `Haptics.notificationAsync` fires mid-chain; reanimated `withTiming`/`useSharedValue` drive the visuals — both need mocking before the component even renders.

**Fix:** extract the hold state machine into a `useHoldToConfirm({ holdMs, onConfirm })` hook (testable with `renderHook` + fake timers, no layout needed), export the timing constants, keep the layout gate only for the visual layer. The two components duplicate ~100 lines of identical logic — one shared hook fixes testability and duplication together.

## Finding 4 — Timers and clock reads are embedded in components

`OtpVerifyPanel.tsx` runs a 500ms cursor-blink `setInterval`, a 350ms focus `setTimeout`, and a resend-cooldown `setInterval`; `SignIn.tsx` stamps `Date.now()` into `codeSentAt`. None of this is injectable. The existing SignIn test's double-`await Promise.resolve()` hack (lines 84–87) is a direct symptom — the test is guessing at internal effect timing because it can't control it.

**Fix:** extract a `useResendCooldown(codeSentAt)` hook; standardize on `jest.useFakeTimers()` for these suites.

## Finding 5 — Screens are monoliths that can only be tested through full render

CLAUDE.md's own guideline is ~120 lines per component. Current sizes: `SettingsScreen.tsx` **494**, `SignIn.tsx` **443**, `OtpVerifyPanel.tsx` **433**, `ResetLawnDataCard.tsx` **335**. `SignIn.tsx` owns a nine-piece state machine (email, isConfirming, isSubmitting, sendError, isVerifying, verifyError, codeSentAt, keyboardVisible, plus two effects) inline in the component — the only way to test any of it is to render the whole screen with all nine mocks from Finding 2.

**Fix:** extract a `useOtpSignIn()` hook so the state machine can be tested with `renderHook`, leaving the screen as a thin, visually-testable shell.

## Finding 6 — `useFocusDeck` is welded to fixture data

The hook imports `DECK_CARDS` and `INITIAL_STREAK_DAYS` directly (`useFocusDeck.ts:11-16`) with no injection point. Consequences:
- Tests assert on content strings (`'soak'`, `'edges'`, streak 6→7) that break on any copy change.
- No way to test edge cases (zero tasks, all locked, one task).
- The streak "increment" is `setStreakDays(INITIAL_STREAK_DAYS + 1)` — a hardcoded write that only works because the initial value never changes, and will silently break once real data arrives from Supabase.

**Fix:** accept `cards` and `initialStreak` as optional parameters defaulting to the constants.

## Finding 7 — `geocodeZip` fuses an external API into the profile write

`onboardingService.ts:35-48` calls global `fetch` against Zippopotam.us inside a private function that `upsertUserProfile` calls unconditionally. Testing the Supabase upsert requires mocking `global.fetch` *and* Supabase at once; the geocoding logic (including its Zod validation of the response) can't be tested alone because it isn't exported. Also: the user's raw ZIP input has no Zod schema — TESTING.md's required `zipCodeSchema.parse()` test has nothing to test against.

**Fix:** export `geocodeZip`, or accept coordinates/geocoder as a parameter to `upsertUserProfile`; add the input schema.

## Smaller items

- **Only two `testID`s exist in the entire app** (both in `OtpVerifyPanel`). Good accessibility coverage compensates for interactive elements, but the email input is queried by placeholder text — exactly what broke 8 tests when the copy changed case. Stable `testID`s on form inputs and primary buttons would decouple tests from copy.
- **`ConfettiBurst` uses unseeded `Math.random()`** for color, position, duration, and delay — non-deterministic render output. Fine for a smoke test; an optional seed/piece-count prop would make it assertable. Low priority.
- **Onboarding screens call `useRouter()` directly** — normal for Expo Router, but adds one more per-suite mock; the shared setup file from Finding 2 should cover it once.
- **`AuthProvider` logs with a raw `__DEV__`-gated `console.log`** (`AuthProvider.tsx:44`) while `logger.ts` exists for exactly this — routing through `logger` would also make log behavior spy-able in tests.

---

## Priority order

1. **Test infrastructure** (Findings 1–2) — jest setup file with env vars, asset mappers, shared Expo/reanimated/haptics mocks, `renderWithTheme` helper. Cuts the cost of every future test.
2. **`useHoldToConfirm` extraction** (Finding 3) — unblocks testing the app's two most critical interactions and removes duplication.
3. **Hook extractions** (Findings 4–5) — `useOtpSignIn`, `useResendCooldown` — turns full-render tests into cheap `renderHook` tests.
4. **Data injection** (Findings 6–7) — parameterize `useFocusDeck`, export/split `geocodeZip`, add the ZIP schema.

Item 1 pairs naturally with Phase 1–2 of `TEST_HARDENING_PLAN.md`; items 2–4 should slot in before that plan's Phase 3 (Today-screen coverage), since they make those tests dramatically cheaper to write.
