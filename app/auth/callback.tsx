import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';

import { checkUserProfile, createSessionFromUrl } from '~/features/auth/services/authService';
import { supabase } from '~/shared/lib/supabase';

// AuthCallbackScreen — the landing screen for the magic link deep link.
// When the user taps the email link, the OS opens kura://auth/callback which
// Expo Router routes here. We grab the full URL (tokens live in the hash or
// query params), exchange them for a session, then navigate explicitly.
//
// We cannot rely on (app)/_layout.tsx's routing guard to redirect after success
// because this screen lives outside that route group — the guard never runs
// while we're here. We must call router.replace ourselves.
//
// On success: check whether a user_profiles row exists to decide the destination.
//   new user (no profile) → /onboarding
//   returning user        → /(tabs)
//
// On failure: token was invalid or expired — send back to sign-in with an
// error flag so the screen can show a plain-English explanation.
export default function AuthCallbackScreen() {
  const router = useRouter();

  // useLinkingURL returns the URL that opened the app or the most recent
  // deep link URL while the app was already running — whichever applies.
  const url = Linking.useLinkingURL();

  useEffect(() => {
    if (!url) return;

    (async () => {
      try {
        await createSessionFromUrl(url);

        // AuthProvider's onAuthStateChange also calls checkUserProfile, but it
        // runs async and may not settle before we navigate. We check directly
        // here so we control the timing and avoid the blank-spinner race.
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) throw new Error('no session after token exchange');

        const hasProfile = await checkUserProfile(session.user.id);
        router.replace(hasProfile ? '/(app)/(tabs)' : '/onboarding');
      } catch {
        // Never show the raw error to the user — just redirect to sign-in
        // with a flag so it can display "Your link expired. Try again." (MASVS-CODE-4).
        router.replace('/(auth)/sign-in?error=link-expired');
      }
    })();
  }, [url]);

  // Show a spinner while the token exchange is in flight.
  // The user sees this for a fraction of a second before being redirected.
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicator size="large" />
    </View>
  );
}
