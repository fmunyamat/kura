// TaskRowCta — the action area at the bottom of an open row. An unlocked task
// shows an optional "More details →" link followed by the lime "Mark complete ✓"
// pill; the locked preview shows a muted "Unlocks tomorrow" pill instead.
// Tapping "More details →" opens TaskDetailsModal as a bottom sheet over a
// dimmed background.
//
// The "Mark complete" pill requires a 2-second press-and-hold. While the user
// holds, two deep-green curtain panels wipe inward from both outer edges toward
// the centre (stage-curtain effect). On completion the panels retreat, the
// original lime surface is revealed, and the label updates to "✓ Done!" before
// the row collapses.

import * as Haptics from 'expo-haptics';
import { useRef, useState } from 'react';
import { Pressable } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
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

// How long the user must hold before the action fires (milliseconds).
const HOLD_MS = 2000;

// Pill — the button body. overflow: hidden is required so the curtain panels
// are clipped to the pill's rounded edges as they animate. The locked variant
// swaps the lime fill for a muted glass well with a faint border.
const Pill = styled(Pressable)<{ $isLocked: boolean }>`
  margin-top: 12px;
  width: 100%;
  padding: 14px;
  border-radius: ${({ theme }) => theme.radii.full}px;
  align-items: center;
  overflow: hidden;
  background-color: ${({ theme, $isLocked }) =>
    $isLocked ? theme.colors.glassClearInput : theme.colors.limeSolid};
  border-width: ${({ $isLocked }) => ($isLocked ? 1 : 0)}px;
  border-color: ${({ theme }) => theme.colors.glassClearDivider};
`;

// PillLabel — the button text. Sits after the curtain panels in the JSX tree
// so it renders on top of them — React Native paints later children over
// earlier ones regardless of position type.
const PillLabel = styled.Text<{ $isLocked: boolean }>`
  font-family: ${({ theme }) => theme.typography.fontHeaderBold};
  font-size: 14px;
  color: ${({ theme, $isLocked }) =>
    $isLocked ? theme.colors.subtextOnPhoto : theme.colors.primaryDeep};
`;

// CurtainPanel — one half of the two-panel wipe. `left` and `width` are
// driven entirely by useAnimatedStyle so we avoid percentage CSS, which is
// unreliable when combined with animated width in styled-components/native.
// `top: 0; bottom: 0` gives the panel the full pill height.
const CurtainPanel = styled(Animated.View)`
  position: absolute;
  top: 0;
  bottom: 0;
  background-color: ${({ theme }) => theme.colors.primaryMid};
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

  // holdPhase drives the pill label text:
  //   idle    → "Mark complete ✓"   (default, panels off-screen)
  //   holding → "Hold..."           (panels sliding in)
  //   done    → "✓ Done!"           (panels retreated, row about to collapse)
  const [holdPhase, setHoldPhase] = useState<'idle' | 'holding' | 'done'>('idle');

  // halfWidth is measured from the pill's onLayout and tells the panels how
  // far to grow. Using a shared value means reads inside useAnimatedStyle
  // stay on the UI thread without triggering JS re-renders.
  const halfWidth = useSharedValue(0);

  // panelWidth: 0 = both panels fully retracted at their outer edges,
  // halfWidth.value = both panels fully extended to the pill's centre.
  const panelWidth = useSharedValue(0);

  // holdTimer drives the JS-side 2-second countdown. Stored in a ref so
  // handlePressOut can cancel it without a re-render.
  const holdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // isCompleted is a synchronous guard so handlePressOut (which fires even
  // after a successful hold on some gesture systems) doesn't reset a done pill.
  const isCompletedRef = useRef(false);

  // Both panels are anchored to the pill's centre seam. As panelWidth grows
  // from 0 → halfWidth they spread outward — inside-out.
  //
  // Left panel:  left edge = halfWidth - panelWidth (starts at centre, moves left)
  //              right edge = halfWidth (always at centre)
  // Right panel: left edge = halfWidth (always at centre)
  //              right edge = halfWidth + panelWidth (moves right)
  //
  // Using pixel values inside useAnimatedStyle avoids the percentage-CSS
  // parsing issues that caused the glitch with `right: 50%`.
  const leftPanelStyle = useAnimatedStyle(() => ({
    left: halfWidth.value - panelWidth.value,
    width: panelWidth.value,
  }));
  const rightPanelStyle = useAnimatedStyle(() => ({
    left: halfWidth.value,
    width: panelWidth.value,
  }));

  // triggerComplete — called after the full 2-second hold. Retreats the panels
  // with a quick ease, then fires the haptic, shows "Done!", and collapses the
  // row after a short pause so the user can see the done state.
  const triggerComplete = () => {
    isCompletedRef.current = true;

    // Panels ease back out to their outer edges over 220ms.
    panelWidth.value = withTiming(0, {
      duration: 220,
      easing: Easing.out(Easing.cubic),
    });

    // Wait for the panels to clear before updating the label and collapsing.
    setTimeout(() => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setHoldPhase('done');
      // Short pause so the Done label is visible before the card collapses.
      setTimeout(onComplete, 400);
    }, 220);
  };

  const handlePressIn = () => {
    if (halfWidth.value === 0) return; // layout not yet measured, ignore
    if (isCompletedRef.current) return;

    setHoldPhase('holding');

    // Panels wipe inward linearly for the full hold duration.
    panelWidth.value = withTiming(halfWidth.value, {
      duration: HOLD_MS,
      easing: Easing.linear,
    });

    // JS-side timer as the primary completion signal. The visual animation
    // and this timer both run for HOLD_MS so they complete together.
    holdTimerRef.current = setTimeout(triggerComplete, HOLD_MS);
  };

  const handlePressOut = () => {
    if (isCompletedRef.current) return;

    // Clear the hold timer and snap the panels back to zero instantly.
    // Assigning directly to panelWidth.value cancels the ongoing withTiming.
    if (holdTimerRef.current !== null) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }

    setHoldPhase('idle');
    panelWidth.value = 0;
  };

  if (isLocked) {
    return (
      <Pill $isLocked disabled accessibilityLabel="Locked until tomorrow">
        <PillLabel $isLocked>🔒 Unlocks tomorrow 6:00am</PillLabel>
      </Pill>
    );
  }

  const labelText =
    holdPhase === 'done'    ? '✓ Done!'         :
    holdPhase === 'holding' ? 'Hold...'          :
                              'Mark complete ✓';

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
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onLayout={({ nativeEvent }) => {
          // Capture half the pill's width so the panels know their target size.
          // Using a shared value avoids triggering a re-render on every layout.
          halfWidth.value = nativeEvent.layout.width / 2;
        }}
        disabled={holdPhase === 'done'}
        accessibilityRole="button"
        accessibilityLabel="Hold for 2 seconds to mark this task done"
        accessibilityHint="Press and hold for 2 seconds"
      >
        {/* Left curtain panel — spreads from centre outward to the left edge. */}
        <CurtainPanel style={leftPanelStyle} />

        {/* Right curtain panel — spreads from centre outward to the right edge. */}
        <CurtainPanel style={rightPanelStyle} />

        {/* Label renders last so it paints on top of both curtain panels. */}
        <PillLabel $isLocked={false}>{labelText}</PillLabel>
      </Pill>
    </>
  );
};
