// TaskDetailsModal — a floating focus card that reveals the full detail for a
// task when the user taps "More details →". Uses the same semantic token set
// as TaskRow so it responds to light and dark mode automatically: pale frosted
// glass in light mode, dark glass in dark mode. The BlurView tint also switches
// so the blur itself matches the surface.

import { BlurView } from 'expo-blur';
import { Modal, Platform, ScrollView } from 'react-native';
import Animated, { ZoomIn } from 'react-native-reanimated';
import { Pressable } from 'react-native';
import styled, { useTheme } from 'styled-components/native';

import type { TaskDetails } from '../../types';

interface TaskDetailsModalProps {
  details: TaskDetails;
  isVisible: boolean;
  onClose: () => void;
}

// ── outer shell ───────────────────────────────────────────────────────────────

// Root — full-screen flex container that centres the floating card.
const Root = styled.View`
  flex: 1;
  justify-content: center;
  align-items: stretch;
  padding: 0 ${({ theme }) => theme.spacing.lg}px;
`;

// Dim — the full-screen backdrop behind the card. Pressable so tapping outside
// closes the modal. Dark scrim works in both modes — modal backdrops are always
// dark regardless of the app's colour scheme.
const Dim = styled(Pressable)`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.55);
`;

// CardShell — the floating card. Same border-radius and 1px rim as TaskRow:
// bright top edge fading to a softer base. Semantic edge tokens so the rim
// reads correctly in both light (white glass) and dark (clear glass) modes.
const CardShell = styled(Animated.View)`
  border-radius: ${({ theme }) => theme.radii.lg}px;
  overflow: hidden;
  border-width: 1px;
  border-color: ${({ theme }) => theme.colors.glassEdgeSoft};
  border-top-color: ${({ theme }) => theme.colors.glassEdge};
  max-height: 78%;
`;

// Backdrop — frosted-glass blur, absolutely filling the card. The tint prop is
// passed from the component so it switches between light and dark with the theme.
const Backdrop = styled(BlurView)`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
`;

// Tint — the coloured wash over the blur that gives the card its glassy fill.
// rowExpandedTint is pale blue-white in light mode and dark green in dark mode,
// matching what an open TaskRow shows beneath it.
const Tint = styled.View`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: ${({ theme }) => theme.colors.rowExpandedTint};
`;

// Content — sits above the blur/tint layers.
const Content = styled.View`
  position: relative;
  z-index: 1;
`;

// ── editorial interior ────────────────────────────────────────────────────────

// TopRow — kicker text on the left, close button on the right.
const TopRow = styled.View`
  flex-direction: row;
  align-items: flex-start;
  justify-content: space-between;
  padding: 18px 16px 0;
`;

// Kicker — tiny all-caps mono label that sets the category and framing.
// accentText is lime in dark mode, sky-blue in light mode.
const Kicker = styled.Text`
  flex: 1;
  font-family: ${({ theme }) => theme.typography.fontBodyMedium};
  font-size: 9px;
  letter-spacing: 2.5px;
  text-transform: uppercase;
  color: ${({ theme }) => theme.colors.accentText};
  padding-right: 12px;
  margin-top: 2px;
`;

// CloseButton — small rounded circle. glassInput and glassDivider respond to
// theme: opaque white in light mode, translucent white in dark mode.
const CloseButton = styled(Pressable)`
  width: 26px;
  height: 26px;
  border-radius: 13px;
  background-color: ${({ theme }) => theme.colors.glassInput};
  border-width: 1px;
  border-color: ${({ theme }) => theme.colors.glassDivider};
  align-items: center;
  justify-content: center;
`;

// CloseX — the ✕ glyph inside the close button.
const CloseX = styled.Text`
  font-family: ${({ theme }) => theme.typography.fontBody};
  font-size: 12px;
  color: ${({ theme }) => theme.colors.textPhotoMuted};
`;

// HeroBlock — the editorial splash zone: a large stat + supporting line.
// Only rendered when TaskDetails includes a hero value.
const HeroBlock = styled.View`
  padding: 14px 16px 0;
`;

// HeroStat — the centrepiece number or phrase. textPhotoHeading is white in
// dark mode and near-black slate in light mode, so it always contrasts the
// glassy card surface.
const HeroStat = styled.Text`
  font-family: ${({ theme }) => theme.typography.fontHeaderBold};
  font-size: 48px;
  line-height: 50px;
  color: ${({ theme }) => theme.colors.textPhotoHeading};
`;

// HeroSubLine — the supporting line beneath the stat. textPhotoMuted sits a
// tier below the heading so it reads as context, not headline.
const HeroSubLine = styled.Text`
  font-family: ${({ theme }) => theme.typography.fontHeader};
  font-size: 20px;
  line-height: 24px;
  color: ${({ theme }) => theme.colors.textPhotoMuted};
  margin-top: 2px;
`;

// ── step list ─────────────────────────────────────────────────────────────────

// ScrollArea — scrolls when steps + hero exceed the card's max-height.
const ScrollArea = styled(ScrollView)`
  padding: 0;
`;

// StepList — vertical container for the numbered steps.
const StepList = styled.View`
  margin-top: 16px;
  margin-horizontal: 16px;
`;

// StepRow — one numbered step separated from the one above by a thin rule.
// glassDivider is a dark-slate tint in light mode and translucent white in dark.
const StepRow = styled.View`
  flex-direction: row;
  align-items: flex-start;
  gap: 12px;
  padding: 12px 0;
  border-top-width: 1px;
  border-top-color: ${({ theme }) => theme.colors.glassDivider};
`;

// StepRowLast — same as StepRow but adds a bottom border to close the list.
const StepRowLast = styled(StepRow)`
  border-bottom-width: 1px;
  border-bottom-color: ${({ theme }) => theme.colors.glassDivider};
`;

// StepNum — the inline accent number. Matches the Kicker accent so steps feel
// visually connected to the category label at the top.
const StepNum = styled.Text`
  font-family: ${({ theme }) => theme.typography.fontHeaderBold};
  font-size: 15px;
  line-height: 18px;
  color: ${({ theme }) => theme.colors.accentText};
  width: 16px;
  flex-shrink: 0;
`;

// StepText — the step body copy. textPhotoBody is 85% white in dark mode and
// 80% dark-slate in light mode — readable on both glass surfaces.
const StepText = styled.Text`
  flex: 1;
  font-family: ${({ theme }) => theme.typography.fontBody};
  font-size: 11.5px;
  line-height: 18px;
  color: ${({ theme }) => theme.colors.textPhotoBody};
`;

// ── pull-quote ────────────────────────────────────────────────────────────────

// PullQuote — a 2px accent left border with the note as an aside. The border
// and text both use accentText so the pull-quote reads as the same voice as
// the kicker and step numbers.
const PullQuote = styled.View`
  border-left-width: 2px;
  border-left-color: ${({ theme }) => theme.colors.accentText};
  padding-left: 12px;
  margin: 16px 16px 20px;
`;

// PullQuoteText — the highlighted quote line in the modal, styled larger and in
// the accent colour to stand out from the surrounding body text.
const PullQuoteText = styled.Text`
  font-family: ${({ theme }) => theme.typography.fontHeader};
  font-size: 12.5px;
  line-height: 19px;
  color: ${({ theme }) => theme.colors.accentText};
`;

// ── component ─────────────────────────────────────────────────────────────────

export const TaskDetailsModal = ({
  details,
  isVisible,
  onClose,
}: TaskDetailsModalProps) => {
  // mode drives the BlurView tint so the blur itself matches the theme surface:
  // a light frost in light mode, a dark frost in dark mode.
  const { mode } = useTheme();

  return (
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
            tint={mode === 'dark' ? 'dark' : 'light'}
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
};
