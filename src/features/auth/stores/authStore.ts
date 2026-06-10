import type { Session, User } from '@supabase/supabase-js';
import { create } from 'zustand';

// AuthState — the shape of everything the app needs to know about the
// current user's authentication status. Components read from this store
// instead of calling Supabase directly, so auth state is always consistent
// across the whole app from a single source of truth.
interface AuthState {
  // session — the active Supabase session, or null if the user is signed out.
  // The session contains the JWT used to authenticate API calls.
  session: Session | null;

  // user — convenience shorthand for session.user, kept separate so
  // components can destructure just the user without the full session object.
  user: User | null;

  // hasCompletedOnboarding — true once the user has a user_profiles row in
  // the database. Set by AuthProvider after checking Supabase on each sign-in.
  // Drives the routing decision: false → /onboarding, true → /(tabs).
  hasCompletedOnboarding: boolean;

  // hasSeenWelcome — true once the user has tapped "Start Growing" on the
  // final welcome screen. Set from user_profiles.has_seen_welcome.
  // Drives the routing decision: profile exists + false → /welcome, true → /(tabs).
  hasSeenWelcome: boolean;

  // isLoading — true while AuthProvider is running the initial session check
  // on app launch. Routing guards wait for this to be false before redirecting
  // so we never flash the sign-in screen to an already-logged-in user.
  isLoading: boolean;

  setSession: (session: Session | null) => void;
  setHasCompletedOnboarding: (has: boolean) => void;
  setHasSeenWelcome: (seen: boolean) => void;
  setIsLoading: (loading: boolean) => void;
}

// useAuthStore — the single Zustand store for auth state.
// AuthProvider writes to it; layouts and screens read from it.
export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  user: null,
  hasCompletedOnboarding: false,
  hasSeenWelcome: false,
  isLoading: true,

  // setSession updates both session and user together so they never drift
  // out of sync — if session is null, user is also cleared to null.
  setSession: (session) =>
    set({ session, user: session?.user ?? null }),

  setHasCompletedOnboarding: (has) =>
    set({ hasCompletedOnboarding: has }),

  setHasSeenWelcome: (seen) =>
    set({ hasSeenWelcome: seen }),

  setIsLoading: (loading) =>
    set({ isLoading: loading }),
}));
