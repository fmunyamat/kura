// Layout file for the "logged out" part of the app. In Expo Router a `_layout`
// file wraps every screen in its folder; the `(auth)` folder holds the screens
// someone sees before they sign in (right now just the sign-in screen). This
// file also acts as a guard: if the app already has a saved login session, it
// bounces the user straight into the app so a logged-in person never gets stuck
// looking at the sign-in screen again.

import { Redirect, Stack } from 'expo-router';

import { useAuthStore } from '~/features/auth/stores/authStore';

// AuthGroupLayout — layout for all unauthenticated screens (currently just sign-in).
// If the app finds an existing session on launch, it skips this group entirely
// and sends the user straight to the app — they should never see sign-in again
// until they explicitly sign out.
export default function AuthGroupLayout() {
  const { session, isLoading } = useAuthStore();

  // Return null while AuthProvider is still restoring the session from SecureStore.
  // This prevents a brief flash of the sign-in screen for already-logged-in users.
  if (isLoading) return null;

  // Groups are invisible in URLs — "/" resolves to (app)/(tabs)/index.tsx
  if (session) return <Redirect href="/" />;

  return <Stack screenOptions={{ headerShown: false }} />;
}
