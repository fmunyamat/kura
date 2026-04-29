jest.mock('expo-image', () => ({ Image: 'Image' }));
jest.mock('expo-linear-gradient', () => ({ LinearGradient: 'LinearGradient' }));
jest.mock('../../../assets/images/kura-logo.svg', () => 'kura-logo-svg', { virtual: true });

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ThemeProvider } from 'styled-components/native';
import { lightTheme } from '~/config/theme';
import { SignInScreen } from './SignInScreen';

const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider theme={lightTheme}>{children}</ThemeProvider>
);

describe('SignInScreen', () => {
  it('renders the email input by default', () => {
    const { getByPlaceholderText } = render(<SignInScreen />, { wrapper: Wrapper });
    expect(getByPlaceholderText('you@example.com')).toBeTruthy();
  });

  it('shows the confirmation panel after submitting an email', () => {
    const { getByPlaceholderText, getByText } = render(<SignInScreen />, { wrapper: Wrapper });
    fireEvent.changeText(getByPlaceholderText('you@example.com'), 'hello@kura.com');
    fireEvent.press(getByText('Send magic link'));
    expect(getByText('Check your inbox')).toBeTruthy();
    expect(getByText('hello@kura.com')).toBeTruthy();
  });

  it('returns to the email form when reset link is pressed', () => {
    const { getByPlaceholderText, getByText } = render(<SignInScreen />, { wrapper: Wrapper });
    fireEvent.changeText(getByPlaceholderText('you@example.com'), 'hello@kura.com');
    fireEvent.press(getByText('Send magic link'));
    fireEvent.press(getByText('Use a different email'));
    expect(getByPlaceholderText('you@example.com')).toBeTruthy();
  });
});
