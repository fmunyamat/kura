import { useState } from 'react';
import { Pressable } from 'react-native';
import styled from 'styled-components/native';
import { useAuthStore } from '~/features/auth/stores/authStore';
import { OnboardingScreenShell } from '~/features/onboarding/components/OnboardingScreenShell';
import { CtaButton } from '~/shared/components/CtaButton';
import {
  BottomSpacer,
  ContentArea,
  ContentGroup,
  CtaArea,
  GapSpacer,
  TopSpacer,
} from '~/shared/components/ScreenLayout';
import { ScreenHeadline, ScreenSubtext } from '~/shared/components/ScreenTypography';
import { upsertUserProfile } from '../services/onboardingService';
import { useOnboardingStore } from '../stores/onboardingStore';

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

// PhotoCapture — the final onboarding step. The user takes a "before" photo
// of their lawn to anchor the progress timeline.
// Skipping is allowed — they can take the photo later from the Progress tab.
// Both paths (take photo + skip) call handleComplete to write user_profiles,
// which is what signals the app to route to the home tabs on next render.
// Layout, headline, subtext, and the CTA all come from the shared screen
// components.
export const PhotoCapture = () => {
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
      <ContentArea>
        <TopSpacer />
        <ContentGroup>
          <ScreenHeadline size="title">
            Snap a "before"{'\n'}photo.
          </ScreenHeadline>
          <ScreenSubtext>
            See how much your lawn improves over the season.
          </ScreenSubtext>
          <GapSpacer />
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

      <CtaArea>
        {errorMessage && <ErrorText>{errorMessage}</ErrorText>}
        <CtaButton
          label="Skip for now →"
          onPress={handleComplete}
          isLoading={isSubmitting}
          accessibilityLabel={isSubmitting ? 'Saving your profile' : 'Skip for now'}
        />
      </CtaArea>
    </OnboardingScreenShell>
  );
};
