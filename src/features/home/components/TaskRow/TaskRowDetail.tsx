// TaskRowDetail — everything that's revealed when a row is opened: a photo strip
// for the task, the plain-English description, and the numbered steps. It's the
// inner content only; the parent (TaskRow) wraps it in the clipped, animated
// drawer that grows it open, so this component has no animation of its own.

import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import type { ImageSourcePropType } from 'react-native';
import styled, { useTheme } from 'styled-components/native';

interface TaskRowDetailProps {
  image: ImageSourcePropType;
  description: string;
  steps: string[];
  // isLocked — the locked preview swaps each step's number for a small lock.
  isLocked: boolean;
}

// Photo — a short image band at the top of the open detail, with a dark fade
// laid over it so the text just below always stays readable.
const Photo = styled.View`
  height: 96px;
  margin-top: 12px;
  border-radius: ${({ theme }) => theme.radii.md}px;
  overflow: hidden;
`;

const PhotoImage = styled(Image)`
  width: 100%;
  height: 100%;
`;

const PhotoFade = styled(LinearGradient)`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
`;

const Description = styled.Text`
  margin-top: 12px;
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
// locked preview row).
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

export const TaskRowDetail = ({
  image,
  description,
  steps,
  isLocked,
}: TaskRowDetailProps) => {
  // The gradient needs its stops as a plain array, so we read them off the
  // theme directly rather than through a styled-component.
  const { colors } = useTheme();
  return (
    <>
      <Photo>
        <PhotoImage source={image} contentFit="cover" />
        <PhotoFade
          colors={[colors.photoHeaderFadeTop, colors.photoHeaderFadeBottom]}
        />
      </Photo>
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
    </>
  );
};
