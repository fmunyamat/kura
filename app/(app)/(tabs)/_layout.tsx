// Layout file for the main tabbed part of the app (the screens a signed-in user
// bounces between). In Expo Router a `_layout` file wraps everything in its
// folder; here it sets up the bottom tab navigator and lists which tabs exist.
// It also swaps out the plain default tab bar for our own FloatingTabBar — the
// glass pill that floats above the content. To add a new tab later, add one
// more <Tabs.Screen> line below.

import { Tabs } from 'expo-router';

import { FloatingTabBar } from '@/src/shared/components/FloatingTabBar';

// TabsLayout — root layout for the authenticated tab navigator.
// The default tab bar is replaced with FloatingTabBar (the floating glass pill).
// Add a Tabs.Screen entry here for each new tab route; its `title` becomes the
// pill label and its route name maps to an icon inside FloatingTabBar.
export default function TabsLayout() {
  return (
    <Tabs
      // headerShown: false hides Expo's default top bar — each screen draws
      // its own header. tabBar replaces the standard bar with FloatingTabBar,
      // passing along the navigation info (props) it needs to render the tabs.
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <FloatingTabBar {...props} />}
    >
      {/* Each Tabs.Screen names one tab. `name` must match the route file in
          this folder (index.tsx, settings.tsx); `title` is the label shown. */}
      <Tabs.Screen name="index" options={{ title: 'Today' }} />
      <Tabs.Screen name="settings" options={{ title: 'Settings' }} />
    </Tabs>
  );
}
