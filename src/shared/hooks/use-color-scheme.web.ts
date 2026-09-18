// Web-only version of the useColorScheme hook (Expo automatically uses this file
// instead of use-color-scheme.ts when the app runs in a browser). On the web a
// page is often built once on the server before it reaches the browser, and at
// that moment we don't yet know if the visitor prefers dark or light mode. If we
// guessed wrong, the page would visibly flicker when the browser corrected it.
// This hook avoids that by reporting a steady 'light' until the browser has
// fully loaded ("hydrated"), then switching to the real preference.

import { useEffect, useState } from 'react';
import { useColorScheme as useRNColorScheme } from 'react-native';

// useColorScheme — returns 'light' or 'dark' for the current browser, but only
// once it is safe to do so (see the file summary above for why we wait).
export function useColorScheme() {
  // hasHydrated tracks whether the browser has finished loading the page.
  // It starts false so the very first render matches what the server produced.
  const [hasHydrated, setHasHydrated] = useState(false);

  // This effect runs only in the browser, right after the first render. Flipping
  // hasHydrated to true tells the hook it's now safe to trust the real setting.
  useEffect(() => {
    setHasHydrated(true);
  }, []);

  // Ask React Native (web) what the visitor's actual light/dark preference is.
  const colorScheme = useRNColorScheme();

  // Once hydrated, hand back the real preference…
  if (hasHydrated) {
    return colorScheme;
  }

  // …until then, always say 'light' so the server and browser agree and the
  // page doesn't flash a different theme on load.
  return 'light';
}
