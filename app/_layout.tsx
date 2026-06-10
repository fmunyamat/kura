import { DarkTheme, DefaultTheme, ThemeProvider as NavThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ThemeProvider } from 'styled-components/native';

import { useColorScheme } from '@/src/shared/hooks/use-color-scheme';
import AuthProvider from '@/src/app/providers/AuthProvider';
import { darkTheme, lightTheme } from '@/src/config/theme';
import DevPill from '@/src/features/dev/DevPill';
import { useDevStore } from '@/src/features/dev/devStore';
import * as Sentry from '@sentry/react-native';

// Hold the splash screen until fonts finish loading so the first frame
// never renders with fallback system fonts.
SplashScreen.preventAutoHideAsync();

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
// every screen needs (theme + auth) and registers the two top-level route
// segments with the Stack navigator.
//
// Route structure:
//   (auth) — unauthenticated screens (sign-in). Guard: redirect to (app) if session exists.
//   (app)  — authenticated screens (tabs, onboarding). Guard: redirect to (auth) if no session.
export default Sentry.wrap(function RootLayout() {
  const colorScheme = useColorScheme();
  const { loadDefaultFlow, isDefaultLoaded } = useDevStore();

  // Load all ZalandoSans (headers) and JetBrains Mono (body) weights used across the app.
  // fontFamily strings here become the values used in styled-components.
  const [fontsLoaded, fontError] = useFonts({
    'ZalandoSans-Regular':    require('@expo-google-fonts/zalando-sans/400Regular/ZalandoSans_400Regular.ttf'),
    'ZalandoSans-Bold':       require('@expo-google-fonts/zalando-sans/700Bold/ZalandoSans_700Bold.ttf'),
    'ZalandoSans-Black':      require('@expo-google-fonts/zalando-sans/900Black/ZalandoSans_900Black.ttf'),
    'JetBrainsMono-Regular':  require('@expo-google-fonts/jetbrains-mono/400Regular/JetBrainsMono_400Regular.ttf'),
    'JetBrainsMono-Medium':   require('@expo-google-fonts/jetbrains-mono/500Medium/JetBrainsMono_500Medium.ttf'),
    'JetBrainsMono-Bold':     require('@expo-google-fonts/jetbrains-mono/700Bold/JetBrainsMono_700Bold.ttf'),
    'JetBrainsMono-ExtraBold': require('@expo-google-fonts/jetbrains-mono/800ExtraBold/JetBrainsMono_800ExtraBold.ttf'),
  });

  // Hide the splash screen once fonts are ready (or if loading failed — the
  // app still renders with system font fallbacks rather than hanging forever).
  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  // In dev, read the persisted default flow from SecureStore before rendering
  // any screens. SecureStore reads are fast (local), so this adds no visible delay.
  useEffect(() => {
    if (__DEV__) loadDefaultFlow();
  }, []);

  if (!fontsLoaded && !fontError) return null;

  // Wait for the default flow to load before rendering screens in dev so the
  // routing guard in app/(app)/_layout.tsx has a settled defaultFlow value.
  if (__DEV__ && !isDefaultLoaded) return null;

  return (
    <ThemeProvider theme={colorScheme === 'dark' ? darkTheme : lightTheme}>
      <NavThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <AuthProvider>
          {/* GestureHandlerRootView wraps the app so any GestureDetector descendant
              (e.g. WelcomeFlow swipe pager) is recognised by the gesture system. */}
          <GestureHandlerRootView style={{ flex: 1 }}>
            <Stack>
              <Stack.Screen name="(auth)" options={{ headerShown: false }} />
              <Stack.Screen name="(app)" options={{ headerShown: false }} />
              {/* dev-launcher is only navigated to via DevPill in __DEV__ builds. */}
              <Stack.Screen
                name="dev-launcher"
                options={{ headerShown: false, presentation: 'modal' }}
              />
            </Stack>
            <StatusBar style="auto" />
            {/* DevPill — floating badge; Hermes removes this in production builds. */}
            {__DEV__ && <DevPill />}
          </GestureHandlerRootView>
        </AuthProvider>
      </NavThemeProvider>
    </ThemeProvider>
  );
});
