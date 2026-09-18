// Route file for the "how much effort?" onboarding step. Its path under `app/`
// is what makes it a navigable screen. The real UI is the EffortLevel screen in
// the features folder — this file just imports it and hands it back as the
// route's default export.

import { EffortLevel } from '@/src/features/onboarding/screens/EffortLevel';
export default EffortLevel;
