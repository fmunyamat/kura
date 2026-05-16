import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';

// expo-secure-store adapter — stores Supabase session tokens in the device's
// secure enclave (iOS Keychain / Android Keystore) instead of AsyncStorage.
// This is required by MASVS-STORAGE-1: sensitive data must never sit in
// unencrypted storage readable on rooted or jailbroken devices.
const ExpoSecureStoreAdapter = {
  getItem: (key: string): Promise<string | null> =>
    SecureStore.getItemAsync(key),
  setItem: (key: string, value: string): Promise<void> =>
    SecureStore.setItemAsync(key, value),
  removeItem: (key: string): Promise<void> =>
    SecureStore.deleteItemAsync(key),
};

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

// Fail loudly at startup if env vars are missing so the app never silently
// runs without a backend connection — a misconfigured build is easier to
// diagnose from a clear error than from mysterious 401s at runtime.
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase env vars. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY in .env.local.',
  );
}

// supabase — the single shared client instance for the whole app.
// detectSessionInUrl is false because Expo Router handles deep links
// manually via app/auth/callback.tsx — we don't want Supabase trying
// to parse the URL itself on native where there is no real browser URL.
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: ExpoSecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
