import styled from 'styled-components/native';

interface WelcomeStepLabelProps {
  step: number;
  total: number;
}

// StepPill — the pill-shaped "Quick Tour · X of N" indicator.
// Semi-transparent white background so it floats cleanly over the dark photo.
const StepPill = styled.View`
  align-self: center;
  background-color: rgba(255, 255, 255, 0.10);
  border-radius: ${({ theme }) => theme.radii.full}px;
  padding: 4px 13px;
`;

// StepText — uppercase micro-label inside the pill.
const StepText = styled.Text`
  font-size: 11px;
  font-weight: ${({ theme }) => theme.typography.weightBold};
  color: rgba(255, 255, 255, 0.40);
  letter-spacing: 1.6px;
  text-transform: uppercase;
`;

// WelcomeStepLabel — renders the "Quick Tour · X of N" pill shown on
// welcome screens 1–3. Screen 4 omits it — the checkmark handles the
// visual weight instead.
const WelcomeStepLabel = ({ step, total }: WelcomeStepLabelProps) => (
  <StepPill>
    <StepText>Quick Tour · {step} of {total}</StepText>
  </StepPill>
);

export default WelcomeStepLabel;
