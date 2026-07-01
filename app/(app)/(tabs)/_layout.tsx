import { Tabs } from 'expo-router';

import { FloatingTabBar } from '@/src/shared/components/FloatingTabBar';

// TabsLayout — root layout for the authenticated tab navigator.
// The default tab bar is replaced with FloatingTabBar (the floating glass pill).
// Add a Tabs.Screen entry here for each new tab route; its `title` becomes the
// pill label and its route name maps to an icon inside FloatingTabBar.
export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <FloatingTabBar {...props} />}
    >
      <Tabs.Screen name="index" options={{ title: 'Today' }} />
      <Tabs.Screen name="settings" options={{ title: 'Settings' }} />
    </Tabs>
  );
}
