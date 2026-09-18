// Sets up the single Supabase client the whole app shares. Supabase is our
// backend — it holds the database, handles login, and stores files. This file
// does three careful things before creating that client: (1) it tells Supabase
// to keep login tokens in the phone's encrypted secure storage rather than
// plain storage, (2) it checks at startup that the backend address and key are
// present and use a secure https:// connection, and (3) it exports the ready-to-
// use `supabase` object every service in the app imports to talk to the server.

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
  EXPO_PUBLIC_SUPABASE_KEY: z.string().min(1),
});

const env = EnvSchema.safeParse({
  EXPO_PUBLIC_SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL,
  EXPO_PUBLIC_SUPABASE_KEY: process.env.EXPO_PUBLIC_SUPABASE_KEY,
});

if (!env.success) {
  throw new Error(
    `Invalid Supabase env vars. Check .env.local:\n${env.error.message}`,
  );
}

const { EXPO_PUBLIC_SUPABASE_URL: supabaseUrl, EXPO_PUBLIC_SUPABASE_KEY: supabaseKey } =
  env.data;

// supabase — the single shared client instance for the whole app.
// detectSessionInUrl is false because OTP verification is handled in-app via
// verifyOtp() — there is no redirect URL to parse on native.
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    storage: ExpoSecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
