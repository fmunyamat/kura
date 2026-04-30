# Kura

A beginner-friendly lawn care app built with React Native and Expo. The target audience is people with zero lawn experience — every screen and every word of copy is written for someone who has never touched a lawn before.

---

## What's been built so far

### Sign-in screen
- **HeroSection** — displays the Kura logo, wordmark, and tagline at the top of the screen
- **MagicLinkForm** — an email input and a gradient submit button that sends a magic link to the user's inbox (no password required)
- **SocialAuthButtons** — Google and Apple sign-in buttons. The Apple button uses platform splitting (`.ios.tsx`) so it only appears on iOS
- **ConfirmationPanel** — replaces the form after the magic link is sent, showing the user's email and a link to go back and try a different address
- **SignInScreen** — the orchestrator that wires all of the above together and manages the `email` and `submitted` state

### App shell
- Expo Router layout (`app/_layout.tsx`) with a root Stack navigator wrapped in the styled-components `ThemeProvider`
- Tab layout stub (`app/(tabs)/_layout.tsx`) ready for the authenticated section of the app
- Index route (`app/index.tsx`) that redirects straight to the sign-in screen
- Metro config (`metro.config.js`) extended to support `.svg` assets

### Theming
- A single theme object (`src/config/theme.ts`) that holds all color tokens, spacing steps, border radii, and typography sizes
- Dark-mode tokens for the auth screens (`screenDark`, `panelDark`, `inputBorderDark`, etc.) so the sign-in flow has a distinct look from the rest of the app

---

## Tech stack

| Layer | Tool |
|---|---|
| Framework | React Native 0.81 + Expo SDK 54 |
| Language | TypeScript (strict mode) |
| Routing | Expo Router v6 (file-based) |
| Styling | styled-components/native v6 |
| Images | expo-image |
| Gradients | expo-linear-gradient |
| Navigation | React Navigation v7 |
| JS Engine | Hermes |

---

## Prerequisites

Before running the project you need:

- **Node.js** 18 or later — download from [nodejs.org](https://nodejs.org)
- **npm** — comes bundled with Node
- **Expo Go** on your physical device, **or** an iOS Simulator (requires Xcode on Mac) / Android Emulator (requires Android Studio)

---

## Getting started

### 1. Install dependencies

This installs every package listed in `package.json` into the `node_modules` folder.

```bash
npm install
```

### 2. Start the development server

This starts the Metro bundler and opens the Expo developer menu in your terminal.

```bash
npx expo start
```

Once the server is running you have several options to open the app:

| Option | How |
|---|---|
| iOS Simulator | Press `i` in the terminal |
| Android Emulator | Press `a` in the terminal |
| Physical device | Scan the QR code with the Expo Go app |

### 3. Reload after changes

Fast Refresh is enabled — the simulator updates automatically whenever you save a file. If something looks stuck, press `r` in the terminal to force a full reload.

### Start with a clean cache

If you see stale behaviour after pulling changes or switching branches, clear Metro's cache before starting:

```bash
npx expo start --clear
```

---

## Project structure

```
app/                        ← Expo Router entry points (thin wrappers only)
  _layout.tsx               ← root Stack + ThemeProvider
  (tabs)/_layout.tsx        ← tab navigator stub for the authenticated section
  index.tsx                 ← redirects to /sign-in
  sign-in.tsx               ← renders SignInScreen from src/

src/
  config/
    theme.ts                ← all design tokens (colors, spacing, radii, typography)

  features/
    onboarding/
      screens/
        SignInScreen.tsx    ← orchestrates the full sign-in flow
      components/
        HeroSection/        ← logo + wordmark + tagline
        MagicLinkForm/      ← email input + submit button
        SocialAuthButtons/  ← Google + Apple buttons (Apple is iOS-only)
        ConfirmationPanel/  ← shown after magic link is sent

assets/
  images/
    kura-logo.svg
    google-logo.svg
    apple-logo.svg
```

---

## Code conventions

### Props are typed directly — no React.FC

Every component types its props in the function signature rather than using `React.FC`. This keeps the type in one place and avoids the hidden `children` prop that `React.FC` used to add silently.

```tsx
// Correct
export const MagicLinkForm = ({
  email,
  onEmailChange,
  onSubmit,
  isLoading = false,
}: MagicLinkFormProps) => { ... };

// Not used in this project
export const MagicLinkForm: React.FC<MagicLinkFormProps> = ({ ... }) => { ... };
```

### All styles live in styled-components

There are no inline `style={}` props (except for values that must be calculated at runtime) and no `StyleSheet.create()` calls. Every visual element is a named styled-component co-located in the same file as the component that uses it.

```tsx
// Correct — named, co-located styled-component
const SubmitButton = styled.TouchableOpacity`
  border-radius: ${({ theme }) => theme.radii.md}px;
`;

// Not allowed
<View style={{ borderRadius: 8 }} />
```

### All values come from the theme

No hardcoded colours, spacing numbers, or font sizes anywhere in component files. Everything references a token from `theme`.

```tsx
// Correct
padding: ${({ theme }) => theme.spacing.lg}px;

// Not allowed
padding: 24px;
```

### Comments explain how the code works, in plain English

Every component, hook, service function, and non-obvious block of logic has a comment that walks through what it does step by step, written so that someone new to the codebase can follow along without needing to ask.
