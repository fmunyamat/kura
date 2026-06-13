import styled from 'styled-components/native';

interface StepProgressDotsProps {
  total: number;
  // activeIndex — 0-based index of the current step.
  activeIndex: number;
}

// DotsRow — horizontal row that centres the progress dots.
const DotsRow = styled.View`
  flex-direction: row;
  justify-content: center;
  align-items: center;
  gap: 6px;
`;

// InactiveDot — 5×5 circle shown for steps the user hasn't reached yet.
const InactiveDot = styled.View`
  width: 5px;
  height: 5px;
  border-radius: 3px;
  background-color: rgba(255, 255, 255, 0.22);
`;

// ActiveDot — wider pill (18×5) for the current step so it stands out from
// the inactive circles without changing the row's overall height.
const ActiveDot = styled.View`
  width: 18px;
  height: 5px;
  border-radius: 3px;
  background-color: rgba(255, 255, 255, 0.72);
`;

// StepProgressDots — row of progress indicators used at the top of welcome
// and onboarding screens. Renders `total` dots; the dot at `activeIndex`
// expands into a pill shape to mark the current position.
export const StepProgressDots = ({ total, activeIndex }: StepProgressDotsProps) => (
  <DotsRow>
    {Array.from({ length: total }, (_, i) =>
      i === activeIndex ? <ActiveDot key={i} /> : <InactiveDot key={i} />
    )}
  </DotsRow>
);
