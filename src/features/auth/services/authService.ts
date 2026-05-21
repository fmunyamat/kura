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
