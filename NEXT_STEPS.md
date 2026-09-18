# Next Steps — Shared Component Refactor

Tracking doc for the codebase duplication audit (2026-06-10) and the 4-phase
extraction plan that came out of it. All work lives on the
`refactor/tablet-detection-device-info` branch.

---

## ✅ Done

### Phase 1 — Tablet detection via device type (commit `08ad78b`)

- Installed `react-native-device-info`; new shared hook
  `src/shared/hooks/use-is-tablet.ts` exposes `useIsTablet()` +
  the shared `TabletProps` interface.
- Replaced the `min(width, height) >= 600` window heuristic that was
  copy-pasted in 10 files (WelcomeStep1–4, Location, GrassType, EffortLevel,
  PhotoCapture, SignIn, OtpVerifyPanel).
- Jest maps `react-native-device-info` to its bundled mock, so tests render
  the phone layout.

### Phase 2 — Shared screen primitives (commit `b67b4e7`)

All 8 welcome + onboarding screens migrated; net −159 lines.

- `shared/components/ScreenTypography` — `ScreenHeadline`
  (`size: 'display' | 'title'`) + `ScreenSubtext` (`tone: 'faint' | 'muted'`).
- `shared/components/CtaButton` — one pill for every screen:
  `enabled` (0.4 dim), `isLoading` (0.6 dim + spinner + double-tap block),
  `color: 'primary' | 'primaryMid'`, `fullWidth`, `withBottomGap`.
- `shared/components/ScreenLayout` — `ContentArea` (`column` / `centered`),
  `CtaArea`, `TopSpacer`, `BottomSpacer`, `ContentGroup`, `GapSpacer`
  (`'card'` 60/100px, `'pills'` 24/48px).
- New theme tokens: `subtextOnPhoto`, `textOnPrimary`.

### Phase 3 — GlassCard frost adoption + OptionCard (commit `5968298`)

- New `glassFrostPanel` theme token; GlassCard's hardcoded
  `rgba(255,255,255,0.44)` removed.
- GlassCard gained `contentPadding: 'md' | 'none'` for edge-to-edge children.
- WelcomeStep1, WelcomeStep2, and PhotoCapture now use
  `<GlassCard contentPadding="none">` instead of hand-rolled frost panels.
  WelcomeStep3's `NavPill` stays local (deliberately tighter 14px radius)
  but uses the token.
- `GrassTypeCard` promoted to `shared/components/OptionCard` — removes the
  settings → onboarding cross-feature import. Importers updated:
  GrassType, EffortLevel, SettingsScreen.

---

## ⬜ Remaining

### Phase 4 — Small consolidations (not started)

- Shared `ErrorMessage` component — replaces the three near-identical local
  `ErrorText` copies in `SignIn.tsx`, `WelcomeStep4.tsx`, `PhotoCapture.tsx`
  (same `errorOnDark` centered text; size/margin become props).
- Shared `GlassDivider` component with an optional `flex` prop — replaces
  `DividerLine` (SignIn), `FieldDivider` (Location), and `OptionDivider`
  (GrassType, EffortLevel), all 1px `glassClearDivider` rules.

### Deliberately deferred (not part of Phase 4)

- `useSubmitWithErrorState` hook — the repeated
  `setError(null) → setIsSubmitting(true) → try/catch/finally` submit pattern.
  Folds better into the error-handling/Sentry phase plan in `MEMORY.md`
  (touching those handlers twice would be wasted work).
- `FormInput` (label + glass input + unit badge) — only two real instances
  exist (Location, auth forms). Wait for a third before abstracting.

---

## 👉 Immediate next steps

1. **Rebuild the dev client** (user decision, 2026-06-11). The app currently
   throws `Invariant Violation: native module doesn't exist` because
   `react-native-device-info` isn't in the installed binary. Run:
   - `npx expo run:ios` and/or `npx expo run:android`
   - Note: **Expo Go no longer works for this project** — the native module
     requires a development build from now on.
2. **Visually verify on device** after the rebuild — welcome steps 1–4 and
   all four onboarding screens (Phases 2–3 changed how every one of them
   renders; tsc/jest are clean but nobody has eyeballed pixels yet).
3. **Run Phase 4** (ErrorMessage + GlassDivider) once the device check passes.
4. **Merge** — open a PR for `refactor/tablet-detection-device-info` → `main`
   when all phases are verified.

---

## Verification bar (applies to every phase)

- `npx tsc --noEmit` clean.
- `npx jest` at the pre-existing baseline: **11 failures** (10 stale auth
  tests expecting old placeholder casing + 1 stale `(app)/_layout` welcome
  redirect test). Any 12th failure is a regression from this refactor.
- No new hardcoded colors — grep for raw `rgba(`/`#` values outside
  `theme.ts` in touched files.
