import { Image } from 'expo-image';
import { Platform, Pressable } from 'react-native';
import styled from 'styled-components/native';

export interface SocialAuthButtonsProps {
  onGooglePress: () => void;
  // onApplePress is optional — Apple Sign-In is only available on iOS, so
  // Android callers don't need to supply a handler at all.
  onApplePress?: () => void;
  isTablet?: boolean;
}

// ButtonsWrapper — horizontal row so Google and Apple sit side-by-side,
// each taking equal width via flex: 1 on SocialButton.
const ButtonsWrapper = styled.View`
  flex-direction: row;
  gap: ${({ theme }) => theme.spacing.sm}px;
  width: 100%;
`;

// SocialButton — provider button. Uses the same faint white well + hairline
// border as the email input so all secondary controls on the clear glass pane
// read as one consistent material; only the lime submit button stands apart.
const SocialButton = styled(Pressable)<{ $isTablet: boolean }>`
  flex: 1;
  height: ${({ $isTablet }) => ($isTablet ? 54 : 44)}px;
  border-radius: ${({ theme }) => theme.radii.md}px;
  background-color: ${({ theme }) => theme.colors.glassClearInput};
  border-width: 1px;
  border-color: ${({ theme }) => theme.colors.glassClearInputBorder};
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

// ButtonLabel — white text to match the email input, since the clear glass
// pane sits over a dark photo. In React Native, custom fonts require the bold
// variant by name — font-weight alone is ignored.
const ButtonLabel = styled.Text`
  font-family: ${({ theme }) => theme.typography.fontBodyBold};
  font-size: ${({ theme }) => theme.typography.sizeSm}px;
  color: ${({ theme }) => theme.colors.textOnDark};
`;

// SocialAuthButtons — Google always renders; Apple only appears on iOS where
// Sign in with Apple is available. Both buttons share equal width in the row.
export const SocialAuthButtons = ({
  onGooglePress,
  onApplePress,
  isTablet = false,
}: SocialAuthButtonsProps) => (
  <ButtonsWrapper>
    <SocialButton
      $isTablet={isTablet}
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
        $isTablet={isTablet}
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
