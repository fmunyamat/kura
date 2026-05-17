// These tests cover the routing guard in (app)/_layout.tsx — the layout that
// wraps all authenticated screens (home tabs and onboarding). It makes three
// decisions on every render:
//   1. Still loading → show nothing (avoid a flash of the wrong screen)
//   2. No session → send to sign-in (unauthenticated user)
//   3. Session but no profile → send to onboarding (brand-new user)
//   4. Session + profile → let the user through to the app
//
// We also test the anti-loop guard: a user already inside the onboarding flow
// must NOT be redirected back to /onboarding step 1 on every navigation.

jest.mock('expo-router', () => {
  // We need React Native's Text so getByText() can find our rendered output.
  // Plain strings inside fragments don't create Text nodes in React Native —
  // they must be wrapped in <Text> or getByText() won't see them.
  const { Text } = require('react-native');
  return {
    // Redirect renders the destination inside a Text so tests can assert on
    // exactly where the layout tried to navigate.
    Redirect: ({ href }: { href: string }) => <Text>{`redirect:${href}`}</Text>,
    // Stack renders a label so tests can confirm no redirect fired and the
    // layout let the user through to the actual screen navigator.
    Stack: () => <Text>stack</Text>,
    // usePathname returns the current URL — we control this per-test to
    // simulate the user being on different screens (e.g. inside onboarding).
    usePathname: jest.fn(),
  };
});

jest.mock('~/features/auth/stores/authStore', () => ({
  useAuthStore: jest.fn(),
}));

import { render } from '@testing-library/react-native';
import { usePathname } from 'expo-router';
import React from 'react';
import { useAuthStore } from '~/features/auth/stores/authStore';
import AppGroupLayout from '../_layout';

// useAuthStore and usePathname are typed as real hooks, but jest.mock() replaced
// them with jest.fn() at runtime. We cast through unknown to tell TypeScript
// we know what we're doing — the casts are safe because of the jest.mock() calls above.
const mockUseAuthStore = useAuthStore as unknown as jest.Mock;
const mockUsePathname = usePathname as unknown as jest.Mock;

// Default to the home screen path before each test. Individual tests that need
// a different path (e.g. inside onboarding) override this themselves.
beforeEach(() => {
  mockUsePathname.mockReturnValue('/');
});

describe('AppGroupLayout — routing guard', () => {
  it('renders nothing while the app is still checking for a stored session', () => {
    // isLoading: true — AuthProvider hasn't finished reading SecureStore yet.
    // We must not redirect anywhere until we know whether a session exists.
    mockUseAuthStore.mockReturnValue({
      session: null,
      hasCompletedOnboarding: false,
      isLoading: true,
    });

    const { toJSON } = render(<AppGroupLayout />);

    // null render means the layout returned nothing — no screen flash while loading.
    expect(toJSON()).toBeNull();
  });

  it('redirects to sign-in when there is no session', () => {
    // isLoading: false and session: null — the check is done, no user is logged in.
    // This handles the case where a user opens the app for the first time or
    // after their session has expired.
    mockUseAuthStore.mockReturnValue({
      session: null,
      hasCompletedOnboarding: false,
      isLoading: false,
    });

    const { getByText } = render(<AppGroupLayout />);

    // The layout should try to navigate to /sign-in.
    // Note the plain URL — (auth) is a route group and doesn't appear in the URL.
    expect(getByText('redirect:/sign-in')).toBeTruthy();
  });

  it('redirects to onboarding when the user is logged in but has not set up their lawn yet', () => {
    // This is the state right after a brand-new user taps the magic link:
    // they have a session but no user_profiles row in the database yet.
    mockUseAuthStore.mockReturnValue({
      session: { user: { id: '1' } },
      hasCompletedOnboarding: false,
      isLoading: false,
    });
    // Simulate the user trying to go to the home screen (/) before finishing setup.
    mockUsePathname.mockReturnValue('/');

    const { getByText } = render(<AppGroupLayout />);

    // The layout should intercept and send them to onboarding instead.
    expect(getByText('redirect:/onboarding')).toBeTruthy();
  });

  it('does NOT redirect to /onboarding when the user is already inside the onboarding flow', () => {
    // This is the critical anti-loop guard. Without it, every time the user
    // taps "Next" to go from step 1 to step 2, the layout would re-evaluate,
    // see hasCompletedOnboarding is still false, and redirect them back to step 1.
    // The fix: check the current URL — if it starts with /onboarding, let them through.
    mockUseAuthStore.mockReturnValue({
      session: { user: { id: '1' } },
      hasCompletedOnboarding: false,
      isLoading: false,
    });
    // The user is on step 2 of onboarding — they should be allowed to stay here.
    mockUsePathname.mockReturnValue('/onboarding/grass-type');

    const { getByText } = render(<AppGroupLayout />);

    // 'stack' means the layout rendered the screen navigator — no redirect happened.
    expect(getByText('stack')).toBeTruthy();
  });

  it('lets the user through to the app when they have a session and a complete profile', () => {
    // This is the happy path for a returning user: they open the app,
    // AuthProvider restores their session and confirms their profile exists,
    // and the routing guard steps aside and shows the home tabs.
    mockUseAuthStore.mockReturnValue({
      session: { user: { id: '1' } },
      hasCompletedOnboarding: true,
      isLoading: false,
    });

    const { getByText } = render(<AppGroupLayout />);

    // 'stack' confirms no redirect fired — the user sees their dashboard.
    expect(getByText('stack')).toBeTruthy();
  });
});
