import { Image } from 'expo-image';
import styled from 'styled-components/native';

export interface SocialAuthButtonsProps {
  onGooglePress: () => void;
  onApplePress: () => void;
}

// ButtonsWrapper — a horizontal row so Google and Apple sit side-by-side,
// each taking equal width. gap keeps them from touching.
const ButtonsWrapper = styled.View`
  flex-direction: row;
  gap: ${({ theme }) => theme.spacing.sm}px;
`;

// SocialButton — flex: 1 makes each button claim half the available row width.
// The glass-compatible background matches the card surface without being opaque.
const SocialButton = styled.TouchableOpacity`
  flex: 1;
  height: 44px;
  border-radius: ${({ theme }) => theme.radii.md}px;
  border-width: 1px;
  border-color: ${({ theme }) => theme.colors.borderOnDark};
  background-color: ${({ theme }) => theme.colors.inputBackgroundDark};
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: ${({ theme }) => theme.spacing.xs}px;
`;

// BrandLogo — the provider's logo icon. Size comes from theme.iconSizes.sm so
// that all inline brand icons stay consistent if the token is ever updated.
const BrandLogo = styled(Image)`
  width: ${({ theme }) => theme.iconSizes.sm}px;
  height: ${({ theme }) => theme.iconSizes.sm}px;
`;

// ButtonLabel — the provider name next to the logo. Shortened to single words
// ("Google" / "Apple") because the horizontal layout is narrower than the
// previous stacked layout and the full "Continue with…" label won't fit.
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
      activeOpacity={0.75}
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
      activeOpacity={0.75}
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
