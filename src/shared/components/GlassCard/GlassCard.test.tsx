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

  // Verify that passing a custom intensity value does not cause an error.
  // The BlurView mock is a string component so we cannot inspect the prop
  // directly, but if the intensity prop were rejected or caused a crash this
  // test would throw and fail.
  it('renders without error when a custom intensity is supplied', () => {
    expect(() =>
      render(
        <GlassCard intensity={30}><Text>custom intensity</Text></GlassCard>,
        { wrapper: Wrapper }
      )
    ).not.toThrow();
  });
});
