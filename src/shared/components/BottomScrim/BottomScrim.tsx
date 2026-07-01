// BottomScrim — a bottom-anchored gradient that fades scrolling content into
// the dark background before it reaches the floating tab bar. Without it, cards
// slide directly behind the frosted pill and the blur smears their edges, which
// reads busy. The scrim dissolves that content to the background green instead,
// so the pill always floats over a calm surface. It's purely decorative and
// never intercepts touches, so buttons underneath it still work.

import { LinearGradient } from 'expo-linear-gradient';
import styled from 'styled-components/native';

import { FLOATING_TAB_BAR_CLEARANCE } from '~/shared/components/FloatingTabBar';

// FADE_ZONE — the visible gradient region above the nav pill. The gradient runs
// from transparent at the top of this zone to fully opaque at the bottom.
const FADE_ZONE = 90;

// Total scrim height: the fade zone sits above the pill area, which is then
// covered by a solid opaque block from the pill's top edge to the screen bottom.
// This guarantees content reaches opacity 0 exactly at the top of the nav pill.
const SCRIM_HEIGHT = FADE_ZONE + FLOATING_TAB_BAR_CLEARANCE;

// The fraction of the scrim height at which the gradient turns fully opaque.
// Everything below this point (the nav pill area) stays at full opacity.
const OPAQUE_LOCATION = FADE_ZONE / SCRIM_HEIGHT;

// Fade — three colour stops: transparent → fully opaque → stays opaque.
// The `locations` prop pins the opaque point to the nav pill's top edge so
// content is invisible before it reaches the pill, not after.
const Fade = styled(LinearGradient).attrs(({ theme }) => ({
  colors: [
    theme.colors.scrimFadeTop,
    theme.colors.scrimFadeBottom,
    theme.colors.scrimFadeBottom,
  ] as const,
  locations: [0, OPAQUE_LOCATION, 1] as const,
}))`
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: ${SCRIM_HEIGHT}px;
`;

export const BottomScrim = () => (
  // pointerEvents none so the fade is visual only — taps fall through to the
  // content and tab bar beneath it.
  <Fade pointerEvents="none" />
);
