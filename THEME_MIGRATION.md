# Theme Migration — Light (Clear Sky) + Dark

Tracking doc for rolling the two-theme system across the whole app.

- **Dark** = the app's original look (white text + dark glass over a dark green
  photo wash). Unchanged.
- **Light** = the "Clear Sky" mockup (dark slate text + pale frosted glass over
  a bright blue-white photo wash). Chosen from
  `mockups/home-light-glass-concepts.html` (concept 3, Clear Sky).

The theme is chosen from the device colour scheme in `app/_layout.tsx`
(`useColorScheme()`), so once a screen is on the semantic tokens it flips
automatically. See `src/config/theme.ts` for the full token system.

---

## ✅ Done — theme system + Today/Home screen

- **`src/config/theme.ts` reorganised** into labelled groups: `brand`,
  `sharedChrome`, `darkPanelChrome`, `legacyOnPhoto` (always-dark, being
  retired), per-theme `*Chrome` / `*Onboarding`, and the new **`*Semantic`**
  theme-aware set. Added a `mode: 'light' | 'dark'` field to each theme (for
  non-colour branching like BlurView `tint`).
- **Today/Home screen migrated** to the semantic tokens — it renders Clear Sky
  in light mode and the original look in dark mode. Files:
  `HomeScreen` (overlay → `photoWash*` gradient), `HomeHeader`,
  `SplitContextCard`, `CompletionTrack`, `TaskRow`, `TaskRowDetail`,
  `TaskRowCta`, `ClearedCard`, `ConfettiBurst`, `FloatingTabBar`
  (blur `tint` follows `theme.mode`), plus `BottomScrim` (already token-driven).

---

## The migration recipe

For each not-yet-migrated screen, swap its **legacy** tokens for the matching
**semantic** ones. The legacy tokens still exist (defined once, always dark) so
nothing breaks until you touch a file.

| Legacy token (always dark)        | Semantic token (theme-aware)          | Used for |
|-----------------------------------|---------------------------------------|----------|
| `onboardingPhotoTint` / `photoTint` | `photoWashTop` + `photoWashBottom`  | full-screen photo overlay (run as a `LinearGradient`, see `HomeScreen`) |
| `white` (as on-photo heading)     | `textPhotoHeading`                    | headings over the photo |
| `textOnDark`                      | `textPhotoBody`                       | body copy over the photo |
| `textMutedOnDark`                 | `textPhotoMuted`                      | muted copy |
| `subtextOnPhoto`                  | `textPhotoSubtle`                     | faint labels/eyebrows |
| `textFaintOnDark`                 | `textPhotoFaint`                      | faintest labels |
| `glassClearPanel`                 | `glassFill`                           | glass surface fill |
| `glassClearEdge`                  | `glassEdge`                           | glass top highlight edge |
| `glassClearEdgeBottom`            | `glassEdgeSoft`                       | glass soft (bottom/side) edge |
| `glassClearInput`                 | `glassInput`                          | input / track wells |
| `glassClearDivider`               | `glassDivider`                        | hairline dividers |
| `lime`                            | `accentText`                          | accent text (labels, links, active tab) |
| `limeSolid`                       | `accentPrimary`                       | action fill (CTA, check) |
| `primaryDeep` (as ink on lime)    | `accentPrimaryInk`                    | text/icon on the action fill |
| `primaryMid` (as secondary fill)  | `accentPrimaryPressed`                | pressed/curtain states |

**Tokens to ADD when the form screens migrate** (not needed by Home, so not yet
created — add them to both `lightSemantic` and `darkSemantic`):

- `glassInputFocused` ← replaces `glassClearInputFocused`
  (dark: `rgba(255,255,255,0.22)`; light suggestion: `rgba(255,255,255,0.72)`)
- `glassInputBorder` ← replaces `glassClearInputBorder`
  (dark: `rgba(255,255,255,0.14)`; light suggestion: `rgba(22,48,58,0.14)`)
- `errorOnPhoto` — theme-aware error text
  (dark: `errorOnDark`; light: `errorOnLight`). Or branch on `theme.mode` at
  the call site using the existing `errorOnDark`/`errorOnLight` brand tokens.

**Also decide** whether `glassFrostPanel` (the `GlassCard` `frost` variant) and
the onboarding gradient/frost tokens should get light values, or whether those
cards move onto `glassFill`. The `glassOnboarding*` tokens appear **unused**
(no consumers found) — verify and delete if so.

---

## ⬜ Remaining screens

### 1. Shared components (do these first — they flip several screens at once)

- **`GlassCard`** (`shared/components/GlassCard`) — the `clear` variant uses
  `glassClearPanel` / `glassClearEdge` / `glassClearEdgeBottom`; the `frost`
  variant uses `glassFrostPanel`. Move `clear` → `glassFill`/`glassEdge`/
  `glassEdgeSoft`. Decide a light value for `frost`. The Android faux-backdrop
  takes a `clearBackdropTint` prop from callers (currently `photoTint`) — update
  callers to pass a light wash in light mode.
- **`ScreenTypography`** (`shared/components/ScreenTypography`) — `white` →
  `textPhotoHeading`; `subtextOnPhoto` → `textPhotoSubtle`; `textMutedOnDark` →
  `textPhotoMuted`. Flips headings on every welcome + onboarding screen.
- **`OptionCard`** (`shared/components/OptionCard`) — `glassClearInput*`,
  `textOnDark`, `textMutedOnDark`, `white`, `primary` → semantic equivalents.
- **`GlassDivider`** — `glassClearDivider` → `glassDivider`.
- **`ErrorMessage`** — `errorOnDark` → theme-aware error (see above).
- **`CtaButton`** — uses `primary`/`textOnPrimary`. The green pill reads fine on
  a light background; likely leave as-is, but confirm contrast.

### 2. Sign-in flow (`features/auth`)

- **`SignIn.tsx`** — photo overlay `photoTint` → `photoWash*` gradient;
  `textOnDark` / `textMutedOnDark` → `textPhotoBody` / `textPhotoMuted`.
- **`OtpRequestForm.tsx`** — `glassClearInput*`, `textOnDark`, `textMutedOnDark`,
  `primary*` → semantic. **Note:** it reads `useColorScheme()` directly
  (`isDark`); reconcile with `theme.mode` so there's one source of truth.
- **`OtpVerifyPanel.tsx`** — `photoTint`, `inputBorderDark`, `inputBackgroundDark`,
  `errorOnDark`, `textOnDark`, `textMutedOnDark`, `white`, `primary*` → semantic.
- **`SocialAuthButtons.tsx`** — `glassClearInput`, `glassClearInputBorder`,
  `textOnDark` → semantic.

### 3. Onboarding + welcome (`features/onboarding`, `features/welcome`)

- **`OnboardingScreenShell.tsx`** — has **hardcoded** values, not tokens:
  `rgba(10,28,10,0.60)` overlay → `photoWash*` gradient; NavBackArrow
  `rgba(255,255,255,0.50)` → `textPhotoMuted`.
- **Welcome steps 1–3** and **onboarding GrassType / EffortLevel /
  SprinklerSystem** — mostly `onboardingPhotoTint` (via their own overlays) +
  `ScreenTypography`; migrating the shell + typography covers most of it.
- **`Location.tsx`** — `glassClearInput*`, `textOnDark`, `textMutedOnDark`,
  `photoTint` (Android tint) → semantic.
- Check `StepProgressDots`, `StepPillLabel` for hardcoded/legacy colours.

### 4. Settings (`features/settings/SettingsScreen.tsx`) — heaviest

- Uses the `gradient*` background **and lots of hardcoded** `rgba(255,255,255,…)`
  values plus `white`. Needs a broader pass: replace the hardcoded whites with
  theme tokens and give it a light treatment. Consider whether Settings keeps
  the dark-panel look (it's a different surface from the photo screens) or
  adopts Clear Sky — a product decision.

---

## Known caveats during rollout

- **Task Details bottom-sheet** (`TaskRow/TaskDetailsModal.tsx`) was **left on
  legacy (dark) tokens** on purpose — it's a dark sheet over a dim backdrop,
  which reads fine in light mode, and its `deckCardExpanded` fill can't be
  shared with the open-row tint. Give it a light sheet later if desired.
- **Floating tab bar is shared chrome.** It now renders light in light mode, so
  until **Settings** migrates, the light pill floats over the still-dark
  Settings screen. Cosmetic only; resolves when Settings is migrated.
- **`photoHeaderFade*`** stays a dark gradient in both themes on purpose — it
  sits over a real photo strip and needs the dark fade for text contrast.
