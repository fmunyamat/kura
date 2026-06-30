// TaskDetailsModal — a floating focus card that reveals the full detail for a
// task when the user taps "More details →". The card uses the exact same glass
// surface as an open task row — BlurView backdrop, deckCardExpanded tint,
// glassClearEdge border — but without the photo strip. The background dims and
// the card scales up into the centre of the screen. Tapping outside or the ×
// button dismisses it.

import { BlurView } from 'expo-blur';
import { Platform, ScrollView } from 'react-native';
import Animated, { ZoomIn } from 'react-native-reanimated';
import styled from 'styled-components/native';

import type { TaskDetails } from '../../types';
import { Pressable } from 'react-native';

interface TaskDetailsModalProps {
  details: TaskDetails;
  isVisible: boolean;
  onClose: () => void;
}

// ── layout shells ───────────────────────────────────────────────────────────

// Root — full-screen flex container that centres the floating card.
// spacing.lg padding on both sides lets the dimmed backdrop show around it.
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

// CardShell — the floating card container. Matches the open TaskRow exactly:
// same border-radius, same 1px rim (bright on top, dimmer on the other three
// sides), overflow:hidden so the BlurView is clipped to the rounded corners.
// max-height keeps long detail lists scrollable inside the card.
const CardShell = styled(Animated.View)`
  border-radius: ${({ theme }) => theme.radii.lg}px;
  overflow: hidden;
  border-width: 1px;
  border-color: ${({ theme }) => theme.colors.glassClearEdgeBottom};
  border-top-color: ${({ theme }) => theme.colors.glassClearEdge};
  max-height: 78%;
`;

// Backdrop — the frosted-glass blur layer, absolutely positioned to fill the
// card. Same intensity and tint as the open task row.
const Backdrop = styled(BlurView)`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
`;

// Tint — the thin dark-green wash over the blur that gives the surface its
// glassy fill, matching the deckCardExpanded colour used by open task rows.
const Tint = styled.View`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: ${({ theme }) => theme.colors.deckCardExpanded};
`;

// Content — the z-indexed wrapper that sits above the blur/tint layers.
// Horizontal padding matches DrawerInner in TaskRow (15px each side).
const Content = styled.View`
  position: relative;
  z-index: 1;
`;

// ── title area ───────────────────────────────────────────────────────────────

// TitleRow — the modal title and × close button, padded to match the card
// header area. The title uses fontHeaderBold matching the task row's Title.
const TitleRow = styled.View`
  flex-direction: row;
  align-items: flex-start;
  padding: 16px 15px 14px;
`;

const ModalTitle = styled.Text`
  flex: 1;
  font-family: ${({ theme }) => theme.typography.fontHeaderBold};
  font-size: 16px;
  color: ${({ theme }) => theme.colors.white};
  padding-right: 12px;
`;

// CloseButton — small rounded circle, same glass-input fill used elsewhere
// for secondary controls on the dark glass surface.
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

// ── scrollable content ────────────────────────────────────────────────────────

// ScrollArea — lets long detail lists scroll inside the fixed-height card.
// Side padding matches DrawerInner's 15px.
const ScrollArea = styled(ScrollView)`
  padding: 0 15px;
`;

// Divider — the faint rule between the title and the steps, matching the
// glassClearDivider used inside glass cards elsewhere.
const Divider = styled.View`
  height: 1px;
  background-color: ${({ theme }) => theme.colors.glassClearDivider};
  margin: 0 15px;
`;

// Steps / StepRow / StepDot / StepNumber / StepText — pixel-for-pixel copies
// of the same elements in TaskRowDetail, so the detail steps look like a
// natural continuation of the main card's steps.
const Steps = styled.View`
  margin-top: 13px;
`;

const StepRow = styled.View`
  flex-direction: row;
  align-items: center;
  gap: 10px;
  padding: 7px 0;
`;

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

// Note — the optional callout at the bottom. Lime tint marks it as a helpful
// aside, not an action step.
const Note = styled.View`
  flex-direction: row;
  gap: 8px;
  align-items: flex-start;
  background-color: rgba(184, 229, 106, 0.08);
  border-width: 1px;
  border-color: rgba(184, 229, 106, 0.18);
  border-radius: ${({ theme }) => theme.radii.md}px;
  padding: 10px 12px;
  margin-top: 12px;
  margin-bottom: 16px;
`;

const NoteIcon = styled.Text`
  font-size: 13px;
  margin-top: 1px;
`;

const NoteText = styled.Text`
  flex: 1;
  font-family: ${({ theme }) => theme.typography.fontBody};
  font-size: 11px;
  line-height: 17px;
  color: ${({ theme }) => theme.colors.lime};
`;

// ── component ────────────────────────────────────────────────────────────────

import { Modal } from 'react-native';

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

      {/* ZoomIn scales the card up from the centre as it appears, the same
          Reanimated entering pattern used by ClearedCard elsewhere. */}
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
          <TitleRow>
            <ModalTitle>{details.title}</ModalTitle>
            <CloseButton
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Close"
            >
              <CloseX>✕</CloseX>
            </CloseButton>
          </TitleRow>

          <Divider />

          <ScrollArea
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 0 }}
          >
            <Steps>
              {details.steps.map((step, index) => (
                <StepRow key={step}>
                  <StepDot>
                    <StepNumber>{index + 1}</StepNumber>
                  </StepDot>
                  <StepText>{step}</StepText>
                </StepRow>
              ))}
            </Steps>

            {details.note && (
              <Note>
                <NoteIcon>📌</NoteIcon>
                <NoteText>{details.note}</NoteText>
              </Note>
            )}
          </ScrollArea>
        </Content>
      </CardShell>
    </Root>
  </Modal>
);
