import { Redirect, Stack, usePathname } from 'expo-router';
import { useEffect } from 'react';

import { useDevStore } from '~/features/dev/devStore';
import { useAuthStore } from '~/features/auth/stores/authStore';

// AppGroupLayout — layout for all authenticated screens (tabs + onboarding).
// Makes routing decisions on every render:
//   1. Dev override active → bypass auth guards, jump to selected flow
//   2. No session → send to sign-in
//   3. Session but no profile → send to onboarding
//   4. Session + profile + !hasSeenWelcome → send to welcome flow
//   5. Session + profile + hasSeenWelcome → let request through to tabs
export default function AppGroupLayout() {
  const { session, hasCompletedOnboarding, hasSeenWelcome, isLoading } = useAuthStore();
  const { selectedFlow, defaultFlow, setSelectedFlow } = useDevStore();
  const pathname = usePathname();

  // Apply the persisted default flow once on mount. This is what makes the app
  // jump straight to the pinned screen after a full reload (shake → Reload),
  // without the user needing to open the launcher and tap Launch.
  // The root layout already waits for isDefaultLoaded before mounting this
  // component, so defaultFlow is settled and this runs exactly once per session.
  useEffect(() => {
    if (__DEV__ && defaultFlow !== null) {
      setSelectedFlow(defaultFlow);
    }
  }, []);

  if (isLoading) return null;

  // Dev override — bypass all auth/profile guards and jump directly to the
  // selected flow. __DEV__ is a compile-time constant; Hermes eliminates this
  // entire block from production bundles.
  if (__DEV__ && selectedFlow !== 'sign-in') {
    if (selectedFlow === 'onboarding') {
      const inOnboarding = pathname.startsWith('/onboarding');
      if (!inOnboarding) return <Redirect href="/onboarding" />;
      return <Stack screenOptions={{ headerShown: false }} />;
    }
    if (selectedFlow === 'welcome') {
      const inWelcome = pathname.startsWith('/welcome');
      if (!inWelcome) return <Redirect href="/welcome" />;
      return <Stack screenOptions={{ headerShown: false }} />;
    }
    if (selectedFlow === 'tabs') {
      // Just render the Stack — the default tab route renders without any redirect.
      return <Stack screenOptions={{ headerShown: false }} />;
    }
  }

  // Groups are invisible in URLs — "/sign-in" resolves to (auth)/sign-in.tsx
  if (!session) return <Redirect href="/sign-in" />;

  // Only redirect to onboarding if the user isn't already there.
  // Without this guard, every navigation inside the onboarding flow would
  // re-trigger the redirect and trap the user on step 1 forever.
  const inOnboarding = pathname.startsWith('/onboarding');
  if (!hasCompletedOnboarding && !inOnboarding) {
    return <Redirect href="/onboarding" />;
  }

  // Profile complete but welcome flow not yet seen — show the 4-screen tutorial.
  // Guard against redirecting while the user is already in /welcome so tapping
  // between steps doesn't cause an infinite redirect loop.
  const inWelcome = pathname.startsWith('/welcome');
  if (hasCompletedOnboarding && !hasSeenWelcome && !inWelcome) {
    return <Redirect href="/welcome" />;
  }

  // Welcome flow just finished — user is still on /welcome but hasSeenWelcome
  // flipped to true. Redirect to tabs; the routing guard owns this transition,
  // not handleFinish, for the same reason handleComplete doesn't call router.replace.
  if (hasCompletedOnboarding && hasSeenWelcome && inWelcome) {
    return <Redirect href="/" />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
