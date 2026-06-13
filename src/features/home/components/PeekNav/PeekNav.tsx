// PeekNav — the ‹ · label · › row under the deck. The arrows lean the front
// card aside to peek at what's behind without committing to anything; the label
// in the middle says which card you're looking at. Arrows dim and stop
// responding at the ends of the deck.

import * as Haptics from 'expo-haptics';
import { Pressable } from 'react-native';
import styled from 'styled-components/native';

interface PeekNavProps {
  label: string;
  canPeekBack: boolean;
  canPeekForward: boolean;
  onPeekBack: () => void;
  onPeekForward: () => void;
}

const Row = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: 16px;
  margin-top: 16px;
`;

// Button — a round glass control. It dims to 30% when there's nothing more to
// peek at in that direction.
const Button = styled(Pressable)<{ $disabled: boolean }>`
  width: 38px;
  height: 38px;
  border-radius: ${({ theme }) => theme.radii.full}px;
  border-width: 1px;
  border-color: ${({ theme }) => theme.colors.glassClearDivider};
  background-color: ${({ theme }) => theme.colors.glassClearInput};
  align-items: center;
  justify-content: center;
  opacity: ${({ $disabled }) => ($disabled ? 0.3 : 1)};
`;

const Arrow = styled.Text`
  font-family: ${({ theme }) => theme.typography.fontBody};
  font-size: 15px;
  color: ${({ theme }) => theme.colors.textOnDark};
`;

const Label = styled.Text`
  min-width: 120px;
  text-align: center;
  font-family: ${({ theme }) => theme.typography.fontBody};
  font-size: 9px;
  letter-spacing: 1.6px;
  text-transform: uppercase;
  color: ${({ theme }) => theme.colors.subtextOnPhoto};
`;

export const PeekNav = ({
  label,
  canPeekBack,
  canPeekForward,
  onPeekBack,
  onPeekForward,
}: PeekNavProps) => {
  // A light tick on each peek so flipping through the deck feels physical.
  const handleBack = () => {
    Haptics.selectionAsync();
    onPeekBack();
  };
  const handleForward = () => {
    Haptics.selectionAsync();
    onPeekForward();
  };

  return (
    <Row>
      <Button
        $disabled={!canPeekBack}
        disabled={!canPeekBack}
        onPress={handleBack}
        accessibilityRole="button"
        accessibilityLabel="Peek at the previous card"
      >
        <Arrow>‹</Arrow>
      </Button>
      <Label>{label}</Label>
      <Button
        $disabled={!canPeekForward}
        disabled={!canPeekForward}
        onPress={handleForward}
        accessibilityRole="button"
        accessibilityLabel="Peek at the next card"
      >
        <Arrow>›</Arrow>
      </Button>
    </Row>
  );
};
