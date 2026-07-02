// useTaskRowAnimation — owns the open/close motion of a single accordion row.
//
// It keeps one Reanimated value, `openProgress` (0 = collapsed, 1 = open), and
// reacts to the row's `isOpen` flag from the parent. From that one value it
// derives two animated styles: the detail drawer growing open (its height and
// fade), and the chevron rotating to point up when the row is open. Keeping it
// to a single driver means the drawer and the chevron can never fall out of
// sync, and — because closing is driven by the same value running back down to
// 0 — collapsing a row is the exact mirror of opening it, not a different
// motion. The rows below reflow for free: as this row's real height changes
// every frame, ordinary flex layout pushes them down (or lets them ride back
// up) in the same frame, with nothing extra needed to keep them in step.

import { useEffect } from 'react';
import type { LayoutChangeEvent } from 'react-native';
import {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

// The open/close ride. A gentle ease so a task "unfolds" rather than snapping.
const OPEN_TIMING = { duration: 420, easing: Easing.bezier(0.2, 0.7, 0.2, 1) };

interface TaskRowAnimationParams {
  isOpen: boolean;
}

export const useTaskRowAnimation = ({ isOpen }: TaskRowAnimationParams) => {
  // 0 → collapsed, 1 → fully open. Everything else is derived from this.
  const openProgress = useSharedValue(isOpen ? 1 : 0);

  // The drawer's real, measured content height (photo + description + steps +
  // button) — captured once via onLayout. Animating to this exact number
  // instead of an oversized ceiling is what makes open and close true mirror
  // motions: with a ceiling, opening would visibly finish early and keep
  // "growing" into empty space, and closing would sit frozen until the ceiling
  // dropped below the real height, then snap shut — which is exactly the stall-
  // then-jump collapse this replaces.
  const contentHeight = useSharedValue(0);

  // Drive the value whenever the parent opens or closes this row.
  useEffect(() => {
    openProgress.value = withTiming(isOpen ? 1 : 0, OPEN_TIMING);
  }, [isOpen, openProgress]);

  // handleContentLayout — reads the drawer content's natural height. Yoga
  // still lays the content out at its full intrinsic size even while the
  // parent clips it, so this reports the true height at any point in the
  // animation, not just once it's fully open.
  const handleContentLayout = (event: LayoutChangeEvent) => {
    contentHeight.value = event.nativeEvent.layout.height;
  };

  // The detail drawer: grow its height from 0 to the real content height and
  // fade it in. The fade lags slightly behind the grow (it only reaches full
  // opacity in the back half) so the contents don't flicker while still short.
  const drawerStyle = useAnimatedStyle(() => ({
    height: interpolate(openProgress.value, [0, 1], [0, contentHeight.value]),
    opacity: interpolate(openProgress.value, [0, 0.5, 1], [0, 0, 1]),
  }));

  // The chevron points down when collapsed and flips to point up when open.
  const chevronStyle = useAnimatedStyle(() => ({
    transform: [
      { rotate: `${interpolate(openProgress.value, [0, 1], [0, 180])}deg` },
    ],
  }));

  return { drawerStyle, chevronStyle, handleContentLayout };
};
