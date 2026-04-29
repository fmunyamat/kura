# Sign-In Screen — Design Spec

**Date:** 2026-04-28
**Branch:** `feature/sign-in-screen`
**Scope:** UI only — no Supabase, Zustand, or TanStack Query wiring in this pass.

---

## Overview

A single sign-in screen that serves as the unified entry point for both new and returning users. Auth method is email magic link (no password, no OTP code entry). Google and Apple sign-in are also available, with Apple shown on iOS only.

---

## Visual Design

### Layout

The screen is split into two vertical zones:

| Zone | Height | Background |
|---|---|---|
| Hero | 40% | Deep-to-mid green gradient |
| Auth panel | 60% | White |

The boundary between zones is a straight horizontal line with a 56px multi-stop gradient overlay fading from transparent to white, so the green bleeds smoothly into the white panel below.

### Hero Section

- **Background:** linear gradient `175deg`, `#0c3520` → `#135633` → `#1e6b3c` → `#2D6A2D` → `#3d7d35`
- **Content alignment:** `flex-start` (top), `padding-top: 20px`, `padding-bottom: 64px` — bottom padding keeps content clear of the 56px fade zone
- **Logo:** `kura-logo.svg` at 38×38, drop-shadow for depth
- **Wordmark:** "kura", white, 17px, weight 900, tight letter-spacing
- **Tagline:** "Lawn care, simplified", lime (`rgba(184,229,106,0.92)`), 6.5px, uppercase, letter-spacing 1.1px
- **Fade overlay:** absolute, bottom 0, height 56px, 6-stop gradient: `0% → 8% → 25% → 55% → 82% → 100%` opacity white

### Auth Panel — Default State

- **Padding:** 18px top, 16px sides, 16px bottom
- **Gap between elements:** 10px
- **Field label:** "EMAIL", 8px, weight 700, uppercase, `#333`
- **Email input:** 32px tall, `border-radius: 9px`, border `#d0e8d0`, background `#f5fbf5`, placeholder `your@email.com`
- **CTA button:** "Send Magic Link →", 32px tall, `border-radius: 9px`, gradient `#135633` → `#2D6A2D`, white text, weight 800, box-shadow `rgba(19,86,51,0.35)`
- **Divider:** "or continue with", hairline rules either side, `#bbb`
- **Social buttons:** stacked, full-width, 30px tall, `border-radius: 9px`, bordered (`#e0e0e0`), 8px gap between them
  - Google: Google coloured icon + "Continue with Google"
  - Apple: Apple icon + "Continue with Apple" — **iOS only**

### Auth Panel — Submitted State

The hero is unchanged. The auth panel content is replaced in-place (no navigation) by:

- **Envelope icon** in a 44px lime-tinted circle (`#EAF9BF` → `#C8E6C0` gradient, `#B8E56A` border)
- **"Check your inbox"** — 11px, weight 800, `#135633`
- **Body copy:** "We sent a sign-in link to"
- **Email pill:** the address the user entered, `background: #EAF4E5`, `color: #2D6A2D`, weight 700
- **Body copy:** "Open it to sign in — no password needed."
- **"Use a different email"** link — `#5A9E3A`, underlined, resets to default state

---

## Color Tokens

| Token | Value | Used for |
|---|---|---|
| Gradient top | `#0c3520` | Hero gradient start |
| Gradient mid | `#135633` | Hero gradient / CTA button start |
| Primary green | `#2D6A2D` | CTA button end |
| Primary mid | `#5A9E3A` | "Use different email" link |
| Lime accent | `#B8E56A` | Tagline, confirmation icon border |
| Surface | `#EAF4E5` | Email pill background |
| Input border | `#d0e8d0` | Email input border |
| Input bg | `#f5fbf5` | Email input background |
| White | `#FFFFFF` | Auth panel background |

---

## Component Architecture

```
src/features/onboarding/
├── screens/
│   └── SignInScreen.tsx
├── components/
│   ├── HeroSection/
│   │   ├── index.tsx
│   │   └── HeroSection.tsx
│   ├── MagicLinkForm/
│   │   ├── index.tsx
│   │   └── MagicLinkForm.tsx
│   ├── SocialAuthButtons/
│   │   ├── index.tsx
│   │   ├── SocialAuthButtons.ios.tsx
│   │   └── SocialAuthButtons.android.tsx
│   └── ConfirmationPanel/
│       ├── index.tsx
│       └── ConfirmationPanel.tsx
└── types.ts
```

### Component responsibilities

**`SignInScreen`**
- Owns `email: string` and `submitted: boolean` state
- Renders `HeroSection` (always)
- Conditionally renders `MagicLinkForm` + `SocialAuthButtons` (default) or `ConfirmationPanel` (submitted)
- Wrapped in `KeyboardAvoidingView` with platform-appropriate `behavior` prop

**`HeroSection`**
- Renders gradient background, fade overlay, logo, wordmark, tagline
- No props — purely presentational
- Uses `expo-image` for the SVG logo

**`MagicLinkForm`**
- Props: `email: string`, `onEmailChange: (email: string) => void`, `onSubmit: () => void`
- Renders field label, `TextInput`, CTA button
- `TextInput`: `keyboardType="email-address"`, `autoCapitalize="none"`, `autoCorrect={false}`, `autoComplete="off"`, `textContentType="none"`

**`SocialAuthButtons`** (platform-split)
- `.ios.tsx`: renders Google button + Apple button
- `.android.tsx`: renders Google button only
- Props: `onGooglePress: () => void`, `onApplePress?: () => void`
- Both callbacks are no-ops in this UI-only pass

**`ConfirmationPanel`**
- Props: `email: string`, `onReset: () => void`
- Renders envelope icon, heading, body copy, email pill, reset link

### Styling rules

- All styles via `styled-components/native` — no `StyleSheet.create()`, no inline `style={}`
- All colour and spacing values from `theme` tokens — no hardcoded values
- Transient props (`$` prefix) for any conditional styled variants

---

## Screen States

| State | Condition | Panel content |
|---|---|---|
| Default | `submitted === false` | `MagicLinkForm` + `SocialAuthButtons` |
| Submitted | `submitted === true` | `ConfirmationPanel` |
| Reset | User taps "Use a different email" | `submitted → false`, `email → ''`, back to Default |

---

## Dependencies required

These packages must be installed before implementation begins:

| Package | Reason |
|---|---|
| `styled-components` + `@types/styled-components-react-native` | All component styling |

The existing `constants/theme.ts` must be replaced with the Kura theme from CLAUDE.md (green tokens, spacing, radii, typography). The `types/styled.d.ts` module augmentation must also be created so `theme` is typed throughout the codebase.

The colors listed in the Visual Design section above are not hardcoded in components — they come from `theme.colors` and are only specified in this spec as a reference for what values to put in the theme.

---

## Out of scope (this pass)

- Supabase magic link call
- Google OAuth integration
- Apple Sign In integration
- Form validation (Zod)
- Loading / error states
- Navigation wiring to onboarding or app tabs
- Zustand / TanStack Query
