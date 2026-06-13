// DeckCardDetailDrawer — the description and numbered steps that slide open
// when a card is tapped into its modal. It stays mounted and collapsed
// (max-height 0) the rest of the time; the parent passes an animated style that
// grows its height and fades it in.

import Animated from 'react-native-reanimated';
import styled from 'styled-components/native';

import type { AnimatedViewStyle } from './animated-style';

interface DeckCardDetailDrawerProps {
  description: string;
  steps: string[];
  isLocked: boolean;
  // animatedStyle — the max-height + opacity reveal driven by the card's modal.
  animatedStyle: AnimatedViewStyle;
}

// Drawer — clips its contents while collapsed so nothing peeks out at height 0.
const Drawer = styled(Animated.View)`
  overflow: hidden;
`;

const Description = styled.Text`
  margin-top: 9px;
  font-family: ${({ theme }) => theme.typography.fontBody};
  font-size: 11px;
  line-height: 18px;
  color: ${({ theme }) => theme.colors.textMutedOnDark};
`;

const Steps = styled.View`
  margin-top: 13px;
`;

const StepRow = styled.View`
  flex-direction: row;
  align-items: center;
  gap: 10px;
  padding: 7px 0;
`;

// StepDot — the small circle holding each step's number (or a lock on the
// locked preview card).
const StepDot = styled.View`
  width: 18px;
  height: 18px;
  border-radius: ${({ theme }) => theme.radii.full}px;
  border-width: 1px;
  border-color: ${({ theme }) => theme.colors.glassClearDivider};
  align-items: center;
  justify-content: center;
`;

const StepNumber = styled.Text`
  font-family: ${({ theme }) => theme.typography.fontBodyBold};
  font-size: 9px;
  color: ${({ theme }) => theme.colors.lime};
`;

const StepText = styled.Text`
  flex: 1;
  font-family: ${({ theme }) => theme.typography.fontBody};
  font-size: 11px;
  color: ${({ theme }) => theme.colors.textOnDark};
`;

export const DeckCardDetailDrawer = ({
  description,
  steps,
  isLocked,
  animatedStyle,
}: DeckCardDetailDrawerProps) => (
  <Drawer style={animatedStyle}>
    <Description>{description}</Description>
    <Steps>
      {steps.map((step, index) => (
        <StepRow key={step}>
          <StepDot>
            <StepNumber>{isLocked ? '🔒' : index + 1}</StepNumber>
          </StepDot>
          <StepText>{step}</StepText>
        </StepRow>
      ))}
    </Steps>
  </Drawer>
);
