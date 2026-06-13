// DeckCardCta — the action pill at the bottom of a card plus the little
// "tap for details" hint above it. Unlocked cards show a lime "Done ✓" button
// that fires a success haptic; the locked preview shows a muted, disabled
// "Unlocks tomorrow" pill instead. The whole block fades with the card via the
// animated style passed from the parent (it only belongs to the front card).

import * as Haptics from 'expo-haptics';
import { Pressable } from 'react-native';
import Animated from 'react-native-reanimated';
import styled from 'styled-components/native';

import type { AnimatedViewStyle } from './animated-style';

interface DeckCardCtaProps {
  isLocked: boolean;
  // isExpanded — when the card is open as a modal the hint flips to "tap to
  // close" and the CTA is pushed to the bottom of the taller card.
  isExpanded: boolean;
  onComplete: () => void;
  animatedStyle: AnimatedViewStyle;
}

// Wrapper — owns the fade that ties the CTA to the front card. It just follows
// the content above it (the card sizes to its content, so the button always
// sits right under the steps with no dead space below).
const Wrapper = styled(Animated.View)``;

const Hint = styled.Text`
  margin-top: 12px;
  text-align: center;
  font-family: ${({ theme }) => theme.typography.fontBody};
  font-size: 8.5px;
  letter-spacing: 1.6px;
  color: ${({ theme }) => theme.colors.subtextOnPhoto};
`;

// Pill — the button body. The locked variant swaps the lime fill for a muted
// glass well with a faint border so it reads as not-yet-available.
const Pill = styled(Pressable)<{ $isLocked: boolean }>`
  margin-top: 15px;
  width: 100%;
  padding: 14px;
  border-radius: ${({ theme }) => theme.radii.full}px;
  align-items: center;
  background-color: ${({ theme, $isLocked }) =>
    $isLocked ? theme.colors.glassClearInput : theme.colors.limeSolid};
  border-width: ${({ $isLocked }) => ($isLocked ? 1 : 0)}px;
  border-color: ${({ theme }) => theme.colors.glassClearDivider};
`;

const PillLabel = styled.Text<{ $isLocked: boolean }>`
  font-family: ${({ theme }) => theme.typography.fontHeaderBold};
  font-size: 14px;
  color: ${({ theme, $isLocked }) =>
    $isLocked ? theme.colors.subtextOnPhoto : theme.colors.primaryDeep};
`;

export const DeckCardCta = ({
  isLocked,
  isExpanded,
  onComplete,
  animatedStyle,
}: DeckCardCtaProps) => {
  // Fire a success buzz, then hand control back to the deck to play the stamp.
  const handlePress = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onComplete();
  };

  return (
    <Wrapper style={animatedStyle}>
      <Hint>{isExpanded ? 'TAP TO CLOSE ⌃' : 'TAP FOR DETAILS ⌄'}</Hint>
      {isLocked ? (
        <Pill $isLocked disabled accessibilityLabel="Locked until tomorrow">
          <PillLabel $isLocked>🔒 Unlocks tomorrow 6:00am</PillLabel>
        </Pill>
      ) : (
        <Pill
          $isLocked={false}
          onPress={handlePress}
          accessibilityRole="button"
          accessibilityLabel="Mark this task done"
        >
          <PillLabel $isLocked={false}>Mark complete ✓</PillLabel>
        </Pill>
      )}
    </Wrapper>
  );
};
