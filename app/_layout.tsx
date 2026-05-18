import { DarkTheme, DefaultTheme, ThemeProvider as NavThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { ThemeProvider } from 'styled-components/native';

import { useColorScheme } from '@/hooks/use-color-scheme';
import AuthProvider from '@/src/app/providers/AuthProvider';
import { darkTheme, lightTheme } from '@/src/config/theme';
import * as Sentry from '@sentry/react-native';

Sentry.init({
  dsn: 'https://75175a58ddaa328fc3bc6216e12c80bc@o4511408929898496.ingest.us.sentry.io/4511408941826048',

  // Keep PII out of crash reports. When true, Sentry automatically attaches
  // IP addresses, cookies, and user data to every event — we don't want that.
  // If we need to identify a user in a crash report, set Sentry.setUser({ id })
  // explicitly in AuthProvider after sign-in, which sends only the UUID. (MASVS-STORAGE-2)
  sendDefaultPii: false,

  // Enable Logs
  enableLogs: true,

  // Configure Session Replay
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1,
  integrations: [Sentry.mobileReplayIntegration(), Sentry.feedbackIntegration()],

  // uncomment the line below to enable Spotlight (https://spotlightjs.com)
  // spotlight: __DEV__,
});

// RootLayout — the app's outermost shell. It sets up the two providers that
// every screen needs (theme + auth) and registers the three top-level route
// segments with the Stack navigator.
//
// Route structure:
//   (auth)        — unauthenticated screens (sign-in). Guard: redirect to (app) if session exists.
//   (app)         — authenticated screens (tabs, onboarding). Guard: redirect to (auth) if no session.
//   auth/callback — deep link handler for magic link token exchange. No guard needed.
export default Sentry.wrap(function RootLayout() {
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
});
