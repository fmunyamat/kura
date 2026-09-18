// Route file for the Settings tab. Expo Router turns every file under `app/`
// into a navigable screen based on its path, so this file's location
// (`(app)/(tabs)/settings`) is what puts a "Settings" tab in the app. The file
// itself holds no screen code — it just grabs the real SettingsScreen from the
// features folder and hands it back as this route's default export, keeping our
// routing layer and our actual screen code in separate places.

import { SettingsScreen } from '@/src/features/settings/screens/SettingsScreen';

export default SettingsScreen;
