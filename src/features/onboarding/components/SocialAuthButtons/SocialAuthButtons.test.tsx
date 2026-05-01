import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ThemeProvider } from 'styled-components/native';
import { lightTheme } from '~/config/theme';
import { SocialAuthButtons } from './SocialAuthButtons.ios';

const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider theme={lightTheme}>{children}</ThemeProvider>
);

describe('SocialAuthButtons (iOS)', () => {
  it('renders the Google button', () => {
    const { getByText } = render(
      <SocialAuthButtons onGooglePress={jest.fn()} onApplePress={jest.fn()} />,
      { wrapper: Wrapper },
    );
    expect(getByText('Google')).toBeTruthy();
  });

  it('renders the Apple button', () => {
    const { getByText } = render(
      <SocialAuthButtons onGooglePress={jest.fn()} onApplePress={jest.fn()} />,
      { wrapper: Wrapper },
    );
    expect(getByText('Apple')).toBeTruthy();
  });

  it('calls onGooglePress when Google button is pressed', () => {
    const onGooglePress = jest.fn();
    const { getByText } = render(
      <SocialAuthButtons onGooglePress={onGooglePress} onApplePress={jest.fn()} />,
      { wrapper: Wrapper },
    );
    fireEvent.press(getByText('Google'));
    expect(onGooglePress).toHaveBeenCalledTimes(1);
  });

  it('calls onApplePress when Apple button is pressed', () => {
    const onApplePress = jest.fn();
    const { getByText } = render(
      <SocialAuthButtons onGooglePress={jest.fn()} onApplePress={onApplePress} />,
      { wrapper: Wrapper },
    );
    fireEvent.press(getByText('Apple'));
    expect(onApplePress).toHaveBeenCalledTimes(1);
  });
});
