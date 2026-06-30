// Types for the Today / Focus Deck screen.

import type { ImageSourcePropType } from 'react-native';

// TaskDetails — the deeper information shown in the bottom-sheet modal when the
// user taps "More details →". Separate from the main steps so the card stays
// clean and only curious users dig into this layer.
export interface TaskDetails {
  // Short heading shown at the top of the modal.
  title: string;
  // Full numbered walkthrough — more granular than the main card's steps.
  steps: string[];
  // Optional caveat or reminder pinned at the bottom of the modal.
  note?: string;
}

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
  // details — optional. When present a "More details →" link appears in the
  // open card above the CTA; tapping it opens a bottom-sheet modal.
  details?: TaskDetails;
}

// WeatherInfo — the right half of the split context card. All hardcoded for now.
export interface WeatherInfo {
  temperature: string;
  icon: string;
  summary: string;
}
