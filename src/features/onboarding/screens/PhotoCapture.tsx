import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator } from 'react-native';
import styled from 'styled-components/native';
import { useAuthStore } from '~/features/auth/stores/authStore';
import { OnboardingLayout } from '~/features/onboarding/components/OnboardingLayout';

import { createUserProfile } from '../services/onboardingService';
import { useOnboardingStore } from '../stores/onboardingStore';

// CameraWell — the tappable area that will launch the camera.
// Approximates a dashed-border well using a semi-transparent background
// since React Native doesn't support native dashed borders on views.
const CameraWell = styled.TouchableOpacity`
  background-color: ${({ theme }) => theme.colors.glassOnboardingInput};
  border-radius: ${({ theme }) => theme.radii.md}px;
  padding: ${({ theme }) => theme.spacing.xl}px;
  align-items: center;
  justify-content: center;
  gap: ${({ theme }) => theme.spacing.xs}px;
`;

// CameraIcon — the large camera emoji centred in the well.
const CameraIcon = styled.Text`
  font-size: ${({ theme }) => theme.typography.size2xl}px;
`;

// CameraLabel — the instruction text below the camera icon.
const CameraLabel = styled.Text`
  font-size: ${({ theme }) => theme.typography.sizeSm}px;
  color: ${({ theme }) => theme.colors.textMutedOnGlass};
`;

// PrimaryButton — "Take photo" CTA. Opacity drops while the profile is being saved
// so it's clear the button is not interactive during submission.
const PrimaryButton = styled.TouchableOpacity<{ $disabled: boolean }>`
  background-color: ${({ theme }) => theme.colors.gradientMidLight};
  border-radius: ${({ theme }) => theme.radii.md}px;
  padding: ${({ theme }) => theme.spacing.md}px;
  align-items: center;
  opacity: ${({ $disabled }) => ($disabled ? 0.6 : 1)};
`;

const ButtonText = styled.Text`
  font-size: ${({ theme }) => theme.typography.sizeMd}px;
  font-weight: ${({ theme }) => theme.typography.weightBold};
  color: ${({ theme }) => theme.colors.white};
`;

// SkipLink — secondary link beneath the button to skip photo capture.
const SkipLink = styled.TouchableOpacity`
  align-items: center;
  padding: ${({ theme }) => theme.spacing.xs}px;
`;

const SkipText = styled.Text`
  font-size: ${({ theme }) => theme.typography.sizeSm}px;
  color: ${({ theme }) => theme.colors.textMutedOnGlass};
  text-decoration-line: underline;
`;

// ErrorText — shown below the buttons if the profile INSERT fails. Uses the
// errorOnDark token so it's readable against the glass panel background.
const ErrorText = styled.Text`
  font-size: ${({ theme }) => theme.typography.sizeSm}px;
  color: ${({ theme }) => theme.colors.errorOnDark};
  text-align: center;
`;

// PhotoCapture — the final onboarding step. The user takes a "before" photo
// of their lawn to anchor the progress timeline.
// Skipping is allowed — they can take the photo later from the Progress tab.
// Camera integration and permission handling will be wired up separately.
// Both paths (take photo + skip) call handleComplete to write user_profiles,
// which is what signals the app to route to the home tabs on next render.
export const PhotoCapture = () => {
  const user = useAuthStore((state) => state.user);
  const { zipCode, lawnSize, grassType, effortLevel } = useOnboardingStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // handleComplete — writes the user_profiles row to Supabase, which flips
  // hasCompletedOnboarding to true. On success, we update the Zustand auth
  // store immediately so the routing guard re-renders without waiting for
  // another onAuthStateChange event, then reset the onboarding store and
  // navigate to the home tabs.
  //
  // On failure, we show a generic message — never the raw Supabase error
  // (MAVSV-CODE-4, MASWE-0087).
  const handleComplete = async () => {
    if (isSubmitting || !user || !lawnSize || !grassType || !effortLevel) return;

    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      await createUserProfile({
        userId: user.id,
        zipCode,
        lawnSize,
        grassType,
        effortLevel,
      });

      // Update auth store directly so the routing guard sees hasCompletedOnboarding
      // = true on the next render without waiting for an onAuthStateChange event.
      useAuthStore.getState().setHasCompletedOnboarding(true);
      useOnboardingStore.getState().reset();
      router.replace('/');
    } catch {
      setErrorMessage('Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <OnboardingLayout
      heroIcon="📸"
      stepLabel="Step 4 of 4"
      title='Snap a "before" photo'
      subtitle="See how much your lawn improves over the season."
    >
      <CameraWell
        onPress={handleComplete}
        disabled={isSubmitting}
        accessibilityRole="button"
        accessibilityLabel="Take a photo of your lawn"
      >
        <CameraIcon>📷</CameraIcon>
        <CameraLabel>Tap to take a photo of your lawn</CameraLabel>
      </CameraWell>

      <PrimaryButton
        $disabled={isSubmitting}
        onPress={handleComplete}
        disabled={isSubmitting}
        accessibilityRole="button"
        accessibilityLabel={isSubmitting ? 'Saving your profile' : 'Take photo'}
      >
        {isSubmitting ? (
          <ActivityIndicator color="white" />
        ) : (
          <ButtonText>Take photo</ButtonText>
        )}
      </PrimaryButton>

      {errorMessage && <ErrorText>{errorMessage}</ErrorText>}

      <SkipLink
        onPress={handleComplete}
        disabled={isSubmitting}
        accessibilityRole="button"
        accessibilityLabel="Skip for now"
      >
        <SkipText>Skip for now</SkipText>
      </SkipLink>
    </OnboardingLayout>
  );
};
