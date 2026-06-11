import { router, useFocusEffect } from 'expo-router';
import { ReactNode, useCallback, useRef } from 'react';
import { ImageBackground, Pressable, useWindowDimensions } from 'react-native';
import Animated, {
    SlideOutRight,
    cancelAnimation,
    useAnimatedStyle,
    useSharedValue,
    withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import styled from 'styled-components/native';

const GRASS_BG = require('../../../../../assets/images/sprinkler.png') as number;

interface OnboardingScreenShellProps {
  currentStep: number;
  totalSteps: number;
  // children — the scrollable content + CTA for the specific screen.
  children: ReactNode;
}

const Screen = styled.View`flex: 1;`;

const PhotoBackground = styled(ImageBackground)`
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
`;

const DarkOverlay = styled.View`
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  background-color: rgba(10, 28, 10, 0.60);
`;

const Safe = styled(SafeAreaView)`flex: 1;`;

// TopBar — holds the progress dots. Top padding matches WelcomeFlow.
const TopBar = styled.View`
  padding: ${({ theme }) => theme.spacing.xl}px 0 ${({ theme }) => theme.spacing.sm}px;
`;

const DotsRow = styled.View`
  flex-direction: row;
  justify-content: center;
  align-items: center;
  gap: 6px;
`;

const InactiveDot = styled.View`
  width: 5px;
  height: 5px;
  border-radius: 3px;
  background-color: rgba(255, 255, 255, 0.22);
`;

const ActiveDot = styled.View`
  width: 18px;
  height: 5px;
  border-radius: 3px;
  background-color: rgba(255, 255, 255, 0.72);
`;

// NavBar — fixed row below the dots. height: 44px matches WelcomeFlow's NavBar
// so the step pill sits at exactly the same vertical position across all screens.
const NavBar = styled.View`
  height: 44px;
  align-items: center;
  justify-content: center;
  padding: 0 ${({ theme }) => theme.spacing.md}px;
  margin: 20px 0 0;
`;

// NavBackButton — absolutely positioned so it never inflates NavBar's height
// and the step pill stays vertically centred on every step. Matches
// WelcomeFlow's NavBackButton exactly.
const NavBackButton = styled(Pressable)`
  position: absolute;
  left: ${({ theme }) => theme.spacing.md}px;
  top: 0;
  bottom: 0;
  justify-content: center;
  padding-right: 8px;
`;

// NavBackArrow — the ‹ chevron. Font size, line-height, and colour match
// WelcomeFlow's NavBackArrow exactly.
const NavBackArrow = styled.Text`
  font-size: 32px;
  line-height: 36px;
  color: rgba(255, 255, 255, 0.50);
`;

const StepPill = styled.View`
  align-self: center;
  background-color: rgba(255, 255, 255, 0.10);
  border-radius: ${({ theme }) => theme.radii.full}px;
  padding: 4px 13px;
`;

const StepPillText = styled.Text`
  font-size: 11px;
  font-weight: ${({ theme }) => theme.typography.weightBold};
  color: rgba(255, 255, 255, 0.40);
  letter-spacing: 1.6px;
  text-transform: uppercase;
`;

// OnboardingScreenShell — shared chrome for every onboarding screen.
// Renders the grass background, dark overlay, progress dots, and NavBar
// (step pill + back arrow). Also owns the horizontal slide animation:
// first focus slides in from the right (forward navigation); re-focus slides
// in from the left (back navigation reveals this screen). SlideOutRight fires
// when a screen is popped so it exits consistently with the enter direction.
export const OnboardingScreenShell = ({
  currentStep,
  totalSteps,
  children,
}: OnboardingScreenShellProps) => {
  const { width } = useWindowDimensions();

  const translateX = useSharedValue(width);

  // isMounted — distinguishes first focus (forward nav, slide from right) from
  // re-focus (back nav reveals this screen, slide from left).
  const isMounted = useRef(false);

  useFocusEffect(
    useCallback(() => {
      if (!isMounted.current) {
        isMounted.current = true;
        translateX.value = width;
        translateX.value = withTiming(0, { duration: 300 });
      } else {
        translateX.value = -width;
        translateX.value = withTiming(0, { duration: 300 });
      }
      // Cancel the in-flight animation when the screen loses focus (e.g. the
      // user taps Continue before the slide completes). Without this, the
      // withTiming update fires after Reanimated has removed its listener,
      // triggering "onAnimatedValueUpdate with no listeners registered".
      return () => cancelAnimation(translateX);
    }, [translateX, width])
  );

  const contentStyle = useAnimatedStyle(() => ({
    flex: 1,
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <Screen>
      <PhotoBackground source={GRASS_BG} resizeMode="cover" blurRadius={7} />
      <DarkOverlay />
      <Safe edges={['top', 'bottom']}>
        <TopBar>
          <DotsRow>
            {Array.from({ length: totalSteps }, (_, i) =>
              i === currentStep - 1
                ? <ActiveDot key={i} />
                : <InactiveDot key={i} />
            )}
          </DotsRow>
        </TopBar>

        {/* NavBar stays outside the animation so it never slides with content. */}
        <NavBar>
          {currentStep > 1 && (
            <NavBackButton
              onPress={() => router.back()}
              accessibilityRole="button"
              accessibilityLabel="Go back to previous step"
            >
              <NavBackArrow>‹</NavBackArrow>
            </NavBackButton>
          )}
          <StepPill>
            <StepPillText>Setup · {currentStep} of {totalSteps}</StepPillText>
          </StepPill>
        </NavBar>

        {/* Animated content area — slides in on mount and on re-focus.
            SlideOutRight fires when the screen is popped via back navigation. */}
        <Animated.View
          style={contentStyle}
          exiting={SlideOutRight.duration(250)}
        >
          {children}
        </Animated.View>
      </Safe>
    </Screen>
  );
};
