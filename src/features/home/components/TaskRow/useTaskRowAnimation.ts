// useTaskRowAnimation — owns the open/close motion of a single accordion row.
//
// It keeps one Reanimated value, `openProgress` (0 = collapsed, 1 = open), and
// reacts to the row's `isOpen` flag from the parent. From that one value it
// derives two animated styles: the detail drawer growing open (its height and
// fade), and the chevron rotating to point up when the row is open. Keeping it
// to a single driver means the drawer and the chevron can never fall out of
// sync.

import { useEffect } from 'react';
import {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

// The open/close ride. A gentle ease so a task "unfolds" rather than snapping.
const OPEN_TIMING = { duration: 420, easing: Easing.bezier(0.2, 0.7, 0.2, 1) };

// The tallest the detail drawer is allowed to grow. It's a ceiling for the
// height interpolation, not a fixed height — the drawer's own content (photo +
// description + steps + button) decides the real height; this just has to be
// comfortably larger than that so nothing is clipped.
const DRAWER_MAX_HEIGHT = 460;

interface TaskRowAnimationParams {
  isOpen: boolean;
}

export const useTaskRowAnimation = ({ isOpen }: TaskRowAnimationParams) => {
  // 0 → collapsed, 1 → fully open. Everything else is derived from this.
  const openProgress = useSharedValue(isOpen ? 1 : 0);

  // Drive the value whenever the parent opens or closes this row.
  useEffect(() => {
    openProgress.value = withTiming(isOpen ? 1 : 0, OPEN_TIMING);
  }, [isOpen, openProgress]);

  // The detail drawer: grow its height from 0 to the ceiling and fade it in.
  // The fade lags slightly behind the grow (it only reaches full opacity in the
  // back half) so the contents don't flicker while the row is still short.
  const drawerStyle = useAnimatedStyle(() => ({
    maxHeight: interpolate(openProgress.value, [0, 1], [0, DRAWER_MAX_HEIGHT]),
    opacity: interpolate(openProgress.value, [0, 0.5, 1], [0, 0, 1]),
  }));

  // The chevron points down when collapsed and flips to point up when open.
  const chevronStyle = useAnimatedStyle(() => ({
    transform: [
      { rotate: `${interpolate(openProgress.value, [0, 1], [0, 180])}deg` },
    ],
  }));

  return { drawerStyle, chevronStyle };
};
