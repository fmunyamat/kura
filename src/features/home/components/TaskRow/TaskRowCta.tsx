// TaskRowCta — the action area at the bottom of an open row. An unlocked task
// shows an optional "More details →" link followed by the lime "Mark complete ✓"
// pill; the locked preview shows a muted "Unlocks tomorrow" pill instead.
// Tapping "More details →" opens TaskDetailsModal as a bottom sheet over a
// dimmed background.

import * as Haptics from 'expo-haptics';
import { useState } from 'react';
import { Pressable } from 'react-native';
import styled from 'styled-components/native';

import type { TaskDetails } from '../../types';
import { TaskDetailsModal } from './TaskDetailsModal';

interface TaskRowCtaProps {
  isLocked: boolean;
  // details — when provided, a "More details →" link appears above the pill
  // that opens the bottom-sheet modal with the deeper walkthrough.
  details?: TaskDetails;
  onComplete: () => void;
}

// Pill — the button body. The locked variant swaps the lime fill for a muted
// glass well with a faint border so it reads as not-yet-available.
const Pill = styled(Pressable)<{ $isLocked: boolean }>`
  margin-top: 12px;
  width: 100%;
  padding: 14px;
  border-radius: ${({ theme }) => theme.radii.full}px;
  align-items: center;
  background-color: ${({ theme, $isLocked }) =>
    $isLocked ? theme.colors.glassClearInput : theme.colors.limeSolid};
  border-width: ${({ $isLocked }) => ($isLocked ? 1 : 0)}px;
  border-color: ${({ theme }) => theme.colors.glassClearDivider};
`;

const PillLabel = styled.Text<{ $isLocked: boolean }>`
  font-family: ${({ theme }) => theme.typography.fontHeaderBold};
  font-size: 14px;
  color: ${({ theme, $isLocked }) =>
    $isLocked ? theme.colors.subtextOnPhoto : theme.colors.primaryDeep};
`;

// DetailsLink — the small text link above the pill that opens the modal.
// Underline style uses dotted decoration so it reads as a secondary action,
// not a primary CTA like the pill below it.
const DetailsLink = styled(Pressable)`
  align-self: center;
  margin-top: 15px;
`;

const DetailsLinkText = styled.Text`
  font-family: ${({ theme }) => theme.typography.fontBody};
  font-size: 11px;
  color: ${({ theme }) => theme.colors.lime};
  text-decoration-line: underline;
  text-decoration-style: dotted;
  text-decoration-color: ${({ theme }) => theme.colors.lime};
`;

export const TaskRowCta = ({ isLocked, details, onComplete }: TaskRowCtaProps) => {
  // Controls whether the details bottom sheet is showing.
  const [isModalVisible, setIsModalVisible] = useState(false);

  const handleComplete = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onComplete();
  };

  if (isLocked) {
    return (
      <Pill $isLocked disabled accessibilityLabel="Locked until tomorrow">
        <PillLabel $isLocked>🔒 Unlocks tomorrow 6:00am</PillLabel>
      </Pill>
    );
  }

  return (
    <>
      {/* The link and modal only render when this card has detail content. */}
      {details && (
        <>
          <DetailsLink
            onPress={() => setIsModalVisible(true)}
            accessibilityRole="button"
            accessibilityLabel="View more details for this task"
          >
            <DetailsLinkText>More details →</DetailsLinkText>
          </DetailsLink>
          <TaskDetailsModal
            details={details}
            isVisible={isModalVisible}
            onClose={() => setIsModalVisible(false)}
          />
        </>
      )}

      <Pill
        $isLocked={false}
        onPress={handleComplete}
        accessibilityRole="button"
        accessibilityLabel="Mark this task done"
      >
        <PillLabel $isLocked={false}>Mark complete ✓</PillLabel>
      </Pill>
    </>
  );
};
