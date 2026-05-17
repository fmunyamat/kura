import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import { z } from 'zod';

// expo-secure-store adapter — stores Supabase session tokens in the device's
// secure enclave (iOS Keychain / Android Keystore) instead of AsyncStorage.
// This is required by MAVSV-STORAGE-1: sensitive data must never sit in
// unencrypted storage readable on rooted or jailbroken devices.
const ExpoSecureStoreAdapter = {
  getItem: (key: string): Promise<string | null> =>
    SecureStore.getItemAsync(key),
  setItem: (key: string, value: string): Promise<void> =>
    SecureStore.setItemAsync(key, value),
  removeItem: (key: string): Promise<void> =>
    SecureStore.deleteItemAsync(key),
};

// EnvSchema — validates both Supabase env vars at startup before they touch
// any client code. The https:// check on the URL enforces MAVSV-NETWORK-1
// (all traffic over TLS) — a misconfigured http:// URL would silently send
// auth tokens over an unencrypted connection without this guard.
const EnvSchema = z.object({
  EXPO_PUBLIC_SUPABASE_URL: z
    .string()
    .url()
    .refine((s) => s.startsWith('https://'), 'Supabase URL must use https://'),
  EXPO_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
});

const env = EnvSchema.safeParse({
  EXPO_PUBLIC_SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL,
  EXPO_PUBLIC_SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
});

if (!env.success) {
  throw new Error(
    `Invalid Supabase env vars. Check .env.local:\n${env.error.message}`,
  );
}

const { EXPO_PUBLIC_SUPABASE_URL: supabaseUrl, EXPO_PUBLIC_SUPABASE_ANON_KEY: supabaseAnonKey } =
  env.data;

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
