import { Redirect, Stack, usePathname } from 'expo-router';

import { useAuthStore } from '~/features/auth/stores/authStore';

// AppGroupLayout — layout for all authenticated screens (tabs + onboarding).
// Makes two routing decisions on every render:
//   1. No session → send to sign-in (user signed out or session expired)
//   2. Session but no profile → send to onboarding (brand-new user)
//   3. Session + profile → let the navigation request through
export default function AppGroupLayout() {
  const { session, hasCompletedOnboarding, isLoading } = useAuthStore();

  // usePathname gives us the current URL path — more reliable than useSegments
  // for this check because it is not affected by stale typed-route generation.
  const pathname = usePathname();

  if (isLoading) return null;

  // Groups are invisible in URLs — "/sign-in" resolves to (auth)/sign-in.tsx
  if (!session) return <Redirect href="/sign-in" />;

  // Only redirect to onboarding if the user isn't already there.
  // Without this guard, every navigation inside the onboarding flow would
  // re-trigger the redirect and trap the user on step 1 forever.
  const inOnboarding = pathname.startsWith('/onboarding');
  if (!hasCompletedOnboarding && !inOnboarding) {
    return <Redirect href="/onboarding" />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
