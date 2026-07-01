// TaskRow — one row of the Today accordion. Collapsed, it's a quiet solid bar
// showing the task's emoji, title, and a chevron. Tapping it opens the row: the
// surface turns to frosted glass and a drawer slides down to reveal the photo,
// the steps, and the "Mark complete" button. A finished task collapses back to
// a dimmed bar with a tick. Because rows sit in a column and never overlap, the
// glass only ever blurs the photo behind it — never another card — so there's
// none of the bleed-through the old stacked deck had.

import { BlurView } from 'expo-blur';
import { Platform, Pressable } from 'react-native';
import Animated, { LinearTransition } from 'react-native-reanimated';
import styled, { useTheme } from 'styled-components/native';

import type { DeckCardData } from '../../types';
import { TaskRowCta } from './TaskRowCta';
import { TaskRowDetail } from './TaskRowDetail';
import { useTaskRowAnimation } from './useTaskRowAnimation';

// How hard the open row frosts the photo behind it. Matches the rest of the
// app's clear-glass surfaces.
const CARD_BLUR_INTENSITY = 60;

interface TaskRowProps {
  card: DeckCardData;
  isOpen: boolean;
  isDone: boolean;
  onToggle: () => void;
  onComplete: () => void;
}

// Container — the animated wrapper for the whole row. LinearTransition makes the
// rows below glide down/up when this one opens or closes. The 1px rim brightens
// along the top when the row is open, the way the app's other glass surfaces do.
const Container = styled(Animated.View)<{ $open: boolean }>`
  border-radius: ${({ theme }) => theme.radii.lg}px;
  overflow: hidden;
  border-width: 1px;
  border-color: ${({ theme, $open }) =>
    $open ? theme.colors.glassEdgeSoft : theme.colors.deckRowBorder};
  border-top-color: ${({ theme, $open }) =>
    $open ? theme.colors.glassEdge : theme.colors.deckRowBorder};
`;

// Solid — the fill + border for a collapsed row. An open row hides this behind
// the glass layers; a done row dims further so finished work recedes.
const Solid = styled.View<{ $open: boolean; $done: boolean }>`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: ${({ theme, $open, $done }) =>
    $open
      ? 'transparent'
      : $done
        ? theme.colors.deckRowSurfaceDone
        : theme.colors.deckRowSurface};
`;

// Backdrop — the real frosted-glass blur, only mounted while the row is open.
const Backdrop = styled(BlurView)`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
`;

// Tint — the thin green wash over the blur that gives the open card its glassy
// fill.
const Tint = styled.View`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: ${({ theme }) => theme.colors.rowExpandedTint};
`;

const Header = styled(Pressable)`
  flex-direction: row;
  align-items: center;
  gap: 12px;
  padding: 14px 15px;
`;

// Badge — the rounded dark square holding the task emoji.
const Badge = styled.View`
  width: 36px;
  height: 36px;
  border-radius: 11px;
  background-color: ${({ theme }) => theme.colors.emojiBadgeSurface};
  border-width: 1px;
  border-color: ${({ theme }) => theme.colors.emojiBadgeEdge};
  align-items: center;
  justify-content: center;
`;

const BadgeEmoji = styled.Text`
  font-size: 17px;
`;

const HeaderText = styled.View`
  flex: 1;
`;

const Count = styled.Text`
  font-family: ${({ theme }) => theme.typography.fontBody};
  font-size: 8px;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  color: ${({ theme }) => theme.colors.accentText};
`;

// Title — the task headline. A done task is struck through and dimmed.
const Title = styled.Text<{ $done: boolean }>`
  margin-top: 2px;
  font-family: ${({ theme }) => theme.typography.fontHeaderBold};
  font-size: 16px;
  color: ${({ theme, $done }) =>
    $done ? theme.colors.textPhotoMuted : theme.colors.textPhotoHeading};
  text-decoration-line: ${({ $done }) => ($done ? 'line-through' : 'none')};
`;

// Chevron — points down when collapsed, flips up when open (rotation animated).
const Chevron = styled(Animated.Text)`
  font-family: ${({ theme }) => theme.typography.fontBody};
  font-size: 13px;
  color: ${({ theme }) => theme.colors.textPhotoMuted};
`;

// Check — the tick shown in place of the chevron once a task is done.
const Check = styled.View`
  width: 22px;
  height: 22px;
  border-radius: ${({ theme }) => theme.radii.full}px;
  background-color: ${({ theme }) => theme.colors.accentPrimary};
  align-items: center;
  justify-content: center;
`;

const CheckMark = styled.Text`
  font-family: ${({ theme }) => theme.typography.fontBodyBold};
  font-size: 12px;
  color: ${({ theme }) => theme.colors.accentPrimaryInk};
`;

// Drawer — the clipped, animated container that grows the detail into view.
const Drawer = styled(Animated.View)`
  overflow: hidden;
`;

const DrawerInner = styled.View`
  padding: 0 15px 16px;
`;

export const TaskRow = ({
  card,
  isOpen,
  isDone,
  onToggle,
  onComplete,
}: TaskRowProps) => {
  const { drawerStyle, chevronStyle } = useTaskRowAnimation({ isOpen });
  // The frosted blur behind an open row matches the theme: a light frost in
  // light mode, a dark frost in dark mode.
  const { mode } = useTheme();

  // Done tasks read "Completed"; everything else keeps its own count line.
  const countLabel = isDone ? 'Completed' : card.countLabel;
  // The big-card titles use a newline to wrap; a row reads better on one line.
  const rowTitle = card.title.replace(/\n/g, ' ');

  return (
    <Container $open={isOpen} layout={LinearTransition.duration(420)}>
      <Solid $open={isOpen} $done={isDone} />
      {isOpen && (
        <>
          <Backdrop
            intensity={CARD_BLUR_INTENSITY}
            tint={mode === 'dark' ? 'dark' : 'light'}
            experimentalBlurMethod={
              Platform.OS === 'android' ? 'dimezisBlurView' : undefined
            }
          />
          <Tint />
        </>
      )}

      <Header
        onPress={onToggle}
        accessibilityRole="button"
        accessibilityLabel={`${rowTitle}. ${isOpen ? 'Collapse' : 'Expand'}`}
      >
        <Badge>
          <BadgeEmoji>{card.emoji}</BadgeEmoji>
        </Badge>
        <HeaderText>
          <Count>{countLabel}</Count>
          <Title $done={isDone}>{rowTitle}</Title>
        </HeaderText>
        {isDone ? (
          <Check>
            <CheckMark>✓</CheckMark>
          </Check>
        ) : (
          <Chevron style={chevronStyle}>⌄</Chevron>
        )}
      </Header>

      <Drawer style={drawerStyle}>
        <DrawerInner>
          <TaskRowDetail
            image={card.image}
            description={card.description}
            steps={card.steps}
            isLocked={card.isLocked}
          />
          <TaskRowCta
            isLocked={card.isLocked}
            details={card.details}
            onComplete={onComplete}
          />
        </DrawerInner>
      </Drawer>
    </Container>
  );
};
