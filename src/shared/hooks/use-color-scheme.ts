// Re-export of React Native's built-in useColorScheme hook, which tells a
// component whether the phone is currently in light or dark mode. We forward it
// through our own shared/hooks folder for one reason: there's a matching
// `use-color-scheme.web.ts` file next to this one, and Expo automatically swaps
// in the `.web` version when the app runs in a browser. Components just import
// from here and get the right behaviour on every platform without knowing about
// the swap.

export { useColorScheme } from 'react-native';
