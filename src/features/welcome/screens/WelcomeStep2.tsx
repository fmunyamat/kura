import { Pressable } from 'react-native';
import styled from 'styled-components/native';
import { useIsTablet, type TabletProps } from '~/shared/hooks/use-is-tablet';

interface WelcomeStep2Props {
  onNext: () => void;
}

// ContentArea — flex column that fills the space below the shared dots row.
// On tablets, horizontal padding increases so content doesn't stretch edge-to-edge.
const ContentArea = styled.View<TabletProps>`
  flex: 1;
  padding: 0 ${({ theme, $isTablet }) =>
    $isTablet ? theme.spacing.xxl : theme.spacing.md}px;
`;

// SpacerCard — gap between subtext and the task card; matches the Spacer32
// equivalent used in Step1 so the two screens feel visually consistent.
const SpacerCard = styled.View<TabletProps>`
  height: ${({ $isTablet }) => ($isTablet ? 100 : 60)}px;
`;

// Spacer12 — small gap between the task card and the caption below it.
const Spacer12 = styled.View`height: 12px;`;

// TopSpacer — pushes the content group down slightly from the NavRow.
// flex: 0.2 matches Step1 so the content sits in the same vertical position.
const TopSpacer = styled.View`flex: 0.2;`;

// BottomSpacer — absorbs remaining space below the content group, pinning
// the CTA to the bottom of the screen.
const BottomSpacer = styled.View`flex: 1;`;

// ContentGroup — wraps headline through card as one unit so the whole block
// moves together in the vertical layout. Matches Step1's structure.
const ContentGroup = styled.View``;

// Headline — the step's main heading. Uses fontHeaderHeavy and tablet-aware
// sizing to match Step1's typographic scale.
const Headline = styled.Text<TabletProps>`
  font-family: ${({ theme }) => theme.typography.fontHeaderHeavy};
  font-size: ${({ $isTablet }) => ($isTablet ? 76 : 50)}px;
  color: #ffffff;
  letter-spacing: ${({ theme }) => theme.typography.letterSpacingTight}px;
  text-align: center;
  line-height: ${({ $isTablet }) => ($isTablet ? 90 : 60)}px;
`;

// Subtext — supporting copy below the headline in body-medium weight, muted white.
// Matches Step1's Subtext styling exactly.
const Subtext = styled.Text<TabletProps>`
  font-family: ${({ theme }) => theme.typography.fontBodyMedium};
  font-size: ${({ $isTablet }) => ($isTablet ? 17 : 11)}px;
  color: rgba(255, 255, 255, 0.48);
  text-align: center;
  line-height: ${({ $isTablet }) => ($isTablet ? 28 : 18)}px;
  padding: 0 ${({ theme }) => theme.spacing.sm}px;
  margin-top: ${({ theme, $isTablet }) =>
    $isTablet ? theme.spacing.md : theme.spacing.sm}px;
`;

// TaskCard — glass panel containing the sample task list preview.
// Background and border-radius match Step1's GlassCard.
const TaskCard = styled.View`
  background-color: rgba(255, 255, 255, 0.44);
  border-radius: ${({ theme }) => theme.radii.lg}px;
  overflow: hidden;
`;

// TaskRow — one task entry inside the card. First row has no top border;
// subsequent rows use a divider to separate them. Divider is white-tinted
// to stay visible against the white-frosted card surface.
const TaskRow = styled.View<{ $first: boolean }>`
  flex-direction: row;
  align-items: center;
  gap: 12px;
  padding: 16px;
  ${({ $first }) =>
    !$first ? 'border-top-width: 1px; border-top-color: rgba(255, 255, 255, 0.18);' : ''}
`;

const TaskIcon = styled.Text`font-size: 32px;`;

const TaskBody = styled.View`flex: 1;`;

// TaskName — task title inside the card. White to match the headline color,
// consistent with the text color change applied to Step1's GlassCard.
const TaskName = styled.Text`
  font-family: ${({ theme }) => theme.typography.fontHeaderBold};
  font-size: 14px;
  color: #ffffff;
`;

// TaskMeta — secondary detail line below the task name. Muted white to
// match Step1's CardDesc treatment.
const TaskMeta = styled.Text`
  font-family: ${({ theme }) => theme.typography.fontBody};
  font-size: 11px;
  color: rgba(255, 255, 255, 0.72);
  margin-top: 2px;
  line-height: 17px;
`;

// UrgencyPill — small badge on the right of each task row showing TODAY or SOON.
// White-tinted pill so it reads against the frosted card background.
const UrgencyPill = styled.View`
  background-color: rgba(255, 255, 255, 0.15);
  border-radius: ${({ theme }) => theme.radii.sm}px;
  padding: 3px 8px;
`;

const UrgencyText = styled.Text`
  font-size: 9px;
  font-weight: ${({ theme }) => theme.typography.weightBold};
  color: rgba(255, 255, 255, 0.60);
`;

// Caption — small explanatory text below the task card.
const Caption = styled.Text`
  font-size: 9.5px;
  font-weight: ${({ theme }) => theme.typography.weightMedium};
  color: rgba(255, 255, 255, 0.30);
  text-align: center;
  padding: 0 ${({ theme }) => theme.spacing.lg}px;
  line-height: 15px;
`;

// CtaButton — dark pill at the bottom, scales on tablet to match Step1.
const CtaButton = styled(Pressable)<TabletProps>`
  background-color: ${({ theme }) => theme.colors.primary};
  border-radius: ${({ theme }) => theme.radii.md}px;
  padding: ${({ $isTablet }) => ($isTablet ? '22px 18px' : '14px 12px')};
  margin-bottom: ${({ theme }) => theme.spacing.md}px;
`;

// CtaLabel — button text, scales from 14px to 22px on tablets.
const CtaLabel = styled.Text<TabletProps>`
  font-family: ${({ theme }) => theme.typography.fontBodyBold};
  font-size: ${({ $isTablet }) => ($isTablet ? 22 : 14)}px;
  color: #D6EFD8;
  text-align: center;
`;

// WelcomeStep2 — introduces the "one task per morning" concept.
// Shows a sample task list so the user can see exactly what they'll see
// in the Today tab when they start using the app.
// Tablet scaling and layout structure match Step1 for visual consistency.
const WelcomeStep2 = ({ onNext }: WelcomeStep2Props) => {
  const isTablet = useIsTablet();

  return (
    <ContentArea $isTablet={isTablet}>
      <TopSpacer />
      <ContentGroup>
        <Headline $isTablet={isTablet}>Each morning,{'\n'}one task.</Headline>
        <Subtext $isTablet={isTablet}>
          Kura picks the most important thing for your lawn today. You don't have to decide.
        </Subtext>
        <SpacerCard $isTablet={isTablet} />
        <TaskCard>
          <TaskRow $first>
            <TaskIcon>💧</TaskIcon>
            <TaskBody>
              <TaskName>Water the lawn</TaskName>
              <TaskMeta>Due today · 15 min · Most urgent</TaskMeta>
            </TaskBody>
            <UrgencyPill><UrgencyText>TODAY</UrgencyText></UrgencyPill>
          </TaskRow>
          <TaskRow $first={false}>
            <TaskIcon>✂️</TaskIcon>
            <TaskBody>
              <TaskName>Mow the backyard</TaskName>
              <TaskMeta>Tomorrow · 30 min</TaskMeta>
            </TaskBody>
            <UrgencyPill><UrgencyText>SOON</UrgencyText></UrgencyPill>
          </TaskRow>
        </TaskCard>
        <Spacer12 />
        <Caption>
          Kura schedules tasks based on your grass type, location, and the time of year.
        </Caption>
      </ContentGroup>
      <BottomSpacer />
      <CtaButton
        $isTablet={isTablet}
        onPress={onNext}
        accessibilityRole="button"
        accessibilityLabel="Got it, move to next step"
      >
        <CtaLabel $isTablet={isTablet}>Got it →</CtaLabel>
      </CtaButton>
    </ContentArea>
  );
};

export default WelcomeStep2;
