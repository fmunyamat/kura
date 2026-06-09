// This route is only reachable via the DevPill, which is only rendered when
// __DEV__ is true. In production builds the pill doesn't exist, so this
// screen is dead code — it just needs to be a valid Expo Router file.
export { default } from '~/features/dev/DevLauncherScreen';
