// TaskDetailsModal — a floating focus card that reveals the full detail for a
// task when the user taps "More details →". The outer shell (BlurView, tint,
// glass border, ZoomIn animation, dimmed backdrop) is unchanged from the open
// task row. The interior uses an editorial layout: a small kicker, a large hero
// stat, numbered steps separated by thin rules, and a pull-quote at the bottom.

import { BlurView } from 'expo-blur';
import { Modal, Platform, ScrollView } from 'react-native';
import Animated, { ZoomIn } from 'react-native-reanimated';
import { Pressable } from 'react-native';
import styled from 'styled-components/native';

import type { TaskDetails } from '../../types';

interface TaskDetailsModalProps {
  details: TaskDetails;
  isVisible: boolean;
  onClose: () => void;
}

// ── outer shell (unchanged) ──────────────────────────────────────────────────

// Root — full-screen flex container that centres the floating card.
const Root = styled.View`
  flex: 1;
  justify-content: center;
  align-items: stretch;
  padding: 0 ${({ theme }) => theme.spacing.lg}px;
`;

// Dim — the full-screen dark layer behind the card. Pressable so tapping
// anywhere outside the card closes the modal.
const Dim = styled(Pressable)`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.65);
`;

// CardShell — the floating card. Matches the open TaskRow: same border-radius,
// same 1px rim (bright top, dimmer elsewhere), overflow:hidden clips the blur.
const CardShell = styled(Animated.View)`
  border-radius: ${({ theme }) => theme.radii.lg}px;
  overflow: hidden;
  border-width: 1px;
  border-color: ${({ theme }) => theme.colors.glassClearEdgeBottom};
  border-top-color: ${({ theme }) => theme.colors.glassClearEdge};
  max-height: 78%;
`;

// Backdrop — frosted-glass blur layer, absolutely filling the card.
const Backdrop = styled(BlurView)`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
`;

// Tint — dark-green wash over the blur, matching deckCardExpanded on open rows.
const Tint = styled.View`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: ${({ theme }) => theme.colors.deckCardExpanded};
`;

// Content — sits above the blur/tint layers.
const Content = styled.View`
  position: relative;
  z-index: 1;
`;

// ── editorial interior ───────────────────────────────────────────────────────

// TopRow — kicker text on the left, close button on the right. The kicker
// sets the category and framing (e.g. "Watering · The one rule").
const TopRow = styled.View`
  flex-direction: row;
  align-items: flex-start;
  justify-content: space-between;
  padding: 18px 16px 0;
`;

// Kicker — tiny all-caps lime mono label. Matches ed-kick from the editorial
// concept: 9px JetBrains, 2.5px letter-spacing, uppercase. Sets the scene
// before the hero stat lands.
const Kicker = styled.Text`
  flex: 1;
  font-family: ${({ theme }) => theme.typography.fontBodyMedium};
  font-size: 9px;
  letter-spacing: 2.5px;
  text-transform: uppercase;
  color: ${({ theme }) => theme.colors.lime};
  padding-right: 12px;
  margin-top: 2px;
`;

// CloseButton — small rounded circle, same glass-input fill as other secondary
// controls on the dark glass surface.
const CloseButton = styled(Pressable)`
  width: 26px;
  height: 26px;
  border-radius: 13px;
  background-color: ${({ theme }) => theme.colors.glassClearInput};
  border-width: 1px;
  border-color: ${({ theme }) => theme.colors.glassClearDivider};
  align-items: center;
  justify-content: center;
`;

const CloseX = styled.Text`
  font-family: ${({ theme }) => theme.typography.fontBody};
  font-size: 12px;
  color: ${({ theme }) => theme.colors.textMutedOnDark};
`;

// HeroBlock — the editorial splash zone between the kicker and the steps.
// Only rendered when the TaskDetails includes a hero value; tasks without a
// single core fact skip this block entirely.
const HeroBlock = styled.View`
  padding: 14px 16px 0;
`;

// HeroStat — the big number or phrase. ZalandoSans-Bold at 48px with tight
// leading so multi-line values (e.g. "Pull\nthe root.") still read as a unit.
const HeroStat = styled.Text`
  font-family: ${({ theme }) => theme.typography.fontHeaderBold};
  font-size: 48px;
  line-height: 50px;
  color: ${({ theme }) => theme.colors.white};
`;

// HeroSubLine — the supporting line beneath the stat. Medium-weight header
// font at 20px — large enough to balance the hero above, quiet enough not to
// compete with it.
const HeroSubLine = styled.Text`
  font-family: ${({ theme }) => theme.typography.fontHeader};
  font-size: 20px;
  line-height: 24px;
  color: ${({ theme }) => theme.colors.textMutedOnDark};
  margin-top: 2px;
`;

// ── step list ────────────────────────────────────────────────────────────────

// ScrollArea — scrolls when the step list + hero exceed the card's max-height.
const ScrollArea = styled(ScrollView)`
  padding: 0;
`;

// StepList — the vertical container for all step rows. Top margin creates
// breathing room below the hero block (or kicker if there is no hero).
const StepList = styled.View`
  margin-top: 16px;
  margin-horizontal: 16px;
`;

// StepRow — one numbered step. A thin rule along the top separates it from the
// row above, matching the ed-step border-top pattern from the editorial concept.
// The last row also draws a border on the bottom via StepRowLast.
const StepRow = styled.View`
  flex-direction: row;
  align-items: flex-start;
  gap: 12px;
  padding: 12px 0;
  border-top-width: 1px;
  border-top-color: ${({ theme }) => theme.colors.glassClearDivider};
`;

// StepRowLast — same as StepRow but adds a bottom border so the list has a
// closed bottom edge before the pull-quote.
const StepRowLast = styled(StepRow)`
  border-bottom-width: 1px;
  border-bottom-color: ${({ theme }) => theme.colors.glassClearDivider};
`;

// StepNum — the inline lime number. No dot circle — editorial uses the number
// directly as a typographic element, in the header font at 15px.
const StepNum = styled.Text`
  font-family: ${({ theme }) => theme.typography.fontHeaderBold};
  font-size: 15px;
  line-height: 18px;
  color: ${({ theme }) => theme.colors.lime};
  width: 16px;
  flex-shrink: 0;
`;

// StepText — the step body copy. Matches ed-st: 11.5px mono, 1.55 leading,
// white at 85% so it reads clearly on the dark glass surface.
const StepText = styled.Text`
  flex: 1;
  font-family: ${({ theme }) => theme.typography.fontBody};
  font-size: 11.5px;
  line-height: 18px;
  color: ${({ theme }) => theme.colors.textOnDark};
`;

// ── pull-quote ────────────────────────────────────────────────────────────────

// PullQuote — the editorial note treatment: a 2px lime left border with the
// note text as an italicised aside. Replaces the old lime-tinted box so the
// note feels like a magazine pull-quote, not a warning callout.
const PullQuote = styled.View`
  border-left-width: 2px;
  border-left-color: ${({ theme }) => theme.colors.lime};
  padding-left: 12px;
  margin: 16px 16px 20px;
`;

// PullQuoteText — header font (serif feel) italicised at 12.5px lime-tinted.
// fontHeader is the closest to the mockup's serif italic.
const PullQuoteText = styled.Text`
  font-family: ${({ theme }) => theme.typography.fontHeader};
  font-size: 12.5px;
  line-height: 19px;
  color: ${({ theme }) => theme.colors.lime};
`;

// ── component ────────────────────────────────────────────────────────────────

export const TaskDetailsModal = ({
  details,
  isVisible,
  onClose,
}: TaskDetailsModalProps) => (
  <Modal
    visible={isVisible}
    transparent
    animationType="fade"
    onRequestClose={onClose}
  >
    <Root>
      <Dim onPress={onClose} accessibilityLabel="Close details" />

      {/* ZoomIn scales the card up from the centre as it appears. */}
      <CardShell entering={ZoomIn.duration(240)}>
        <Backdrop
          intensity={60}
          tint="dark"
          experimentalBlurMethod={
            Platform.OS === 'android' ? 'dimezisBlurView' : undefined
          }
        />
        <Tint />

        <Content>
          {/* Kicker + close button — always present */}
          <TopRow>
            <Kicker>{details.title}</Kicker>
            <CloseButton
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Close"
            >
              <CloseX>✕</CloseX>
            </CloseButton>
          </TopRow>

          {/* Hero stat block — only when the task has a single core fact */}
          {details.hero != null && (
            <HeroBlock>
              <HeroStat>{details.hero}</HeroStat>
              {details.heroSub != null && (
                <HeroSubLine>{details.heroSub}</HeroSubLine>
              )}
            </HeroBlock>
          )}

          <ScrollArea
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 0 }}
          >
            <StepList>
              {details.steps.map((step, index) => {
                const isLast = index === details.steps.length - 1;
                const Row = isLast ? StepRowLast : StepRow;
                return (
                  <Row key={step}>
                    <StepNum>{index + 1}</StepNum>
                    <StepText>{step}</StepText>
                  </Row>
                );
              })}
            </StepList>

            {details.note != null && (
              <PullQuote>
                <PullQuoteText>{details.note}</PullQuoteText>
              </PullQuote>
            )}
          </ScrollArea>
        </Content>
      </CardShell>
    </Root>
  </Modal>
);
