import { DarkTheme, DefaultTheme, ThemeProvider as NavThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { ThemeProvider } from 'styled-components/native';

import { useColorScheme } from '@/hooks/use-color-scheme';
import AuthProvider from '@/src/app/providers/AuthProvider';
import { darkTheme, lightTheme } from '@/src/config/theme';

// RootLayout — the app's outermost shell. It sets up the two providers that
// every screen needs (theme + auth) and registers the three top-level route
// segments with the Stack navigator.
//
// Route structure:
//   (auth)        — unauthenticated screens (sign-in). Guard: redirect to (app) if session exists.
//   (app)         — authenticated screens (tabs, onboarding). Guard: redirect to (auth) if no session.
//   auth/callback — deep link handler for magic link token exchange. No guard needed.
export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider theme={colorScheme === 'dark' ? darkTheme : lightTheme}>
      <NavThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <AuthProvider>
          <Stack>
            <Stack.Screen name="(auth)" options={{ headerShown: false }} />
            <Stack.Screen name="(app)" options={{ headerShown: false }} />
            <Stack.Screen name="auth/callback" options={{ headerShown: false }} />
          </Stack>
          <StatusBar style="auto" />
        </AuthProvider>
      </NavThemeProvider>
    </ThemeProvider>
  );
}
