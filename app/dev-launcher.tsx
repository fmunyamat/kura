// Route file for the developer launcher screen — a hidden menu we use during
// development to jump straight to any flow (sign-in, onboarding, tabs) without
// clicking through the whole app. Expo Router turns this file into a screen; the
// line at the bottom forwards the real DevLauncherScreen as the route's default.
//
// This route is only reachable via the DevPill, which is only rendered when
// __DEV__ is true. In production builds the pill doesn't exist, so this
// screen is dead code — it just needs to be a valid Expo Router file.
export { default } from '~/features/dev/DevLauncherScreen';
