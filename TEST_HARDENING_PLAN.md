# Kura — Test Hardening Plan

A step-by-step plan to get the test suite green, trustworthy, and complete. Derived from a full audit of the current suite (8 real suites, 61 tests, 11 failing) on branch `docs/photo-capture-plan`.

This document is the checklist. Work top to bottom — each phase leaves the suite in a better, still-passing state than the last. Read [TESTING.md](./TESTING.md) alongside this; that file defines *what* to test, this file defines *the order and the concrete fixes*.

**Current baseline:** 3 of 8 real suites failing, core Today screen untested, TESTING.md's own security checklist almost entirely unmet, Detox not installed.

---

## Phase 0 — Restore a green baseline (fix stale failures)

All 11 failures are stale tests, not product bugs. The code moved and the tests didn't. Fix these first so every later change runs against a clean signal.

- [ ] **Fix placeholder casing in SignIn suite (8 failing tests).**
  `src/features/auth/screens/SignIn.test.tsx` queries `getByPlaceholderText('Enter Email Address')`, but `src/features/auth/components/OtpRequestForm.tsx:89` now renders `'Enter email address'` (lowercase). Update every occurrence in the test file.
  *Better fix:* switch these queries to a stable `testID` (e.g. `getByTestId('email-input')`) so future copy changes don't break the suite. Add the `testID` to the `TextInput` in `OtpRequestForm.tsx`.

- [ ] **Update `checkUserProfile` expectations (2 failing tests).**
  `src/features/auth/services/__tests__/authService.test.ts` expects a boolean, but `authService.ts:55-57` now returns `{ hasProfile, hasSeenWelcome }`. Rewrite the two assertions:
  - "row exists" → `expect(await checkUserProfile('abc')).toEqual({ hasProfile: true, hasSeenWelcome: false })`
  - "no row" → `expect(await checkUserProfile('abc')).toEqual({ hasProfile: false, hasSeenWelcome: false })`
  Also add a case where the row has `has_seen_welcome: true` to lock down the second flag.

- [ ] **Fix the routing-guard happy path (1 failing test).**
  `app/(app)/__tests__/_layout.test.tsx` "lets the user through" now receives `redirect:/welcome` because the guard gained a welcome gate (`hasSeenWelcome`, see `app/(app)/_layout.tsx:23,51-53`). Update the mocked store state in that test to include `hasSeenWelcome: true`, and assert it reaches `stack`.

- [ ] **Re-run and confirm green:** `npx jest` → expect 0 failing tests across the real suites.

---

## Phase 1 — Stop testing stale worktree copies

Jest currently picks up 5 suites from `.claude/worktrees/docs+soil-temp-thresholds/` — old copies (`MagicLinkForm`, `ConfirmationPanel`, onboarding-era `SignIn`) for components that no longer exist in `src/`. They pass and inflate the count, hiding how unhealthy the real suite is.

- [ ] **Exclude `.claude/` from Jest.** Add to the `jest` block in `package.json`:
  ```json
  "testPathIgnorePatterns": ["/node_modules/", "/.claude/"]
  ```
- [ ] **Delete the stale worktree test copies** if the worktree itself is no longer needed (confirm with `git worktree list` first).
- [ ] **Re-run** and confirm the suite count drops to the 8 real suites only.

---

## Phase 2 — Harden the existing (good) tests

The auth tests already drive real user journeys. Two weaknesses to remove.

- [ ] **Remove the fragile microtask flush.** `SignIn.test.tsx:84-87` uses a double `await Promise.resolve()` to sequence state updates. Replace with a `waitFor` that asserts an observable condition (e.g. the OTP input is enabled/focused) instead of guessing at timing.
- [ ] **Delete or upgrade `GlassCard.test.tsx`.** It only asserts children render — TESTING.md explicitly says not to test simple display components. Either remove it or, if GlassCard has behaviour (blur intensity, press state), test that instead.
- [ ] **Prefer `testID` over copy-matching** across auth tests so future wording changes don't cascade into failures. This is the pilot for the full migration in **Phase 2.5** below.

---

## Phase 2.5 — Standardize on `testID` queries (do this before writing new screen tests)

**The rule going forward:** tests *find* elements by a stable `testID`, never by their user-facing attributes. Querying by placeholder text, visible copy, or accessibility label couples the test to wording that product/design changes freely — this is exactly what broke 8 SignIn tests when `'Enter Email Address'` became `'Enter email address'`. A `testID` is an explicit, private contract between the component and its test; copy is not.

Do this migration *before* the big test-writing phases (3–5) so those new tests are written the right way from the start, not retrofitted.

### The one distinction that matters — query vs. assert

Switching to `testID` changes how we **locate** an element. It does **not** mean deleting accessibility assertions:

- **Locating** an element → always `getByTestId(...)`. Never `getByPlaceholderText`, `getByText`, or `getByLabelText` for the purpose of grabbing a node to act on.
- **Asserting** on accessibility → still valid and encouraged. Tests that check `accessibilityLabel`, `accessibilityState.disabled/busy`, or `accessibilityRole` are testing real behaviour (screen-reader correctness, disabled/loading state) and must stay. Grab the node by `testID`, then assert its a11y props.

Example of the target pattern:
```tsx
// BEFORE — coupled to copy and to a11y wording
fireEvent.changeText(getByPlaceholderText('Enter email address'), 'a@b.com');
expect(getByLabelText('Sending code')).toBeTruthy();

// AFTER — located by testID, still asserting the a11y contract
fireEvent.changeText(getByTestId('email-input'), 'a@b.com');
expect(getByTestId('send-code-button').props.accessibilityLabel).toBe('Sending code');
```

### Naming convention

- kebab-case, describing the element's role: `email-input`, `send-code-button`, `otp-code-input`, `otp-verify-button`, `resend-code-button`, `use-different-email-button`.
- For list/repeated elements, suffix the item id: `task-row-soak`, `task-complete-cta-edges`, `task-details-button-feed`.
- Screen-level containers get one too for smoke tests: `sign-in-screen`, `home-screen`, `settings-screen`.

### Steps

- [ ] **Add `testID` to every interactive element in source.** Currently only `OtpVerifyPanel` has them (`otp-code-input`, `otp-verify-button`). Add to at least:
  - `OtpRequestForm.tsx` — the email `TextInput` (`email-input`) and the send button (`send-code-button`).
  - `OtpVerifyPanel.tsx` — the resend and "use a different email" buttons.
  - `TaskRow.tsx` / `TaskRowCta.tsx` / `TaskRowDetail.tsx` — the row pressable (`task-row-<id>`), the hold-to-complete CTA (`task-complete-cta-<id>`), the details button.
  - `ResetLawnDataCard.tsx` — the reveal row and the hold-to-reset button (`reset-lawn-button`).
  - `SettingsScreen.tsx` — the grass-type picker rows and account/data rows.
  - Onboarding option cards (`OptionCard.tsx`) — each selectable option (`option-<value>`).
  - `CtaButton.tsx` — accept and forward an optional `testID` prop so every screen using it can label its primary button.
- [ ] **Thread `testID` through shared components.** `CtaButton`, `OptionCard`, `GlassCard`, etc. must accept a `testID?: string` prop and pass it to their root `Pressable`/`View` so callers can label instances. Add the prop to the component's props type.
- [ ] **Migrate existing test queries.** Replace `getByPlaceholderText` / `getByText` / `getByLabelText` *when used to locate-and-act* with `getByTestId` in:
  - `SignIn.test.tsx` (email input, send button — the 8 failing tests) — this also resolves Phase 0's casing failure permanently.
  - `SocialAuthButtons.test.tsx` (`getByText('Google')` / `getByText('Apple')` → `getByTestId('google-signin-button')` / `apple-signin-button`; add those testIDs in `SocialAuthButtons.tsx`).
  - The `_layout` guard tests already assert on redirect *destination* text rendered by the mock, not on real UI — leave those as-is (the `redirect:/...` string is the assertion target, not a located element).
- [ ] **Keep a11y assertions.** Do not delete the "shows Sending code / Verifying code" or `accessibilityState.disabled` checks — rewrite them to locate by `testID` first, then assert the a11y prop (see example above).
- [ ] **Add a lint guard (optional but recommended).** An ESLint rule or a simple grep check in CI that flags `getByPlaceholderText`/`getByText`/`getByLabelText` in `*.test.tsx` (allowing an inline `// eslint-disable` for the rare deliberate copy assertion) stops the pattern from creeping back.

**Done when:** no test locates an element by placeholder, visible text, or a11y label; every interactive element has a `testID`; all remaining `getByText`/`getByLabelText` calls are pure content/a11y *assertions*, not element lookups.

---

## Phase 3 — Cover the core loop: the Today / Home screen

Highest-value gap. Only the `useFocusDeck` hook is tested; every on-screen element is untested, so the wiring could be broken while the hook passes. Add render + interaction tests (RNTL `render` + `fireEvent`), wrapped in the `ThemeProvider` with `lightTheme`.

- [ ] **`TaskAccordion`** — tapping a collapsed row expands it and collapses the previously open one; the "Task 1 of 3" label renders and updates on completion.
- [ ] **`TaskRow` + `TaskRowCta` + `TaskRowDetail`** — the CTA fires completion; a completed row shows its done state; the locked/preview row refuses completion when tapped.
- [ ] **`CompletionTrack`** — renders the correct progress for 0/3, 1/3, 3/3.
- [ ] **`ClearedCard`** — appears only once all tasks are done (`isCleared`), and shows the ticked streak.
- [ ] **`HomeHeader` / `SplitContextCard`** — render the expected labels for a given lawn state.
- [ ] **`ConfettiBurst`** — renders without crashing when triggered (visual only — keep it light).
- [ ] **`HomeScreen`** — smoke test: renders the deck, completing all rows swaps in the cleared state end-to-end (integration over the real hook, not a mock).

---

## Phase 4 — Cover routing, auth bootstrap, and the welcome gate

- [ ] **Welcome-gate branch in `app/(app)/_layout.tsx`** — the newest routing decision (steps 4–5 in its own comment) is untested. Add cases:
  - session + profile + `!hasSeenWelcome` + not on `/welcome` → `redirect:/welcome`
  - session + profile + `!hasSeenWelcome` + already on `/welcome` → `stack` (anti-loop)
  - session + profile + `hasSeenWelcome` → `stack` (tabs)
- [ ] **`AuthProvider`** (`src/app/providers/AuthProvider.tsx`) — CLAUDE.md's "always test" list. Cover: reads stored session on mount → sets store; `onAuthStateChange` sign-in → `setSession` + `checkUserProfile` flags applied; sign-out → store cleared; `isLoading` flips to false after the initial check.
- [ ] **Onboarding `_layout` guard** if it has its own routing decisions.

---

## Phase 5 — Cover onboarding, welcome, and settings screens

- [ ] **Onboarding screens** (grass type, effort level, sprinkler, photo capture, location) — each: renders its options, selecting one advances / stores the choice.
- [ ] **`onboardingService`** — CLAUDE.md requires all Supabase writes to be tested. Verify the right insert/upsert runs and errors are handled (mock Supabase at the boundary).
- [ ] **`onboardingStore` / `lawnStore` / `devStore`** — state transitions for each action.
- [ ] **Welcome flow** (`WelcomeFlow` + 4 steps + `welcome.service`) — stepping through advances; finishing sets `has_seen_welcome`. This flow shipped test-free and broke the layout test.
- [ ] **`SettingsScreen`** — renders account/data rows and the grass-type picker.
- [ ] **`ResetLawnDataCard`** — destructive action. Assert the **hold-to-confirm gesture is actually required** (a plain tap must NOT trigger the reset) and that confirming calls the delete + redirect path. See `project_settings_todos` in memory: it must delete the `user_profiles` row and redirect to onboarding with a confirmation.

---

## Phase 6 — Meet TESTING.md's security checklist

TESTING.md mandates these; almost none exist today. Add them.

- [ ] **Zod validation** — pass malformed input to the onboarding schemas (`onboardingService.ts`) and expect `ZodError`; e.g. bad ZIP to `zipCodeSchema.parse()`, non-UUID to `taskIdSchema.parse()`.
- [ ] **Logger** (`src/shared/utils/logger.ts`) — in production mode (`__DEV__ = false`), assert `console.log` is never called (MASVS-STORAGE-2).
- [ ] **Photos** — assert `expo-image-picker` is always called with `exif: false`; assert uploaded bytes go to Supabase Storage, not AsyncStorage.
- [ ] **Deep links** — unrecognized scheme → no navigation; `kura://progress/capture` → navigates to PhotoCapture.
- [ ] **RLS (local `supabase start`)** — cross-user isolation for `task_completions` and `lawn_photos`; spoofed `user_id` INSERT rejected; signed-URL for another user's path → 403.
- [ ] **`npm audit` in CI** — blocks merge on high-severity CVEs.

---

## Phase 7 — E2E with Detox (currently not installed)

TESTING.md lists Detox as a required layer, but there is no `.detoxrc`, no `e2e/` folder, and the package isn't installed. Decide and act:

- [ ] **Decision:** commit to Detox or remove it from TESTING.md. Don't leave a required layer that doesn't exist.
- [ ] If keeping: install and configure Detox (`.detoxrc.js`, `e2e/` folder, EAS/simulator build).
- [ ] **E2E flows to cover:** sign-in (email → code → tabs), full onboarding, task completion on the Today screen, notification toggle, "Take a photo" → grant permission → capture → thumbnail appears.

---

## Phase 8 — Guardrails so this doesn't rot again

- [ ] **CI gate:** run `npx jest --ci` on every PR; block merge on failure.
- [ ] **Coverage floor:** enable Jest `coverageThreshold` for services, hooks, and stores (the logic-bearing layers) so new untested logic fails CI.
- [ ] **Pre-push hook** (optional) running the fast unit suite.
- [ ] **Convention check:** tests co-located with source (TESTING.md rule) — no top-level `__tests__` for new tests; keep them beside the file under test.

---

## Quick reference — commands

```bash
# Run everything
npx jest

# Run one suite
npx jest src/features/auth/screens/SignIn.test.tsx

# Watch mode while fixing
npx jest --watch

# With coverage
npx jest --coverage
```

## Definition of done

- `npx jest` is green with the `.claude/` worktree copies excluded.
- The Today screen, welcome gate, AuthProvider, onboarding service, and reset-confirmation all have tests.
- Every item on TESTING.md's security checklist has a corresponding passing test (or a documented, deliberate exception).
- Detox is either wired up with the listed E2E flows, or removed from TESTING.md.
- CI runs the suite and blocks merges on failure.
