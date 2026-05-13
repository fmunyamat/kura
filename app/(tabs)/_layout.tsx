import { Tabs } from 'expo-router';

// TabsLayout — root layout for the authenticated tab navigator.
// Add a Tabs.Screen entry here for each new tab route.
export default function TabsLayout() {
  return (
    <Tabs>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          headerShown: false,
        }}
      />
    </Tabs>
  );
}
