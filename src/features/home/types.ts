// Types for the Today / Focus Deck screen.

import type { ImageSourcePropType } from 'react-native';

// DeckPosition — where a card sits in the deck right now, relative to the card
// the user is currently looking at. The screen turns this into a transform:
//   aside  — slid off to the left (the user peeked past it)
//   front  — face-up, the card you act on
//   b1/b2  — stacked behind the front card, peeking out the top
//   hidden — further back than b2, faded fully out
export type DeckPosition = 'aside' | 'front' | 'b1' | 'b2' | 'hidden';

// DeckCardData — one task card's content. `isLocked` cards are previews of a
// future day: they can't be completed, only looked at.
export interface DeckCardData {
  id: string;
  emoji: string;
  image: ImageSourcePropType;
  // countLabel — the small line above the title, e.g. "Task 1 of 3 · Today".
  countLabel: string;
  // title — the task headline. May contain a newline to control wrapping.
  title: string;
  description: string;
  steps: string[];
  isLocked: boolean;
}

// WeatherInfo — the right half of the split context card. All hardcoded for now.
export interface WeatherInfo {
  temperature: string;
  icon: string;
  summary: string;
}
