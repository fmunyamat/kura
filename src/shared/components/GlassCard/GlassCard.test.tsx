jest.mock('expo-blur', () => ({ BlurView: 'BlurView' }));

import React from 'react';
import { Text } from 'react-native';
import { render } from '@testing-library/react-native';
import { ThemeProvider } from 'styled-components/native';
import { lightTheme } from '~/config/theme';
import { GlassCard } from './GlassCard';

const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider theme={lightTheme}>{children}</ThemeProvider>
);

describe('GlassCard', () => {
  it('renders children inside the blur card', () => {
    const { getByText } = render(
      <GlassCard><Text>hello</Text></GlassCard>,
      { wrapper: Wrapper }
    );
    expect(getByText('hello')).toBeTruthy();
  });
});
