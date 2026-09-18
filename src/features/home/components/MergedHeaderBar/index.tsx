// Barrel file for the MergedHeaderBar (the compact bar that fades in when the
// Today screen is scrolled). Re-exports the component AND the HEADER_COLLAPSE_PX
// constant that says how far you scroll before the bar appears, so both can be
// imported from this folder path. Nothing is rendered here — it only forwards.

export { HEADER_COLLAPSE_PX, MergedHeaderBar } from './MergedHeaderBar';
