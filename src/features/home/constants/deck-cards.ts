// Hardcoded content for the Today / Focus Deck screen. Everything here stands
// in for data that will later come from the recommendation engine and a weather
// service — for now it's fixed so we can build and judge the UI on its own.

import type { DeckCardData, TaskDetails, WeatherInfo } from '../types';

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

// ── Watering (soak) card — two variants ──────────────────────────────────────
// Main steps and detail content both come in sprinkler and hose versions.
// useFocusDeck reads lawnStore.hasSprinklerSystem and injects the right pair.

export const SOAK_STEPS_SPRINKLER = [
  'Run each zone for its set amount of time',
  'Stop if puddles form — move to the next zone',
  'Morning is best — less water evaporates',
];

export const SOAK_STEPS_HOSE = [
  'Place a hose-end sprinkler on the front section',
  'Let it run 15–20 minutes, then move it',
  "Repeat until you've covered the whole lawn",
];

// Detail modal content for users with an automatic sprinkler system.
// Teaches the one-time tuna-can calibration so they know their zone run times.
export const SOAK_DETAILS_SPRINKLER: TaskDetails = {
  title: 'Watering · The one rule',
  hero: '1 inch',
  heroSub: 'of water, once a week.',
  steps: [
    "Put an empty tuna can in zone 1's spray path and run until full — write down the minutes",
    'Repeat for every zone and note each time separately — head types differ, so times will vary',
    'Pick 1 or 2 watering days per week. Divide each zone\'s time by that number — that\'s how long to run it each session',
  ],
  note: "Get this once and your sprinkler does the thinking for you.",
};

// Detail modal content for users who water by hand or with a portable sprinkler.
export const SOAK_DETAILS_HOSE: TaskDetails = {
  title: 'Watering · The one rule',
  hero: '1 inch',
  heroSub: 'of water, once a week.',
  steps: [
    'Put an empty tuna can where your sprinkler reaches and run until it\'s full — write down the minutes',
    'Move to each new section and repeat — times may vary depending on water pressure and the sprinkler head',
    'Pick 1 or 2 watering days per week. Divide your time by that number — that\'s how long to run it each session',
  ],
  note: "Get this once and you'll never guess again.",
};

// ── Edges (weeding) card — detail content ────────────────────────────────────
const EDGES_DETAILS: TaskDetails = {
  title: 'Weeds · How to clear them',
  hero: 'Pull\nthe root.',
  heroSub: 'The leaf will grow back.',
  steps: [
    "If it wasn't planted and didn't grow in an even patch — it's a weed",
    'Broad flat leaves in a grass lawn, dandelions, clover, and creeping vines are the most common ones',
    'Pull from the base so the root comes out — leaving the root means it grows back within days',
  ],
  note: "You don't need to clear every weed today. The goal is to stop them spreading.",
};

// ── Feed (fertiliser) card — detail content ───────────────────────────────────
const FEED_DETAILS: TaskDetails = {
  title: 'Feed · How to spread',
  hero: 'Steady\npace.',
  heroSub: 'Even speed, even coverage.',
  steps: [
    'Find the spreader setting on the fertiliser bag — it\'s usually listed by brand name',
    'Walk at a steady, even pace — stopping mid-row concentrates product in one spot and can burn the grass',
    'Water lightly after spreading — this activates the feed and pushes it into the soil',
  ],
  note: 'If you\'re unsure about the setting, go lower — under-feeding is much easier to fix than fertiliser burn.',
};

// ── Deck ─────────────────────────────────────────────────────────────────────
// Front card first: three real tasks for today, then tomorrow's locked preview.
// `require` returns a number at runtime but is typed as ImageSourcePropType so
// expo-image accepts it directly. The soak card ships with sprinkler content by
// default; useFocusDeck swaps both steps and details for the hose variant when
// hasSprinklerSystem is false.
export const DECK_CARDS: DeckCardData[] = [
  {
    id: 'soak',
    emoji: '💧',
    image: require('../../../../assets/images/sprinkler-android.jpg'),
    countLabel: 'Task 1 of 3 · Today',
    title: 'Give it a\ndeep soak.',
    description: 'Your lawn needs 1 inch of water a week. Water on 1 or 2 mornings — never more.',
    steps: SOAK_STEPS_SPRINKLER,
    details: SOAK_DETAILS_SPRINKLER,
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
    details: EDGES_DETAILS,
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
    details: FEED_DETAILS,
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
