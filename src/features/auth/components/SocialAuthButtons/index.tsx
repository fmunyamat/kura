// Barrel file for the SocialAuthButtons component. It re-exports the buttons
// (and their props type) from one short path, so other files can import
// `{ SocialAuthButtons }` from the folder name without knowing which file
// inside actually holds the code. No UI is drawn here — it just forwards.

export { SocialAuthButtons, type SocialAuthButtonsProps } from './SocialAuthButtons';
