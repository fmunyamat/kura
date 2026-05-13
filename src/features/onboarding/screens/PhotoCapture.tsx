import { router } from 'expo-router';
import styled from 'styled-components/native';
import { OnboardingLayout } from '~/features/onboarding/components/OnboardingLayout';

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

// PrimaryButton — "Take photo" CTA.
const PrimaryButton = styled.TouchableOpacity`
  background-color: ${({ theme }) => theme.colors.gradientMidLight};
  border-radius: ${({ theme }) => theme.radii.md}px;
  padding: ${({ theme }) => theme.spacing.md}px;
  align-items: center;
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

// PhotoCapture — the final onboarding step. The user takes a "before"
// photo of their lawn to anchor the progress timeline.
// Skipping is allowed — they can take the photo later from the Progress tab.
// Camera integration and permission handling will be wired up when the
// service layer is added. For now the buttons navigate directly.
export const PhotoCapture = () => {
  const handleTakePhoto = () => {
    // Placeholder: camera capture and service call will be added in the next phase.
    router.replace('/(tabs)');
  };

  const handleSkip = () => {
    router.replace('/(tabs)');
  };

  return (
    <OnboardingLayout
      heroIcon="📸"
      stepLabel="Step 4 of 4"
      title='Snap a "before" photo'
      subtitle="See how much your lawn improves over the season."
    >
      <CameraWell
        onPress={handleTakePhoto}
        accessibilityRole="button"
        accessibilityLabel="Take a photo of your lawn"
      >
        <CameraIcon>📷</CameraIcon>
        <CameraLabel>Tap to take a photo of your lawn</CameraLabel>
      </CameraWell>

      <PrimaryButton
        onPress={handleTakePhoto}
        accessibilityRole="button"
        accessibilityLabel="Take photo"
      >
        <ButtonText>Take photo</ButtonText>
      </PrimaryButton>

      <SkipLink
        onPress={handleSkip}
        accessibilityRole="button"
        accessibilityLabel="Skip for now"
      >
        <SkipText>Skip for now</SkipText>
      </SkipLink>
    </OnboardingLayout>
  );
};
