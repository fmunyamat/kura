import { Image } from 'expo-image';
import React from 'react';
import { useWindowDimensions } from 'react-native';
import styled from 'styled-components/native';

const HeroContainer = styled.View<{ $isTablet: boolean }>
`
    flex: 2;
    align-items: center;
    justify-content: center;
    background-color: ${({ theme }) => theme.colors.screenDark};
    padding-bottom: ${({ $isTablet }) => ($isTablet ? 72 : 57.6)}px;
`;

const LogoImage = styled(Image)<{ $isTablet: boolean }>
`
    width: ${({ $isTablet }) => ($isTablet ? 150 : 120)}px;
    height: ${({ $isTablet }) => ($isTablet ? 150 : 120)}px;
    margin-top: ${({ $isTablet }) => ($isTablet ? 40 : 32)}px;
`;

const Wordmark = styled.Text<{ $isTablet: boolean }>
`
    color: ${({ theme }) => theme.colors.background};
    font-size: ${({ $isTablet, theme }) => ($isTablet ? theme.typography.size2xl : theme.typography.size2xl * 0.8)}px;
    font-weight: ${({ theme }) => theme.typography.weightBlack};
    letter-spacing: -1px;
    margin-top: ${({ theme }) => theme.spacing.xs}px;
`;

const Tagline = styled.Text<{ $isTablet: boolean }>
`
    color: ${({ theme }) => theme.colors.lime};
    font-size: ${({ $isTablet, theme }) => ($isTablet ? theme.typography.sizeSm : theme.typography.sizeSm * 0.8)}px;
    font-weight: ${({ theme }) => theme.typography.weightBold};
    text-transform: uppercase;
    letter-spacing: 2px;
    margin-top: ${({ theme }) => theme.spacing.xs}px;
`;

export const HeroSection: React.FC = () => {
    const { width, height } = useWindowDimensions();
    const isTablet = Math.min(width, height) >= 600;

    return (
        <HeroContainer $isTablet={isTablet}>
            <LogoImage
                $isTablet={isTablet}
                testID="kura-logo"
                accessibilityLabel="Kura logo"
                source={require('../../../../../assets/images/kura-logo.svg')}
                contentFit="contain"
            />
            <Wordmark $isTablet={isTablet}>kura</Wordmark>
            <Tagline $isTablet={isTablet}>Lawn care, simplified</Tagline>
        </HeroContainer>
    );
};
