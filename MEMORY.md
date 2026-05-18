# Session Log — 2026-05-17

## Task: Convert TouchableOpacity → Pressable

**Status:** Complete

**What was done:**
- Converted all `styled.TouchableOpacity` definitions to `styled(Pressable)` across 11 files
- Added `Pressable` import from `react-native` to each affected file
- Removed `activeOpacity` prop from JSX usage sites (not a valid Pressable prop) in:
  - `MagicLinkForm.tsx` (was 0.85)
  - `SocialAuthButtons.tsx` (was 0.75)
  - `SocialAuthButtons.ios.tsx` (was 0.75)
  - `collapsible.tsx` (was 0.8)
- Updated `DESIGN.md` Component usage example to show `styled(Pressable)` pattern
- Verified zero remaining `TouchableOpacity` references in main source

**Files changed:**
- `app/(app)/onboarding/_layout.tsx` — BackButton
- `components/ui/collapsible.tsx` — direct JSX + import
- `src/features/settings/screens/SettingsScreen.tsx` — SettingsRow, SaveButton, DangerCard
- `src/features/onboarding/screens/GrassType.tsx` — PrimaryButton
- `src/features/onboarding/screens/Location.tsx` — HintCard, PrimaryButton
- `src/features/onboarding/screens/EffortLevel.tsx` — PrimaryButton
- `src/features/onboarding/screens/PhotoCapture.tsx` — CameraWell, PrimaryButton, SkipLink
- `src/features/onboarding/components/MagicLinkForm/MagicLinkForm.tsx` — SubmitButton
- `src/features/onboarding/components/GrassTypeCard/GrassTypeCard.tsx` — CardTouchable
- `src/features/onboarding/components/SocialAuthButtons/SocialAuthButtons.tsx` — SocialButton
- `src/features/onboarding/components/SocialAuthButtons/SocialAuthButtons.ios.tsx` — SocialButton
- `DESIGN.md` — updated example

**Note for next session:** Pressable has no built-in press opacity (unlike TouchableOpacity's default 0.2 dimming). To add press feedback, use `style={({ pressed }) => pressed && { opacity: 0.8 }}` on individual Pressables if needed.
