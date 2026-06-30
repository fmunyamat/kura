// TaskAccordion — the stack of task rows on the Today tab. It lays the cards out
// as a simple column (one open, the rest collapsed) and lets the deck hook drive
// which one is open and which are done. Once every task is ticked off it swaps
// the whole list for the celebration panel, leaving tomorrow's locked card as a
// collapsed preview underneath so the user can still see what's coming.

import styled from 'styled-components/native';

import type { FocusDeck } from '../../hooks/useFocusDeck';
import { ClearedCard } from '../ClearedCard';
import { TaskRow } from '../TaskRow';

interface TaskAccordionProps {
  deck: FocusDeck;
  // recordLabel — the streak chip text shown on the cleared panel.
  recordLabel: string;
}

// List — the column the rows sit in. The gap keeps a clear seam between rows so
// each reads as its own surface.
const List = styled.View`
  margin-top: 22px;
  gap: 10px;
`;

export const TaskAccordion = ({ deck, recordLabel }: TaskAccordionProps) => {
  // Cleared: show the celebration, then the locked tomorrow card beneath it as a
  // quiet preview (it can be opened but never completed).
  if (deck.isCleared) {
    const lockedCard = deck.cards.find((card) => card.isLocked);
    return (
      <List>
        <ClearedCard streakLabel={recordLabel} />
        {lockedCard && (
          <TaskRow
            card={lockedCard}
            isOpen={deck.openId === lockedCard.id}
            isDone={false}
            onToggle={() => deck.handleToggleRow(lockedCard.id)}
            onComplete={() => deck.handleComplete(lockedCard.id)}
          />
        )}
      </List>
    );
  }

  return (
    <List>
      {deck.cards.map((card) => (
        <TaskRow
          key={card.id}
          card={card}
          isOpen={deck.openId === card.id}
          isDone={deck.isDone(card.id)}
          onToggle={() => deck.handleToggleRow(card.id)}
          onComplete={() => deck.handleComplete(card.id)}
        />
      ))}
    </List>
  );
};
