import React from 'react';
import styled from 'styled-components/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { lightTheme } from '~/config/theme';

const HERO_COLORS = [
  lightTheme.colors.gradientDark,
  lightTheme.colors.gradientMid,
  lightTheme.colors.gradientMidLight,
  lightTheme.colors.primary,
  lightTheme.colors.gradientLight,
] as const;
const FADE_COLORS = [
  'rgba(255,255,255,0)',
  'rgba(255,255,255,0.08)',
  'rgba(255,255,255,0.25)',
  'rgba(255,255,255,0.55)',
  'rgba(255,255,255,0.82)',
  'rgba(255,255,255,1)',
] as const;
const FADE_LOCATIONS = [0, 0.2, 0.4, 0.6, 0.8, 1] as const;

const HeroGradient = styled(LinearGradient)`
  flex: 2;
  align-items: center;
  justify-content: flex-start;
  padding-top: 20px;
  padding-bottom: 64px;
`;

const FadeOverlay = styled(LinearGradient)`
  position: absolute;
  bottom: 0px;
  left: 0px;
  right: 0px;
  height: 56px;
`;

const LogoImage = styled(Image)`
  width: 38px;
  height: 38px;
`;

const Wordmark = styled.Text`
  color: ${({ theme }) => theme.colors.background};
  font-size: 17px;
  font-weight: ${({ theme }) => theme.typography.weightBlack};
  letter-spacing: -0.8px;
  margin-top: 2px;
`;

const Tagline = styled.Text`
  color: ${({ theme }) => theme.colors.lime};
  font-size: 6.5px;
  font-weight: ${({ theme }) => theme.typography.weightBold};
  text-transform: uppercase;
  letter-spacing: 1.1px;
  margin-top: 2px;
`;

export const HeroSection: React.FC = () => (
  <HeroGradient
    colors={HERO_COLORS}
    start={{ x: 0.1, y: 0 }}
    end={{ x: 0.9, y: 1 }}
  >
    <LogoImage
      testID="kura-logo"
      accessibilityLabel="Kura logo"
      source={require('../../../../../assets/images/kura-logo.svg')}
      contentFit="contain"
    />
    <Wordmark>kura</Wordmark>
    <Tagline>Lawn care, simplified</Tagline>
    <FadeOverlay
      colors={FADE_COLORS}
      locations={FADE_LOCATIONS}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      pointerEvents="none"
    />
  </HeroGradient>
);
