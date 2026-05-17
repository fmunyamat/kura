// These tests cover the Zustand auth store — the single place in the app where
// session state lives. Every routing decision and screen that needs to know
// "is the user logged in?" reads from this store. If the store misbehaves
// (e.g. user is null when session is not null), screens will show the wrong thing.

import type { Session, User } from '@supabase/supabase-js';
import { act } from '@testing-library/react-native';
import { useAuthStore } from '../authStore';

// Before each test, we reset the store back to its starting state.
// Zustand stores are global singletons — without this reset, a change made
// in one test would carry over and potentially break the next one.
beforeEach(() => {
  act(() => {
    useAuthStore.setState({
      session: null,
      user: null,
      hasCompletedOnboarding: false,
      isLoading: true,
    });
  });
});

// A fake session and user we can reuse across multiple tests.
// The 'as unknown as Session' cast lets us pass a minimal object without
// filling in every field that a real Supabase session would have.
const mockUser = { id: 'user-123', email: 'test@example.com' } as User;
const mockSession = { user: mockUser, access_token: 'tok' } as unknown as Session;

// ─────────────────────────────────────────────────────────────────────────────
// Initial state
// When the app first launches (before AuthProvider has run), the store should
// have nothing in it and isLoading should be true so routing guards wait.
// ─────────────────────────────────────────────────────────────────────────────
describe('initial state', () => {
  it('starts with no session, no user, no profile, and isLoading set to true', () => {
    const { session, user, hasCompletedOnboarding, isLoading } = useAuthStore.getState();

    // No session and no user — the user hasn't signed in yet.
    expect(session).toBeNull();
    expect(user).toBeNull();

    // false by default — the routing guard assumes new user until proven otherwise.
    expect(hasCompletedOnboarding).toBe(false);

    // true by default — routing guards read this and show nothing (no flash)
    // until AuthProvider finishes checking for a stored session.
    expect(isLoading).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// setSession
// Called by AuthProvider whenever the auth state changes (sign-in, sign-out,
// token refresh). It updates both session and user at the same time so they
// never hold data for different people.
// ─────────────────────────────────────────────────────────────────────────────
describe('setSession', () => {
  it('stores the session and extracts the user from it', () => {
    // Wrapping in act() tells React Testing Library that a state change is
    // happening so it can flush updates before we check the result.
    act(() => {
      useAuthStore.getState().setSession(mockSession);
    });

    const { session, user } = useAuthStore.getState();

    // The full session object should be stored as-is.
    expect(session).toBe(mockSession);

    // The user is pulled out of session.user so components don't have to
    // dig through the session object every time they just need the user id.
    expect(user).toEqual(mockUser);
  });

  it('clears both session and user when passed null (sign-out)', () => {
    // First put something in the store so we can verify it gets cleared.
    act(() => {
      useAuthStore.getState().setSession(mockSession);
    });

    // Now sign out — pass null to wipe everything.
    act(() => {
      useAuthStore.getState().setSession(null);
    });

    const { session, user } = useAuthStore.getState();

    // Both must be null. If user stayed populated while session was null,
    // a screen could accidentally show the previous user's name or avatar.
    expect(session).toBeNull();
    expect(user).toBeNull();
  });

  it('keeps session and user in sync — they always refer to the same person', () => {
    // Sign in then sign out in the same act block.
    act(() => {
      useAuthStore.getState().setSession(mockSession);
      useAuthStore.getState().setSession(null);
    });

    const { session, user } = useAuthStore.getState();

    // After signing out, both should be null. This test specifically guards
    // against a bug where session is null but user still holds stale data.
    expect(session).toBeNull();
    expect(user).toBeNull();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// setHasCompletedOnboarding
// AuthProvider sets this after checking whether a user_profiles row exists in
// the database. The (app)/_layout.tsx routing guard reads it to decide whether
// to show onboarding or the home tabs. It's critical this flag is correct.
// ─────────────────────────────────────────────────────────────────────────────
describe('setHasCompletedOnboarding', () => {
  it('sets the flag to true when the user has a profile (returning user)', () => {
    act(() => {
      useAuthStore.getState().setHasCompletedOnboarding(true);
    });

    // true means "skip onboarding, go straight to the home tabs"
    expect(useAuthStore.getState().hasCompletedOnboarding).toBe(true);
  });

  it('resets the flag to false when the user signs out', () => {
    // Start as a returning user with a complete profile...
    act(() => {
      useAuthStore.getState().setHasCompletedOnboarding(true);
    });

    // ...then sign out — the flag should clear so if a different account
    // signs in on the same device, we re-check their profile fresh.
    act(() => {
      useAuthStore.getState().setHasCompletedOnboarding(false);
    });

    expect(useAuthStore.getState().hasCompletedOnboarding).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// setIsLoading
// Starts as true on app launch. AuthProvider flips it to false once it has
// finished checking SecureStore for a stored session. Routing guards show
// nothing (null render) while this is true to prevent a flash of the wrong screen.
// ─────────────────────────────────────────────────────────────────────────────
describe('setIsLoading', () => {
  it('flips to false once the initial session check is complete', () => {
    act(() => {
      useAuthStore.getState().setIsLoading(false);
    });

    // false means "session check is done, routing guards can now decide
    // where to send the user based on the current session state".
    expect(useAuthStore.getState().isLoading).toBe(false);
  });
});
