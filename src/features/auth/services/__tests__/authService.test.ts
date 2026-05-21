// Jest hoists mock() calls before imports — by the time authService is
// imported, Supabase is already swapped for a fake we control so tests
// never hit a real database.
jest.mock('~/shared/lib/supabase', () => ({
  supabase: {
    auth: {
      signInWithOtp: jest.fn(),
      verifyOtp: jest.fn(),
      signOut: jest.fn(),
    },
    from: jest.fn(),
  },
}));

import { supabase } from '~/shared/lib/supabase';
import {
  checkUserProfile,
  sendOtpCode,
  signOut,
  verifyOtpCode,
} from '../authService';

const mockSupabase = supabase as jest.Mocked<typeof supabase>;

beforeEach(() => jest.clearAllMocks());

// ─── sendOtpCode ─────────────────────────────────────────────────────────────
// Sends a 6-digit OTP code to the user's email. Omitting emailRedirectTo is
// what tells Supabase to send a numeric code rather than a clickable magic link.
describe('sendOtpCode', () => {
  it('calls signInWithOtp with only the email — no redirect URI — so Supabase sends a code', async () => {
    (mockSupabase.auth.signInWithOtp as jest.Mock).mockResolvedValue({ error: null });

    await sendOtpCode('user@example.com');

    expect(mockSupabase.auth.signInWithOtp).toHaveBeenCalledWith({
      email: 'user@example.com',
    });
  });

  it('throws when Supabase returns an error so the UI can show a warning', async () => {
    (mockSupabase.auth.signInWithOtp as jest.Mock).mockResolvedValue({
      error: new Error('rate limited'),
    });

    await expect(sendOtpCode('user@example.com')).rejects.toThrow('rate limited');
  });
});

// ─── verifyOtpCode ────────────────────────────────────────────────────────────
// Exchanges the 6-digit code the user typed for a live Supabase session.
// Supabase sets the session internally and fires onAuthStateChange —
// AuthProvider picks that up and the routing guard redirects automatically.
describe('verifyOtpCode', () => {
  it('calls verifyOtp with email, token, and type="email"', async () => {
    (mockSupabase.auth.verifyOtp as jest.Mock).mockResolvedValue({ data: {}, error: null });

    await verifyOtpCode('user@example.com', '123456');

    expect(mockSupabase.auth.verifyOtp).toHaveBeenCalledWith({
      email: 'user@example.com',
      token: '123456',
      type: 'email',
    });
  });

  it('throws when Supabase returns an error (wrong or expired code)', async () => {
    (mockSupabase.auth.verifyOtp as jest.Mock).mockResolvedValue({
      data: {},
      error: new Error('Token has expired or is invalid'),
    });

    await expect(verifyOtpCode('user@example.com', '000000')).rejects.toThrow(
      'Token has expired or is invalid',
    );
  });
});

// ─── checkUserProfile ─────────────────────────────────────────────────────────
// Called by AuthProvider after every sign-in to decide whether to route to
// onboarding (new user, no profile row) or the home tabs (returning user).
describe('checkUserProfile', () => {
  const mockChain = (data: unknown) => ({
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          maybeSingle: jest.fn().mockResolvedValue({ data }),
        })),
      })),
    })),
  });

  it('returns true when a user_profiles row exists — returning user', async () => {
    (mockSupabase.from as jest.Mock).mockImplementation(
      mockChain({ user_id: 'abc' }).from,
    );
    expect(await checkUserProfile('abc')).toBe(true);
  });

  it('returns false when no row exists — new user', async () => {
    (mockSupabase.from as jest.Mock).mockImplementation(mockChain(null).from);
    expect(await checkUserProfile('abc')).toBe(false);
  });
});

// ─── signOut ──────────────────────────────────────────────────────────────────
describe('signOut', () => {
  it('calls Supabase signOut to end the session', async () => {
    (mockSupabase.auth.signOut as jest.Mock).mockResolvedValue({ error: null });
    await signOut();
    expect(mockSupabase.auth.signOut).toHaveBeenCalled();
  });

  it('throws when Supabase returns an error', async () => {
    (mockSupabase.auth.signOut as jest.Mock).mockResolvedValue({
      error: new Error('network error'),
    });
    await expect(signOut()).rejects.toThrow('network error');
  });
});
