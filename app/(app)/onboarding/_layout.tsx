import { router, usePathname } from 'expo-router';
import { Stack } from 'expo-router';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import styled, { useTheme } from 'styled-components/native';
import { OnboardingProgressBar } from '~/features/onboarding/components/OnboardingProgressBar';

// STEP_MAP — maps each onboarding route to its 1-based step number.
const STEP_MAP: Record<string, number> = {
  '/onboarding':                1,
  '/onboarding/grass-type':     2,
  '/onboarding/effort-level':   3,
  '/onboarding/photo-capture':  4,
};

const TOTAL_STEPS = 4;

// SHOWS_BACK — routes that display the back arrow overlay.
// Location (/onboarding) is excluded — there is nowhere to go back to.
const SHOWS_BACK = new Set([
  '/onboarding/grass-type',
  '/onboarding/effort-level',
  '/onboarding/photo-capture',
]);

// PROGRESS_BAR_HEIGHT — rendered height of OnboardingProgressBar:
// 3px Segment + 8px padding-bottom on Bar = 11px total.
const PROGRESS_BAR_HEIGHT = 11;

// BackButton — 40×40 pressable rendered as an absolute overlay so it sits
// completely outside the Stack and never animates with screen transitions.
// top and left are passed as inline style because they depend on useSafeAreaInsets
// (a runtime value) — that's the one exception the rules allow for inline style.
const BackButton = styled(Pressable)`
  position: absolute;
  width: 40px;
  height: 40px;
  align-items: center;
  justify-content: center;
`;

// BackArrow — the ← glyph shown inside BackButton.
const BackArrow = styled.Text`
  font-size: ${({ theme }) => theme.typography.sizeLg}px;
  color: rgba(255, 255, 255, 0.9);
`;

// OnboardingStackLayout — wraps all onboarding screens in a shared Stack.
// The progress bar and back button are rendered as absolute overlays OUTSIDE
// the Stack so they don't slide with screen transitions.
export default function OnboardingStackLayout() {
  const pathname = usePathname();
  const { top } = useSafeAreaInsets();
  const theme = useTheme();

  const currentStep = STEP_MAP[pathname] ?? 1;
  const showBack = SHOWS_BACK.has(pathname);

  return (
    <View style={{ flex: 1 }}>
      <Stack screenOptions={{ headerShown: false, animation: 'none' }} />

      {/* Progress bar overlay — pointerEvents none lets touches pass through. */}
      <View style={{ position: 'absolute', top, left: 0, right: 0, pointerEvents: 'none' }}>
        <OnboardingProgressBar currentStep={currentStep} totalSteps={TOTAL_STEPS} />
      </View>

      {/* Back button — appears below the progress bar on step 2 and 3.
          Lives outside the Stack so it never participates in slide animations.
          top is inset + bar height + a little breathing room. */}
      {showBack && (
        <BackButton
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          style={{
            top: top + PROGRESS_BAR_HEIGHT + theme.spacing.xs,
            left: theme.spacing.md,
          }}
        >
          <BackArrow>←</BackArrow>
        </BackButton>
      )}
    </View>
  );
}
