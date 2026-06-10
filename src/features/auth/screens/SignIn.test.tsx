// Tests for SignInScreen — the two-panel OTP sign-in flow.
//
// Panel 1: Email form — user types address, presses "Send code"
// Panel 2: OTP verify panel — user types 6-digit code via hidden input, presses "Sign in"
//
// Both panels are always in the React tree for the slide animation.
// Assertions target state changes (error messages, loading labels, button states).

jest.mock('expo-blur', () => ({ BlurView: 'BlurView' }));
jest.mock('expo-image', () => ({ Image: 'Image' }));
jest.mock('expo-linear-gradient', () => ({ LinearGradient: 'LinearGradient' }));
jest.mock('../../../assets/images/kura-logo.svg', () => 'kura-logo-svg', { virtual: true });
jest.mock('../../../assets/images/google-logo.svg', () => 'google-logo-svg', { virtual: true });
jest.mock('../../../assets/images/apple-logo.svg', () => 'apple-logo-svg', { virtual: true });
jest.mock('../../../../assets/images/mowing-photo.jpg', () => 1, { virtual: true });

// Mock the auth service so tests never hit a real Supabase endpoint.
jest.mock('~/features/auth/services/authService', () => ({
  sendOtpCode: jest.fn(),
  verifyOtpCode: jest.fn(),
}));

// Mock expo-router so the screen can call useLocalSearchParams() without a
// running Expo Router context. Default: no query params (no error in the URL).
jest.mock('expo-router', () => ({
  useLocalSearchParams: jest.fn(() => ({})),
}));

import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import { useLocalSearchParams } from 'expo-router';
import React from 'react';
import { ThemeProvider } from 'styled-components/native';
import { lightTheme } from '~/config/theme';
import { sendOtpCode, verifyOtpCode } from '~/features/auth/services/authService';
import { SignInScreen } from './SignIn';

const mockSendOtpCode = sendOtpCode as jest.Mock;
const mockVerifyOtpCode = verifyOtpCode as jest.Mock;
const mockUseLocalSearchParams = useLocalSearchParams as jest.Mock;

// Wrapper injects the theme so styled-components can read tokens.
const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider theme={lightTheme}>{children}</ThemeProvider>
);

beforeEach(() => {
  jest.clearAllMocks();
  mockSendOtpCode.mockResolvedValue(undefined);
  mockVerifyOtpCode.mockResolvedValue(undefined);
  mockUseLocalSearchParams.mockReturnValue({});
});

describe('SignInScreen', () => {
  it('renders the email input by default', () => {
    const { getByPlaceholderText } = render(<SignInScreen />, { wrapper: Wrapper });
    expect(getByPlaceholderText('Enter Email Address')).toBeTruthy();
  });

  it('shows the OTP verify panel after successfully submitting an email', async () => {
    const { getByPlaceholderText, getByText, getByTestId } = render(<SignInScreen />, { wrapper: Wrapper });
    fireEvent.changeText(getByPlaceholderText('Enter Email Address'), 'hello@kura.com');
    fireEvent.press(getByText('Send code'));

    // Wait for the async handleSubmit to finish and the panel to slide in.
    await waitFor(() => {
      expect(getByText('hello@kura.com')).toBeTruthy();
    });

    expect(mockSendOtpCode).toHaveBeenCalledWith('hello@kura.com');
    // The hidden code input in OtpVerifyPanel should be present.
    expect(getByTestId('otp-code-input')).toBeTruthy();
  });

  it('calls verifyOtpCode with the email and entered code when Sign in is pressed', async () => {
    const { getByPlaceholderText, getByText, getByTestId } = render(<SignInScreen />, { wrapper: Wrapper });

    // Get to the OTP verify panel.
    fireEvent.changeText(getByPlaceholderText('Enter Email Address'), 'hello@kura.com');
    fireEvent.press(getByText('Send code'));
    await waitFor(() => expect(mockSendOtpCode).toHaveBeenCalled());
    // Flush all pending microtasks so handleSubmit's await chain fully settles
    // (setCodeSentAt and the codeSentAt useEffect both run) BEFORE we type the code.
    // Without this, setCodeSentAt fires AFTER our changeText and resets code to ''.
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    // Type a 6-digit code into the hidden input, then wait for the button to
    // become enabled (disabled when code.length < 6, enabled at exactly 6 digits).
    fireEvent.changeText(getByTestId('otp-code-input'), '123456');
    await waitFor(() =>
      expect(getByTestId('otp-verify-button').props.accessibilityState?.disabled).not.toBe(true)
    );
    fireEvent.press(getByTestId('otp-verify-button'));

    await waitFor(() => {
      expect(mockVerifyOtpCode).toHaveBeenCalledWith('hello@kura.com', '123456');
    });
  });

  it('shows a verify error message when verifyOtpCode fails', async () => {
    mockVerifyOtpCode.mockRejectedValue(new Error('Token has expired or is invalid'));

    const { getByPlaceholderText, getByText, getByTestId } = render(<SignInScreen />, { wrapper: Wrapper });
    fireEvent.changeText(getByPlaceholderText('Enter Email Address'), 'hello@kura.com');
    fireEvent.press(getByText('Send code'));
    await waitFor(() => expect(mockSendOtpCode).toHaveBeenCalled());
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    fireEvent.changeText(getByTestId('otp-code-input'), '999999');
    await waitFor(() =>
      expect(getByTestId('otp-verify-button').props.accessibilityState?.disabled).not.toBe(true)
    );
    fireEvent.press(getByTestId('otp-verify-button'));

    await waitFor(() => {
      expect(
        getByText('That code is incorrect or has expired. Try again or request a new one.'),
      ).toBeTruthy();
    });
  });

  it('returns to the email form when "Use a different email" is pressed', async () => {
    const { getByPlaceholderText, getByText } = render(<SignInScreen />, { wrapper: Wrapper });
    fireEvent.changeText(getByPlaceholderText('Enter Email Address'), 'hello@kura.com');
    fireEvent.press(getByText('Send code'));

    await waitFor(() => expect(mockSendOtpCode).toHaveBeenCalled());
    fireEvent.press(getByText('Use a different email'));

    // The email input should be visible again — back to the start state.
    expect(getByPlaceholderText('Enter Email Address')).toBeTruthy();
  });

  it('shows an error message when the OTP send request fails', async () => {
    mockSendOtpCode.mockRejectedValue(new Error('rate limited'));

    const { getByPlaceholderText, getByText } = render(<SignInScreen />, { wrapper: Wrapper });
    fireEvent.changeText(getByPlaceholderText('Enter Email Address'), 'test@example.com');
    fireEvent.press(getByText('Send code'));

    await waitFor(() => {
      expect(getByText('Something went wrong. Please try again.')).toBeTruthy();
    });

    // The raw error must NOT be shown (MASVS-CODE-4, MASWE-0087).
    expect(() => getByText('rate limited')).toThrow();
  });

  it('clears the send error when the user starts typing again', async () => {
    mockSendOtpCode.mockRejectedValue(new Error('oops'));

    const { getByPlaceholderText, getByText, queryByText } = render(<SignInScreen />, { wrapper: Wrapper });
    fireEvent.changeText(getByPlaceholderText('Enter Email Address'), 'bad@example.com');
    fireEvent.press(getByText('Send code'));

    await waitFor(() => {
      expect(getByText('Something went wrong. Please try again.')).toBeTruthy();
    });

    // The moment the user types again the error vanishes.
    fireEvent.changeText(getByPlaceholderText('Enter Email Address'), 'new@example.com');
    expect(queryByText('Something went wrong. Please try again.')).toBeNull();
  });

  it('replaces the button label with a loading indicator while send is in flight', async () => {
    // While sendOtpCode is running, the button's accessibilityLabel changes
    // from 'Send code' to 'Sending code' so screen readers announce the loading state.
    let resolveRequest!: () => void;
    mockSendOtpCode.mockImplementation(
      () => new Promise<void>((resolve) => { resolveRequest = resolve; }),
    );

    const { getByPlaceholderText, getByText, getByLabelText } = render(<SignInScreen />, { wrapper: Wrapper });
    fireEvent.changeText(getByPlaceholderText('Enter Email Address'), 'test@example.com');
    fireEvent.press(getByText('Send code'));

    await waitFor(() => {
      expect(getByLabelText('Sending code')).toBeTruthy();
    });

    // Resolve so Jest can clean up without pending state updates.
    resolveRequest();
  });

  it('shows a link-expired message when the URL has error=link-expired', () => {
    // This handles the case where someone taps an old magic link and gets
    // redirected back to sign-in with ?error=link-expired in the URL.
    mockUseLocalSearchParams.mockReturnValue({ error: 'link-expired' });

    const { getByText } = render(<SignInScreen />, { wrapper: Wrapper });

    expect(getByText('Your link has expired. Please request a new code.')).toBeTruthy();
  });
});
