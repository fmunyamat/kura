jest.mock('expo-blur', () => ({ BlurView: 'BlurView' }));
jest.mock('expo-image', () => ({ Image: 'Image' }));
jest.mock('expo-linear-gradient', () => ({ LinearGradient: 'LinearGradient' }));
jest.mock('../../../assets/images/kura-logo.svg', () => 'kura-logo-svg', { virtual: true });
jest.mock('../../../assets/images/google-logo.svg', () => 'google-logo-svg', { virtual: true });
jest.mock('../../../assets/images/apple-logo.svg', () => 'apple-logo-svg', { virtual: true });
jest.mock('../../../../assets/images/mowing-photo.jpg', () => 1, { virtual: true });

import { fireEvent, render } from '@testing-library/react-native';
import React from 'react';
import { ThemeProvider } from 'styled-components/native';
import { lightTheme } from '~/config/theme';
import { SignInScreen } from './SignIn';

const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider theme={lightTheme}>{children}</ThemeProvider>
);

describe('SignInScreen', () => {
  it('renders the email input by default', () => {
    const { getByPlaceholderText } = render(<SignInScreen />, { wrapper: Wrapper });
    expect(getByPlaceholderText('Enter Email Address')).toBeTruthy();
  });

  it('shows the confirmation panel after submitting an email', () => {
    const { getByPlaceholderText, getByText } = render(<SignInScreen />, { wrapper: Wrapper });
    fireEvent.changeText(getByPlaceholderText('Enter Email Address'), 'hello@kura.com');
    fireEvent.press(getByText('Send magic link'));
    expect(getByText('Check your inbox')).toBeTruthy();
    expect(getByText('hello@kura.com')).toBeTruthy();
  });

  it('returns to the email form when reset link is pressed', () => {
    const { getByPlaceholderText, getByText } = render(<SignInScreen />, { wrapper: Wrapper });
    fireEvent.changeText(getByPlaceholderText('Enter Email Address'), 'hello@kura.com');
    fireEvent.press(getByText('Send magic link'));
    fireEvent.press(getByText('Use a different email'));
    expect(getByPlaceholderText('Enter Email Address')).toBeTruthy();
  });
});
