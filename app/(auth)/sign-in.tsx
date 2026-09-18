// Route file for the sign-in screen. It sits in the `(auth)` group, which is
// the part of the app reachable when nobody is logged in. Expo Router maps this
// path to a screen; the real UI is the SignInScreen, imported here and handed
// back as the route's default export.

import { SignInScreen } from '@/src/features/auth/screens/SignIn';

export default SignInScreen;
