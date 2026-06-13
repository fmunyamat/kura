// DoneStamp — the rotated "DONE" badge that slams onto a card the moment it's
// completed, just before the card flies off the deck. It sits invisibly over
// every card and is revealed only by the animated style (scale + opacity) the
// parent drives during completion.

import Animated from 'react-native-reanimated';
import styled from 'styled-components/native';

import type { AnimatedViewStyle } from './animated-style';

interface DoneStampProps {
  animatedStyle: AnimatedViewStyle;
}

// Stamp — centred over the card, pinned a little above the middle. The -14°
// tilt lives in the animated transform alongside the slam scale.
const Stamp = styled(Animated.View)`
  position: absolute;
  top: 38%;
  align-self: center;
  border-width: 4px;
  border-color: ${({ theme }) => theme.colors.limeSolid};
  border-radius: 10px;
  padding: 6px 18px;
  background-color: ${({ theme }) => theme.colors.emojiBadgeSurface};
`;

const StampText = styled.Text`
  font-family: ${({ theme }) => theme.typography.fontHeaderHeavy};
  font-size: 34px;
  letter-spacing: 4px;
  color: ${({ theme }) => theme.colors.limeSolid};
`;

export const DoneStamp = ({ animatedStyle }: DoneStampProps) => (
  <Stamp style={animatedStyle} pointerEvents="none">
    <StampText>DONE</StampText>
  </Stamp>
);
