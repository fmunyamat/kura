// Route file for the first onboarding step (named `index`, so it is the default
// screen when the user lands in the onboarding section). Expo Router maps this
// file's path to a screen; the actual UI lives in the Location screen, which
// this file imports and re-exports as the route's default.

import { Location } from '@/src/features/onboarding/screens/Location';
export default Location;
