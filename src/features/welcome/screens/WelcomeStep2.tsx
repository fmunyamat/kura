import styled from 'styled-components/native';
import { CtaButton } from '~/shared/components/CtaButton';
import {
  BottomSpacer,
  ContentArea,
  ContentGroup,
  GapSpacer,
  TopSpacer,
} from '~/shared/components/ScreenLayout';
import { ScreenHeadline, ScreenSubtext } from '~/shared/components/ScreenTypography';

interface WelcomeStep2Props {
  onNext: () => void;
}

// Spacer12 — small gap between the task card and the caption below it.
const Spacer12 = styled.View`height: 12px;`;

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

// WelcomeStep2 — introduces the "one task per morning" concept.
// Shows a sample task list so the user can see exactly what they'll see
// in the Today tab when they start using the app.
// Layout, headline, subtext, and the CTA all come from the shared screen
// components so every step renders the identical skeleton.
const WelcomeStep2 = ({ onNext }: WelcomeStep2Props) => {
  return (
    <ContentArea>
      <TopSpacer />
      <ContentGroup>
        <ScreenHeadline>Each morning,{'\n'}one task.</ScreenHeadline>
        <ScreenSubtext>
          Kura picks the most important thing for your lawn today. You don't have to decide.
        </ScreenSubtext>
        <GapSpacer />
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
        label="Got it →"
        onPress={onNext}
        accessibilityLabel="Got it, move to next step"
        withBottomGap
      />
    </ContentArea>
  );
};

export default WelcomeStep2;
