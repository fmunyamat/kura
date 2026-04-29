jest.mock('expo-image', () => ({ Image: 'Image' }));
jest.mock('expo-linear-gradient', () => ({ LinearGradient: 'LinearGradient' }));
jest.mock('../../../../../assets/images/kura-logo.svg', () => 'kura-logo-svg', { virtual: true });

import React from 'react';
import { render } from '@testing-library/react-native';
import { ThemeProvider } from 'styled-components/native';
import { lightTheme } from '~/config/theme';
import { HeroSection } from './HeroSection';

const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider theme={lightTheme}>{children}</ThemeProvider>
);

describe('HeroSection', () => {
  it('renders the wordmark', () => {
    const { getByText } = render(<HeroSection />, { wrapper: Wrapper });
    expect(getByText('kura')).toBeTruthy();
  });

  it('renders the tagline', () => {
    const { getByText } = render(<HeroSection />, { wrapper: Wrapper });
    expect(getByText('Lawn care, simplified')).toBeTruthy();
  });

  it('renders the logo image', () => {
    const { getByTestId } = render(<HeroSection />, { wrapper: Wrapper });
    expect(getByTestId('kura-logo')).toBeTruthy();
  });
});
