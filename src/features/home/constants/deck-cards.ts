// Hardcoded content for the Today / Focus Deck screen. Everything here stands
// in for data that will later come from the recommendation engine and a weather
// service — for now it's fixed so we can build and judge the UI on its own.

import type { DeckCardData, WeatherInfo } from '../types';

// The person we greet at the top of the screen.
export const USER_FIRST_NAME = 'John';

// The day the deck is showing. Drives the eyebrow and the locked card's label.
export const TODAY_LABEL = 'Friday';
export const TOMORROW_LABEL = 'Saturday';

// Streak: how many days in a row the user has cleared their deck. Clearing
// today's deck bumps this by one (6 → 7) — see useFocusDeck.
export const INITIAL_STREAK_DAYS = 6;

// The right half of the split context card.
export const WEATHER: WeatherInfo = {
  temperature: '24°',
  icon: '☀️',
  summary: 'Sunny · Wind 12 km/h',
};

// The deck, front card first: three real tasks for today, then tomorrow's
// locked preview sitting at the back. `require` returns a number at runtime but
// is typed as ImageSourcePropType so expo-image accepts it directly.
export const DECK_CARDS: DeckCardData[] = [
  {
    id: 'soak',
    emoji: '💧',
    image: require('../../../../assets/images/sprinkler-android.jpg'),
    countLabel: 'Task 1 of 3 · Today',
    title: 'Give it a\ndeep soak.',
    description: 'Water slowly so it sinks in — quick sprinkles only wet the surface.',
    steps: [
      'Set sprinkler on the front patch',
      'Run 20 minutes, then move it',
      'Repeat on the back half',
    ],
    isLocked: false,
  },
  {
    id: 'edges',
    emoji: '🔍',
    image: require('../../../../assets/images/grass.jpg'),
    countLabel: 'Task 2 of 3 · Today',
    title: 'Walk the\nedges.',
    description: "Five minutes along the walkway — pull anything that isn't grass.",
    steps: [
      'Start at the front path',
      'Check both fence lines',
      'Toss weeds in the green bin',
    ],
    isLocked: false,
  },
  {
    id: 'feed',
    emoji: '🌱',
    image: require('../../../../assets/images/fertilizer.png'),
    countLabel: 'Task 3 of 3 · Today',
    title: 'Feed the\nlawn.',
    description: 'A light, even spread of feed now keeps the colour strong through the week.',
    steps: [
      'Fill the spreader to the first line',
      'Walk straight, even rows',
      'Water it in lightly after',
    ],
    isLocked: false,
  },
  {
    id: 'mow',
    emoji: '✂️',
    image: require('../../../../assets/images/evening-mow.jpg'),
    countLabel: 'Tomorrow · Saturday',
    title: 'First mow of\nthe week.',
    description: 'Blade on the high setting — never cut more than a third of the height.',
    steps: ['Unlocks tomorrow at 6:00am'],
    isLocked: true,
  },
];

// The chip shown on the deck-cleared card once the streak ticks over.
export const RECORD_STREAK_LABEL = '🔥 7 days — new record';
