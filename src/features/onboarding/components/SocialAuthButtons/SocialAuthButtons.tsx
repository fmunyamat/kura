import { Image } from 'expo-image';
import styled from 'styled-components/native';

export interface SocialAuthButtonsProps {
  onGooglePress: () => void;
  onApplePress?: () => void;
}

const ButtonsWrapper = styled.View
`
  gap: ${({ theme }) => theme.spacing.sm}px;
`;

const SocialButton = styled.TouchableOpacity
`
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

const BrandLogo = styled(Image)
`
    width: 18px;
    height: 18px;
`;

const ButtonLabel = styled.Text
`
    font-size: ${({ theme }) => theme.typography.sizeSm}px;
    font-weight: ${({ theme }) => theme.typography.weightBold};
    color: ${({ theme }) => theme.colors.textOnDark};
`;

export const SocialAuthButtons = ({
  onGooglePress,
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
            <ButtonLabel>Sign in with Google</ButtonLabel>
        </SocialButton>
    </ButtonsWrapper>
);
