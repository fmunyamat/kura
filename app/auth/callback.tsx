import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';

import { createSessionFromUrl } from '~/features/auth/services/authService';

// AuthCallbackScreen — the landing screen for the magic link deep link.
// When the user taps the email link, the OS opens kura:// which Expo Router
// routes here. We grab the full URL (tokens live in the hash or query params),
// hand it to createSessionFromUrl, and wait.
//
// On success: supabase.auth.onAuthStateChange fires in AuthProvider, which
// updates the Zustand store and lets (app)/_layout.tsx redirect automatically
// to onboarding (new users) or /(tabs) (returning users).
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

    createSessionFromUrl(url).catch(() => {
      // Never show the raw error to the user — just redirect to sign-in
      // with a flag so it can display "Your link expired. Try again." (MASVS-CODE-4).
      router.replace('/(auth)/sign-in?error=link-expired');
    });
  }, [url]);

  // Show a spinner while the token exchange is in flight.
  // The user sees this for a fraction of a second before being redirected.
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicator size="large" />
    </View>
  );
}
