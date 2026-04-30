// Barrel — re-exports everything from the iOS-specific implementation so that
// both the runtime component and its TypeScript prop contract come from the same
// source. Keeping them in sync prevents the type from advertising onApplePress
// as required while a different runtime silently makes it optional.
export { SocialAuthButtons, type SocialAuthButtonsProps } from './SocialAuthButtons.ios';
