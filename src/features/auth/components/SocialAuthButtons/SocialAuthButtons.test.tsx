import React from 'react';
import { Platform } from 'react-native';
import { render, fireEvent } from '@testing-library/react-native';
import { ThemeProvider } from 'styled-components/native';
import { lightTheme } from '~/config/theme';
import { SocialAuthButtons } from './SocialAuthButtons';

const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider theme={lightTheme}>{children}</ThemeProvider>
);

describe('SocialAuthButtons', () => {
  it('always renders the Google button', () => {
    const { getByText } = render(
      <SocialAuthButtons onGooglePress={jest.fn()} />,
      { wrapper: Wrapper },
    );
    expect(getByText('Google')).toBeTruthy();
  });

  it('calls onGooglePress when Google button is pressed', () => {
    const onGooglePress = jest.fn();
    const { getByText } = render(
      <SocialAuthButtons onGooglePress={onGooglePress} />,
      { wrapper: Wrapper },
    );
    fireEvent.press(getByText('Google'));
    expect(onGooglePress).toHaveBeenCalledTimes(1);
  });

  describe('on iOS', () => {
    beforeEach(() => {
      Platform.OS = 'ios';
    });

    it('renders the Apple button when onApplePress is provided', () => {
      const { getByText } = render(
        <SocialAuthButtons onGooglePress={jest.fn()} onApplePress={jest.fn()} />,
        { wrapper: Wrapper },
      );
      expect(getByText('Apple')).toBeTruthy();
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

    it('does not render the Apple button when onApplePress is omitted', () => {
      const { queryByText } = render(
        <SocialAuthButtons onGooglePress={jest.fn()} />,
        { wrapper: Wrapper },
      );
      expect(queryByText('Apple')).toBeNull();
    });
  });

  describe('on Android', () => {
    beforeEach(() => {
      Platform.OS = 'android';
    });

    it('does not render the Apple button', () => {
      const { queryByText } = render(
        <SocialAuthButtons onGooglePress={jest.fn()} onApplePress={jest.fn()} />,
        { wrapper: Wrapper },
      );
      expect(queryByText('Apple')).toBeNull();
    });
  });
});
