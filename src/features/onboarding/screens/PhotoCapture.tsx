import { useState } from 'react';
import { ActivityIndicator, Pressable } from 'react-native';
import styled from 'styled-components/native';
import { useAuthStore } from '~/features/auth/stores/authStore';
import { OnboardingScreenShell } from '~/features/onboarding/components/OnboardingScreenShell';
import { useIsTablet, type TabletProps } from '~/shared/hooks/use-is-tablet';
import { upsertUserProfile } from '../services/onboardingService';
import { useOnboardingStore } from '../stores/onboardingStore';

const ContentArea = styled.View<TabletProps>`
  flex: 1;
  padding: 0 ${({ theme, $isTablet }) =>
    $isTablet ? theme.spacing.xxl : theme.spacing.md}px;
`;

const TopSpacer = styled.View`flex: 0.2;`;
const BottomSpacer = styled.View`flex: 1;`;
const ContentGroup = styled.View``;

const Headline = styled.Text<TabletProps>`
  font-family: ${({ theme }) => theme.typography.fontHeaderHeavy};
  font-size: ${({ $isTablet }) => ($isTablet ? 64 : 42)}px;
  color: #ffffff;
  letter-spacing: ${({ theme }) => theme.typography.letterSpacingTight}px;
  text-align: center;
  line-height: ${({ $isTablet }) => ($isTablet ? 76 : 50)}px;
`;

const Subtext = styled.Text<TabletProps>`
  font-family: ${({ theme }) => theme.typography.fontBodyMedium};
  font-size: ${({ $isTablet }) => ($isTablet ? 17 : 11)}px;
  color: rgba(255, 255, 255, 0.48);
  text-align: center;
  line-height: ${({ $isTablet }) => ($isTablet ? 28 : 18)}px;
  padding: 0 ${({ theme }) => theme.spacing.sm}px;
  margin-top: ${({ theme, $isTablet }) =>
    $isTablet ? theme.spacing.md : theme.spacing.sm}px;
`;

const SpacerCard = styled.View<TabletProps>`
  height: ${({ $isTablet }) => ($isTablet ? 100 : 60)}px;
`;

// CameraCard — frosted white card housing the camera well and the skip link.
// Matches FormCard/OptionsCard used in Location, GrassType, and EffortLevel.
const CameraCard = styled.View`
  background-color: rgba(255, 255, 255, 0.44);
  border-radius: ${({ theme }) => theme.radii.lg}px;
  overflow: hidden;
`;

// CameraWell — the tappable area that launches the camera. Sits inside
// CameraCard so it gets the frosted background. Large vertical padding makes
// it an obvious tap target.
const CameraWell = styled(Pressable)`
  padding: ${({ theme }) => theme.spacing.xl}px ${({ theme }) => theme.spacing.md}px;
  align-items: center;
  justify-content: center;
  gap: ${({ theme }) => theme.spacing.xs}px;
`;

const CameraIcon = styled.Text`font-size: 40px;`;

// CameraLabel — instruction text below the camera icon. fontHeaderBold and
// white colour match CardName/NavPillName for consistent card typography.
const CameraLabel = styled.Text`
  font-family: ${({ theme }) => theme.typography.fontHeaderBold};
  font-size: 14px;
  color: #ffffff;
  margin-top: 4px;
`;

// ErrorText — shown above the CTA if the profile INSERT fails.
// Never exposes the raw Supabase error (MASVS-CODE-4, MASWE-0087).
const ErrorText = styled.Text`
  font-size: ${({ theme }) => theme.typography.sizeXs}px;
  color: ${({ theme }) => theme.colors.errorOnDark};
  text-align: center;
  margin-bottom: ${({ theme }) => theme.spacing.sm}px;
`;

const CtaArea = styled.View<TabletProps>`
  padding: 0 ${({ theme, $isTablet }) =>
    $isTablet ? theme.spacing.xxl : theme.spacing.md}px
    ${({ theme }) => theme.spacing.md}px;
`;

// CtaButton — dark pill matching all other onboarding screens.
// Dims while the profile write is in flight to block double-taps.
const CtaButton = styled(Pressable)<TabletProps & { $disabled: boolean }>`
  background-color: ${({ theme }) => theme.colors.primary};
  border-radius: ${({ theme }) => theme.radii.md}px;
  padding: ${({ $isTablet }) => ($isTablet ? '22px 18px' : '14px 12px')};
  opacity: ${({ $disabled }) => ($disabled ? 0.6 : 1)};
`;

const CtaLabel = styled.Text<TabletProps>`
  font-family: ${({ theme }) => theme.typography.fontBodyBold};
  font-size: ${({ $isTablet }) => ($isTablet ? 22 : 14)}px;
  color: #D6EFD8;
  text-align: center;
`;

// PhotoCapture — the final onboarding step. The user takes a "before" photo
// of their lawn to anchor the progress timeline.
// Skipping is allowed — they can take the photo later from the Progress tab.
// Both paths (take photo + skip) call handleComplete to write user_profiles,
// which is what signals the app to route to the home tabs on next render.
export const PhotoCapture = () => {
  const isTablet = useIsTablet();

  const user = useAuthStore((state) => state.user);
  const { zipCode, lawnSize, grassType, effortLevel } = useOnboardingStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // handleComplete — writes the user_profiles row to Supabase, which flips
  // hasCompletedOnboarding to true. On success, we update the Zustand auth
  // store immediately so the routing guard re-renders without waiting for
  // another onAuthStateChange event. Navigation is automatic from there —
  // the guard in app/(app)/_layout.tsx redirects to /welcome (or tabs).
  // We must NOT call router.replace ourselves: the store update synchronously
  // swaps the (app) layout's <Stack> for a <Redirect>, so a manual navigation
  // dispatched right after targets a navigator that no longer exists and
  // throws "action not handled by any navigator".
  //
  // On failure we show a generic message — never the raw Supabase error
  // (MAVSV-CODE-4, MASWE-0087).
  const handleComplete = async () => {
    if (isSubmitting || !user || !lawnSize || !grassType || !effortLevel) return;

    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      await upsertUserProfile({ userId: user.id, zipCode, lawnSize, grassType, effortLevel });

      // Update auth store directly so the routing guard sees hasCompletedOnboarding
      // = true on the next render without waiting for an onAuthStateChange event.
      useAuthStore.getState().setHasCompletedOnboarding(true);
      useOnboardingStore.getState().reset();
    } catch (err) {
      if (__DEV__) console.log('[PhotoCapture] handleComplete error:', err);
      setErrorMessage('Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <OnboardingScreenShell currentStep={4} totalSteps={4}>
      <ContentArea $isTablet={isTablet}>
        <TopSpacer />
        <ContentGroup>
          <Headline $isTablet={isTablet}>
            Snap a "before"{'\n'}photo.
          </Headline>
          <Subtext $isTablet={isTablet}>
            See how much your lawn improves over the season.
          </Subtext>
          <SpacerCard $isTablet={isTablet} />
          <CameraCard>
            <CameraWell
              onPress={handleComplete}
              disabled={isSubmitting}
              accessibilityRole="button"
              accessibilityLabel="Take a photo of your lawn"
            >
              <CameraIcon>📷</CameraIcon>
              <CameraLabel>Tap to take a photo</CameraLabel>
            </CameraWell>
          </CameraCard>
        </ContentGroup>
        <BottomSpacer />
      </ContentArea>

      <CtaArea $isTablet={isTablet}>
        {errorMessage && <ErrorText>{errorMessage}</ErrorText>}
        <CtaButton
          $isTablet={isTablet}
          $disabled={isSubmitting}
          disabled={isSubmitting}
          onPress={handleComplete}
          accessibilityRole="button"
          accessibilityLabel={isSubmitting ? 'Saving your profile' : 'Skip for now'}
          accessibilityState={{ busy: isSubmitting }}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#D6EFD8" />
          ) : (
            <CtaLabel $isTablet={isTablet}>Skip for now →</CtaLabel>
          )}
        </CtaButton>
      </CtaArea>
    </OnboardingScreenShell>
  );
};
