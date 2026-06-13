// DeckCard — one card in the deck. It stitches together the photo header, the
// title, the slide-open detail drawer, the action pill, and the DONE stamp, and
// hands all of their motion to useDeckCardAnimation. The parent only tells it
// where it sits (position), whether it's the front card, whether it's opened as
// a modal, and whether it's currently being completed.

import { BlurView } from 'expo-blur';
import { Platform, Pressable } from 'react-native';
import Animated from 'react-native-reanimated';
import styled from 'styled-components/native';

import type { DeckCardData, DeckPosition } from '../../types';
import { DeckCardCta } from './DeckCardCta';
import { DeckCardDetailDrawer } from './DeckCardDetailDrawer';
import { DeckCardPhotoHeader } from './DeckCardPhotoHeader';
import { DoneStamp } from './DoneStamp';
import { useDeckCardAnimation } from './useDeckCardAnimation';

// How hard the card blurs whatever sits behind it (the cards lower in the deck
// and the photo). Higher = frostier; this is what stops the card behind from
// reading through the translucent fill.
const CARD_BLUR_INTENSITY = 60;

interface DeckCardProps {
  card: DeckCardData;
  position: DeckPosition;
  isFront: boolean;
  isExpanded: boolean;
  isCompleting: boolean;
  onPress: () => void;
  onComplete: () => void;
  onFlyOutEnd: () => void;
}

// The stacking order for each resting position; an open or flying card jumps
// above everything else.
const Z_BY_POSITION: Record<DeckPosition, number> = {
  front: 3,
  b1: 2,
  b2: 1,
  hidden: 0,
  aside: 4,
};

type CardSurface = 'front' | 'back' | 'expanded';

// Card — the absolutely-stacked pane. Rounded corners are clipped; the 1px edge
// is brighter along the top to catch the light like real glass. It has no fill
// of its own — the blurred backdrop and the colour tint are layered inside it.
const Card = styled(Animated.View)<{ $zIndex: number }>`
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  border-radius: ${({ theme }) => theme.radii.lg}px;
  overflow: hidden;
  border-width: 1px;
  border-color: ${({ theme }) => theme.colors.glassClearEdgeBottom};
  border-top-color: ${({ theme }) => theme.colors.glassClearEdge};
  z-index: ${({ $zIndex }) => $zIndex};
  transform-origin: bottom;
`;

// CardBackdrop — the real frosted-glass blur. It samples whatever is drawn
// behind the card and blurs it, so the card stacked underneath turns into a
// soft wash instead of reading through sharply. tint="dark" keeps the body dark
// enough for the white title to stay legible.
const CardBackdrop = styled(BlurView)`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
`;

// CardTint — the thin colour wash over the blur that gives each card its glassy
// fill: a faint lift on the front card, deeper green once opened as a modal.
const CardTint = styled.View<{ $surface: CardSurface }>`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: ${({ theme, $surface }) =>
    $surface === 'expanded'
      ? theme.colors.deckCardExpanded
      : $surface === 'front'
        ? theme.colors.deckCardSurface
        : theme.colors.glassClearPanel};
`;

// Body — the padded content below the photo. It sizes to its own content, so
// the card is exactly as tall as the title, steps, and button need.
const Body = styled.View`
  padding: 24px 20px 20px;
`;

const Count = styled.Text<{ $isLocked: boolean }>`
  font-family: ${({ theme }) => theme.typography.fontBody};
  font-size: 9.5px;
  letter-spacing: 2px;
  color: ${({ theme, $isLocked }) =>
    $isLocked ? theme.colors.subtextOnPhoto : theme.colors.lime};
`;

const Title = styled.Text`
  margin-top: 10px;
  font-family: ${({ theme }) => theme.typography.fontHeaderHeavy};
  font-size: 25px;
  line-height: 28px;
  color: ${({ theme }) => theme.colors.white};
`;

export const DeckCard = ({
  card,
  position,
  isFront,
  isExpanded,
  isCompleting,
  onPress,
  onComplete,
  onFlyOutEnd,
}: DeckCardProps) => {
  const { cardStyle, stampStyle, ctaStyle, drawerStyle, handleCardLayout } =
    useDeckCardAnimation({ position, isFront, isExpanded, isCompleting, onFlyOutEnd });

  const zIndex = isExpanded ? 45 : isCompleting ? 4 : Z_BY_POSITION[position];
  const surface: CardSurface = isExpanded ? 'expanded' : isFront ? 'front' : 'back';

  return (
    <Card style={cardStyle} onLayout={handleCardLayout} $zIndex={zIndex}>
      {/* The frosted backdrop and its colour tint sit behind everything else.
          Android needs the experimental method to actually blur the backdrop;
          iOS blurs natively. */}
      <CardBackdrop
        intensity={CARD_BLUR_INTENSITY}
        tint="dark"
        experimentalBlurMethod={Platform.OS === 'android' ? 'dimezisBlurView' : undefined}
      />
      <CardTint $surface={surface} />
      <Pressable onPress={onPress} accessibilityRole="button">
        <DeckCardPhotoHeader image={card.image} emoji={card.emoji} />
        <Body>
          <Count $isLocked={card.isLocked}>{card.countLabel}</Count>
          <Title>{card.title}</Title>
          <DeckCardDetailDrawer
            description={card.description}
            steps={card.steps}
            isLocked={card.isLocked}
            animatedStyle={drawerStyle}
          />
          <DeckCardCta
            isLocked={card.isLocked}
            isExpanded={isExpanded}
            onComplete={onComplete}
            animatedStyle={ctaStyle}
          />
        </Body>
      </Pressable>
      <DoneStamp animatedStyle={stampStyle} />
    </Card>
  );
};
