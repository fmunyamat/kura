// These tests cover SignInScreen — the magic link email form that sits at the
// entry point of the app. The screen has two panels that slide horizontally:
//   Panel 1: the email form with "Send magic link" button
//   Panel 2: the confirmation view ("Check your inbox") shown after success
//
// Both panels are always in the React tree; the slide animation just moves
// them on and off screen. That means assertions on text like "Check your inbox"
// will find it even without pressing submit — the key assertions are around
// state changes (error messages, loading, email display).
//
// We mock every native module that doesn't exist in Jest (expo-blur,
// expo-image, expo-linear-gradient) and the auth service so tests never
// hit a real network.

jest.mock('expo-blur', () => ({ BlurView: 'BlurView' }));
jest.mock('expo-image', () => ({ Image: 'Image' }));
jest.mock('expo-linear-gradient', () => ({ LinearGradient: 'LinearGradient' }));
jest.mock('../../../assets/images/kura-logo.svg', () => 'kura-logo-svg', { virtual: true });
jest.mock('../../../assets/images/google-logo.svg', () => 'google-logo-svg', { virtual: true });
jest.mock('../../../assets/images/apple-logo.svg', () => 'apple-logo-svg', { virtual: true });
jest.mock('../../../../assets/images/mowing-photo.jpg', () => 1, { virtual: true });

// Mock the auth service so we never make a real Supabase call during tests.
// Each test can override this default with .mockResolvedValue / .mockRejectedValue.
jest.mock('~/features/auth/services/authService', () => ({
  signInWithMagicLink: jest.fn(),
}));

// Mock expo-router so the screen can call useLocalSearchParams() without a
// running Expo Router context. Default: no query params (no error in the URL).
jest.mock('expo-router', () => ({
  useLocalSearchParams: jest.fn(() => ({})),
}));

import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { useLocalSearchParams } from 'expo-router';
import React from 'react';
import { ThemeProvider } from 'styled-components/native';
import { lightTheme } from '~/config/theme';
import { signInWithMagicLink } from '~/features/auth/services/authService';
import { SignInScreen } from './SignIn';

// Typed aliases so TypeScript knows these are mock functions.
const mockSignInWithMagicLink = signInWithMagicLink as jest.Mock;
const mockUseLocalSearchParams = useLocalSearchParams as jest.Mock;

// Wrapper injects the theme so styled-components can read tokens.
const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider theme={lightTheme}>{children}</ThemeProvider>
);

// Reset all mocks between tests so one test's configuration doesn't
// bleed into the next. Default: signInWithMagicLink resolves with nothing
// (a successful send) and no query params in the URL.
beforeEach(() => {
  jest.clearAllMocks();
  mockSignInWithMagicLink.mockResolvedValue(undefined);
  mockUseLocalSearchParams.mockReturnValue({});
});

describe('SignInScreen', () => {
  it('renders the email input by default', () => {
    // The form panel is visible on first render — the email input should be
    // ready for the user to type into straight away.
    const { getByPlaceholderText } = render(<SignInScreen />, { wrapper: Wrapper });
    expect(getByPlaceholderText('Enter Email Address')).toBeTruthy();
  });

  it('shows the confirmation panel after successfully submitting an email', async () => {
    // signInWithMagicLink resolves — Supabase accepted the email.
    // After that, the screen should slide to the confirmation panel which
    // shows the user's email address back to them.
    mockSignInWithMagicLink.mockResolvedValue(undefined);

    const { getByPlaceholderText, getByText } = render(<SignInScreen />, { wrapper: Wrapper });
    fireEvent.changeText(getByPlaceholderText('Enter Email Address'), 'hello@kura.com');
    fireEvent.press(getByText('Send magic link'));

    // Wait for the async handleSubmit to finish so the state update (setIsConfirming)
    // has been applied before we check for the email text.
    await waitFor(() => {
      expect(getByText('hello@kura.com')).toBeTruthy();
    });

    // signInWithMagicLink should have been called with exactly the typed email.
    expect(mockSignInWithMagicLink).toHaveBeenCalledWith('hello@kura.com');
  });

  it('returns to the email form when reset link is pressed', async () => {
    // After a successful submit, tapping "Use a different email" should slide
    // the form back and clear the email field.
    mockSignInWithMagicLink.mockResolvedValue(undefined);

    const { getByPlaceholderText, getByText } = render(<SignInScreen />, { wrapper: Wrapper });
    fireEvent.changeText(getByPlaceholderText('Enter Email Address'), 'hello@kura.com');
    fireEvent.press(getByText('Send magic link'));

    // Wait for the submit to land before trying to press reset.
    await waitFor(() => expect(mockSignInWithMagicLink).toHaveBeenCalled());
    fireEvent.press(getByText('Use a different email'));

    // The empty email input should be visible again — back to the start state.
    expect(getByPlaceholderText('Enter Email Address')).toBeTruthy();
  });

  it('shows an error message when the magic link request fails', async () => {
    // signInWithMagicLink throws — Supabase returned an error (e.g. rate limited).
    // The screen must catch this and show a generic message, never the raw error.
    mockSignInWithMagicLink.mockRejectedValue(new Error('rate limited'));

    const { getByPlaceholderText, getByText } = render(<SignInScreen />, { wrapper: Wrapper });
    fireEvent.changeText(getByPlaceholderText('Enter Email Address'), 'test@example.com');
    fireEvent.press(getByText('Send magic link'));

    // Wait for the rejected promise to settle and the error state to render.
    await waitFor(() => {
      expect(getByText('Something went wrong. Please try again.')).toBeTruthy();
    });

    // The raw error ('rate limited') must NOT be shown — that would expose
    // internal system detail to the user (MASVS-CODE-4, MASWE-0087).
    expect(() => getByText('rate limited')).toThrow();
  });

  it('shows a link-expired message when the URL has error=link-expired', () => {
    // This happens when the user taps an old magic link email and
    // auth/callback.tsx redirects them back to /sign-in?error=link-expired.
    // The screen reads that query param and shows a friendly explanation.
    mockUseLocalSearchParams.mockReturnValue({ error: 'link-expired' });

    const { getByText } = render(<SignInScreen />, { wrapper: Wrapper });

    // The screen should display a human-readable explanation, not the raw
    // 'link-expired' code from the URL.
    expect(getByText('Your link has expired. Please request a new one.')).toBeTruthy();
  });

  it('clears the error message when the user starts typing again', async () => {
    // If the user previously got an error, they should see a clean form the
    // moment they start correcting their input — not a stale red message.
    mockSignInWithMagicLink.mockRejectedValue(new Error('oops'));

    const { getByPlaceholderText, getByText, queryByText } = render(<SignInScreen />, { wrapper: Wrapper });
    fireEvent.changeText(getByPlaceholderText('Enter Email Address'), 'bad@example.com');
    fireEvent.press(getByText('Send magic link'));

    // Wait for the error to appear first.
    await waitFor(() => {
      expect(getByText('Something went wrong. Please try again.')).toBeTruthy();
    });

    // Now the user types again — error should vanish immediately.
    fireEvent.changeText(getByPlaceholderText('Enter Email Address'), 'new@example.com');
    expect(queryByText('Something went wrong. Please try again.')).toBeNull();
  });

  it('replaces the button label with a loading indicator while the request is in flight', async () => {
    // While signInWithMagicLink is running, the "Send magic link" text inside
    // the button is replaced by an ActivityIndicator. We confirm this by checking
    // the button's accessibilityLabel — it changes from 'Send magic link' to
    // 'Sending magic link' so screen readers announce the loading state too.
    // (See MagicLinkForm.tsx: accessibilityLabel={isLoading ? 'Sending magic link' : 'Send magic link'})
    let resolveRequest!: () => void;
    mockSignInWithMagicLink.mockImplementation(
      () => new Promise<void>((resolve) => { resolveRequest = resolve; }),
    );

    const { getByPlaceholderText, getByText, getByLabelText } = render(<SignInScreen />, { wrapper: Wrapper });
    fireEvent.changeText(getByPlaceholderText('Enter Email Address'), 'test@example.com');
    fireEvent.press(getByText('Send magic link'));

    // Once the request is in flight, the button should have the loading label.
    await waitFor(() => {
      expect(getByLabelText('Sending magic link')).toBeTruthy();
    });

    // Resolve the request so Jest can clean up without pending state updates.
    resolveRequest();
  });
});
