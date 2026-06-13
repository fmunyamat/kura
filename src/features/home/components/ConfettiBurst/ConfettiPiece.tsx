// ConfettiPiece — a single falling rectangle. On mount it waits out its random
// delay, then drops the height of the phone while spinning and fading out.

import { useEffect } from 'react';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import styled from 'styled-components/native';

interface ConfettiPieceProps {
  color: string;
  // leftPercent — horizontal start position across the screen (0–100).
  leftPercent: number;
  duration: number;
  delay: number;
}

// How far each piece falls. Comfortably past the bottom of any phone screen.
const FALL_DISTANCE = 560;

const Piece = styled(Animated.View)<{ $color: string; $leftPercent: number }>`
  position: absolute;
  top: -10px;
  left: ${({ $leftPercent }) => $leftPercent}%;
  width: 8px;
  height: 13px;
  border-radius: 2px;
  background-color: ${({ $color }) => $color};
`;

export const ConfettiPiece = ({
  color,
  leftPercent,
  duration,
  delay,
}: ConfettiPieceProps) => {
  // 0 at the top, 1 once it has fallen all the way and faded.
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      delay,
      withTiming(1, { duration, easing: Easing.linear })
    );
  }, [progress, duration, delay]);

  const style = useAnimatedStyle(() => ({
    opacity: 1 - progress.value,
    transform: [
      { translateY: progress.value * FALL_DISTANCE },
      { rotate: `${progress.value * 540}deg` },
    ],
  }));

  return <Piece style={style} $color={color} $leftPercent={leftPercent} />;
};
