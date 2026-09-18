// Barrel file for the OnboardingScreenShell (the shared frame every onboarding
// step sits inside). Re-exports it from one path so each onboarding screen can
// import it by folder name. No UI here — it only forwards the component.

export { OnboardingScreenShell } from './OnboardingScreenShell';
