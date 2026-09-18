// Barrel file for the CtaButton component. Its only job is to re-export the
// button from one tidy path, so other files can write
// `import { CtaButton } from '@/src/shared/components/CtaButton'` instead of
// reaching all the way into the CtaButton.tsx file. Nothing here draws to the
// screen — it just forwards the real component along.

export { CtaButton } from './CtaButton';
