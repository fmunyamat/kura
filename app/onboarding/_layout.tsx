import { Stack } from 'expo-router';

// OnboardingStackLayout — Expo Router nested Stack for the four onboarding screens.
// headerShown: false — each screen renders its own full-bleed gradient header.
// animation: slide_from_right gives the standard forward-navigation feel.
export default function OnboardingStackLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }} />
  );
}
