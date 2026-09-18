// Layout file for the onboarding section. In Expo Router, a `_layout` file wraps
// every screen that sits in the same folder — so this file is the shared frame
// around all the onboarding steps (grass type, effort, photo, etc.). Its whole
// job is to group those steps into one stack of screens with no default header
// and no built-in slide animation; the visible back arrow, step pill, and
// progress dots are drawn per-screen by OnboardingScreenShell, not here.

import { Stack } from 'expo-router';
import { View } from 'react-native';

// OnboardingStackLayout — wraps all onboarding screens in a shared Stack.
// Navigation chrome (back arrow, step pill, progress dots, slide animation)
// is handled by OnboardingScreenShell inside each screen, not here.
export default function OnboardingStackLayout() {
  return (
    // A plain full-height View holds the stack. `flex: 1` makes it fill the
    // screen so the onboarding steps have the whole display to draw into.
    <View style={{ flex: 1 }}>
      {/* Stack = a pile of screens where a new one slides on top of the last.
          headerShown: false hides Expo's default top bar (we draw our own);
          animation: 'none' turns off the slide so steps swap instantly. */}
      <Stack screenOptions={{ headerShown: false, animation: 'none' }} />
    </View>
  );
}
