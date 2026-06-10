import { supabase } from '~/shared/lib/supabase';

// sendOtpCode — sends a 6-digit OTP email to the user.
// Omitting emailRedirectTo is what tells Supabase to send a numeric code
// instead of a clickable magic link. The user enters the code in-app
// rather than tapping a deep link.
export const sendOtpCode = async (email: string): Promise<void> => {
  const { error } = await supabase.auth.signInWithOtp({ email });

  // Throw raw error so callers can catch it — but callers must never forward
  // the message to the UI. Show a generic message instead (MASVS-CODE-4).
  if (error) throw error;
};

// verifyOtpCode — exchanges the 6-digit code the user typed for a live session.
// Supabase sets the session internally and fires onAuthStateChange.
// AuthProvider's listener picks that up, updates the Zustand store, and
// the routing guard in (auth)/_layout.tsx redirects to "/" automatically —
// no explicit navigation call needed here.
export const verifyOtpCode = async (email: string, token: string): Promise<void> => {
  const { error } = await supabase.auth.verifyOtp({ email, token, type: 'email' });
  if (error) throw error;
};

// ProfileFlags — the two routing signals AuthProvider needs from user_profiles.
interface ProfileFlags {
  hasProfile: boolean;
  hasSeenWelcome: boolean;
}

// checkUserProfile — returns routing flags for the given user.
// hasProfile: true if a user_profiles row exists (onboarding complete).
// hasSeenWelcome: true if the user has already completed the welcome flow.
// Called by AuthProvider after every sign-in to decide which screen to route to.
export const checkUserProfile = async (userId: string): Promise<ProfileFlags> => {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('user_id, has_seen_welcome')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    if (__DEV__) console.log('[checkUserProfile] error:', JSON.stringify(error));
    return { hasProfile: false, hasSeenWelcome: false };
  }

  return {
    hasProfile: !!data,
    hasSeenWelcome: data?.has_seen_welcome ?? false,
  };
};

// signOut — ends the Supabase session and wipes tokens from SecureStore.
// After this returns, AuthProvider's onAuthStateChange fires, clears the
// Zustand store, and the routing guard redirects to sign-in automatically.
export const signOut = async (): Promise<void> => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};
