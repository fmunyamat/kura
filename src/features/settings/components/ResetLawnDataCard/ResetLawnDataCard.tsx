// ResetLawnDataCard — the "I've moved" control on the Settings screen.
// Starts minimized: a single row sized exactly like the Account section's
// "Log out" row, so Data doesn't loom over the rest of the screen until the
// user actually wants it. Tapping that row swaps in the full warning
// banner — a red card explaining in plain English what resetting does, plus
// a press-and-hold button (instead of a single tap) that actually triggers
// it. A beginner has to both open it on purpose, read the risk, and
// deliberately hold for 2 seconds — there's no single accidental tap that
// could wipe their saved lawn profile and task history. Tapping the
// banner's header again collapses it back to the row.
//
// The hold gesture reuses the same technique as the Today screen's "Mark
// complete" pill (see TaskRowCta.tsx): a Reanimated shared value fills the
// button from empty to full over 2 seconds while the user holds, and a
// plain setTimeout is the actual trigger so the visual animation and the
// real completion always agree. Releasing early snaps the fill back to
// empty instantly and cancels the hold.

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

interface ResetLawnDataCardProps {
  onReset: () => void;
}

// How long the user must hold before the reset actually fires (milliseconds).
// Matches the Today screen's "Mark complete" hold so the gesture feels the
// same everywhere in the app.
const HOLD_MS = 2000;

// A darker shade of the button's own red, used for the fill that sweeps in
// as the user holds — the same "base colour + darker pressed colour" pairing
// TaskRowCta uses for its lime pill and curtain panels.
const BUTTON_BASE = '#d33417';
const BUTTON_FILL = '#9c2510';

// CollapsedRow — the minimized state. Same padding, gap, icon size, and
// border-radius as the Account section's "Log out" row (Row/RowIcon in
// SettingsScreen.tsx) so it occupies exactly the same footprint. Background
// and border match Card exactly (below) so the row reads as the same
// surface before and after it's expanded, not a different shade of red.
const CollapsedRow = styled(Pressable)`
  flex-direction: row;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm}px;
  padding: 12px 14px;
  border-radius: ${({ theme }) => theme.radii.lg}px;
  border-width: 1px;
  background-color: rgba(239, 68, 68, 0.47);
  border-color: rgba(239, 68, 68, 0.18);
  border-top-color: rgba(255, 189, 189, 0.32);
`;

const CollapsedIcon = styled.View`
  width: 34px;
  height: 34px;
  border-radius: ${({ theme }) => theme.radii.sm}px;
  background-color: rgba(239, 68, 68, 0.18);
  align-items: center;
  justify-content: center;
`;

const CollapsedIconText = styled.Text`
  font-size: 15px;
`;

// CollapsedBody — holds the name + description stack, filling the space
// between the icon and the chevron (same role RowName plays in the plain
// Account row, just split into two lines here).
const CollapsedBody = styled.View`
  flex: 1;
`;

const CollapsedName = styled.Text`
  font-family: ${({ theme }) => theme.typography.fontBodyBold};
  font-size: 12px;
  color: rgba(255, 255, 255, 0.95);
`;

// CollapsedDesc — the small line under "I've moved" spelling out what
// tapping it does, so the row doesn't rely on the icon alone.
const CollapsedDesc = styled.Text`
  margin-top: 2px;
  font-family: ${({ theme }) => theme.typography.fontBody};
  font-size: 9.5px;
  line-height: 13px;
  color: rgba(255, 255, 255, 0.7);
`;

const CollapsedChevron = styled.Text`
  font-size: 14px;
  color: rgba(255, 255, 255, 0.55);
`;

// Card — the red banner itself. Sits in the red family the rest of the
// Settings screen's danger styling already uses (two-tone rim: a soft border
// with a slightly brighter top edge, same as every other glass card here).
const Card = styled.View`
  background-color: rgba(239, 68, 68, 0.47);
  border-radius: ${({ theme }) => theme.radii.lg}px;
  border-width: 1px;
  border-color: rgba(239, 68, 68, 0.18);
  border-top-color: rgba(255, 189, 189, 0.32);
  padding: 15px 15px 14px;
`;

// Top — the icon + headline + description row at the top of the banner.
// Tappable: tapping it while expanded collapses back to CollapsedRow.
const Top = styled(Pressable)`
  flex-direction: row;
  align-items: flex-start;
  gap: 10px;
`;

const WarningIcon = styled.Text`
  font-size: 20px;
  line-height: 22px;
`;

const TextGroup = styled.View`
  flex: 1;
`;

const Headline = styled.Text`
  font-family: ${({ theme }) => theme.typography.fontHeaderHeavy};
  font-size: 14.5px;
  color: rgba(255, 255, 255, 0.95);
`;

const Description = styled.Text`
  margin-top: 4px;
  font-family: ${({ theme }) => theme.typography.fontBody};
  font-size: 10px;
  line-height: 16px;
  color: rgba(255, 255, 255, 0.75);
`;

// HoldButton — the button body. overflow: hidden clips the fill bar to the
// button's rounded edges as it sweeps in from the left.
const HoldButton = styled(Pressable)`
  margin-top: 13px;
  width: 100%;
  padding: 13px;
  border-radius: ${({ theme }) => theme.radii.full}px;
  align-items: center;
  overflow: hidden;
  background-color: ${BUTTON_BASE};
`;

// FillBar — grows from 0 to the button's full width while the user holds.
// left/width are driven by useAnimatedStyle so we avoid percentage CSS,
// which doesn't play well with animated widths in styled-components/native.
const FillBar = styled(Animated.View)`
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  background-color: ${BUTTON_FILL};
`;

// ButtonLabel — sits after FillBar in the JSX tree so it always paints on
// top of it, regardless of the fill's current width.
const ButtonLabel = styled.Text`
  font-family: ${({ theme }) => theme.typography.fontHeaderBold};
  font-size: 13px;
  color: #ffffff;
`;

const HoldHint = styled.Text`
  margin-top: 8px;
  font-family: ${({ theme }) => theme.typography.fontBody};
  font-size: 8.5px;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.55);
  text-align: center;
`;

export const ResetLawnDataCard = ({ onReset }: ResetLawnDataCardProps) => {
  // isExpanded — false shows the minimized CollapsedRow; true shows the full
  // warning banner + hold button. Starts collapsed.
  const [isExpanded, setIsExpanded] = useState(false);

  // holdPhase drives the button's label text:
  //   idle    → "Hold to reset lawn data"  (default, fill bar empty)
  //   holding → "Keep holding…"            (fill bar sweeping in)
  //   done    → "✓ Reset started"          (fill bar retreated)
  const [holdPhase, setHoldPhase] = useState<'idle' | 'holding' | 'done'>('idle');

  // fullWidth is measured from the button's onLayout and tells the fill bar
  // how far to grow. A shared value keeps this on the UI thread so reads
  // inside useAnimatedStyle don't trigger JS re-renders.
  const fullWidth = useSharedValue(0);

  // fillWidth: 0 = bar fully empty, fullWidth.value = bar fully filled.
  const fillWidth = useSharedValue(0);

  // holdTimerRef drives the JS-side 2-second countdown. Stored in a ref so
  // handlePressOut can cancel it without a re-render.
  const holdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // isCompletedRef is a synchronous guard so handlePressOut (which can fire
  // even after a successful hold on some gesture systems) doesn't reset a
  // completed button.
  const isCompletedRef = useRef(false);

  const fillStyle = useAnimatedStyle(() => ({
    width: fillWidth.value,
  }));

  // triggerReset — called after the full 2-second hold. Empties the fill bar
  // with a quick ease, then fires the haptic, shows "Reset started", and
  // calls onReset once the user has seen that confirmation.
  const triggerReset = () => {
    isCompletedRef.current = true;

    fillWidth.value = withTiming(0, {
      duration: 220,
      easing: Easing.out(Easing.cubic),
    });

    setTimeout(() => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setHoldPhase('done');
      setTimeout(onReset, 400);
    }, 220);
  };

  const handlePressIn = () => {
    if (fullWidth.value === 0) return; // layout not yet measured, ignore
    if (isCompletedRef.current) return;

    setHoldPhase('holding');

    fillWidth.value = withTiming(fullWidth.value, {
      duration: HOLD_MS,
      easing: Easing.linear,
    });

    // JS-side timer is the actual completion signal — it runs for the same
    // HOLD_MS as the visual fill so the two finish together.
    holdTimerRef.current = setTimeout(triggerReset, HOLD_MS);
  };

  const handlePressOut = () => {
    if (isCompletedRef.current) return;

    if (holdTimerRef.current !== null) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }

    setHoldPhase('idle');
    fillWidth.value = 0;
  };

  const labelText =
    holdPhase === 'done'    ? '✓ Reset started'          :
    holdPhase === 'holding' ? 'Keep holding…'             :
                              'Hold to reset lawn data';

  if (!isExpanded) {
    return (
      <CollapsedRow
        onPress={() => setIsExpanded(true)}
        accessibilityRole="button"
        accessibilityLabel="I've moved. Shows the lawn data reset option"
      >
        <CollapsedIcon>
          <CollapsedIconText>📦</CollapsedIconText>
        </CollapsedIcon>
        <CollapsedBody>
          <CollapsedName>I&apos;ve moved</CollapsedName>
          <CollapsedDesc>Reset Lawn Data</CollapsedDesc>
        </CollapsedBody>
        <CollapsedChevron>›</CollapsedChevron>
      </CollapsedRow>
    );
  }

  return (
    <Card>
      <Top
        onPress={() => setIsExpanded(false)}
        accessibilityRole="button"
        accessibilityLabel="Collapse the lawn data reset option"
      >
        <WarningIcon>⚠️</WarningIcon>
        <TextGroup>
          <Headline>Moving to a new lawn?</Headline>
          <Description>
            Resetting clears your saved lawn profile and task history, so setup
            starts clean at the new address.
          </Description>
        </TextGroup>
      </Top>

      <HoldButton
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onLayout={({ nativeEvent }) => {
          fullWidth.value = nativeEvent.layout.width;
        }}
        disabled={holdPhase === 'done'}
        accessibilityRole="button"
        accessibilityLabel="Reset all lawn data and restart onboarding"
        accessibilityHint="Press and hold for 2 seconds"
      >
        <FillBar style={fillStyle} />
        <ButtonLabel>{labelText}</ButtonLabel>
      </HoldButton>
      <HoldHint>Hold for 2 seconds</HoldHint>
    </Card>
  );
};
