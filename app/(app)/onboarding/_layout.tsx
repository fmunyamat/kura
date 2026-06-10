import { Stack } from 'expo-router';
import { View } from 'react-native';

// OnboardingStackLayout — wraps all onboarding screens in a shared Stack.
// Navigation chrome (back arrow, step pill, progress dots, slide animation)
// is handled by OnboardingScreenShell inside each screen, not here.
export default function OnboardingStackLayout() {
  return (
    <View style={{ flex: 1 }}>
      <Stack screenOptions={{ headerShown: false, animation: 'none' }} />
    </View>
  );
}
