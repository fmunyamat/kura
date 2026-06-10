import { Image } from 'expo-image';
import { Platform, Pressable } from 'react-native';
import styled from 'styled-components/native';

export interface SocialAuthButtonsProps {
  onGooglePress: () => void;
  // onApplePress is optional — Apple Sign-In is only available on iOS, so
  // Android callers don't need to supply a handler at all.
  onApplePress?: () => void;
}

// ButtonsWrapper — horizontal row so Google and Apple sit side-by-side,
// each taking equal width via flex: 1 on SocialButton.
const ButtonsWrapper = styled.View`
  flex-direction: row;
  gap: ${({ theme }) => theme.spacing.sm}px;
  width: 100%;
`;

// SocialButton — provider button. Dark well background and white border match
// the input style on the frosted card: dark recess on a semi-transparent white
// surface. rgba(0,0,0,0.10) background pairs with the email input well.
const SocialButton = styled(Pressable)`
  flex: 1;
  height: 44px;
  border-radius: ${({ theme }) => theme.radii.md}px;
  background-color: rgba(223, 223, 223, 0.55);
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

// ButtonLabel — provider name in JetBrains Mono Bold. In React Native, custom
// fonts require the bold variant by name — font-weight alone is ignored.
const ButtonLabel = styled.Text`
  font-family: ${({ theme }) => theme.typography.fontBodyBold};
  font-size: ${({ theme }) => theme.typography.sizeSm}px;
  color: rgba(255, 255, 255, 0.85);
`;

// SocialAuthButtons — Google always renders; Apple only appears on iOS where
// Sign in with Apple is available. Both buttons share equal width in the row.
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

    {Platform.OS === 'ios' && onApplePress && (
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
    )}
  </ButtonsWrapper>
);
