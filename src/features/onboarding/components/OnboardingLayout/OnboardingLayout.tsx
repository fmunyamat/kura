import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { ReactNode, useEffect } from 'react';
import { Keyboard, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import styled from 'styled-components/native';
import { OnboardingProgressBar } from '~/features/onboarding/components/OnboardingProgressBar';

interface OnboardingLayoutProps {
  step: number;
  totalSteps: number;
  heroIcon: string;
  stepLabel: string;
  title: string;
  subtitle: string;
  // children — the form content rendered inside the frosted glass panel.
  children: ReactNode;
  
}

// Background — full-screen LinearGradient using the app's four-stop green
// gradient. Creates the illusion of depth that the frosted glass panel sits over.
const Background = styled(LinearGradient).attrs(({ theme }) => ({
  colors: [
    theme.colors.gradientDark,
    theme.colors.gradientMid,
    theme.colors.gradientMidLight,
    theme.colors.gradientLight,
  ] as const,
  start: { x: 0.1, y: 0 },
  end: { x: 0.2, y: 1 },
}))`
  flex: 1;
`;

// Safe — outermost layout wrapper. Must sit OUTSIDE the keyboard-avoidance
// layer so that layer's offset calculation works in already-inset space.
const Safe = styled(SafeAreaView)`
  flex: 1;
`;

// IosScreen — KeyboardAvoidingView used only on iOS. 'padding' adds bottom
// space equal to the keyboard height, causing HeroZone (flex:1) to compress
// while the glass panel stays visible.
const IosScreen = styled(KeyboardAvoidingView)`
  flex: 1;
`;

// AndroidScreen — plain Animated.View used on Android instead of
// KeyboardAvoidingView. edgeToEdgeEnabled in app.json sets windowSoftInputMode
// to 'adjustNothing', which prevents KeyboardAvoidingView from receiving the
// layout events it needs to work. We manually translate the layout up by the
// keyboard height using Reanimated.
const AndroidScreen = styled(Animated.View)`
  flex: 1;
`;

// HeroZone — the upper portion holding the icon, step label, title, and
// subtitle. flex: 1 makes it fill available space above the panel. When the
// keyboard appears and the layout shifts, HeroZone compresses first so the
// glass panel stays fully visible.
const HeroZone = styled.View`
  flex: 1;
  align-items: center;
  justify-content: center;
  padding: 0 ${({ theme }) => theme.spacing.lg}px ${({ theme }) => theme.spacing.md}px;
  gap: ${({ theme }) => theme.spacing.xs}px;
`;

// HeroIcon — the emoji icon at the top of the hero zone.
const HeroIcon = styled.Text`
  font-size: ${({ theme }) => theme.typography.size2xl}px;
  margin-bottom: ${({ theme }) => theme.spacing.xs}px;
`;

// StepLabel — small uppercase step counter (e.g. "STEP 1 OF 4") in muted white.
const StepLabel = styled.Text`
  font-size: ${({ theme }) => theme.typography.sizeXs}px;
  font-weight: ${({ theme }) => theme.typography.weightBold};
  letter-spacing: 2px;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.65);
`;

// Title — the primary heading of the screen.
const Title = styled.Text`
  font-size: ${({ theme }) => theme.typography.sizeXl}px;
  font-weight: ${({ theme }) => theme.typography.weightBlack};
  color: rgba(255, 255, 255, 0.96);
  letter-spacing: ${({ theme }) => theme.typography.letterSpacingTight}px;
  text-align: center;
  line-height: ${({ theme }) => theme.typography.sizeXl * 1.25}px;
`;

// Subtitle — supporting copy below the title, in muted white.
const Subtitle = styled.Text`
  font-size: ${({ theme }) => theme.typography.sizeXs}px;
  color: rgba(255, 255, 255, 0.68);
  text-align: center;
  line-height: ${({ theme }) => theme.typography.lineHeightSm}px;
`;

// GlassPanelShadow — the outer wrapper that casts the drop shadow and sets
// the floating margins. It must be separate from GlassPanelClip because
// overflow: hidden on a View clips its own shadow on iOS — splitting them
// lets the shadow render outside while the blur is still masked to the radius.
const GlassPanelShadow = styled.View`
  margin: 0 ${({ theme }) => theme.spacing.md}px ${({ theme }) => theme.spacing.lg}px;
  border-radius: ${({ theme }) => theme.radii.lg}px;
  shadow-color: #000;
  shadow-offset: 0px 16px;
  shadow-opacity: 0.55;
  shadow-radius: 28px;
  elevation: 20;
`;

// GlassPanelClip — clips the BlurView and its children to the card's
// rounded corners. overflow: hidden is required — without it the blur effect
// leaks past the border-radius on iOS.
const GlassPanelClip = styled.View`
  border-radius: ${({ theme }) => theme.radii.lg}px;
  overflow: hidden;
`;

// GlassPanelContent — sits on top of the BlurView and applies the dark green
// tint. rgba(22,48,24,0.82) over a dark BlurView creates the deep frosted
// panel that floats off the gradient background. No gap here — the ScrollView
// is the only direct child, so gap would have nothing to act on.
const GlassPanelContent = styled.View`
  background-color: ${({ theme }) => theme.colors.glassOnboardingPanel};
  padding: ${({ theme }) => theme.spacing.md}px;
`;

// PanelInner — the actual gap container that lives inside the ScrollView.
// Gap must be here rather than on GlassPanelContent because GlassPanelContent's
// only direct child is the ScrollView, so any gap set there has no siblings
// to act on.
const PanelInner = styled.View`
  gap: ${({ theme }) => theme.spacing.lg}px;
`;

// OnboardingLayout — the shared wrapper for all four onboarding screens.
// Renders the green gradient background, the hero zone, the progress bar,
// and the frosted glass panel at the bottom that holds the screen's form content.
export const OnboardingLayout = ({
  step,
  totalSteps,
  heroIcon,
  stepLabel,
  title,
  subtitle,
  children,
}: OnboardingLayoutProps) => {
  // androidKeyboardOffset — tracks keyboard height on Android so we can
  // manually push the layout up. Only active on Android; iOS uses KAV.
  const androidKeyboardOffset = useSharedValue(0);

  useEffect(() => {
    if (Platform.OS !== 'android') return;

    // keyboardDidShow fires once the keyboard has fully appeared and reports
    // the exact final height. We animate to that height so the content slides
    // up smoothly rather than jumping. edgeToEdgeEnabled means we get the
    // full keyboard + navigation-bar height in endCoordinates.height.
    const show = Keyboard.addListener('keyboardDidShow', (e) => {
      androidKeyboardOffset.value = withTiming(e.endCoordinates.height, {
        duration: 220,
      });
    });

    const hide = Keyboard.addListener('keyboardDidHide', () => {
      androidKeyboardOffset.value = withTiming(0, { duration: 220 });
    });

    return () => {
      show.remove();
      hide.remove();
    };
  }, [androidKeyboardOffset]);

  const androidShiftStyle = useAnimatedStyle(() => ({
    paddingBottom: androidKeyboardOffset.value,
  }));

  const panelContent = (
    <>
      <OnboardingProgressBar currentStep={step} totalSteps={totalSteps} />
      <HeroZone>
        <HeroIcon>{heroIcon}</HeroIcon>
        <StepLabel>{stepLabel}</StepLabel>
        <Title>{title}</Title>
        <Subtitle>{subtitle}</Subtitle>
      </HeroZone>
      <GlassPanelShadow>
        <GlassPanelClip>
          <BlurView intensity={28} tint="dark">
            <GlassPanelContent>
              {/* ScrollView handles the edge case where panel content is taller
                  than available space on very small phones after keyboard +
                  hero zone compete for vertical space. keyboardShouldPersistTaps
                  ensures the Continue button fires while the keyboard is still up. */}
              <ScrollView
                bounces={false}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
              >
                <PanelInner>{children}</PanelInner>
              </ScrollView>
            </GlassPanelContent>
          </BlurView>
        </GlassPanelClip>
      </GlassPanelShadow>
    </>
  );

  return (
    <Background>
      <Safe>
        {Platform.OS === 'android' ? (
          <AndroidScreen style={androidShiftStyle}>
            {panelContent}
          </AndroidScreen>
        ) : (
          <IosScreen behavior="padding">
            {panelContent}
          </IosScreen>
        )}
      </Safe>
    </Background>
  );
};
