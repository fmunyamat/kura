// These tests cover the routing guard in (auth)/_layout.tsx — the layout that
// wraps the sign-in screen. Its one job is: if the user already has a session,
// skip sign-in and send them straight to the app. If not, show sign-in normally.
//
// We mock expo-router so we can assert on WHERE the layout tries to navigate
// without needing a full running Expo Router context (which doesn't exist in Jest).
// The fake Redirect component just renders text like "redirect:/" so our test
// can read it and confirm the layout is trying to go to the right place.
jest.mock('expo-router', () => {
  // We need React Native's Text so getByText() can find our rendered output.
  // Plain strings inside fragments don't create Text nodes in React Native —
  // they must be wrapped in <Text> or getByText() won't see them.
  const { Text } = require('react-native');
  return {
    // Redirect normally navigates to a new screen. In tests, we render the
    // destination as a Text so we can assert on exactly where it tried to go.
    Redirect: ({ href }: { href: string }) => <Text>{`redirect:${href}`}</Text>,
    // Stack normally renders the screen navigator. We render a label so we
    // can confirm it was shown (meaning the guard let the user through).
    Stack: () => <Text>stack</Text>,
  };
});

// Mock the auth store so each test can control exactly what auth state
// the layout sees — without having to boot up the real Zustand store and
// Supabase session machinery.
jest.mock('~/features/auth/stores/authStore', () => ({
  useAuthStore: jest.fn(),
}));

import { render } from '@testing-library/react-native';
import React from 'react';
import { useAuthStore } from '~/features/auth/stores/authStore';
import AuthGroupLayout from '../_layout';

// Typed alias so we can call .mockReturnValue() without TypeScript complaining.
// useAuthStore is typed as a Zustand hook, but jest.mock() replaced it with
// a jest.fn() at runtime. We cast through unknown to tell TypeScript we know
// what we're doing — the cast is safe because of the jest.mock() above.
const mockUseAuthStore = useAuthStore as unknown as jest.Mock;

describe('AuthGroupLayout — routing guard', () => {
  it('renders nothing while the app is still checking for a stored session', () => {
    // isLoading: true means AuthProvider hasn't finished reading SecureStore yet.
    // We set session: null to simulate the state before any check has run.
    mockUseAuthStore.mockReturnValue({ session: null, isLoading: true });

    const { toJSON } = render(<AuthGroupLayout />);

    // toJSON() returns null when the component rendered nothing (returned null).
    // This is intentional — we don't want the sign-in screen to flash briefly
    // for a user who is already logged in and just relaunched the app.
    expect(toJSON()).toBeNull();
  });

  it('redirects to the home screen when the user already has a valid session', () => {
    // isLoading: false means the session check finished and found a session.
    // We give it a minimal session object with just a user id.
    mockUseAuthStore.mockReturnValue({ session: { user: { id: '1' } }, isLoading: false });

    const { getByText } = render(<AuthGroupLayout />);

    // The layout should render our fake Redirect pointing at '/'.
    // '/' is the home tabs — groups are invisible in URLs so (app)/(tabs)
    // is just '/' from the router's point of view.
    expect(getByText('redirect:/')).toBeTruthy();
  });

  it('shows the sign-in Stack when there is no session (unauthenticated user)', () => {
    // isLoading: false and session: null — check is done, no session found.
    // This is the normal case for a new user or someone who signed out.
    mockUseAuthStore.mockReturnValue({ session: null, isLoading: false });

    const { getByText } = render(<AuthGroupLayout />);

    // 'stack' is what our mocked Stack component renders. Seeing it here means
    // the layout decided to show sign-in rather than redirect away.
    expect(getByText('stack')).toBeTruthy();
  });
});
