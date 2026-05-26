jest.mock('@shopify/react-native-skia', () => ({
  Canvas: 'Canvas',
  BackdropBlur: 'BackdropBlur',
  Fill: 'Fill',
}));

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
  it('renders children inside the glass card', () => {
    const { getByText } = render(
      <GlassCard><Text>hello</Text></GlassCard>,
      { wrapper: Wrapper }
    );
    expect(getByText('hello')).toBeTruthy();
  });

  // Verify that passing a custom blur sigma does not cause an error.
  it('renders without error when a custom blur value is supplied', () => {
    expect(() =>
      render(
        <GlassCard blur={20}><Text>custom blur</Text></GlassCard>,
        { wrapper: Wrapper }
      )
    ).not.toThrow();
  });
});
