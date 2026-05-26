import { Image } from 'expo-image';
import { Pressable } from 'react-native';
import styled from 'styled-components/native';

export interface SocialAuthButtonsProps {
  onGooglePress: () => void;
  onApplePress?: () => void;
}

// ButtonsWrapper — horizontal row so Google and Apple sit side-by-side,
// each taking equal width via flex: 1 on SocialButton.
const ButtonsWrapper = styled.View`
  flex-direction: row;
  gap: ${({ theme }) => theme.spacing.sm}px;
  width: 100%;
`;

// SocialButton — one of the two provider buttons. flex: 1 makes each button
// fill half the wrapper row equally regardless of screen width.
const SocialButton = styled(Pressable)`
  flex: 1;
  height: 44px;
  border-radius: ${({ theme }) => theme.radii.md}px;
  border-width: 1px;
  border-color: ${({ theme }) => theme.colors.borderOnDark};
  background-color: ${({ theme }) => theme.colors.buttonSurfaceDark};
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: ${({ theme }) => theme.spacing.xs}px;
`;

// BrandLogo — the provider icon (Google colour mark or Apple white mark).
const BrandLogo = styled(Image)`
  width: 18px;
  height: 18px;
`;

// ButtonLabel — short provider name ("Google" / "Apple") in bold white.
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
