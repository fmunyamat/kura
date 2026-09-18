// Route file for the Today tab (the default tab, since it is named `index`).
// Expo Router builds the app's navigation from the `app/` folder, so this
// file's location decides where the screen appears. It holds no screen code of
// its own — it just imports the real HomeScreen and hands it back as this
// route's default export, keeping routing and screen code cleanly separated.

import HomeScreen from '~/features/home/screens/HomeScreen';

export default HomeScreen;
