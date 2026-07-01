// lawnStore — holds lawn setup preferences captured during onboarding that the
// home screen needs after the onboarding store is reset. Unlike onboardingStore,
// this is NOT cleared when onboarding completes. It acts as the local source of
// truth for the home screen until a full user-profile load from Supabase is wired in.

import { create } from 'zustand';

interface LawnState {
  // Set to true when the user said they have an in-ground or automatic sprinkler
  // system during onboarding. False means they water by hand or with a portable
  // hose-end sprinkler. null = not yet answered (before onboarding is complete).
  hasSprinklerSystem: boolean | null;
  setHasSprinklerSystem: (v: boolean) => void;
}

export const useLawnStore = create<LawnState>((set) => ({
  hasSprinklerSystem: null,
  setHasSprinklerSystem: (hasSprinklerSystem) => set({ hasSprinklerSystem }),
}));
