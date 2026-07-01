// useFocusDeck — the single source of truth for the Today screen's task list.
//
// The Today tab shows today's tasks as an accordion: a column of rows where one
// row is open (its full card on show) and the rest are collapsed. This hook
// tracks which row is open, which tasks have been ticked off, and the streak,
// and hands the screen the derived labels it needs. There is no overlap between
// rows, so unlike the old stacked deck nothing bleeds through the glass.

import { useCallback, useMemo, useState } from 'react';

import {
  DECK_CARDS,
  INITIAL_STREAK_DAYS,
  SOAK_DETAILS_HOSE,
  SOAK_STEPS_HOSE,
} from '../constants/deck-cards';
import { useLawnStore } from '../stores/lawnStore';
import type { DeckCardData } from '../types';

// How many of today's real (unlocked) tasks there are — the denominator of the
// "Task X of 3" counter. Computed once from the source data.
const TODAY_TOTAL = DECK_CARDS.filter((card) => !card.isLocked).length;

// The id of the first unlocked task — the row that starts open on load.
const FIRST_TASK_ID = DECK_CARDS.find((card) => !card.isLocked)?.id ?? null;

export interface FocusDeck {
  // Every card in display order: today's tasks, then tomorrow's locked preview.
  cards: DeckCardData[];
  // The id of the row currently expanded, or null if every row is collapsed.
  openId: string | null;
  // The ids of tasks the user has ticked off.
  doneIds: string[];
  streakDays: number;
  // True once every unlocked task is done — the screen swaps to the celebration.
  isCleared: boolean;

  // Derived display strings + the progress bar fraction (0–1).
  completionLabel: string;
  completionProgress: number;

  // Whether a given card has been completed.
  isDone: (id: string) => boolean;

  // Open the tapped row (and close whatever was open); tapping the open row
  // closes it.
  handleToggleRow: (id: string) => void;
  // Tick a task off: mark it done, advance the streak if it was the last one,
  // and open the next task still to do.
  handleComplete: (id: string) => void;
}

export const useFocusDeck = (): FocusDeck => {
  // hasSprinklerSystem drives which steps we show on the soak card. null (not
  // yet answered — before onboarding is complete) falls through to sprinkler
  // steps, which is the default in DECK_CARDS.
  const hasSprinklerSystem = useLawnStore((state) => state.hasSprinklerSystem);

  // Swap the soak card's steps and detail modal content based on the user's
  // watering setup. Every other card is unchanged. We derive this instead of
  // mutating DECK_CARDS so the source list stays pure.
  const cards = useMemo<DeckCardData[]>(() => {
    if (hasSprinklerSystem === false) {
      return DECK_CARDS.map((card) =>
        card.id === 'soak'
          ? { ...card, steps: SOAK_STEPS_HOSE, details: SOAK_DETAILS_HOSE }
          : card
      );
    }
    return DECK_CARDS;
  }, [hasSprinklerSystem]);

  // Which row is expanded. Starts on the first real task.
  const [openId, setOpenId] = useState<string | null>(FIRST_TASK_ID);
  // The set of completed task ids, kept as an array so it's easy to expose.
  const [doneIds, setDoneIds] = useState<string[]>([]);
  const [streakDays, setStreakDays] = useState(INITIAL_STREAK_DAYS);

  // Fast membership check used by both the derived values and the screen.
  const doneSet = useMemo(() => new Set(doneIds), [doneIds]);
  const isDone = useCallback((id: string) => doneSet.has(id), [doneSet]);

  // How many tasks are done, and whether that clears the whole day.
  const doneCount = doneIds.length;
  const isCleared = doneCount >= TODAY_TOTAL;

  // "Task 2 of 3" while there's work left, otherwise "All done".
  const completionLabel = isCleared
    ? 'All done'
    : `Task ${doneCount + 1} of ${TODAY_TOTAL}`;
  const completionProgress = doneCount / TODAY_TOTAL;

  // Open the tapped row, or close it if it was already open.
  const handleToggleRow = useCallback((id: string) => {
    setOpenId((current) => (current === id ? null : id));
  }, []);

  // Tick a task off. Guarded so the locked preview and already-done tasks can't
  // be completed. After marking it done, jump the open row to the next task
  // that still needs doing (or close everything once the day is cleared).
  const handleComplete = useCallback(
    (id: string) => {
      const card = cards.find((item) => item.id === id);
      if (!card || card.isLocked) return;

      setDoneIds((current) => {
        if (current.includes(id)) return current;
        const next = [...current, id];

        // Find the next unlocked task that isn't done yet and open it; if there
        // are none left, collapse everything so the cleared view can take over.
        const nextTask = cards.find(
          (item) => !item.isLocked && !next.includes(item.id)
        );
        setOpenId(nextTask ? nextTask.id : null);

        // Clearing the last task bumps the streak by one.
        if (next.length >= TODAY_TOTAL) {
          setStreakDays(INITIAL_STREAK_DAYS + 1);
        }
        return next;
      });
    },
    [cards]
  );

  return {
    cards,
    openId,
    doneIds,
    streakDays,
    isCleared,
    completionLabel,
    completionProgress,
    isDone,
    handleToggleRow,
    handleComplete,
  };
};
