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
