# Sign-In Screen Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Kura sign-in screen UI — gradient hero, magic link email, Google + Apple social auth (Apple iOS only), and a confirmation state — with no backend wiring.

**Architecture:** `SignInScreen` owns `email` and `submitted` state, renders `HeroSection` (always) plus either `MagicLinkForm`+`SocialAuthButtons` or `ConfirmationPanel`. Expo Router's `app/sign-in.tsx` is the route entry point. `SocialAuthButtons` is platform-split: `.ios.tsx` shows Google + Apple, `.tsx` (default/Android) shows Google only. All styles use `styled-components/native` with Kura theme tokens.

**Tech Stack:** React Native 0.81 · Expo SDK 54 · Expo Router 6 · expo-linear-gradient · expo-image · styled-components/native v6 · TypeScript strict · jest-expo · React Native Testing Library

---

## File Map

| Action | Path | Responsibility |
|--------|------|----------------|
| Create | `src/config/theme.ts` | Kura design tokens (colors, spacing, radii, typography) |
| Create | `src/types/styled.d.ts` | styled-components DefaultTheme augmentation |
| Modify | `tsconfig.json` | Add `~/` alias → `./src/` |
| Modify | `package.json` | Add jest config, styled-components, expo-linear-gradient |
| Modify | `app/_layout.tsx` | Wrap Stack in styled-components ThemeProvider |
| Modify | `app/sign-in.tsx` | Expo Router route — renders SignInScreen |
| Create | `src/features/onboarding/types.ts` | `SignInState` type |
| Create | `src/features/onboarding/screens/SignInScreen.tsx` | Orchestrates state, renders hero + panel |
| Create | `src/features/onboarding/components/HeroSection/HeroSection.tsx` | Gradient hero, logo, wordmark, tagline, fade |
| Create | `src/features/onboarding/components/HeroSection/HeroSection.test.tsx` | Renders logo, wordmark, tagline |
| Create | `src/features/onboarding/components/HeroSection/index.tsx` | Barrel export |
| Create | `src/features/onboarding/components/MagicLinkForm/MagicLinkForm.tsx` | Field label, email input, CTA button |
| Create | `src/features/onboarding/components/MagicLinkForm/MagicLinkForm.test.tsx` | Input change, submit callback |
| Create | `src/features/onboarding/components/MagicLinkForm/index.tsx` | Barrel export |
| Create | `src/features/onboarding/components/SocialAuthButtons/SocialAuthButtons.tsx` | Default/Android — Google only |
| Create | `src/features/onboarding/components/SocialAuthButtons/SocialAuthButtons.ios.tsx` | iOS — Google + Apple |
| Create | `src/features/onboarding/components/SocialAuthButtons/SocialAuthButtons.test.tsx` | Button renders and press callbacks |
| Create | `src/features/onboarding/components/SocialAuthButtons/index.tsx` | Barrel export |
| Create | `src/features/onboarding/components/ConfirmationPanel/ConfirmationPanel.tsx` | Envelope icon, email pill, reset link |
| Create | `src/features/onboarding/components/ConfirmationPanel/ConfirmationPanel.test.tsx` | Shows email, triggers reset |
| Create | `src/features/onboarding/components/ConfirmationPanel/index.tsx` | Barrel export |
| Create | `src/features/onboarding/screens/SignInScreen.test.tsx` | State transitions: submit → confirm → reset |

---

## Task 1: Create branch, install dependencies, configure tooling

**Files:** `package.json` · `tsconfig.json`

- [ ] **Create the feature branch**
  ```bash
  git checkout -b feature/sign-in-screen
  ```

- [ ] **Install runtime dependencies**
  ```bash
  npm install styled-components expo-linear-gradient
  ```

- [ ] **Install dev dependencies**
  ```bash
  npm install --save-dev @types/styled-components-react-native jest-expo @testing-library/react-native
  ```

- [ ] **Add jest config to `package.json`** (at root level, alongside `"scripts"`):
  ```json
  "jest": {
    "preset": "jest-expo",
    "setupFilesAfterEnv": ["@testing-library/react-native/extend-expect"],
    "transformIgnorePatterns": [
      "node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|react-navigation|@react-navigation/.*|styled-components)"
    ]
  }
  ```

- [ ] **Add `~/` path alias to `tsconfig.json`**

  Replace the entire file with:
  ```json
  {
    "extends": "expo/tsconfig.base",
    "compilerOptions": {
      "strict": true,
      "paths": {
        "@/*": ["./*"],
        "~/*": ["./src/*"]
      }
    },
    "include": [
      "**/*.ts",
      "**/*.tsx",
      ".expo/types/**/*.ts",
      "expo-env.d.ts"
    ]
  }
  ```

- [ ] **Verify jest runs** (will pass with 0 test suites — that's fine):
  ```bash
  npx jest --no-coverage --passWithNoTests
  ```
  Expected: `Test Suites: 0 skipped` — no errors.

- [ ] **Commit**
  ```bash
  git add package.json package-lock.json tsconfig.json
  git commit -m "chore: install styled-components, expo-linear-gradient, jest-expo"
  ```

---

## Task 2: Create Kura theme and styled-components type augmentation

**Files:** `src/config/theme.ts` · `src/types/styled.d.ts`

- [ ] **Create `src/config/theme.ts`**
  ```ts
  export const lightTheme = {
    colors: {
      primary:         '#2D6A2D',
      primaryMid:      '#5A9E3A',
      gradientDark:    '#0c3520',
      gradientMid:     '#135633',
      gradientLight:   '#3d7d35',
      lime:            'rgba(184,229,106,0.92)',
      background:      '#FFFFFF',
      surface:         '#EAF4E5',
      inputBorder:     '#d0e8d0',
      inputBackground: '#f5fbf5',
      text:            '#1A1A1A',
      textMuted:       '#888888',
      border:          '#e0e0e0',
      success:         '#C8E6C0',
    },
    spacing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 },
    radii:   { sm: 4, md: 8, lg: 16, full: 9999 },
    typography: {
      sizeXs: 12,
      sizeSm: 14,
      sizeMd: 16,
      sizeLg: 20,
      sizeXl: 24,
      size2xl: 32,
      weightRegular: '400' as const,
      weightMedium:  '500' as const,
      weightBold:    '700' as const,
    },
  };

  export type AppTheme = typeof lightTheme;
  ```

- [ ] **Create `src/types/styled.d.ts`**
  ```ts
  import type { AppTheme } from '~/config/theme';

  declare module 'styled-components/native' {
    export interface DefaultTheme extends AppTheme {}
  }
  ```

- [ ] **Commit**
  ```bash
  git add src/config/theme.ts src/types/styled.d.ts
  git commit -m "feat: add Kura theme tokens and styled-components type augmentation"
  ```

---

## Task 3: Add ThemeProvider to app root and register sign-in route

**Files:** `app/_layout.tsx` · `app/sign-in.tsx`

- [ ] **Update `app/_layout.tsx`** to wrap the navigator in styled-components ThemeProvider:
  ```tsx
  import { DarkTheme, DefaultTheme, ThemeProvider as NavThemeProvider } from '@react-navigation/native';
  import { Stack } from 'expo-router';
  import { StatusBar } from 'expo-status-bar';
  import 'react-native-reanimated';
  import { ThemeProvider } from 'styled-components/native';

  import { useColorScheme } from '@/hooks/use-color-scheme';
  import { lightTheme } from '@/src/config/theme';

  export const unstable_settings = {
    anchor: '(tabs)',
  };

  export default function RootLayout() {
    const colorScheme = useColorScheme();

    return (
      <ThemeProvider theme={lightTheme}>
        <NavThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="sign-in" options={{ headerShown: false }} />
            <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
          </Stack>
          <StatusBar style="auto" />
        </NavThemeProvider>
      </ThemeProvider>
    );
  }
  ```

- [ ] **Create `app/sign-in.tsx`** (thin route shell — component built in Task 8):
  ```tsx
  import { SignInScreen } from '@/src/features/onboarding/screens/SignInScreen';

  export default SignInScreen;
  ```

- [ ] **Commit**
  ```bash
  git add app/_layout.tsx app/sign-in.tsx
  git commit -m "feat: register sign-in route and add styled-components ThemeProvider"
  ```

---

## Task 4: Build HeroSection

**Files:** `src/features/onboarding/components/HeroSection/HeroSection.test.tsx` · `HeroSection.tsx` · `index.tsx`

- [ ] **Write the failing test** at `src/features/onboarding/components/HeroSection/HeroSection.test.tsx`:
  ```tsx
  import React from 'react';
  import { render } from '@testing-library/react-native';
  import { ThemeProvider } from 'styled-components/native';
  import { lightTheme } from '~/config/theme';
  import { HeroSection } from './HeroSection';

  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <ThemeProvider theme={lightTheme}>{children}</ThemeProvider>
  );

  describe('HeroSection', () => {
    it('renders the wordmark', () => {
      const { getByText } = render(<HeroSection />, { wrapper: Wrapper });
      expect(getByText('kura')).toBeTruthy();
    });

    it('renders the tagline', () => {
      const { getByText } = render(<HeroSection />, { wrapper: Wrapper });
      expect(getByText('Lawn care, simplified')).toBeTruthy();
    });

    it('renders the logo image', () => {
      const { getByTestId } = render(<HeroSection />, { wrapper: Wrapper });
      expect(getByTestId('kura-logo')).toBeTruthy();
    });
  });
  ```

- [ ] **Run test to verify it fails**
  ```bash
  npx jest HeroSection.test --no-coverage
  ```
  Expected: FAIL — `Cannot find module './HeroSection'`

- [ ] **Create `src/features/onboarding/components/HeroSection/HeroSection.tsx`**
  ```tsx
  import React from 'react';
  import styled from 'styled-components/native';
  import { LinearGradient } from 'expo-linear-gradient';
  import { Image } from 'expo-image';

  const HERO_COLORS = ['#0c3520', '#135633', '#1e6b3c', '#2D6A2D', '#3d7d35'] as const;
  const FADE_COLORS = [
    'rgba(255,255,255,0)',
    'rgba(255,255,255,0.08)',
    'rgba(255,255,255,0.25)',
    'rgba(255,255,255,0.55)',
    'rgba(255,255,255,0.82)',
    'rgba(255,255,255,1)',
  ] as const;
  const FADE_LOCATIONS = [0, 0.2, 0.4, 0.6, 0.8, 1] as const;

  const HeroGradient = styled(LinearGradient)`
    flex: 2;
    align-items: center;
    justify-content: flex-start;
    padding-top: 20px;
    padding-bottom: 64px;
  `;

  const FadeOverlay = styled(LinearGradient)`
    position: absolute;
    bottom: 0px;
    left: 0px;
    right: 0px;
    height: 56px;
  `;

  const LogoImage = styled(Image)`
    width: 38px;
    height: 38px;
  `;

  const Wordmark = styled.Text`
    color: ${({ theme }) => theme.colors.background};
    font-size: 17px;
    font-weight: 900;
    letter-spacing: -0.8px;
    margin-top: 2px;
  `;

  const Tagline = styled.Text`
    color: ${({ theme }) => theme.colors.lime};
    font-size: 6.5px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 1.1px;
    margin-top: 2px;
  `;

  export const HeroSection: React.FC = () => (
    <HeroGradient
      colors={HERO_COLORS}
      start={{ x: 0.1, y: 0 }}
      end={{ x: 0.9, y: 1 }}
    >
      <LogoImage
        testID="kura-logo"
        source={require('../../../../../assets/images/kura-logo.svg')}
        contentFit="contain"
      />
      <Wordmark>kura</Wordmark>
      <Tagline>Lawn care, simplified</Tagline>
      <FadeOverlay
        colors={FADE_COLORS}
        locations={FADE_LOCATIONS}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        pointerEvents="none"
      />
    </HeroGradient>
  );
  ```

- [ ] **Create barrel** `src/features/onboarding/components/HeroSection/index.tsx`:
  ```tsx
  export { HeroSection } from './HeroSection';
  ```

- [ ] **Run test to verify it passes**
  ```bash
  npx jest HeroSection.test --no-coverage
  ```
  Expected: PASS — 3 tests

- [ ] **Commit**
  ```bash
  git add src/features/onboarding/components/HeroSection/
  git commit -m "feat: add HeroSection with gradient hero and fade overlay"
  ```

---

## Task 5: Build MagicLinkForm

**Files:** `src/features/onboarding/components/MagicLinkForm/MagicLinkForm.test.tsx` · `MagicLinkForm.tsx` · `index.tsx`

- [ ] **Write the failing test** at `src/features/onboarding/components/MagicLinkForm/MagicLinkForm.test.tsx`:
  ```tsx
  import React from 'react';
  import { render, fireEvent } from '@testing-library/react-native';
  import { ThemeProvider } from 'styled-components/native';
  import { lightTheme } from '~/config/theme';
  import { MagicLinkForm } from './MagicLinkForm';

  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <ThemeProvider theme={lightTheme}>{children}</ThemeProvider>
  );

  describe('MagicLinkForm', () => {
    it('renders the email input with placeholder', () => {
      const { getByPlaceholderText } = render(
        <MagicLinkForm email="" onEmailChange={jest.fn()} onSubmit={jest.fn()} />,
        { wrapper: Wrapper },
      );
      expect(getByPlaceholderText('your@email.com')).toBeTruthy();
    });

    it('calls onEmailChange when text changes', () => {
      const onEmailChange = jest.fn();
      const { getByPlaceholderText } = render(
        <MagicLinkForm email="" onEmailChange={onEmailChange} onSubmit={jest.fn()} />,
        { wrapper: Wrapper },
      );
      fireEvent.changeText(getByPlaceholderText('your@email.com'), 'hello@kura.com');
      expect(onEmailChange).toHaveBeenCalledWith('hello@kura.com');
    });

    it('calls onSubmit when the CTA is pressed', () => {
      const onSubmit = jest.fn();
      const { getByText } = render(
        <MagicLinkForm email="hello@kura.com" onEmailChange={jest.fn()} onSubmit={onSubmit} />,
        { wrapper: Wrapper },
      );
      fireEvent.press(getByText('Send Magic Link →'));
      expect(onSubmit).toHaveBeenCalledTimes(1);
    });
  });
  ```

- [ ] **Run test to verify it fails**
  ```bash
  npx jest MagicLinkForm.test --no-coverage
  ```
  Expected: FAIL — `Cannot find module './MagicLinkForm'`

- [ ] **Create `src/features/onboarding/components/MagicLinkForm/MagicLinkForm.tsx`**
  ```tsx
  import React from 'react';
  import styled from 'styled-components/native';
  import { LinearGradient } from 'expo-linear-gradient';

  interface MagicLinkFormProps {
    email: string;
    onEmailChange: (email: string) => void;
    onSubmit: () => void;
  }

  const CTA_COLORS = ['#135633', '#2D6A2D'] as const;

  const FieldLabel = styled.Text`
    font-size: 8px;
    font-weight: 700;
    color: ${({ theme }) => theme.colors.text};
    text-transform: uppercase;
    letter-spacing: 0.5px;
  `;

  const EmailInput = styled.TextInput`
    height: 32px;
    border-width: 1.5px;
    border-color: ${({ theme }) => theme.colors.inputBorder};
    border-radius: ${({ theme }) => theme.radii.md}px;
    background-color: ${({ theme }) => theme.colors.inputBackground};
    font-size: 14px;
    padding-left: ${({ theme }) => theme.spacing.sm}px;
    padding-right: ${({ theme }) => theme.spacing.sm}px;
    color: ${({ theme }) => theme.colors.text};
  `;

  const CtaButton = styled.TouchableOpacity`
    border-radius: ${({ theme }) => theme.radii.md}px;
    overflow: hidden;
    shadow-color: #135633;
    shadow-offset: 0px 2px;
    shadow-opacity: 0.35;
    shadow-radius: 8px;
    elevation: 4;
  `;

  const CtaGradient = styled(LinearGradient)`
    height: 32px;
    align-items: center;
    justify-content: center;
  `;

  const CtaLabel = styled.Text`
    color: ${({ theme }) => theme.colors.background};
    font-size: 14px;
    font-weight: 800;
    letter-spacing: 0.3px;
  `;

  export const MagicLinkForm: React.FC<MagicLinkFormProps> = ({
    email,
    onEmailChange,
    onSubmit,
  }) => (
    <>
      <FieldLabel>Email</FieldLabel>
      <EmailInput
        value={email}
        onChangeText={onEmailChange}
        placeholder="your@email.com"
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="off"
        textContentType="none"
        placeholderTextColor="#aaa"
      />
      <CtaButton onPress={onSubmit} activeOpacity={0.85}>
        <CtaGradient colors={CTA_COLORS} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
          <CtaLabel>Send Magic Link →</CtaLabel>
        </CtaGradient>
      </CtaButton>
    </>
  );
  ```

- [ ] **Create barrel** `src/features/onboarding/components/MagicLinkForm/index.tsx`:
  ```tsx
  export { MagicLinkForm } from './MagicLinkForm';
  ```

- [ ] **Run test to verify it passes**
  ```bash
  npx jest MagicLinkForm.test --no-coverage
  ```
  Expected: PASS — 3 tests

- [ ] **Commit**
  ```bash
  git add src/features/onboarding/components/MagicLinkForm/
  git commit -m "feat: add MagicLinkForm component"
  ```

---

## Task 6: Build SocialAuthButtons (platform split)

**Files:** `src/features/onboarding/components/SocialAuthButtons/SocialAuthButtons.tsx` · `SocialAuthButtons.ios.tsx` · `SocialAuthButtons.test.tsx` · `index.tsx`

Metro resolves `./SocialAuthButtons` to `./SocialAuthButtons.ios.tsx` on iOS and falls back to `./SocialAuthButtons.tsx` on Android. The barrel exports from `./SocialAuthButtons` — no Platform.OS check needed.

- [ ] **Write the failing test** at `src/features/onboarding/components/SocialAuthButtons/SocialAuthButtons.test.tsx`:

  This test imports the iOS variant directly to assert the full feature set.
  ```tsx
  import React from 'react';
  import { render, fireEvent } from '@testing-library/react-native';
  import { ThemeProvider } from 'styled-components/native';
  import { lightTheme } from '~/config/theme';
  import { SocialAuthButtons } from './SocialAuthButtons.ios';

  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <ThemeProvider theme={lightTheme}>{children}</ThemeProvider>
  );

  describe('SocialAuthButtons (iOS)', () => {
    it('renders the Google button', () => {
      const { getByText } = render(
        <SocialAuthButtons onGooglePress={jest.fn()} onApplePress={jest.fn()} />,
        { wrapper: Wrapper },
      );
      expect(getByText('Continue with Google')).toBeTruthy();
    });

    it('renders the Apple button', () => {
      const { getByText } = render(
        <SocialAuthButtons onGooglePress={jest.fn()} onApplePress={jest.fn()} />,
        { wrapper: Wrapper },
      );
      expect(getByText('Continue with Apple')).toBeTruthy();
    });

    it('calls onGooglePress when Google button is pressed', () => {
      const onGooglePress = jest.fn();
      const { getByText } = render(
        <SocialAuthButtons onGooglePress={onGooglePress} onApplePress={jest.fn()} />,
        { wrapper: Wrapper },
      );
      fireEvent.press(getByText('Continue with Google'));
      expect(onGooglePress).toHaveBeenCalledTimes(1);
    });

    it('calls onApplePress when Apple button is pressed', () => {
      const onApplePress = jest.fn();
      const { getByText } = render(
        <SocialAuthButtons onGooglePress={jest.fn()} onApplePress={onApplePress} />,
        { wrapper: Wrapper },
      );
      fireEvent.press(getByText('Continue with Apple'));
      expect(onApplePress).toHaveBeenCalledTimes(1);
    });
  });
  ```

- [ ] **Run test to verify it fails**
  ```bash
  npx jest SocialAuthButtons.test --no-coverage
  ```
  Expected: FAIL — `Cannot find module './SocialAuthButtons.ios'`

- [ ] **Create the shared styled primitives and iOS variant** at `src/features/onboarding/components/SocialAuthButtons/SocialAuthButtons.ios.tsx`:
  ```tsx
  import React from 'react';
  import styled from 'styled-components/native';

  export interface SocialAuthButtonsProps {
    onGooglePress: () => void;
    onApplePress: () => void;
  }

  const ButtonsWrapper = styled.View`
    gap: 8px;
  `;

  const SocialButton = styled.TouchableOpacity`
    height: 30px;
    border-radius: ${({ theme }) => theme.radii.md}px;
    border-width: 1.5px;
    border-color: ${({ theme }) => theme.colors.border};
    background-color: ${({ theme }) => theme.colors.background};
    flex-direction: row;
    align-items: center;
    justify-content: center;
    gap: 6px;
  `;

  const ButtonLabel = styled.Text`
    font-size: 14px;
    font-weight: 600;
    color: ${({ theme }) => theme.colors.text};
  `;

  const GoogleDot = styled.View`
    width: 14px;
    height: 14px;
    border-radius: 7px;
    background-color: #4285f4;
  `;

  const AppleDot = styled.View`
    width: 14px;
    height: 14px;
    border-radius: 7px;
    background-color: #000000;
  `;

  export const SocialAuthButtons: React.FC<SocialAuthButtonsProps> = ({
    onGooglePress,
    onApplePress,
  }) => (
    <ButtonsWrapper>
      <SocialButton onPress={onGooglePress} activeOpacity={0.75}>
        <GoogleDot />
        <ButtonLabel>Continue with Google</ButtonLabel>
      </SocialButton>
      <SocialButton onPress={onApplePress} activeOpacity={0.75}>
        <AppleDot />
        <ButtonLabel>Continue with Apple</ButtonLabel>
      </SocialButton>
    </ButtonsWrapper>
  );
  ```

- [ ] **Create Android/default variant** at `src/features/onboarding/components/SocialAuthButtons/SocialAuthButtons.tsx`:
  ```tsx
  import React from 'react';
  import styled from 'styled-components/native';

  export interface SocialAuthButtonsProps {
    onGooglePress: () => void;
    onApplePress?: () => void;
  }

  const ButtonsWrapper = styled.View`
    gap: 8px;
  `;

  const SocialButton = styled.TouchableOpacity`
    height: 30px;
    border-radius: ${({ theme }) => theme.radii.md}px;
    border-width: 1.5px;
    border-color: ${({ theme }) => theme.colors.border};
    background-color: ${({ theme }) => theme.colors.background};
    flex-direction: row;
    align-items: center;
    justify-content: center;
    gap: 6px;
  `;

  const ButtonLabel = styled.Text`
    font-size: 14px;
    font-weight: 600;
    color: ${({ theme }) => theme.colors.text};
  `;

  const GoogleDot = styled.View`
    width: 14px;
    height: 14px;
    border-radius: 7px;
    background-color: #4285f4;
  `;

  export const SocialAuthButtons: React.FC<SocialAuthButtonsProps> = ({
    onGooglePress,
  }) => (
    <ButtonsWrapper>
      <SocialButton onPress={onGooglePress} activeOpacity={0.75}>
        <GoogleDot />
        <ButtonLabel>Continue with Google</ButtonLabel>
      </SocialButton>
    </ButtonsWrapper>
  );
  ```

- [ ] **Create barrel** `src/features/onboarding/components/SocialAuthButtons/index.tsx`:
  ```tsx
  export { SocialAuthButtons } from './SocialAuthButtons';
  export type { SocialAuthButtonsProps } from './SocialAuthButtons';
  ```

- [ ] **Run test to verify it passes**
  ```bash
  npx jest SocialAuthButtons.test --no-coverage
  ```
  Expected: PASS — 4 tests

- [ ] **Commit**
  ```bash
  git add src/features/onboarding/components/SocialAuthButtons/
  git commit -m "feat: add SocialAuthButtons with iOS/Android platform split"
  ```

---

## Task 7: Build ConfirmationPanel

**Files:** `src/features/onboarding/components/ConfirmationPanel/ConfirmationPanel.test.tsx` · `ConfirmationPanel.tsx` · `index.tsx`

- [ ] **Write the failing test** at `src/features/onboarding/components/ConfirmationPanel/ConfirmationPanel.test.tsx`:
  ```tsx
  import React from 'react';
  import { render, fireEvent } from '@testing-library/react-native';
  import { ThemeProvider } from 'styled-components/native';
  import { lightTheme } from '~/config/theme';
  import { ConfirmationPanel } from './ConfirmationPanel';

  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <ThemeProvider theme={lightTheme}>{children}</ThemeProvider>
  );

  describe('ConfirmationPanel', () => {
    it('renders the heading', () => {
      const { getByText } = render(
        <ConfirmationPanel email="hello@kura.com" onReset={jest.fn()} />,
        { wrapper: Wrapper },
      );
      expect(getByText('Check your inbox')).toBeTruthy();
    });

    it('displays the submitted email', () => {
      const { getByText } = render(
        <ConfirmationPanel email="hello@kura.com" onReset={jest.fn()} />,
        { wrapper: Wrapper },
      );
      expect(getByText('hello@kura.com')).toBeTruthy();
    });

    it('calls onReset when the reset link is pressed', () => {
      const onReset = jest.fn();
      const { getByText } = render(
        <ConfirmationPanel email="hello@kura.com" onReset={onReset} />,
        { wrapper: Wrapper },
      );
      fireEvent.press(getByText('Use a different email'));
      expect(onReset).toHaveBeenCalledTimes(1);
    });
  });
  ```

- [ ] **Run test to verify it fails**
  ```bash
  npx jest ConfirmationPanel.test --no-coverage
  ```
  Expected: FAIL — `Cannot find module './ConfirmationPanel'`

- [ ] **Create `src/features/onboarding/components/ConfirmationPanel/ConfirmationPanel.tsx`**
  ```tsx
  import React from 'react';
  import styled from 'styled-components/native';

  interface ConfirmationPanelProps {
    email: string;
    onReset: () => void;
  }

  const Panel = styled.View`
    flex: 3;
    background-color: ${({ theme }) => theme.colors.background};
    padding: 20px 16px 16px;
    align-items: center;
    justify-content: center;
    gap: 8px;
  `;

  const IconCircle = styled.View`
    width: 44px;
    height: 44px;
    border-radius: 22px;
    background-color: ${({ theme }) => theme.colors.success};
    border-width: 2px;
    border-color: #b8e56a;
    align-items: center;
    justify-content: center;
    margin-bottom: 4px;
  `;

  const IconText = styled.Text`
    font-size: 22px;
  `;

  const Heading = styled.Text`
    font-size: 17px;
    font-weight: 800;
    color: ${({ theme }) => theme.colors.gradientMid};
    letter-spacing: -0.3px;
  `;

  const BodyText = styled.Text`
    font-size: 13px;
    color: ${({ theme }) => theme.colors.textMuted};
    text-align: center;
    line-height: 18px;
  `;

  const EmailPillWrapper = styled.View`
    background-color: ${({ theme }) => theme.colors.surface};
    border-radius: ${({ theme }) => theme.radii.md}px;
    padding: 4px 10px;
  `;

  const EmailPillText = styled.Text`
    color: ${({ theme }) => theme.colors.primary};
    font-weight: 700;
    font-size: 13px;
  `;

  const ResetLink = styled.Text`
    font-size: 13px;
    color: ${({ theme }) => theme.colors.primaryMid};
    text-decoration-line: underline;
    margin-top: 4px;
  `;

  export const ConfirmationPanel: React.FC<ConfirmationPanelProps> = ({
    email,
    onReset,
  }) => (
    <Panel>
      <IconCircle>
        <IconText>✉️</IconText>
      </IconCircle>
      <Heading>Check your inbox</Heading>
      <BodyText>We sent a sign-in link to</BodyText>
      <EmailPillWrapper>
        <EmailPillText>{email}</EmailPillText>
      </EmailPillWrapper>
      <BodyText>Open it to sign in — no password needed.</BodyText>
      <ResetLink onPress={onReset}>Use a different email</ResetLink>
    </Panel>
  );
  ```

- [ ] **Create barrel** `src/features/onboarding/components/ConfirmationPanel/index.tsx`:
  ```tsx
  export { ConfirmationPanel } from './ConfirmationPanel';
  ```

- [ ] **Run test to verify it passes**
  ```bash
  npx jest ConfirmationPanel.test --no-coverage
  ```
  Expected: PASS — 3 tests

- [ ] **Commit**
  ```bash
  git add src/features/onboarding/components/ConfirmationPanel/
  git commit -m "feat: add ConfirmationPanel component"
  ```

---

## Task 8: Build SignInScreen

**Files:** `src/features/onboarding/types.ts` · `src/features/onboarding/screens/SignInScreen.test.tsx` · `SignInScreen.tsx`

- [ ] **Create `src/features/onboarding/types.ts`**
  ```ts
  export interface SignInState {
    email: string;
    submitted: boolean;
  }
  ```

- [ ] **Write the failing test** at `src/features/onboarding/screens/SignInScreen.test.tsx`:
  ```tsx
  import React from 'react';
  import { render, fireEvent } from '@testing-library/react-native';
  import { ThemeProvider } from 'styled-components/native';
  import { lightTheme } from '~/config/theme';
  import { SignInScreen } from './SignInScreen';

  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <ThemeProvider theme={lightTheme}>{children}</ThemeProvider>
  );

  describe('SignInScreen', () => {
    it('renders the email input by default', () => {
      const { getByPlaceholderText } = render(<SignInScreen />, { wrapper: Wrapper });
      expect(getByPlaceholderText('your@email.com')).toBeTruthy();
    });

    it('shows the confirmation panel after submitting an email', () => {
      const { getByPlaceholderText, getByText } = render(<SignInScreen />, { wrapper: Wrapper });
      fireEvent.changeText(getByPlaceholderText('your@email.com'), 'hello@kura.com');
      fireEvent.press(getByText('Send Magic Link →'));
      expect(getByText('Check your inbox')).toBeTruthy();
      expect(getByText('hello@kura.com')).toBeTruthy();
    });

    it('returns to the email form when reset link is pressed', () => {
      const { getByPlaceholderText, getByText } = render(<SignInScreen />, { wrapper: Wrapper });
      fireEvent.changeText(getByPlaceholderText('your@email.com'), 'hello@kura.com');
      fireEvent.press(getByText('Send Magic Link →'));
      fireEvent.press(getByText('Use a different email'));
      expect(getByPlaceholderText('your@email.com')).toBeTruthy();
    });
  });
  ```

- [ ] **Run test to verify it fails**
  ```bash
  npx jest SignInScreen.test --no-coverage
  ```
  Expected: FAIL — `Cannot find module './SignInScreen'`

- [ ] **Create `src/features/onboarding/screens/SignInScreen.tsx`**

  Note: `KeyboardAvoidingView` needs `behavior="padding"` on iOS and `undefined` on Android. We extract this to a module-level constant to keep JSX free of platform checks.
  ```tsx
  import React, { useState } from 'react';
  import { KeyboardAvoidingView, Platform } from 'react-native';
  import styled from 'styled-components/native';
  import { HeroSection } from '../components/HeroSection';
  import { MagicLinkForm } from '../components/MagicLinkForm';
  import { SocialAuthButtons } from '../components/SocialAuthButtons';
  import { ConfirmationPanel } from '../components/ConfirmationPanel';

  const KEYBOARD_BEHAVIOR = Platform.select<'padding' | undefined>({
    ios: 'padding',
    default: undefined,
  });

  const Screen = styled(KeyboardAvoidingView)`
    flex: 1;
    background-color: ${({ theme }) => theme.colors.background};
  `;

  const AuthPanel = styled.View`
    flex: 3;
    background-color: ${({ theme }) => theme.colors.background};
    padding: 18px 16px 16px;
    gap: 10px;
  `;

  const Divider = styled.View`
    flex-direction: row;
    align-items: center;
    gap: ${({ theme }) => theme.spacing.sm}px;
  `;

  const DividerLine = styled.View`
    flex: 1;
    height: 1px;
    background-color: ${({ theme }) => theme.colors.border};
  `;

  const DividerText = styled.Text`
    font-size: 12px;
    color: ${({ theme }) => theme.colors.textMuted};
  `;

  export const SignInScreen: React.FC = () => {
    const [email, setEmail] = useState('');
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = () => setSubmitted(true);
    const handleReset = () => {
      setSubmitted(false);
      setEmail('');
    };

    return (
      <Screen behavior={KEYBOARD_BEHAVIOR}>
        <HeroSection />
        {submitted ? (
          <ConfirmationPanel email={email} onReset={handleReset} />
        ) : (
          <AuthPanel>
            <MagicLinkForm
              email={email}
              onEmailChange={setEmail}
              onSubmit={handleSubmit}
            />
            <Divider>
              <DividerLine />
              <DividerText>or continue with</DividerText>
              <DividerLine />
            </Divider>
            <SocialAuthButtons
              onGooglePress={() => {}}
              onApplePress={() => {}}
            />
          </AuthPanel>
        )}
      </Screen>
    );
  };
  ```

- [ ] **Run all tests to verify everything passes**
  ```bash
  npx jest --no-coverage
  ```
  Expected: PASS — 13 tests across 5 test files

- [ ] **Commit**
  ```bash
  git add src/features/onboarding/
  git commit -m "feat: add SignInScreen orchestrating hero, form, social auth, and confirmation"
  ```

---

## Task 9: Smoke-test on device and final commit

- [ ] **Start Expo dev server**
  ```bash
  npx expo start
  ```

- [ ] **Navigate to the sign-in screen**

  In the Expo Go app (or simulator), open the developer menu and navigate to `/sign-in`. Verify:
  - Green gradient hero renders with logo, "kura", and tagline
  - Email input, "Send Magic Link →" button, divider, and social buttons are all visible below
  - On iOS, both Google and Apple buttons appear; on Android, only Google appears
  - Typing an email and pressing the CTA shows the confirmation panel with the correct email
  - "Use a different email" returns to the email form with the input cleared

- [ ] **Final commit**
  ```bash
  git add .
  git commit -m "feat: sign-in screen UI complete"
  ```
