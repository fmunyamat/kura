// DeckScrim — the dimmer that fades in behind a card when it opens into its
// modal, so everything around the open card recedes. It overscans well past the
// deck's bounds so it darkens the whole screen, and tapping it closes the card.
// While hidden it ignores touches so the deck stays fully interactive.

import { Pressable } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import styled from 'styled-components/native';
import { useEffect } from 'react';

interface DeckScrimProps {
  isVisible: boolean;
  onPress: () => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// Scrim — pinned far beyond the deck on every side so the dark wash reaches the
// edges of the screen (the deck container does not clip its children).
const Scrim = styled(AnimatedPressable)`
  position: absolute;
  top: -400px;
  bottom: -400px;
  left: -40px;
  right: -40px;
  z-index: 40;
  background-color: ${({ theme }) => theme.colors.scrimDark};
`;

export const DeckScrim = ({ isVisible, onPress }: DeckScrimProps) => {
  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withTiming(isVisible ? 1 : 0, { duration: 350 });
  }, [isVisible, opacity]);

  const style = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Scrim
      style={style}
      onPress={onPress}
      // Only catch taps while it's actually showing; otherwise let them through
      // to the cards underneath.
      pointerEvents={isVisible ? 'auto' : 'none'}
      accessibilityElementsHidden={!isVisible}
    />
  );
};
