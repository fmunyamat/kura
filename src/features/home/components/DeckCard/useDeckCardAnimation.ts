// useDeckCardAnimation — owns every moving part of a single deck card.
//
// It keeps a set of Reanimated shared values for the card's transform, its
// "DONE" stamp, its CTA fade, and its detail drawer, and reacts to three
// inputs from the parent:
//   • position    — where the card sits in the deck (front / b1 / b2 / …)
//   • isExpanded  — whether the front card is opened into its modal
//   • isCompleting — whether this card should play the stamp + fly-away
//
// When the fly-away finishes it calls `onFlyOutEnd` back on the JS thread so the
// hook that owns the deck can drop the card and slide the rest forward.

import { useEffect } from 'react';
import { useWindowDimensions, type LayoutChangeEvent } from 'react-native';
import {
  Easing,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

import type { DeckPosition } from '../../types';

// The deck's signature spring-like curve (overshoots slightly, y > 1). Slowed
// down so flipping between cards reads as a relaxed glide rather than a snap.
const DECK_TIMING = { duration: 850, easing: Easing.bezier(0.2, 0.85, 0.25, 1.1) };
// How long the position fade (opacity) takes — kept in step with DECK_TIMING.
const DECK_FADE_DURATION = 750;
// The modal open/close ride, and the matching detail-drawer slide. Slowed so
// "tap for details" opens gently.
const EXPAND_TIMING = { duration: 750, easing: Easing.bezier(0.2, 0.7, 0.2, 1) };
// The stamp slamming down from huge to actual size.
const STAMP_TIMING = { duration: 400, easing: Easing.bezier(0.3, 1.2, 0.4, 1) };
// The card flying off the top of the deck.
const FLY_TIMING = { duration: 550, easing: Easing.bezier(0.2, 0.85, 0.25, 1.1) };
const FLY_DELAY = 600; // pause after the stamp lands before the card leaves

// How far the card lifts when opened into its modal. It no longer forces a tall
// height — the card simply grows to fit its content (description + steps +
// button), so there's no dead space below the button.
const EXPANDED_LIFT = -50;

// The resting transform for each deck position. `x` is a fraction of the card's
// width so the slide-aside scales with the screen. The aside card is thrown a
// full 1.2 widths to the left so it clears the screen edge completely (the -7°
// tilt would otherwise leave a corner poking in).
const POSITION_TARGETS: Record<
  DeckPosition,
  { y: number; xFraction: number; scale: number; rotate: number; opacity: number }
> = {
  front: { y: 0, xFraction: 0, scale: 1, rotate: 0, opacity: 1 },
  b1: { y: -13, xFraction: 0, scale: 0.93, rotate: 0, opacity: 0.55 },
  b2: { y: -25, xFraction: 0, scale: 0.86, rotate: 0, opacity: 0.3 },
  hidden: { y: -25, xFraction: 0, scale: 0.8, rotate: 0, opacity: 0 },
  aside: { y: 0, xFraction: -1.2, scale: 0.95, rotate: -7, opacity: 0.35 },
};

interface DeckCardAnimationParams {
  position: DeckPosition;
  isFront: boolean;
  isExpanded: boolean;
  isCompleting: boolean;
  onFlyOutEnd: () => void;
}

export const useDeckCardAnimation = ({
  position,
  isFront,
  isExpanded,
  isCompleting,
  onFlyOutEnd,
}: DeckCardAnimationParams) => {
  // Card width is the screen minus the 20px side padding either side; stable, so
  // the slide-aside and fly-off work before the card has measured itself.
  const { width } = useWindowDimensions();
  const cardWidth = width - 40;

  // The card's own measured height, used to throw it up-and-off proportionally.
  const cardHeight = useSharedValue(300);

  // Transform values for the deck position (and, during completion, the fly-off).
  const translateY = useSharedValue(0);
  const translateX = useSharedValue(0);
  const scale = useSharedValue(1);
  const rotate = useSharedValue(0);
  const opacity = useSharedValue(1);

  // 0 → condensed card, 1 → opened modal. Drives the lift, the grow, the drawer.
  const expandProgress = useSharedValue(0);
  // The CTA only lives on the front card; it cross-fades as cards slide.
  const ctaOpacity = useSharedValue(1);
  // The DONE stamp.
  const stampScale = useSharedValue(3.2);
  const stampOpacity = useSharedValue(0);

  // Settle into the resting transform whenever the deck position changes — but
  // never while this card is mid-completion, or it would fight the fly-off.
  useEffect(() => {
    if (isCompleting) return;
    const target = POSITION_TARGETS[position];
    translateY.value = withTiming(target.y, DECK_TIMING);
    translateX.value = withTiming(target.xFraction * cardWidth, DECK_TIMING);
    scale.value = withTiming(target.scale, DECK_TIMING);
    rotate.value = withTiming(target.rotate, DECK_TIMING);
    opacity.value = withTiming(target.opacity, { duration: DECK_FADE_DURATION });
  }, [position, isCompleting, cardWidth, translateY, translateX, scale, rotate, opacity]);

  // Open or close the modal in step with the parent's isExpanded flag.
  useEffect(() => {
    expandProgress.value = withTiming(isExpanded ? 1 : 0, EXPAND_TIMING);
  }, [isExpanded, expandProgress]);

  // Fade the CTA with whether this is the front card.
  useEffect(() => {
    ctaOpacity.value = withTiming(isFront ? 1 : 0, { duration: 250 });
  }, [isFront, ctaOpacity]);

  // The completion sequence: slam the stamp, hold, then fly the card away and
  // report back once it's gone.
  useEffect(() => {
    if (!isCompleting) return;
    stampOpacity.value = withTiming(1, { duration: 400 });
    stampScale.value = withTiming(1, STAMP_TIMING);
    translateX.value = withDelay(FLY_DELAY, withTiming(cardWidth * 1.25, FLY_TIMING));
    rotate.value = withDelay(FLY_DELAY, withTiming(16, FLY_TIMING));
    translateY.value = withDelay(
      FLY_DELAY,
      withTiming(-cardHeight.value * 0.26, FLY_TIMING)
    );
    opacity.value = withDelay(
      FLY_DELAY,
      withTiming(0, FLY_TIMING, (finished) => {
        if (finished) runOnJS(onFlyOutEnd)();
      })
    );
  }, [isCompleting, cardWidth, cardHeight, onFlyOutEnd, translateX, translateY, rotate, opacity, stampOpacity, stampScale]);

  // Remember the card's condensed height so the fly-off throw is proportional.
  const handleCardLayout = (event: LayoutChangeEvent) => {
    cardHeight.value = event.nativeEvent.layout.height;
  };

  // The card itself: the deck transform, plus a gentle lift when it opens. The
  // height is left to the content — the detail drawer growing open is what makes
  // the card taller, so it ends up exactly as tall as it needs to be.
  const cardStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value + expandProgress.value * EXPANDED_LIFT },
      { translateX: translateX.value },
      { scale: scale.value },
      { rotate: `${rotate.value}deg` },
    ],
    opacity: opacity.value,
  }));

  const stampStyle = useAnimatedStyle(() => ({
    opacity: stampOpacity.value,
    transform: [{ scale: stampScale.value }, { rotate: '-14deg' }],
  }));

  const ctaStyle = useAnimatedStyle(() => ({ opacity: ctaOpacity.value }));

  // The detail drawer grows open with the modal.
  const drawerStyle = useAnimatedStyle(() => ({
    maxHeight: interpolate(expandProgress.value, [0, 1], [0, 320]),
    opacity: expandProgress.value,
  }));

  return { cardStyle, stampStyle, ctaStyle, drawerStyle, handleCardLayout };
};
