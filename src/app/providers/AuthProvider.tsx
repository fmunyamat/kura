import { useEffect } from 'react';
import { AppState } from 'react-native';

import { checkUserProfile } from '~/features/auth/services/authService';
import { useAuthStore } from '~/features/auth/stores/authStore';
import { supabase } from '~/shared/lib/supabase';

// AuthProvider — mounts once at the app root and keeps the Zustand auth store
// in sync with Supabase's session state for the lifetime of the app.
// It does three things:
//   1. Restores any persisted session from SecureStore on launch
//   2. Subscribes to future auth events (sign-in, sign-out, token refresh)
//   3. Pauses/resumes the token auto-refresh when the app backgrounds/foregrounds
const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const { setSession, setHasCompletedOnboarding, setHasSeenWelcome, setIsLoading } = useAuthStore();

  useEffect(() => {
    // Pause token auto-refresh while the app is in the background to avoid
    // unnecessary network calls. Resume immediately when it comes back to
    // the foreground so the session stays fresh.
    const appStateSubscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        supabase.auth.startAutoRefresh();
      } else {
        supabase.auth.stopAutoRefresh();
      }
    });

    // Restore a persisted session from SecureStore. If one exists, the user
    // skips the sign-in screen on relaunch. isLoading stays true until this
    // check completes so routing guards don't flash the wrong screen.
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);

      if (session?.user) {
        const flags = await checkUserProfile(session.user.id);
        setHasCompletedOnboarding(flags.hasProfile);
        setHasSeenWelcome(flags.hasSeenWelcome);
      }

      // isLoading must flip to false AFTER session and profile are both set,
      // otherwise the routing guard runs with incomplete state and may redirect
      // to the wrong screen for a split second before correcting itself.
      setIsLoading(false);
    });

    // Listen for all subsequent auth state changes — sign-in from the magic
    // link callback, sign-out, and background token refreshes all come through
    // here. Re-checking the profile on every sign-in keeps hasCompletedOnboarding
    // accurate even if the profile row was just created during onboarding.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);

      if (session?.user) {
        const flags = await checkUserProfile(session.user.id);
        setHasCompletedOnboarding(flags.hasProfile);
        setHasSeenWelcome(flags.hasSeenWelcome);
      } else {
        // Signed out — clear profile flags so the next sign-in starts fresh.
        setHasCompletedOnboarding(false);
        setHasSeenWelcome(false);
      }
    });

    return () => {
      appStateSubscription.remove();
      subscription.unsubscribe();
    };
  }, []);

  return <>{children}</>;
};

export default AuthProvider;
