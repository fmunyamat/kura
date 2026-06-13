// Deck — the stage the cards are stacked on. It fills the space between the
// completion track and the peek nav, lays the cards out by the positions the
// deck hook hands back, and overlays the dimming scrim used by the modal. Once
// the deck is cleared it swaps the front card for the celebration panel while
// keeping tomorrow's locked card visible behind it.

import styled from 'styled-components/native';

import type { FocusDeck } from '../../hooks/useFocusDeck';
import { ClearedCard } from '../ClearedCard';
import { DeckCard } from '../DeckCard';
import { DeckScrim } from './DeckScrim';

interface DeckProps {
  deck: FocusDeck;
  // recordLabel — the streak chip text shown on the cleared panel.
  recordLabel: string;
}

// A no-op for the locked card's unused callbacks on the cleared screen.
const noop = () => {};

// Stage — fills the available height. It must NOT clip its children: the scrim
// overscans past it and the cards lift out of it when they open.
const Stage = styled.View`
  flex: 1;
  margin-top: 26px;
  position: relative;
`;

export const Deck = ({ deck, recordLabel }: DeckProps) => {
  // Cleared: the only card left is tomorrow's locked preview. Pin it at the
  // back and drop the celebration panel in front of it.
  if (deck.isCleared) {
    const lockedCard = deck.remainingCards[0];
    return (
      <Stage>
        {lockedCard && (
          <DeckCard
            card={lockedCard}
            position="b1"
            isFront={false}
            isExpanded={false}
            isCompleting={false}
            onPress={noop}
            onComplete={noop}
            onFlyOutEnd={noop}
          />
        )}
        <ClearedCard streakLabel={recordLabel} />
      </Stage>
    );
  }

  return (
    <Stage>
      <DeckScrim isVisible={deck.isExpanded} onPress={deck.handleCloseExpanded} />
      {deck.remainingCards.map((card, index) => {
        const isFront = index === deck.peekIndex;
        return (
          <DeckCard
            key={card.id}
            card={card}
            position={deck.getPositionFor(index)}
            isFront={isFront}
            isExpanded={deck.isExpanded && isFront}
            isCompleting={deck.completingCardId === card.id}
            onPress={deck.handleToggleExpanded}
            onComplete={deck.handleComplete}
            onFlyOutEnd={deck.handleCardFlyOutEnd}
          />
        );
      })}
    </Stage>
  );
};
