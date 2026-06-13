// useFocusDeck — the single source of truth for the Today screen's card deck.
//
// It tracks which cards are still in the deck, which one the user is looking at
// (peeking), whether an action is mid-animation (busy), whether the front card
// is opened into its modal, and the streak count. The screen reads the derived
// labels and positions from here and calls the handlers; all the animation
// lives in the card components, which call back into `handleCardFlyOutEnd` when
// a completed card has finished flying away.

import { useCallback, useMemo, useState } from 'react';

import { DECK_CARDS, INITIAL_STREAK_DAYS } from '../constants/deck-cards';
import type { DeckCardData, DeckPosition } from '../types';

// How many of today's real (unlocked) tasks there are — the denominator of the
// "Task X of Y" counter. Computed once from the source data.
const TODAY_TOTAL = DECK_CARDS.filter((card) => !card.isLocked).length;

// Look up a card's content by id without scanning the array each time.
const CARD_BY_ID: Record<string, DeckCardData> = Object.fromEntries(
  DECK_CARDS.map((card) => [card.id, card])
);

export interface FocusDeck {
  // The cards still in the deck, front-most first.
  remainingCards: DeckCardData[];
  // Index of the card currently facing the user (0 = the real front of the deck).
  peekIndex: number;
  isBusy: boolean;
  isExpanded: boolean;
  // The id of the card playing its "stamp and fly away" completion animation,
  // or null when nothing is completing.
  completingCardId: string | null;
  streakDays: number;
  // True once every unlocked task is done — only the locked preview remains.
  isCleared: boolean;

  // Derived display strings + the progress bar fraction (0–1).
  completionLabel: string;
  completionProgress: number;
  peekLabel: string;
  canPeekBack: boolean;
  canPeekForward: boolean;

  // Where the card at `index` in `remainingCards` should sit right now.
  getPositionFor: (index: number) => DeckPosition;

  handlePeek: (direction: 1 | -1) => void;
  handleToggleExpanded: () => void;
  handleCloseExpanded: () => void;
  handleComplete: () => void;
  handleCardFlyOutEnd: () => void;
}

export const useFocusDeck = (): FocusDeck => {
  // The deck's identity list, front first. Completing a card drops its id here.
  const [remainingIds, setRemainingIds] = useState<string[]>(() =>
    DECK_CARDS.map((card) => card.id)
  );
  const [peekIndex, setPeekIndex] = useState(0);
  const [isBusy, setIsBusy] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [completingCardId, setCompletingCardId] = useState<string | null>(null);
  const [streakDays, setStreakDays] = useState(INITIAL_STREAK_DAYS);

  const remainingCards = useMemo(
    () => remainingIds.map((id) => CARD_BY_ID[id]),
    [remainingIds]
  );

  // How many unlocked tasks are left, and therefore how many are done.
  const unlockedLeft = remainingCards.filter((card) => !card.isLocked).length;
  const doneCount = TODAY_TOTAL - unlockedLeft;
  const isCleared = unlockedLeft === 0;

  // "Task 2 of 3" while there's work left, otherwise "All done".
  const completionLabel = unlockedLeft
    ? `Task ${doneCount + 1} of ${TODAY_TOTAL}`
    : 'All done';
  const completionProgress = doneCount / TODAY_TOTAL;

  // The label under the deck. Cleared deck and the locked preview get their own
  // wording; everything else is a plain "Card X of Y".
  const peekedCard = remainingCards[peekIndex];
  const peekLabel = isCleared
    ? 'See you tomorrow'
    : peekedCard?.isLocked
      ? 'Tomorrow · locked'
      : `Card ${peekIndex + 1} of ${remainingCards.length}`;

  // Peeking is blocked while a card is animating or once the deck is cleared.
  const canPeekBack = peekIndex > 0 && !isBusy && !isCleared;
  const canPeekForward =
    peekIndex < remainingCards.length - 1 && !isBusy && !isCleared;

  // Turn an array index into a deck position relative to the peek cursor:
  // before it → slid aside, at it → front, then b1 / b2 / hidden behind.
  const getPositionFor = useCallback(
    (index: number): DeckPosition => {
      const relative = index - peekIndex;
      if (relative < 0) return 'aside';
      if (relative === 0) return 'front';
      if (relative === 1) return 'b1';
      if (relative === 2) return 'b2';
      return 'hidden';
    },
    [peekIndex]
  );

  // Lean the front card aside to reveal the next/previous card. Closes any open
  // modal first so cards always arrive condensed, and respects the bounds.
  const handlePeek = useCallback(
    (direction: 1 | -1) => {
      if (isBusy || isCleared) return;
      setIsExpanded(false);
      setPeekIndex((current) => {
        const next = current + direction;
        if (next < 0 || next > remainingIds.length - 1) return current;
        return next;
      });
    },
    [isBusy, isCleared, remainingIds.length]
  );

  // Open or close the modal for whichever card is currently facing the user
  // (the one at the peek cursor). Never opens mid-animation.
  const handleToggleExpanded = useCallback(() => {
    if (isBusy) return;
    setIsExpanded((open) => !open);
  }, [isBusy]);

  const handleCloseExpanded = useCallback(() => {
    setIsExpanded(false);
  }, []);

  // Begin completing the front card: flag it busy and hand the card its cue to
  // play the stamp + fly-away animation. Guarded so you can't complete a peeked
  // card, a card mid-animation, or the locked preview.
  const handleComplete = useCallback(() => {
    if (isBusy || peekIndex !== 0) return;
    const frontCard = remainingCards[0];
    if (!frontCard || frontCard.isLocked) return;
    // Close the modal first so the card flies away condensed, then arm it.
    setIsExpanded(false);
    setIsBusy(true);
    setCompletingCardId(frontCard.id);
  }, [isBusy, peekIndex, remainingCards]);

  // Called by the card once it has finished flying off the top of the deck.
  // Drops the front card, resets the cursor, and — if that emptied today's
  // tasks — ticks the streak up by one.
  const handleCardFlyOutEnd = useCallback(() => {
    setRemainingIds((current) => {
      const next = current.slice(1);
      const stillToDo = next.filter((id) => !CARD_BY_ID[id].isLocked).length;
      if (stillToDo === 0) {
        setStreakDays(INITIAL_STREAK_DAYS + 1);
      }
      return next;
    });
    setPeekIndex(0);
    setCompletingCardId(null);
    setIsExpanded(false);
    setIsBusy(false);
  }, []);

  return {
    remainingCards,
    peekIndex,
    isBusy,
    isExpanded,
    completingCardId,
    streakDays,
    isCleared,
    completionLabel,
    completionProgress,
    peekLabel,
    canPeekBack,
    canPeekForward,
    getPositionFor,
    handlePeek,
    handleToggleExpanded,
    handleCloseExpanded,
    handleComplete,
    handleCardFlyOutEnd,
  };
};
