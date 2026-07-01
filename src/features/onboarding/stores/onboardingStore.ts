import { create } from 'zustand';

import type { GrassTypeList } from '../types';

// OnboardingState — temporary data accumulated across the five onboarding
// steps before it's written to user_profiles at the end of the flow.
// Not persisted — if the user force-quits mid-onboarding, they start again.
interface OnboardingState {
  // Step 1 — Location
  zipCode: string;
  lawnSize: number | null;

  // Step 2 — GrassType
  grassType: GrassTypeList | null;

  // Step 3 — EffortLevel
  effortLevel: 1 | 2 | 3 | null;

  // Step 4 — SprinklerSystem
  // true = in-ground or automatic system; false = hose or hand watering.
  hasSprinklerSystem: boolean | null;

  setZipCode: (v: string) => void;
  setLawnSize: (v: number) => void;
  setGrassType: (v: GrassTypeList) => void;
  setEffortLevel: (v: 1 | 2 | 3) => void;
  setHasSprinklerSystem: (v: boolean) => void;

  // reset — called after user_profiles is written so the store is clean
  // if the user somehow triggers onboarding again.
  reset: () => void;
}

const INITIAL: Pick<
  OnboardingState,
  'zipCode' | 'lawnSize' | 'grassType' | 'effortLevel' | 'hasSprinklerSystem'
> = {
  zipCode: '',
  lawnSize: null,
  grassType: null,
  effortLevel: null,
  hasSprinklerSystem: null,
};

export const useOnboardingStore = create<OnboardingState>((set) => ({
  ...INITIAL,
  setZipCode: (zipCode) => set({ zipCode }),
  setLawnSize: (lawnSize) => set({ lawnSize }),
  setGrassType: (grassType) => set({ grassType }),
  setEffortLevel: (effortLevel) => set({ effortLevel }),
  setHasSprinklerSystem: (hasSprinklerSystem) => set({ hasSprinklerSystem }),
  reset: () => set(INITIAL),
}));
