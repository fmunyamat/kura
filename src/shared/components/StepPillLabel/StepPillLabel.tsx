import styled from 'styled-components/native';

interface StepPillLabelProps {
  // prefix — context label before the step count, e.g. "Quick Tour" or "Setup".
  prefix: string;
  step: number;
  total: number;
}

// Pill — semi-transparent capsule that floats over the dark photo background.
const Pill = styled.View`
  align-self: center;
  background-color: rgba(255, 255, 255, 0.10);
  border-radius: ${({ theme }) => theme.radii.full}px;
  padding: 4px 13px;
`;

// PillText — uppercase micro-label rendered inside the pill.
const PillText = styled.Text`
  font-size: 11px;
  font-weight: ${({ theme }) => theme.typography.weightBold};
  color: rgba(255, 255, 255, 0.40);
  letter-spacing: 1.6px;
  text-transform: uppercase;
`;

// StepPillLabel — the capsule-shaped step counter used in the NavBar of welcome
// and onboarding screens. Shows "{prefix} · {step} of {total}".
export const StepPillLabel = ({ prefix, step, total }: StepPillLabelProps) => (
  <Pill>
    <PillText>{prefix} · {step} of {total}</PillText>
  </Pill>
);
