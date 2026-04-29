import React from 'react';
import styled from 'styled-components/native';

export interface SocialAuthButtonsProps {
  onGooglePress: () => void;
  onApplePress: () => void;
}

const ButtonsWrapper = styled.View`
  gap: ${({ theme }) => theme.spacing.sm}px;
`;

const SocialButton = styled.TouchableOpacity`
  height: 44px;
  border-radius: ${({ theme }) => theme.radii.md}px;
  border-width: 1px;
  border-color: ${({ theme }) => theme.colors.border};
  background-color: ${({ theme }) => theme.colors.background};
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: ${({ theme }) => theme.spacing.xs}px;
`;

const ButtonLabel = styled.Text`
  font-size: ${({ theme }) => theme.typography.sizeSm}px;
  font-weight: ${({ theme }) => theme.typography.weightBold};
  color: ${({ theme }) => theme.colors.text};
`;

const GoogleDot = styled.View`
  width: 14px;
  height: 14px;
  border-radius: 7px;
  background-color: ${({ theme }) => theme.colors.googleBrand};
`;

const AppleDot = styled.View`
  width: 14px;
  height: 14px;
  border-radius: 7px;
  background-color: ${({ theme }) => theme.colors.appleBrand};
`;

export const SocialAuthButtons: React.FC<SocialAuthButtonsProps> = ({
  onGooglePress,
  onApplePress,
}) => (
  <ButtonsWrapper>
    <SocialButton
      onPress={onGooglePress}
      activeOpacity={0.75}
      accessibilityLabel="Continue with Google"
      accessibilityRole="button"
    >
      <GoogleDot />
      <ButtonLabel>Continue with Google</ButtonLabel>
    </SocialButton>
    <SocialButton
      onPress={onApplePress}
      activeOpacity={0.75}
      accessibilityLabel="Continue with Apple"
      accessibilityRole="button"
    >
      <AppleDot />
      <ButtonLabel>Continue with Apple</ButtonLabel>
    </SocialButton>
  </ButtonsWrapper>
);
