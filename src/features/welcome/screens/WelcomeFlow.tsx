import { useState } from 'react';
import { ImageBackground, Pressable, useWindowDimensions } from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import styled from 'styled-components/native';

import { useAuthStore } from '~/features/auth/stores/authStore';
import { StepPillLabel } from '~/shared/components/StepPillLabel';
import { StepProgressDots } from '~/shared/components/StepProgressDots';
import { welcomeService } from '../services/welcome.service';
import WelcomeStep1 from './WelcomeStep1';
import WelcomeStep2 from './WelcomeStep2';
import WelcomeStep3 from './WelcomeStep3';
import WelcomeStep4 from './WelcomeStep4';

const GRASS_BG = require('../../../../assets/images/lawn.png') as number;
const TOTAL_STEPS = 4;

const Screen = styled.View`flex: 1;`;

const PhotoBackground = styled(ImageBackground)`
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
`;

const Safe = styled(SafeAreaView)`flex: 1;`;

const DarkOverlay = styled.View`
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  background-color: rgba(10, 28, 10, 0.60);
`;

const TopBar = styled.View`
  padding: ${({ theme }) => theme.spacing.xl}px 0 ${({ theme }) => theme.spacing.sm}px;
`;

// NavBar — fixed outside the sliding row so the label and back arrow
// stay still during transitions. height: 44px is tall enough for the
// 36px arrow on step 2 while keeping the step pill centred at exactly
// the same vertical position on every step.
const NavBar = styled.View`
  height: 44px;
  align-items: center;
  justify-content: center;
  padding: 0 ${({ theme }) => theme.spacing.md}px;
  margin: 20px 0 0;
`;

// NavBackButton — absolutely positioned so it doesn't inflate NavBar's
// height and the step pill stays at the same vertical centre on all steps.
const NavBackButton = styled(Pressable)`
  position: absolute;
  left: ${({ theme }) => theme.spacing.md}px;
  top: 0;
  bottom: 0;
  justify-content: center;
  padding-right: 8px;
`;

const NavBackArrow = styled.Text`
  font-size: 32px;
  line-height: 36px;
  color: rgba(255, 255, 255, 0.50);
`;

// StepClip — clips the sliding row so off-screen steps aren't visible.
const StepClip = styled.View`
  flex: 1;
  overflow: hidden;
`;

const StepSlot = styled.View<{ $width: number }>`
  width: ${({ $width }) => $width}px;
`;

// WelcomeFlow — pager for the 4-screen welcome tutorial.
// Steps are side-by-side in a row; slideX drives the position.
// Button taps animate slideX to the target step.
const WelcomeFlow = () => {
  const { width } = useWindowDimensions();

  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const slideX = useSharedValue(0);

  const rowStyle = useAnimatedStyle(() => ({
    flexDirection: 'row',
    flex: 1,
    transform: [{ translateX: slideX.value }],
  }));

  const user = useAuthStore((s) => s.user);
  const userName =
    (user?.user_metadata?.first_name as string | undefined) ??
    (user?.user_metadata?.full_name as string | undefined)?.split(' ')[0] ??
    'there';

  // goToStep — single source of truth for button-driven navigation.
  const goToStep = (step: number) => {
    setCurrentStep(step);
    slideX.value = withTiming(-step * width, { duration: 300 });
  };

  const handleNext = () => goToStep(Math.min(currentStep + 1, TOTAL_STEPS - 1));
  const handleBack = () => goToStep(Math.max(currentStep - 1, 0));

  const handleFinish = async () => {
    setErrorMessage(null);
    setIsSubmitting(true);
    try {
      await welcomeService.markWelcomeSeen();
      useAuthStore.getState().setHasSeenWelcome(true);
    } catch (err) {
      if (__DEV__) console.log('[WelcomeFlow] handleFinish error:', err);
      setErrorMessage('Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Screen>
      <PhotoBackground source={GRASS_BG} resizeMode="cover" blurRadius={7} />
      <DarkOverlay />
      <Safe edges={['top', 'bottom']}>
        <TopBar>
          <StepProgressDots total={TOTAL_STEPS} activeIndex={currentStep} />
        </TopBar>

        {/* NavBar is outside the animation — label and back arrow stay fixed. */}
        <NavBar>
          <StepPillLabel prefix="Quick Tour" step={currentStep + 1} total={4} />
          {currentStep >= 1 && currentStep <= 3 && (
            <NavBackButton
              onPress={handleBack}
              accessibilityRole="button"
              accessibilityLabel="Go back to previous step"
            >
              <NavBackArrow>‹</NavBackArrow>
            </NavBackButton>
          )}
        </NavBar>

        <StepClip>
          <Animated.View style={rowStyle}>
            <StepSlot $width={width}>
              <WelcomeStep1 userName={userName} onNext={handleNext} />
            </StepSlot>
            <StepSlot $width={width}>
              <WelcomeStep2 onNext={handleNext} />
            </StepSlot>
            <StepSlot $width={width}>
              <WelcomeStep3 onNext={handleNext} />
            </StepSlot>
            <StepSlot $width={width}>
              <WelcomeStep4
                onFinish={handleFinish}
                isSubmitting={isSubmitting}
                errorMessage={errorMessage}
              />
            </StepSlot>
          </Animated.View>
        </StepClip>
      </Safe>
    </Screen>
  );
};

export default WelcomeFlow;
