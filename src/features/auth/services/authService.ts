import { makeRedirectUri } from 'expo-auth-session';
// QueryParams is the officially documented import path from Supabase's React
// Native deep-linking guide — it handles both query params and hash fragments
// from magic link URLs, which plain URL parsing misses.
import * as QueryParams from 'expo-auth-session/build/QueryParams';
import * as WebBrowser from 'expo-web-browser';

import { supabase } from '~/shared/lib/supabase';

// Required for expo-auth-session to cleanly close the in-app browser on
// redirect back to the app — harmless on native, necessary for web.
WebBrowser.maybeCompleteAuthSession();

// signInWithMagicLink — sends a one-time magic link to the given email.
// makeRedirectUri() generates the correct deep link for the current platform:
//   native → kura://  (the scheme registered in app.json)
//   Expo Go → exp://...
// Supabase sends an email with a link that, when tapped, opens the app at
// this URI with access_token and refresh_token embedded in the URL.
export const signInWithMagicLink = async (email: string): Promise<void> => {
  // 'auth/callback' must match the file at app/auth/callback.tsx exactly.
  // Without the path, makeRedirectUri() returns kura:// (root), which the OS
  // opens at the app root — the callback screen never mounts and tokens are lost.
  const redirectTo = makeRedirectUri({ path: 'auth/callback' });

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: redirectTo },
  });

  // Throw raw error so callers can catch it — but callers must never forward
  // the message to the UI. Show a generic message instead (MASVS-CODE-4).
  if (error) throw error;
};

// createSessionFromUrl — parses the magic link deep link URL and establishes
// a Supabase session from the tokens embedded in it. Called from the
// app/auth/callback.tsx screen as soon as the deep link URL is available.
// getQueryParams handles both query-string and hash-fragment token formats
// so this works regardless of which format Supabase sends for this project.
export const createSessionFromUrl = async (url: string): Promise<void> => {
  const { params, errorCode } = QueryParams.getQueryParams(url);

  if (errorCode) throw new Error(errorCode);

  const { access_token, refresh_token } = params;

  // No tokens in the URL — nothing to do. This can happen if the deep link
  // was triggered by something other than a magic link (e.g. a typo URL).
  if (!access_token) return;

  const { error } = await supabase.auth.setSession({ access_token, refresh_token });
  if (error) throw error;

  // Session is now set. AuthProvider's onAuthStateChange listener will fire,
  // update the Zustand store, and let the routing guard redirect automatically.
};

// checkUserProfile — returns true if a user_profiles row exists for this user,
// meaning they have already completed onboarding. Returns false for new users.
// Called by AuthProvider after every sign-in to decide whether to route to
// onboarding or straight to the home tabs.
export const checkUserProfile = async (userId: string): Promise<boolean> => {
  const { data } = await supabase
    .from('user_profiles')
    .select('user_id')
    .eq('user_id', userId)
    .maybeSingle();
  return !!data;
};

// signOut — ends the Supabase session and wipes tokens from SecureStore.
// After this returns, AuthProvider's onAuthStateChange fires, clears the
// Zustand store, and the routing guard redirects to sign-in automatically.
export const signOut = async (): Promise<void> => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};
