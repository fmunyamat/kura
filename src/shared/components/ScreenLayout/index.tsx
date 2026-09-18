// Barrel file for the ScreenLayout building blocks — the reusable spacing and
// area pieces (top/bottom spacers, the scrollable content area, the button area
// at the bottom, etc.) that most screens are assembled from. Re-exports all of
// them from one path so a screen can grab whichever pieces it needs. No UI is
// drawn here; it only forwards the real styled-components.

export {
  BottomSpacer,
  ContentArea,
  ContentGroup,
  CtaArea,
  GapSpacer,
  TopSpacer,
} from './ScreenLayout';
