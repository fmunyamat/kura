// ─── Why these mocks exist ────────────────────────────────────────────────────
// Jest runs mock() calls before any imports (it "hoists" them to the top of the
// file). That means by the time authService is imported below, every external
// package it relies on is already swapped out for a fake version we control.
//
// expo-web-browser — authService calls WebBrowser.maybeCompleteAuthSession()
//   the moment the module loads (not inside a function). Without this mock the
//   test file would crash trying to call native code that doesn't exist in Jest.
//
// expo-auth-session — provides makeRedirectUri(), which generates the deep link
//   URL sent in the magic-link email. We make it always return 'kura://' so our
//   assertions have a predictable value to check against.
//
// expo-auth-session/build/QueryParams — provides getQueryParams(), which pulls
//   the access_token and refresh_token out of the magic-link URL. We control
//   its return value in each test to simulate different URL shapes.
//
// ~/shared/lib/supabase — the Supabase client. We never want tests hitting a
//   real database, so every auth and database method is replaced with a jest.fn()
//   whose return value we set per-test.
// ─────────────────────────────────────────────────────────────────────────────
jest.mock('expo-web-browser', () => ({ maybeCompleteAuthSession: jest.fn() }));
jest.mock('expo-auth-session', () => ({ makeRedirectUri: jest.fn(() => 'kura://') }));
jest.mock('expo-auth-session/build/QueryParams', () => ({ getQueryParams: jest.fn() }));
jest.mock('~/shared/lib/supabase', () => ({
  supabase: {
    auth: {
      signInWithOtp: jest.fn(),
      setSession: jest.fn(),
      signOut: jest.fn(),
    },
    // from() is the entry point for all database queries (e.g. supabase.from('user_profiles'))
    from: jest.fn(),
  },
}));

import * as QueryParams from 'expo-auth-session/build/QueryParams';
import { supabase } from '~/shared/lib/supabase';
import {
  checkUserProfile,
  createSessionFromUrl,
  signInWithMagicLink,
  signOut,
} from '../authService';

// Typed aliases so TypeScript knows these are mock functions and lets us call
// .mockResolvedValue() etc. without type errors.
const mockSupabase = supabase as jest.Mocked<typeof supabase>;
const mockGetQueryParams = QueryParams.getQueryParams as jest.Mock;

// Clear all mock call history before each test so a previous test's calls
// don't accidentally make the next test's assertions pass.
beforeEach(() => jest.clearAllMocks());

// ─────────────────────────────────────────────────────────────────────────────
// signInWithMagicLink
// This function is responsible for kicking off the magic-link email. It calls
// Supabase with the user's email and the app's deep-link URL. These tests make
// sure it passes the right data to Supabase and blows up correctly on errors.
// ─────────────────────────────────────────────────────────────────────────────
describe('signInWithMagicLink', () => {
  it('calls signInWithOtp with the email and the generated redirect URI', async () => {
    // Simulate Supabase successfully queuing the email — no error comes back.
    (mockSupabase.auth.signInWithOtp as jest.Mock).mockResolvedValue({ error: null });

    await signInWithMagicLink('user@example.com');

    // The key things to check:
    //   1. The correct email was passed through
    //   2. emailRedirectTo matches what makeRedirectUri() returned ('kura://')
    //      so Supabase knows where to send the user after they click the link
    expect(mockSupabase.auth.signInWithOtp).toHaveBeenCalledWith({
      email: 'user@example.com',
      options: { emailRedirectTo: 'kura://' },
    });
  });

  it('throws when Supabase returns an error so the UI can show a warning', async () => {
    // Simulate Supabase hitting a rate limit (e.g. too many OTP requests).
    (mockSupabase.auth.signInWithOtp as jest.Mock).mockResolvedValue({
      error: new Error('rate limited'),
    });

    // The function must throw — callers catch this and show a generic
    // "Something went wrong" message without exposing the raw Supabase error.
    await expect(signInWithMagicLink('user@example.com')).rejects.toThrow('rate limited');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// createSessionFromUrl
// When the user taps the magic link in their email, the OS opens the app and
// passes the URL to app/auth/callback.tsx, which calls this function. It reads
// the tokens out of the URL and hands them to Supabase to create a live session.
// ─────────────────────────────────────────────────────────────────────────────
describe('createSessionFromUrl', () => {
  it('reads tokens from the URL and passes them to Supabase to create a session', async () => {
    // Pretend the URL contained valid access and refresh tokens.
    mockGetQueryParams.mockReturnValue({
      params: { access_token: 'acc_123', refresh_token: 'ref_456' },
      errorCode: null,
    });
    (mockSupabase.auth.setSession as jest.Mock).mockResolvedValue({ error: null });

    await createSessionFromUrl('kura://#access_token=acc_123&refresh_token=ref_456');

    // Both tokens must be forwarded to Supabase exactly as-is —
    // changing either one would make the session call fail on the server.
    expect(mockSupabase.auth.setSession).toHaveBeenCalledWith({
      access_token: 'acc_123',
      refresh_token: 'ref_456',
    });
  });

  it('throws when Supabase includes an error code in the URL (e.g. link expired)', async () => {
    // This happens when the user clicks the link after it has expired.
    // Supabase puts an error code in the URL instead of tokens.
    mockGetQueryParams.mockReturnValue({ params: {}, errorCode: 'otp_expired' });

    // The function must throw so app/auth/callback.tsx can redirect to sign-in
    // with an "Your link has expired" message.
    await expect(createSessionFromUrl('kura://?error=otp_expired')).rejects.toThrow('otp_expired');
  });

  it('does nothing when the URL has no access_token — avoids a pointless Supabase call', async () => {
    // This can happen if the app is opened via kura:// for any reason other
    // than a magic link (e.g. a general deep link with no auth tokens).
    mockGetQueryParams.mockReturnValue({ params: {}, errorCode: null });

    await createSessionFromUrl('kura://');

    // We should bail out early — calling setSession with empty values would
    // cause a Supabase error and confuse the user.
    expect(mockSupabase.auth.setSession).not.toHaveBeenCalled();
  });

  it('throws when Supabase rejects the tokens — the session call itself failed', async () => {
    // Tokens were present in the URL but Supabase refused them
    // (e.g. they were already used once — magic links are single-use).
    mockGetQueryParams.mockReturnValue({
      params: { access_token: 'acc', refresh_token: 'ref' },
      errorCode: null,
    });
    (mockSupabase.auth.setSession as jest.Mock).mockResolvedValue({
      error: new Error('invalid token'),
    });

    await expect(createSessionFromUrl('kura://')).rejects.toThrow('invalid token');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// checkUserProfile
// Called by AuthProvider after every sign-in to decide whether to send the
// user to onboarding (new user, no profile row) or straight to the app
// (returning user, profile row exists). The routing guard depends entirely
// on this returning the right boolean.
// ─────────────────────────────────────────────────────────────────────────────
describe('checkUserProfile', () => {
  // mockChain builds the chain of mock functions that mirrors how Supabase's
  // query builder works: supabase.from(...).select(...).eq(...).maybeSingle()
  // Each method returns an object with the next method on it, until the final
  // maybeSingle() resolves with the fake database row (or null).
  const mockChain = (data: unknown) => ({
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          maybeSingle: jest.fn().mockResolvedValue({ data }),
        })),
      })),
    })),
  });

  it('returns true when a user_profiles row exists — this is a returning user', async () => {
    // Simulate the database finding a row for this user_id.
    (mockSupabase.from as jest.Mock).mockImplementation(
      mockChain({ user_id: 'abc' }).from,
    );

    const result = await checkUserProfile('abc');

    // true means "profile exists" → routing guard will skip onboarding
    // and take the user straight to the home tabs.
    expect(result).toBe(true);
  });

  it('returns false when no row exists — this is a brand-new user', async () => {
    // Simulate the database returning null (no matching row found).
    (mockSupabase.from as jest.Mock).mockImplementation(mockChain(null).from);

    const result = await checkUserProfile('abc');

    // false means "no profile" → routing guard will redirect to /onboarding
    // so the user can set up their lawn before seeing the dashboard.
    expect(result).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// signOut
// Ends the current session and wipes tokens from SecureStore. After this,
// AuthProvider's onAuthStateChange fires and clears the Zustand store, which
// causes the routing guard to redirect to sign-in automatically.
// ─────────────────────────────────────────────────────────────────────────────
describe('signOut', () => {
  it('calls Supabase signOut to end the session and clear stored tokens', async () => {
    (mockSupabase.auth.signOut as jest.Mock).mockResolvedValue({ error: null });

    await signOut();

    expect(mockSupabase.auth.signOut).toHaveBeenCalled();
  });

  it('throws when Supabase returns an error so the caller knows the sign-out failed', async () => {
    // This could happen if the device is offline when the user tries to sign out.
    (mockSupabase.auth.signOut as jest.Mock).mockResolvedValue({
      error: new Error('network error'),
    });

    await expect(signOut()).rejects.toThrow('network error');
  });
});
