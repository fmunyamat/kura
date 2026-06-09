import * as SecureStore from 'expo-secure-store';
import { create } from 'zustand';

// DevFlow — the four flows reachable from the dev launcher.
// 'sign-in' means no override — normal auth guards run.
export type DevFlow = 'sign-in' | 'onboarding' | 'welcome' | 'tabs';

// SecureStore key for the persisted default flow.
// This survives full manual reloads (shake → Reload), unlike the in-memory
// selectedFlow which resets to 'sign-in' on every full reload.
const DEFAULT_FLOW_KEY = 'dev_default_flow';

// VALID_FLOWS — used to validate the value read back from SecureStore.
// Guards against stale or corrupted stored values.
const VALID_FLOWS: DevFlow[] = ['sign-in', 'onboarding', 'welcome', 'tabs'];
const isValidDevFlow = (v: string | null): v is DevFlow =>
  v !== null && (VALID_FLOWS as string[]).includes(v);

interface DevState {
  // selectedFlow — the currently active dev override. Survives Metro fast refresh
  // but resets to 'sign-in' on a full manual reload (shake → Reload).
  selectedFlow: DevFlow;
  setSelectedFlow: (flow: DevFlow) => void;

  // defaultFlow — the flow that the app should jump to automatically on launch.
  // Persisted to SecureStore so it survives full reloads.
  // null means no default is set — app boots normally.
  defaultFlow: DevFlow | null;
  isDefaultLoaded: boolean;
  setDefaultFlow: (flow: DevFlow | null) => void;
  loadDefaultFlow: () => Promise<void>;
}

// useDevStore — dev-only store for the flow override.
// Module-level Zustand state survives Metro fast refresh automatically,
// so the selection persists across hot reloads without needing AsyncStorage.
// A full manual reload (shake → Reload) resets selectedFlow to 'sign-in',
// but defaultFlow is reloaded from SecureStore during app initialisation.
export const useDevStore = create<DevState>((set) => ({
  selectedFlow: 'sign-in',
  setSelectedFlow: (flow) => set({ selectedFlow: flow }),

  defaultFlow: null,
  isDefaultLoaded: false,

  // setDefaultFlow — updates state immediately (optimistic) then persists to
  // SecureStore in the background. Passing null clears the default.
  setDefaultFlow: (flow) => {
    if (flow === null) {
      SecureStore.deleteItemAsync(DEFAULT_FLOW_KEY).catch(() => {});
    } else {
      SecureStore.setItemAsync(DEFAULT_FLOW_KEY, flow).catch(() => {});
    }
    set({ defaultFlow: flow });
  },

  // loadDefaultFlow — reads the persisted default from SecureStore and hydrates
  // the store. Called once during app initialisation in the root layout.
  loadDefaultFlow: async () => {
    const stored = await SecureStore.getItemAsync(DEFAULT_FLOW_KEY);
    set({
      defaultFlow: isValidDevFlow(stored) ? stored : null,
      isDefaultLoaded: true,
    });
  },
}));
