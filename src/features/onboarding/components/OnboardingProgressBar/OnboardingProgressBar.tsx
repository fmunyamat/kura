import styled from 'styled-components/native';

interface OnboardingProgressBarProps {
  // currentStep — 1-based index of the step currently being shown.
  currentStep: number;
  totalSteps: number;
}

// Bar — horizontal row of segments at the top of every onboarding screen.
const Bar = styled.View`
  flex-direction: row;
  padding: 0 ${({ theme }) => theme.spacing.lg}px ${({ theme }) => theme.spacing.sm}px;
  gap: 5px;
`;

type SegmentState = 'done' | 'active' | 'empty';

// Segment — one thin pill per step. done = fully opaque white (completed),
// active = semi-opaque white (current step), empty = faint white (not yet reached).
const Segment = styled.View<{ $state: SegmentState }>`
  flex: 1;
  height: 3px;
  border-radius: 2px;
  background-color: ${({ $state, theme }) =>
    $state === 'done'
      ? theme.colors.onboardingProgressDone
      : $state === 'active'
      ? theme.colors.onboardingProgressActive
      : theme.colors.onboardingProgressEmpty};
`;

// OnboardingProgressBar — renders a row of step indicator segments.
// Steps before currentStep are "done", currentStep is "active", the rest are "empty".
export const OnboardingProgressBar = ({
  currentStep,
  totalSteps,
}: OnboardingProgressBarProps) => (
  <Bar>
    {Array.from({ length: totalSteps }, (_, i) => {
      const stepNumber = i + 1;
      const state: SegmentState =
        stepNumber < currentStep
          ? 'done'
          : stepNumber === currentStep
          ? 'active'
          : 'empty';

      return (
        <Segment
          key={stepNumber}
          $state={state}
          testID="progress-segment"
          accessibilityState={{ selected: state === 'active' }}
          accessibilityValue={{ text: state }}
        />
      );
    })}
  </Bar>
);
