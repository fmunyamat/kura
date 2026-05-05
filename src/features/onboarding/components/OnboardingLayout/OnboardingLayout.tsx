import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { ReactNode, useEffect } from 'react';
import { Keyboard, KeyboardAvoidingView, Platform, ScrollView, useWindowDimensions } from 'react-native';
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

// ContentArea — on phones this is a transparent flex:1 passthrough. On tablets
// it becomes the centering container: flex:1 + justify-content:center groups
// HeroZone and GlassPanelShadow together in the vertical middle of the screen,
// with a gap controlling the space between them.
const ContentArea = styled.View<{ $isTablet: boolean }>`
  flex: 1;
  ${({ $isTablet, theme }) =>
    $isTablet
      ? `justify-content: center; gap: ${theme.spacing.xxl*3}px; padding: 0 ${theme.spacing.lg}px ${theme.spacing.lg}px;`
      : ''}
`;

// HeroZone — holds the icon, step label, title, and subtitle. On phones it
// has flex:1 so it fills the space above the panel and centres its content
// within that space. On tablets ContentArea handles centering, so flex is
// omitted entirely — React Native then uses flexBasis:auto which lets HeroZone
// size to its content height without expanding. flex:0 would set flexBasis:0
// and collapse the view to zero height.
const HeroZone = styled.View<{ $isTablet: boolean }>`
  ${({ $isTablet }) => (!$isTablet ? 'flex: 3;' : '')}
  align-items: center;
  justify-content: center;
  padding: 0 ${({ theme, $isTablet }) =>
    $isTablet ? theme.spacing.xxl : theme.spacing.lg}px
    ${({ theme, $isTablet }) =>
    $isTablet ? 0 : theme.spacing.md}px;
  gap: ${({ theme, $isTablet }) =>
    $isTablet ? theme.spacing.sm : theme.spacing.xs}px;
`;

// HeroIcon — the emoji icon at the top of the hero zone. Scales up on tablets
// so it reads properly on larger screens.
const HeroIcon = styled.Text<{ $isTablet: boolean }>`
  font-size: ${({ theme, $isTablet }) =>
    $isTablet ? theme.typography.size2xl * 1.5 : theme.typography.size2xl}px;
  margin-bottom: ${({ theme }) => theme.spacing.xs}px;
`;

// StepLabel — small uppercase step counter (e.g. "STEP 1 OF 4") in muted white.
// Slightly larger on tablets for readability.
const StepLabel = styled.Text<{ $isTablet: boolean }>`
  font-size: ${({ theme, $isTablet }) =>
    $isTablet ? theme.typography.sizeSm : theme.typography.sizeXs}px;
  font-weight: ${({ theme }) => theme.typography.weightBold};
  letter-spacing: 2px;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.65);
`;

// Title — the primary heading of the screen. Scales to a larger size on
// tablets so it commands the extra vertical space naturally.
const Title = styled.Text<{ $isTablet: boolean }>`
  font-size: ${({ theme, $isTablet }) =>
    $isTablet ? theme.typography.size2xl : theme.typography.sizeXl}px;
  font-weight: ${({ theme }) => theme.typography.weightBlack};
  color: rgba(255, 255, 255, 0.96);
  letter-spacing: ${({ theme }) => theme.typography.letterSpacingTight}px;
  text-align: center;
  line-height: ${({ theme, $isTablet }) =>
    ($isTablet ? theme.typography.size2xl : theme.typography.sizeXl) * 1.25}px;
`;

// Subtitle — supporting copy below the title, in muted white. Steps up one
// size on tablets so it remains comfortably readable at arm's length.
const Subtitle = styled.Text<{ $isTablet: boolean }>`
  font-size: ${({ theme, $isTablet }) =>
    $isTablet ? theme.typography.sizeMd : theme.typography.sizeXs}px;
  color: rgba(255, 255, 255, 0.68);
  text-align: center;
  line-height: ${({ theme, $isTablet }) =>
    $isTablet ? theme.typography.sizeMd * 1.5 : theme.typography.lineHeightSm}px;
`;

// GlassPanelShadow — the outer wrapper that casts the drop shadow. On phones
// it uses horizontal margins so it floats within the screen. On tablets it
// centres at a fixed 520px width — the ContentArea gap above provides spacing
// from the hero zone so no bottom margin is needed on tablet.
// Split from GlassPanelClip because overflow: hidden on a View clips its own
// shadow on iOS — the shadow renders outside while the blur is masked inside.
const GlassPanelShadow = styled.View<{ $isTablet: boolean }>`
  ${({ $isTablet, theme }) =>
    $isTablet
      ? `align-self: center; width: 520px;`
      : `margin: 0 ${theme.spacing.md}px ${theme.spacing.lg}px;`}
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

// GlassPanelContent — sits on top of the BlurView and applies the glass tint.
// Padding increases on tablets so the form content doesn't sit too close to
// the panel edges.
const GlassPanelContent = styled.View<{ $isTablet: boolean }>`
  background-color: ${({ theme }) => theme.colors.glassOnboardingPanel};
  padding: ${({ theme, $isTablet }) =>
    $isTablet ? theme.spacing.lg : theme.spacing.md}px;
`;

// PanelInner — the actual gap container that lives inside the ScrollView.
// Gap must be here rather than on GlassPanelContent because GlassPanelContent's
// only direct child is the ScrollView, so any gap set there has no siblings
// to act on. Gap grows on tablets to match the extra breathing room.
const PanelInner = styled.View<{ $isTablet: boolean }>`
  gap: ${({ theme, $isTablet }) =>
    $isTablet ? theme.spacing.xl : theme.spacing.lg}px;
`;

// OnboardingLayout — the shared wrapper for all four onboarding screens.
// Renders the green gradient background, the hero zone, the progress bar,
// and the frosted glass panel at the bottom that holds the screen's form content.
// On tablets (min(width, height) >= 600) the hero and panel are centred together
// as a group in the middle of the screen with controlled spacing between them.
export const OnboardingLayout = ({
  step,
  totalSteps,
  heroIcon,
  stepLabel,
  title,
  subtitle,
  children,
}: OnboardingLayoutProps) => {
  const { width, height } = useWindowDimensions();
  // isTablet — true when the shortest screen dimension is at least 600pt,
  // matching the threshold used throughout the app (e.g. SignInScreen).
  const isTablet = Math.min(width, height) >= 600;

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
      <ContentArea $isTablet={isTablet}>
        <HeroZone $isTablet={isTablet}>
          <HeroIcon $isTablet={isTablet}>{heroIcon}</HeroIcon>
          <StepLabel $isTablet={isTablet}>{stepLabel}</StepLabel>
          <Title $isTablet={isTablet}>{title}</Title>
          <Subtitle $isTablet={isTablet}>{subtitle}</Subtitle>
        </HeroZone>
        <GlassPanelShadow $isTablet={isTablet}>
          <GlassPanelClip>
            <BlurView intensity={28} tint="dark">
              <GlassPanelContent $isTablet={isTablet}>
                {/* ScrollView handles the edge case where panel content is taller
                    than available space on very small phones after keyboard +
                    hero zone compete for vertical space. keyboardShouldPersistTaps
                    ensures the Continue button fires while the keyboard is still up. */}
                <ScrollView
                  bounces={false}
                  showsVerticalScrollIndicator={false}
                  keyboardShouldPersistTaps="handled"
                >
                  <PanelInner $isTablet={isTablet}>{children}</PanelInner>
                </ScrollView>
              </GlassPanelContent>
            </BlurView>
          </GlassPanelClip>
        </GlassPanelShadow>
      </ContentArea>
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
