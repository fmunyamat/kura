# Glassmorphism Sign-In Screen Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the sign-in screen to use a full-bleed mowing photo with a frosted glass card for the auth form, replacing the current two-section dark/photo split layout.

**Architecture:** The `ImageBackground` moves from wrapping only the bottom panel to covering the entire screen, with a semi-transparent `TintOverlay` on top. The hero logo/wordmark/tagline is inlined into `SignInScreen` (replacing `HeroSection`). A reusable `GlassCard` component (`BlurView` + border) wraps the auth form and the confirmation panel content. The slide animation mechanism (Animated.Value horizontal row, overflow: hidden clip) is unchanged.

**Tech Stack:** expo-blur (BlurView), expo-image (Image), expo-linear-gradient (gradient button), styled-components/native, React Native Animated API.

---

## File Map

| Action | Path | Responsibility |
|--------|------|----------------|
| Create | `src/shared/components/GlassCard/GlassCard.tsx` | Reusable frosted-glass card surface |
| Create | `src/shared/components/GlassCard/GlassCard.test.tsx` | Component test |
| Create | `src/shared/components/GlassCard/index.tsx` | Barrel export |
| Modify | `src/features/onboarding/screens/SignInScreen.tsx` | Full layout restructure; inlines hero content; uses GlassCard |
| Modify | `src/features/onboarding/components/SocialAuthButtons/SocialAuthButtons.ios.tsx` | Horizontal side-by-side layout with glass styling |
| Modify | `src/features/onboarding/components/ConfirmationPanel/ConfirmationPanel.tsx` | Uses GlassCard; removes Spacer pair; centers card vertically |
| Delete | `src/features/onboarding/components/HeroSection/HeroSection.tsx` | Replaced by inlined hero in SignInScreen |
| Delete | `src/features/onboarding/components/HeroSection/HeroSection.test.tsx` | No longer needed |
| Delete | `src/features/onboarding/components/HeroSection/index.tsx` | No longer needed |

---

## Task 1: Install expo-blur

**Files:**
- Modify: `package.json` (automatic via `expo install`)

- [ ] **Step 1: Install the package**

```bash
npx expo install expo-blur
```

Expected output includes `expo-blur` added to `package.json` and installed in `node_modules`.

- [ ] **Step 2: Verify the package is listed**

```bash
grep "expo-blur" package.json
```

Expected: `"expo-blur": "~14.x.x"` (version pinned by Expo SDK).

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "feat: install expo-blur for glassmorphism glass card"
```

---

## Task 2: Create the GlassCard shared component

**Files:**
- Create: `src/shared/components/GlassCard/GlassCard.tsx`
- Create: `src/shared/components/GlassCard/GlassCard.test.tsx`
- Create: `src/shared/components/GlassCard/index.tsx`

- [ ] **Step 1: Write the failing test**

Create `src/shared/components/GlassCard/GlassCard.test.tsx`:

```tsx
jest.mock('expo-blur', () => ({ BlurView: 'BlurView' }));

import React from 'react';
import { Text } from 'react-native';
import { render } from '@testing-library/react-native';
import { ThemeProvider } from 'styled-components/native';
import { lightTheme } from '~/config/theme';
import { GlassCard } from './GlassCard';

const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider theme={lightTheme}>{children}</ThemeProvider>
);

describe('GlassCard', () => {
  it('renders children inside the blur card', () => {
    const { getByText } = render(
      <GlassCard><Text>hello</Text></GlassCard>,
      { wrapper: Wrapper }
    );
    expect(getByText('hello')).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx jest src/shared/components/GlassCard/GlassCard.test.tsx --no-coverage
```

Expected: FAIL — `Cannot find module './GlassCard'`.

- [ ] **Step 3: Write the GlassCard implementation**

Create `src/shared/components/GlassCard/GlassCard.tsx`:

```tsx
import { BlurView } from 'expo-blur';
import { ReactNode } from 'react';
import styled from 'styled-components/native';

interface GlassCardProps {
  children: ReactNode;
  intensity?: number;
}

// Clip — a rounded View that clips the BlurView and its children to the card
// boundary, and draws the 1px border on top. overflow: hidden is what makes
// the border-radius actually cut off the blur surface's corners.
const Clip = styled.View`
  border-radius: ${({ theme }) => theme.radii.lg}px;
  overflow: hidden;
  border-width: 1px;
  border-color: ${({ theme }) => theme.colors.borderOnDark};
`;

// Blur — the expo-blur BlurView that applies a frosted-glass effect over
// whatever is rendered behind this card in the view hierarchy. intensity and
// tint are set via JSX props when the card is used, not here.
const Blur = styled(BlurView)``;

// Content — sits on top of the blur and adds a faint white tint so the card
// reads as a distinct surface. Also supplies the inner padding and gap that
// space out whatever children are placed inside.
const Content = styled.View`
  background-color: rgba(255, 255, 255, 0.04);
  padding: ${({ theme }) => theme.spacing.md}px;
  gap: ${({ theme }) => theme.spacing.md}px;
`;

export const GlassCard = ({ children, intensity = 18 }: GlassCardProps) => (
  <Clip>
    <Blur intensity={intensity} tint="dark">
      <Content>{children}</Content>
    </Blur>
  </Clip>
);
```

- [ ] **Step 4: Write the barrel**

Create `src/shared/components/GlassCard/index.tsx`:

```tsx
export { GlassCard } from './GlassCard';
```

- [ ] **Step 5: Run test to verify it passes**

```bash
npx jest src/shared/components/GlassCard/GlassCard.test.tsx --no-coverage
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/shared/components/GlassCard/
git commit -m "feat: add GlassCard shared component using expo-blur"
```

---

## Task 3: Restructure SignInScreen for the full-bleed glassmorphism layout

**Files:**
- Modify: `src/features/onboarding/screens/SignInScreen.tsx`

This is the core layout change. The `ImageBackground` moves from covering only the bottom panel to covering the entire screen. The `HeroSection` import is removed and its content is inlined as styled components directly in this file. The `FadeEdge` gradient is removed (no longer needed — the full-bleed photo is the single background). The auth form is wrapped in `GlassCard`.

- [ ] **Step 1: Replace the entire file content**

Open `src/features/onboarding/screens/SignInScreen.tsx` and replace it with:

```tsx
import { Image } from 'expo-image';
import { useRef, useState } from 'react';
import {
  Animated,
  Easing,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  useWindowDimensions,
} from 'react-native';
import styled from 'styled-components/native';
import { ConfirmationPanel } from '../components/ConfirmationPanel';
import { MagicLinkForm } from '../components/MagicLinkForm';
import { SocialAuthButtons } from '../components/SocialAuthButtons';
import { GlassCard } from '~/shared/components/GlassCard';

const KEYBOARD_BEHAVIOR = Platform.select<'padding' | undefined>({
  ios: 'padding',
  default: undefined,
});

// Screen — full-screen KeyboardAvoidingView. On iOS, shifts the layout up
// when the keyboard appears so the email input stays visible.
const Screen = styled(KeyboardAvoidingView)`
  flex: 1;
`;

// PhotoBackground — the mowing photo covers the entire screen. Both the hero
// area and the auth panel sit on top of this single image so the glass card
// has a real photo to blur and the two sections read as one unified background.
const PhotoBackground = styled(ImageBackground)`
  flex: 1;
`;

// TintOverlay — a semi-transparent dark layer over the photo that brings
// the overall luminance down so text and the glass card are legible against
// the greenery without losing the sense of depth from the photo.
const TintOverlay = styled.View`
  flex: 1;
  background-color: rgba(5, 12, 5, 0.58);
`;

// GlassHero — the upper two-fifths of the screen. The logo, wordmark, and
// tagline sit here, floating directly over the tinted photo.
const GlassHero = styled.View`
  flex: 2;
  align-items: center;
  justify-content: center;
  gap: ${({ theme }) => theme.spacing.xs}px;
`;

// LogoImage — the kura SVG mark rendered via expo-image for reliable SVG
// support across iOS and Android. Size scales up on tablets.
const LogoImage = styled(Image)<{ $isTablet: boolean }>`
  width: ${({ $isTablet }) => ($isTablet ? 150 : 120)}px;
  height: ${({ $isTablet }) => ($isTablet ? 150 : 120)}px;
  margin-bottom: ${({ theme }) => theme.spacing.xs}px;
`;

// Wordmark — the "kura" brand name in a heavy weight. On tablets the type
// scales up to stay proportional to the larger logo.
const Wordmark = styled.Text<{ $isTablet: boolean }>`
  color: ${({ theme }) => theme.colors.textOnDark};
  font-size: ${({ $isTablet, theme }) =>
    $isTablet ? theme.typography.size2xl : theme.typography.size2xl * 0.8}px;
  font-weight: ${({ theme }) => theme.typography.weightBlack};
  letter-spacing: -1px;
`;

// Tagline — "Lawn care, simplified" in lime, uppercase and letter-spaced for
// that sport-utility feel that contrasts nicely with the heavy wordmark above.
const Tagline = styled.Text<{ $isTablet: boolean }>`
  color: ${({ theme }) => theme.colors.lime};
  font-size: ${({ $isTablet, theme }) =>
    $isTablet ? theme.typography.sizeSm : theme.typography.sizeSm * 0.8}px;
  font-weight: ${({ theme }) => theme.typography.weightBold};
  text-transform: uppercase;
  letter-spacing: 2px;
`;

// PanelHost — the lower three-fifths that holds both sliding panels.
// overflow: hidden clips whichever panel is off-screen during the slide.
const PanelHost = styled.View`
  flex: 3;
  overflow: hidden;
`;

// GlassAuthContent — the container for the form panel. Its explicit width
// reserves exactly one screen-width slot in the horizontal row. The padding
// creates breathing room between the glass card and the screen edges.
const GlassAuthContent = styled.View<{ $width: number }>`
  width: ${({ $width }) => $width}px;
  padding: ${({ theme }) => theme.spacing.md}px;
  justify-content: center;
`;

// Divider — the "or continue with" row between the magic link form and
// the social buttons, inside the glass card.
const Divider = styled.View`
  flex-direction: row;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm}px;
`;

const DividerLine = styled.View`
  flex: 1;
  height: 1px;
  background-color: ${({ theme }) => theme.colors.borderOnDark};
`;

const DividerText = styled.Text`
  font-size: ${({ theme }) => theme.typography.sizeXs}px;
  color: ${({ theme }) => theme.colors.textMutedOnDark};
`;

export const SignInScreen = () => {
  const [email, setEmail] = useState('');

  // isConfirming disables pointer events on the off-screen form so stray taps
  // can't reach hidden inputs — especially important on Android where
  // overflow: hidden alone doesn't block touches.
  const [isConfirming, setIsConfirming] = useState(false);

  // screenWidth drives the slide distance and each panel's explicit width.
  // useWindowDimensions re-runs on rotation so both stay correct after the
  // device turns. isTablet scales up the hero content on large screens.
  const { width: screenWidth, height } = useWindowDimensions();
  const isTablet = Math.min(screenWidth, height) >= 600;

  // slideAnim is the horizontal offset applied to the panel row.
  // 0 = auth form visible. -screenWidth = confirmation panel visible.
  const slideAnim = useRef(new Animated.Value(0)).current;

  // slide animates the panel row to any target offset using an ease-out-cubic
  // curve so the motion feels physical rather than mechanical.
  const slide = (toValue: number, onDone?: () => void) =>
    Animated.timing(slideAnim, {
      toValue,
      duration: 320,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(onDone);

  // handleSubmit immediately disables the form (keyboard dismisses, stray taps
  // blocked) then slides the confirmation panel in from the right.
  const handleSubmit = () => {
    setIsConfirming(true);
    slide(-screenWidth);
  };

  // handleReset slides the form back in, then clears the email and re-enables
  // the form only after the animation finishes — so the form is never visible
  // mid-slide with stale state.
  const handleReset = () =>
    slide(0, () => {
      setIsConfirming(false);
      setEmail('');
    });

  return (
    <Screen behavior={KEYBOARD_BEHAVIOR}>
      {/* PhotoBackground covers the full screen so the glass card blurs a real
          photo rather than a flat colour. resizeMode="cover" fills any screen
          aspect ratio without letterboxing. */}
      <PhotoBackground
        source={require('../../../../assets/images/mowing-photo.jpg')}
        resizeMode="cover"
      >
        <TintOverlay>
          <GlassHero>
            <LogoImage
              $isTablet={isTablet}
              accessibilityLabel="Kura logo"
              source={require('../../../../assets/images/kura-logo.svg')}
              contentFit="contain"
            />
            <Wordmark $isTablet={isTablet}>kura</Wordmark>
            <Tagline $isTablet={isTablet}>Lawn care, simplified</Tagline>
          </GlassHero>

          <PanelHost>
            {/* The Animated.View holds both panels in a horizontal row.
                Total width is 2× screen width — one panel slot each.
                slideAnim shifts the entire row so the right panel comes
                into view. Both panels are always mounted so the slide
                is instant with no layout recalculation mid-animation. */}
            <Animated.View
              style={{
                flexDirection: 'row',
                flex: 1,
                width: screenWidth * 2,
                transform: [{ translateX: slideAnim }],
              }}
            >
              <GlassAuthContent
                $width={screenWidth}
                pointerEvents={isConfirming ? 'none' : 'auto'}
              >
                <GlassCard>
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
                </GlassCard>
              </GlassAuthContent>

              <ConfirmationPanel email={email} onReset={handleReset} />
            </Animated.View>
          </PanelHost>
        </TintOverlay>
      </PhotoBackground>
    </Screen>
  );
};
```

- [ ] **Step 2: Confirm the import alias `~/` resolves correctly**

Check `tsconfig.json` for the `~` path alias:

```bash
grep -A 5 '"paths"' /Users/farai/Projects/kura/tsconfig.json
```

If `~` isn't mapped, use a relative import instead: `'../../../shared/components/GlassCard'` in `SignInScreen.tsx`.

- [ ] **Step 3: Run TypeScript to check for errors**

```bash
npx tsc --noEmit
```

Expected: no errors. Fix any import path issues before continuing.

- [ ] **Step 4: Commit**

```bash
git add src/features/onboarding/screens/SignInScreen.tsx
git commit -m "feat: restructure SignInScreen with full-bleed photo and glass hero layout"
```

---

## Task 4: Update SocialAuthButtons to horizontal glass style

**Files:**
- Modify: `src/features/onboarding/components/SocialAuthButtons/SocialAuthButtons.ios.tsx`

The mockup shows Google and Apple buttons placed side-by-side in a single row, each taking half the available width. The glass card provides the frosted background; the buttons just need a subtle tinted border to read as distinct tap targets.

- [ ] **Step 1: Replace the entire file content**

Open `src/features/onboarding/components/SocialAuthButtons/SocialAuthButtons.ios.tsx` and replace it with:

```tsx
import { Image } from 'expo-image';
import styled from 'styled-components/native';

export interface SocialAuthButtonsProps {
  onGooglePress: () => void;
  onApplePress: () => void;
}

// ButtonsWrapper — a horizontal row so Google and Apple sit side-by-side,
// each taking equal width. gap keeps them from touching.
const ButtonsWrapper = styled.View`
  flex-direction: row;
  gap: ${({ theme }) => theme.spacing.sm}px;
`;

// SocialButton — flex: 1 makes each button claim half the available row width.
// The glass-compatible background matches the card surface without being opaque.
const SocialButton = styled.TouchableOpacity`
  flex: 1;
  height: 44px;
  border-radius: ${({ theme }) => theme.radii.md}px;
  border-width: 1px;
  border-color: ${({ theme }) => theme.colors.borderOnDark};
  background-color: ${({ theme }) => theme.colors.inputBackgroundDark};
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: ${({ theme }) => theme.spacing.xs}px;
`;

const BrandLogo = styled(Image)`
  width: 18px;
  height: 18px;
`;

const ButtonLabel = styled.Text`
  font-size: ${({ theme }) => theme.typography.sizeSm}px;
  font-weight: ${({ theme }) => theme.typography.weightBold};
  color: ${({ theme }) => theme.colors.textOnDark};
`;

export const SocialAuthButtons = ({
  onGooglePress,
  onApplePress,
}: SocialAuthButtonsProps) => (
  <ButtonsWrapper>
    <SocialButton
      onPress={onGooglePress}
      activeOpacity={0.75}
      accessibilityLabel="Continue with Google"
      accessibilityRole="button"
    >
      <BrandLogo
        source={require('../../../../../assets/images/google-logo.svg')}
        contentFit="contain"
      />
      <ButtonLabel>Google</ButtonLabel>
    </SocialButton>
    <SocialButton
      onPress={onApplePress}
      activeOpacity={0.75}
      accessibilityLabel="Continue with Apple"
      accessibilityRole="button"
    >
      <BrandLogo
        source={require('../../../../../assets/images/apple-logo.svg')}
        contentFit="contain"
      />
      <ButtonLabel>Apple</ButtonLabel>
    </SocialButton>
  </ButtonsWrapper>
);
```

Note: button labels shortened to "Google" / "Apple" (was "Continue with Google" / "Continue with Apple") because the horizontal layout is narrow — the full label won't fit alongside the logo at smaller screen sizes.

- [ ] **Step 2: Run TypeScript to check for errors**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/features/onboarding/components/SocialAuthButtons/SocialAuthButtons.ios.tsx
git commit -m "feat: update SocialAuthButtons to horizontal glass layout"
```

---

## Task 5: Update ConfirmationPanel to use GlassCard

**Files:**
- Modify: `src/features/onboarding/components/ConfirmationPanel/ConfirmationPanel.tsx`

The confirmation panel now sits on the same full-bleed photo as the auth form. It should use `GlassCard` so it reads as a consistent frosted surface. The two `Spacer` views are replaced with `justify-content: center` on the outer `Panel`, which is simpler and equally correct.

- [ ] **Step 1: Replace the entire file content**

Open `src/features/onboarding/components/ConfirmationPanel/ConfirmationPanel.tsx` and replace it with:

```tsx
import { useWindowDimensions } from 'react-native';
import styled from 'styled-components/native';
import { GlassCard } from '~/shared/components/GlassCard';

interface ConfirmationPanelProps {
  email: string;
  onReset: () => void;
}

// Panel — outer container for the confirmation slide. It occupies exactly one
// screen-width slot in the horizontal row that SignInScreen manages. padding
// pushes the glass card away from the screen edges; justify-content: center
// vertically centres the card in whatever height the PanelHost gives us.
const Panel = styled.View<{ $width: number; $isTablet: boolean }>`
  width: ${({ $width }) => $width}px;
  flex: 1;
  padding: ${({ $isTablet, theme }) =>
    $isTablet ? theme.spacing.xl : theme.spacing.md}px;
  justify-content: center;
`;

// GlassContent — aligns the icon, headings, and links in a centred column
// inside the glass card. Gap scales up on tablets so the content feels
// proportional at larger viewing distances.
const GlassContent = styled.View<{ $isTablet: boolean }>`
  align-items: center;
  gap: ${({ $isTablet, theme }) =>
    $isTablet ? theme.spacing.xl : theme.spacing.lg}px;
`;

// IconCircle — a subtle circular badge behind the envelope emoji.
const IconCircle = styled.View<{ $isTablet: boolean }>`
  width: ${({ $isTablet }) => ($isTablet ? 72 : 48)}px;
  height: ${({ $isTablet }) => ($isTablet ? 72 : 48)}px;
  border-radius: ${({ theme }) => theme.radii.full}px;
  background-color: rgba(255, 255, 255, 0.08);
  align-items: center;
  justify-content: center;
`;

const IconText = styled.Text<{ $isTablet: boolean }>`
  font-size: ${({ $isTablet, theme }) =>
    $isTablet ? theme.typography.sizeXl : theme.typography.sizeLg}px;
`;

const Heading = styled.Text<{ $isTablet: boolean }>`
  font-size: ${({ $isTablet, theme }) =>
    $isTablet ? theme.typography.sizeXl : theme.typography.sizeLg}px;
  font-weight: ${({ theme }) => theme.typography.weightBold};
  color: ${({ theme }) => theme.colors.textOnDark};
  letter-spacing: ${({ theme }) => theme.typography.letterSpacingTight}px;
`;

const BodyText = styled.Text<{ $isTablet: boolean }>`
  font-size: ${({ $isTablet, theme }) =>
    $isTablet ? theme.typography.sizeMd : theme.typography.sizeSm}px;
  color: ${({ theme }) => theme.colors.textMutedOnDark};
  text-align: center;
  line-height: ${({ theme }) => theme.typography.lineHeightSm}px;
`;

// EmailPillWrapper — a dark capsule that frames the user's email address.
// The border matches the email input field so it feels like the same language.
const EmailPillWrapper = styled.View<{ $isTablet: boolean }>`
  background-color: ${({ theme }) => theme.colors.inputBackgroundDark};
  border-width: 1px;
  border-color: ${({ theme }) => theme.colors.inputBorderDark};
  border-radius: ${({ theme }) => theme.radii.md}px;
  padding: ${({ $isTablet, theme }) =>
    $isTablet ? theme.spacing.sm : theme.spacing.xs}px
    ${({ $isTablet, theme }) =>
    $isTablet ? theme.spacing.md : theme.spacing.sm}px;
`;

// EmailPillText — the address inside the pill, in lime so it stands out
// clearly from the surrounding muted body copy.
const EmailPillText = styled.Text<{ $isTablet: boolean }>`
  color: ${({ theme }) => theme.colors.lime};
  font-weight: ${({ theme }) => theme.typography.weightBold};
  font-size: ${({ $isTablet, theme }) =>
    $isTablet ? theme.typography.sizeMd : theme.typography.sizeSm}px;
`;

// ResetLink — a tappable line that slides the form back so the user can
// correct a typo or try a different address.
const ResetLink = styled.Text<{ $isTablet: boolean }>`
  font-size: ${({ $isTablet, theme }) =>
    $isTablet ? theme.typography.sizeMd : theme.typography.sizeSm}px;
  color: ${({ theme }) => theme.colors.textMutedOnDark};
  text-decoration-line: underline;
`;

export const ConfirmationPanel = ({
  email,
  onReset,
}: ConfirmationPanelProps) => {
  // useWindowDimensions re-runs on rotation so width and isTablet always
  // reflect the current device orientation. Math.min picks the shorter side
  // so a landscape tablet still counts as a tablet.
  const { width, height } = useWindowDimensions();
  const isTablet = Math.min(width, height) >= 600;

  return (
    <Panel $width={width} $isTablet={isTablet}>
      <GlassCard>
        <GlassContent $isTablet={isTablet}>
          <IconCircle $isTablet={isTablet}>
            <IconText $isTablet={isTablet}>✉️</IconText>
          </IconCircle>
          <Heading $isTablet={isTablet}>Check your inbox</Heading>
          <BodyText $isTablet={isTablet}>We sent a sign-in link to</BodyText>
          <EmailPillWrapper $isTablet={isTablet}>
            <EmailPillText $isTablet={isTablet}>{email}</EmailPillText>
          </EmailPillWrapper>
          <BodyText $isTablet={isTablet}>Open it to sign in — no password needed.</BodyText>
          <ResetLink
            $isTablet={isTablet}
            onPress={onReset}
            accessibilityRole="button"
            accessibilityLabel="Use a different email"
          >
            Use a different email
          </ResetLink>
        </GlassContent>
      </GlassCard>
    </Panel>
  );
};
```

- [ ] **Step 2: Run TypeScript to check for errors**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/features/onboarding/components/ConfirmationPanel/ConfirmationPanel.tsx
git commit -m "feat: update ConfirmationPanel with GlassCard and simplified layout"
```

---

## Task 6: Remove HeroSection component

**Files:**
- Delete: `src/features/onboarding/components/HeroSection/HeroSection.tsx`
- Delete: `src/features/onboarding/components/HeroSection/HeroSection.test.tsx`
- Delete: `src/features/onboarding/components/HeroSection/index.tsx`

HeroSection's content (logo, wordmark, tagline) is now inlined in `SignInScreen`. The component is no longer imported anywhere.

- [ ] **Step 1: Confirm no remaining imports**

```bash
grep -r "HeroSection" /Users/farai/Projects/kura/src --include="*.tsx" --include="*.ts"
```

Expected: zero results (the import was removed from SignInScreen in Task 3).

- [ ] **Step 2: Delete the three files**

```bash
rm src/features/onboarding/components/HeroSection/HeroSection.tsx
rm src/features/onboarding/components/HeroSection/HeroSection.test.tsx
rm src/features/onboarding/components/HeroSection/index.tsx
rmdir src/features/onboarding/components/HeroSection
```

- [ ] **Step 3: Run the full test suite to confirm nothing is broken**

```bash
npx jest --no-coverage
```

Expected: all tests pass. If any test imports HeroSection it will surface here; fix by deleting the remaining import.

- [ ] **Step 4: Run TypeScript to confirm no stale references**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "chore: remove HeroSection component (content inlined into SignInScreen)"
```

---

## Self-Review Checklist

### Spec coverage
| Requirement | Task |
|-------------|------|
| Full-bleed mowing photo background | Task 3 — `PhotoBackground` covers entire screen |
| Semi-transparent dark tint over photo | Task 3 — `TintOverlay` at `rgba(5,12,5,0.58)` |
| Mowing stripe overlay | Intentionally omitted — `repeating-linear-gradient` is unsupported in React Native's LinearGradient; effect is imperceptible at 0.04–0.06 opacity |
| Hero section: logo (kura-logo.svg) | Task 3 — `LogoImage` via expo-image |
| Hero section: wordmark + tagline | Task 3 — `Wordmark` + `Tagline` styled components |
| Frosted glass card around auth form | Task 2 (GlassCard) + Task 3 (usage) |
| Green gradient submit button | No change needed — MagicLinkForm already has it |
| Divider "or continue with" | Task 3 — `Divider`, `DividerLine`, `DividerText` (same as before, now inside GlassCard) |
| Horizontal side-by-side social buttons | Task 4 — `ButtonsWrapper` flex-direction: row |
| Glass card on ConfirmationPanel | Task 5 |
| Slide animation preserved | Task 3 — mechanism unchanged (Animated.Value, Easing.out, overflow: hidden) |
| HeroSection removed | Task 6 |
| Tablet responsiveness preserved | Tasks 3, 5 — `$isTablet` prop on hero content and confirmation panel |

### Placeholder scan
No TBD, TODO, or "similar to Task N" patterns present.

### Type consistency
- `GlassCard` imported as `'~/shared/components/GlassCard'` in both Task 3 (SignInScreen) and Task 5 (ConfirmationPanel) — consistent.
- `$isTablet: boolean` transient prop used consistently on all responsive styled components.
- `$width: number` transient prop used on `GlassAuthContent` (Task 3) and `Panel` (Task 5) — consistent naming.
- `intensity` prop on `GlassCard` defaults to `18` in Task 2 and is not overridden in Tasks 3 or 5 — consistent.
