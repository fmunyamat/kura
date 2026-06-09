# Magic Link → Email OTP Code Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace Supabase magic link sign-in with a 6-digit email OTP code so the user types the code in-app instead of tapping a link that deep-links back.

**Architecture:** Remove the `emailRedirectTo` deep link from `signInWithOtp` (which causes Supabase to send a 6-digit code instead of a click-able link), add a `verifyOtp` call for code verification, replace the static ConfirmationPanel with an interactive OTP entry panel (code input + resend timer + error display), and delete the now-obsolete `app/auth/callback.tsx` deep link handler. Auth state propagation, routing guards, AuthProvider, and Zustand store remain unchanged — they operate at the session level and are auth-method-agnostic.

**Tech Stack:** Supabase JS v2 (`supabase.auth.signInWithOtp` / `supabase.auth.verifyOtp`), React Native, Expo Router, styled-components/native, Jest + React Native Testing Library

---

## Supabase Dashboard (manual step — do this before coding)

In the Supabase dashboard for this project:
- Go to **Authentication → Providers → Email**
- Confirm **"Enable Email OTP"** is toggled on
- Set **"Email OTP Expiration"** to `3600` (1 hour) or leave at default
- Magic Links can remain on or off — both work simultaneously; removing `emailRedirectTo` from the code call is what switches which one Supabase sends

---

## File Map

| Action | File |
|--------|------|
| Modify | `src/features/auth/services/authService.ts` |
| Modify | `src/features/auth/services/__tests__/authService.test.ts` |
| Rename + update | `src/features/onboarding/components/MagicLinkForm/MagicLinkForm.tsx` → `OtpRequestForm.tsx` |
| Replace | `src/features/onboarding/components/ConfirmationPanel/ConfirmationPanel.tsx` → `OtpVerifyPanel.tsx` |
| Modify | `src/features/onboarding/screens/SignIn.tsx` |
| Modify | `src/features/onboarding/screens/SignIn.test.tsx` |
| Delete | `app/auth/callback.tsx` |

---

## Task 1: Update authService — TDD

**Files:**
- Modify: `src/features/auth/services/__tests__/authService.test.ts`
- Modify: `src/features/auth/services/authService.ts`

- [ ] **Step 1a: Write failing tests for the new service functions**

Replace the entire content of `src/features/auth/services/__tests__/authService.test.ts` with:

```typescript
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
// what tells Supabase to send a code instead of a magic link.
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
// Exchanges the 6-digit code for a session. Supabase sets the session internally
// and fires onAuthStateChange — no manual setSession call needed.
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
// Unchanged — still needed by AuthProvider after every sign-in.
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
  it('calls Supabase signOut', async () => {
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
```

- [ ] **Step 1b: Run the tests — they should fail (functions not found)**

```bash
npx jest src/features/auth/services/__tests__/authService.test.ts --no-coverage
```

Expected: FAIL — `sendOtpCode` and `verifyOtpCode` are not exported from authService.

- [ ] **Step 1c: Replace authService.ts with the new implementation**

Replace the entire content of `src/features/auth/services/authService.ts`:

```typescript
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
```

- [ ] **Step 1d: Run the tests — they should all pass**

```bash
npx jest src/features/auth/services/__tests__/authService.test.ts --no-coverage
```

Expected: PASS (8 tests across 4 describe blocks).

- [ ] **Step 1e: Commit**

```bash
git add src/features/auth/services/authService.ts src/features/auth/services/__tests__/authService.test.ts
git commit -m "feat: replace magic link auth with email OTP code (signInWithOtp + verifyOtp)"
```

---

## Task 2: Create OtpRequestForm (replace MagicLinkForm)

**Files:**
- Create: `src/features/onboarding/components/OtpRequestForm/OtpRequestForm.tsx`
- Delete later (Task 6): `src/features/onboarding/components/MagicLinkForm/MagicLinkForm.tsx`

- [ ] **Step 2a: Create the new file**

Create `src/features/onboarding/components/OtpRequestForm/OtpRequestForm.tsx`:

```typescript
import { LinearGradient } from 'expo-linear-gradient';
import { ActivityIndicator, Pressable, TextInput } from 'react-native';
import styled, { DefaultTheme, useTheme } from 'styled-components/native';

// OtpRequestForm — the email input form. The user types their address and
// taps "Send code". On submit, Supabase emails them a 6-digit code.
// isLoading disables the button and shows a spinner while the request is in flight.
interface OtpRequestFormProps {
  email: string;
  onEmailChange: (email: string) => void;
  onSubmit: () => void;
  isLoading?: boolean;
}

const Container = styled.View`
  width: 100%;
`;

const StyledTextInput = styled(TextInput)`
  border-width: 1px;
  border-color: ${({ theme }: { theme: DefaultTheme }) => theme.colors.inputBorderDark};
  background-color: ${({ theme }: { theme: DefaultTheme }) => theme.colors.inputBackgroundDark};
  border-radius: ${({ theme }: { theme: DefaultTheme }) => theme.radii.md}px;
  padding: ${({ theme }: { theme: DefaultTheme }) => theme.spacing.sm}px;
  font-size: ${({ theme }: { theme: DefaultTheme }) => theme.typography.sizeMd}px;
  color: ${({ theme }: { theme: DefaultTheme }) => theme.colors.textOnDark};
`;

const SubmitButton = styled(Pressable)`
  border-radius: ${({ theme }: { theme: DefaultTheme }) => theme.radii.md}px;
  overflow: hidden;
  margin-top: ${({ theme }: { theme: DefaultTheme }) => theme.spacing.md}px;
`;

const GradientBackground = styled(LinearGradient)`
  padding: ${({ theme }: { theme: DefaultTheme }) => theme.spacing.md}px;
  align-items: center;
`;

const ButtonText = styled.Text`
  color: ${({ theme }: { theme: DefaultTheme }) => theme.colors.white};
  font-size: ${({ theme }: { theme: DefaultTheme }) => theme.typography.sizeMd}px;
  font-weight: ${({ theme }: { theme: DefaultTheme }) => theme.typography.weightBold};
`;

export const OtpRequestForm = ({
  email,
  onEmailChange,
  onSubmit,
  isLoading = false,
}: OtpRequestFormProps) => {
  const theme = useTheme();

  return (
    <Container>
      <StyledTextInput
        placeholder="Enter Email Address"
        placeholderTextColor="rgba(255,255,255,0.25)"
        value={email}
        onChangeText={onEmailChange}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="email"
        textContentType="emailAddress"
        accessibilityLabel="Email address"
      />
      <SubmitButton
        onPress={onSubmit}
        disabled={isLoading}
        accessibilityLabel={isLoading ? 'Sending code' : 'Send code'}
        accessibilityRole="button"
        accessibilityState={{ busy: isLoading, disabled: isLoading }}
      >
        <GradientBackground
          colors={[theme.colors.primary, theme.colors.primaryMid]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          {isLoading ? (
            <ActivityIndicator color={theme.colors.white} />
          ) : (
            <ButtonText>Send code</ButtonText>
          )}
        </GradientBackground>
      </SubmitButton>
    </Container>
  );
};
```

- [ ] **Step 2b: Commit**

```bash
git add src/features/onboarding/components/OtpRequestForm/OtpRequestForm.tsx
git commit -m "feat: add OtpRequestForm component (email input, Send code button)"
```

---

## Task 3: Create OtpVerifyPanel (replace ConfirmationPanel)

**Files:**
- Create: `src/features/onboarding/components/OtpVerifyPanel/OtpVerifyPanel.tsx`
- Delete later (Task 6): `src/features/onboarding/components/ConfirmationPanel/ConfirmationPanel.tsx`

- [ ] **Step 3a: Create the new file**

Create `src/features/onboarding/components/OtpVerifyPanel/OtpVerifyPanel.tsx`:

```typescript
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, TextInput, useWindowDimensions } from 'react-native';
import styled, { DefaultTheme, useTheme } from 'styled-components/native';
import { GlassCard } from '~/shared/components/GlassCard';

// OtpVerifyPanel — the right-side slide panel shown after the user submits their
// email. It presents 6 individual digit boxes that fill as the user types,
// giving clear visual feedback on how many digits remain. A hidden TextInput
// captures keyboard events; the boxes are the visual layer on top.
//
// codeSentAt is a timestamp (Date.now()) that resets whenever a new code is
// sent — the panel uses it to restart the 60-second resend cooldown and clear
// the digit boxes.
interface OtpVerifyPanelProps {
  email: string;
  codeSentAt: number;
  onReset: () => void;
  onVerify: (code: string) => void;
  onResend: () => void;
  isVerifying?: boolean;
  errorMessage: string | null;
}

const RESEND_COOLDOWN_SECONDS = 60;

// Panel — outer container occupying one screen-width slot in SignInScreen's
// horizontal PanelRow. justify-content: center vertically centres the card.
const Panel = styled.View<{ $width: number; $isTablet: boolean }>`
  width: ${({ $width }) => $width}px;
  flex: 1;
  padding: ${({ $isTablet, theme }) =>
    $isTablet ? theme.spacing.xl : theme.spacing.md}px;
  justify-content: center;
`;

// GlassContent — centred column that spaces all panel elements evenly.
// Gap scales up on tablets so the layout feels proportional at arm's length.
const GlassContent = styled.View<{ $isTablet: boolean }>`
  align-items: center;
  gap: ${({ $isTablet, theme }) =>
    $isTablet ? theme.spacing.xl : theme.spacing.lg}px;
`;

// IconCircle — subtle semi-transparent disc behind the envelope emoji.
const IconCircle = styled.View<{ $isTablet: boolean }>`
  width: ${({ $isTablet }) => ($isTablet ? 72 : 48)}px;
  height: ${({ $isTablet }) => ($isTablet ? 72 : 48)}px;
  border-radius: ${({ theme }) => theme.radii.full}px;
  background-color: rgba(255, 255, 255, 0.08);
  align-items: center;
  justify-content: center;
`;

const IconText = styled.Text<{ $isTablet: boolean }>`
  font-size: ${({ $isTablet, theme }) =>
    $isTablet ? theme.typography.sizeXl : theme.typography.sizeLg}px;
`;

const Heading = styled.Text<{ $isTablet: boolean }>`
  font-size: ${({ $isTablet, theme }) =>
    $isTablet ? theme.typography.sizeXl : theme.typography.sizeLg}px;
  font-weight: ${({ theme }) => theme.typography.weightBold};
  color: ${({ theme }) => theme.colors.textOnDark};
  letter-spacing: ${({ theme }) => theme.typography.letterSpacingTight}px;
`;

const BodyText = styled.Text<{ $isTablet: boolean }>`
  font-size: ${({ $isTablet, theme }) =>
    $isTablet ? theme.typography.sizeMd : theme.typography.sizeSm}px;
  color: ${({ theme }) => theme.colors.textMutedOnDark};
  text-align: center;
  line-height: ${({ theme }) => theme.typography.lineHeightSm}px;
`;

// EmailPillWrapper — the dark capsule framing the user's email address.
// Identical to ConfirmationPanel so the two panels feel like one continuous flow.
const EmailPillWrapper = styled.View<{ $isTablet: boolean }>`
  background-color: ${({ theme }) => theme.colors.inputBackgroundDark};
  border-width: 1px;
  border-color: ${({ theme }) => theme.colors.inputBorderDark};
  border-radius: ${({ theme }) => theme.radii.md}px;
  padding: ${({ $isTablet, theme }) =>
    $isTablet ? theme.spacing.sm : theme.spacing.xs}px
    ${({ $isTablet, theme }) =>
    $isTablet ? theme.spacing.md : theme.spacing.sm}px;
`;

const EmailPillText = styled.Text<{ $isTablet: boolean }>`
  color: ${({ theme }) => theme.colors.lime};
  font-weight: ${({ theme }) => theme.typography.weightBold};
  font-size: ${({ $isTablet, theme }) =>
    $isTablet ? theme.typography.sizeMd : theme.typography.sizeSm}px;
`;

// CodeInputContainer — positions the hidden TextInput relative to the box row
// so absolute placement keeps it out of layout flow while remaining focusable.
const CodeInputContainer = styled.View`
  width: 100%;
  position: relative;
`;

// CodeBoxRow — tappable row of 6 digit boxes. Pressing anywhere in the row
// focuses the hidden TextInput and brings up the number keyboard.
const CodeBoxRow = styled(Pressable)`
  flex-direction: row;
  gap: ${({ theme }: { theme: DefaultTheme }) => theme.spacing.sm}px;
  width: 100%;
`;

// SingleBox — one digit slot. The active slot (the next empty position while
// focused) gets a lime border and a slightly lighter background to draw the eye.
// Filled slots show the digit; the active-empty slot shows the blinking cursor.
const SingleBox = styled.View<{ $isActive: boolean }>`
  flex: 1;
  aspect-ratio: 1;
  background-color: ${({ $isActive, theme }) =>
    $isActive ? 'rgba(184,229,106,0.06)' : theme.colors.inputBackgroundDark};
  border-width: 1.5px;
  border-color: ${({ $isActive, theme }) =>
    $isActive ? theme.colors.lime : theme.colors.inputBorderDark};
  border-radius: ${({ theme }) => theme.radii.md}px;
  align-items: center;
  justify-content: center;
`;

// BoxDigit — the lime number rendered inside a filled box.
const BoxDigit = styled.Text`
  font-size: ${({ theme }: { theme: DefaultTheme }) => theme.typography.sizeXl}px;
  font-weight: ${({ theme }: { theme: DefaultTheme }) => theme.typography.weightBold};
  color: ${({ theme }: { theme: DefaultTheme }) => theme.colors.lime};
`;

// BoxCursor — a slim vertical lime bar inside the active empty box. Its
// visibility is toggled on a 500ms interval to produce a blinking caret effect
// while the hidden TextInput is focused.
const BoxCursor = styled.View`
  width: 2px;
  height: ${({ theme }: { theme: DefaultTheme }) => theme.typography.sizeXl}px;
  background-color: ${({ theme }: { theme: DefaultTheme }) => theme.colors.lime};
  border-radius: 1px;
`;

// HiddenInput — the real TextInput that captures keyboard events. Invisible
// (opacity 0, 1×1 px) and absolutely positioned so it never affects layout.
// The CodeBoxRow's onPress forwards focus to it via inputRef.
const HiddenInput = styled(TextInput)`
  position: absolute;
  opacity: 0;
  width: 1px;
  height: 1px;
`;

const VerifyButton = styled(Pressable)`
  width: 100%;
  border-radius: ${({ theme }: { theme: DefaultTheme }) => theme.radii.md}px;
  overflow: hidden;
`;

// GradientBackground — dims to 45% when the button is disabled (code under 6
// digits or request in flight) so the user can see it isn't ready to press.
const GradientBackground = styled(LinearGradient)<{ $isDisabled: boolean }>`
  padding: ${({ theme }) => theme.spacing.md}px;
  align-items: center;
  opacity: ${({ $isDisabled }) => ($isDisabled ? 0.45 : 1)};
`;

const ButtonText = styled.Text`
  color: ${({ theme }: { theme: DefaultTheme }) => theme.colors.white};
  font-size: ${({ theme }: { theme: DefaultTheme }) => theme.typography.sizeMd}px;
  font-weight: ${({ theme }: { theme: DefaultTheme }) => theme.typography.weightBold};
`;

// ErrorText — soft red shown below the verify button when the code is wrong or
// expired. Never shows the raw Supabase error (MASVS-CODE-4, MASWE-0087).
const ErrorText = styled.Text`
  font-size: ${({ theme }: { theme: DefaultTheme }) => theme.typography.sizeSm}px;
  color: ${({ theme }: { theme: DefaultTheme }) => theme.colors.errorOnDark};
  text-align: center;
`;

// ResendText — muted countdown while the cooldown runs, then becomes a tappable
// lime link when it expires. The colour shift alone signals availability.
const ResendText = styled.Text<{ $canResend: boolean }>`
  font-size: ${({ theme }: { theme: DefaultTheme }) => theme.typography.sizeSm}px;
  color: ${({ $canResend, theme }) =>
    $canResend ? theme.colors.lime : theme.colors.textMutedOnDark};
  text-decoration-line: ${({ $canResend }) => ($canResend ? 'underline' : 'none')};
`;

const ResetLink = styled.Text<{ $isTablet: boolean }>`
  font-size: ${({ $isTablet, theme }) =>
    $isTablet ? theme.typography.sizeMd : theme.typography.sizeSm}px;
  color: ${({ theme }) => theme.colors.textMutedOnDark};
  text-decoration-line: underline;
`;

export const OtpVerifyPanel = ({
  email,
  codeSentAt,
  onReset,
  onVerify,
  onResend,
  isVerifying = false,
  errorMessage,
}: OtpVerifyPanelProps) => {
  const theme = useTheme();
  const { width, height } = useWindowDimensions();
  const isTablet = Math.min(width, height) >= 600;

  // code — the digit string the hidden TextInput holds (e.g. "1234").
  // It drives both the box display and the onVerify call.
  const [code, setCode] = useState('');

  // isFocused — true while the hidden TextInput has keyboard focus.
  // Determines which box is "active" and whether the cursor blinks.
  const [isFocused, setIsFocused] = useState(false);

  // cursorVisible — toggled on a 500ms interval to produce the blinking cursor
  // inside the active empty box. Only meaningful when isFocused is true.
  const [cursorVisible, setCursorVisible] = useState(true);

  // secondsLeft — resend cooldown. Resets to 60 whenever codeSentAt changes.
  const [secondsLeft, setSecondsLeft] = useState(RESEND_COOLDOWN_SECONDS);

  const inputRef = useRef<TextInput>(null);
  const cooldownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const cursorIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Reset boxes, cooldown, and refocus the input whenever a new code is sent.
  useEffect(() => {
    setCode('');
    setSecondsLeft(RESEND_COOLDOWN_SECONDS);
    inputRef.current?.focus();

    cooldownIntervalRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          if (cooldownIntervalRef.current) clearInterval(cooldownIntervalRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (cooldownIntervalRef.current) clearInterval(cooldownIntervalRef.current);
    };
  }, [codeSentAt]);

  // Start or stop the cursor blink depending on whether the input is focused.
  useEffect(() => {
    if (isFocused) {
      setCursorVisible(true);
      cursorIntervalRef.current = setInterval(() => {
        setCursorVisible((prev) => !prev);
      }, 500);
    } else {
      if (cursorIntervalRef.current) clearInterval(cursorIntervalRef.current);
      setCursorVisible(false);
    }
    return () => {
      if (cursorIntervalRef.current) clearInterval(cursorIntervalRef.current);
    };
  }, [isFocused]);

  const canResend = secondsLeft === 0;
  const isVerifyDisabled = isVerifying || code.length < 6;

  const handleResend = () => {
    if (!canResend) return;
    onResend();
  };

  return (
    <Panel $width={width} $isTablet={isTablet}>
      <GlassCard>
        <GlassContent $isTablet={isTablet}>
          <IconCircle $isTablet={isTablet}>
            <IconText $isTablet={isTablet}>✉️</IconText>
          </IconCircle>

          <Heading $isTablet={isTablet}>Check your email</Heading>

          <BodyText $isTablet={isTablet}>We sent a 6-digit code to</BodyText>

          <EmailPillWrapper $isTablet={isTablet}>
            <EmailPillText $isTablet={isTablet}>{email}</EmailPillText>
          </EmailPillWrapper>

          {/* CodeInputContainer wraps both the visual box row and the hidden
              TextInput so the hidden input's absolute position is contained. */}
          <CodeInputContainer>
            {/* Tapping anywhere on the box row focuses the hidden input. */}
            <CodeBoxRow onPress={() => inputRef.current?.focus()}>
              {Array.from({ length: 6 }).map((_, i) => {
                const digit = code[i];
                // Active = next empty position while the input is focused.
                const isActive = isFocused && i === code.length;
                return (
                  <SingleBox key={i} $isActive={isActive}>
                    {digit ? (
                      <BoxDigit>{digit}</BoxDigit>
                    ) : isActive && cursorVisible ? (
                      <BoxCursor />
                    ) : null}
                  </SingleBox>
                );
              })}
            </CodeBoxRow>

            {/* HiddenInput — invisible, absolutely positioned. The box row
                above is its visual representation. caretHidden suppresses the
                native OS caret so our BoxCursor is the only cursor shown. */}
            <HiddenInput
              ref={inputRef}
              value={code}
              onChangeText={setCode}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              keyboardType="number-pad"
              maxLength={6}
              caretHidden
              accessibilityLabel="6-digit verification code"
            />
          </CodeInputContainer>

          <VerifyButton
            onPress={() => onVerify(code)}
            disabled={isVerifyDisabled}
            accessibilityLabel={isVerifying ? 'Verifying code' : 'Sign in'}
            accessibilityRole="button"
            accessibilityState={{ busy: isVerifying, disabled: isVerifyDisabled }}
          >
            <GradientBackground
              $isDisabled={isVerifyDisabled}
              colors={[theme.colors.primary, theme.colors.primaryMid]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              {isVerifying ? (
                <ActivityIndicator color={theme.colors.white} />
              ) : (
                <ButtonText>Sign in</ButtonText>
              )}
            </GradientBackground>
          </VerifyButton>

          {errorMessage && <ErrorText>{errorMessage}</ErrorText>}

          <ResendText
            $canResend={canResend}
            onPress={handleResend}
            accessibilityRole="button"
            accessibilityLabel={
              canResend ? 'Resend code' : `Resend code in ${secondsLeft} seconds`
            }
            accessibilityState={{ disabled: !canResend }}
          >
            {canResend ? 'Resend code' : `Resend code in ${secondsLeft}s`}
          </ResendText>

          <ResetLink
            $isTablet={isTablet}
            onPress={onReset}
            accessibilityRole="button"
            accessibilityLabel="Use a different email"
          >
            Use a different email
          </ResetLink>
        </GlassContent>
      </GlassCard>
    </Panel>
  );
};
```

- [ ] **Step 3b: Commit**

```bash
git add src/features/onboarding/components/OtpVerifyPanel/OtpVerifyPanel.tsx
git commit -m "feat: add OtpVerifyPanel component (code input, verify button, resend timer)"
```

---

## Task 4: Update SignInScreen

**Files:**
- Modify: `src/features/onboarding/screens/SignIn.tsx`

- [ ] **Step 4a: Replace the content of SignIn.tsx**

Replace the entire content of `src/features/onboarding/screens/SignIn.tsx`:

```typescript
import { Image } from 'expo-image';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  useWindowDimensions,
} from 'react-native';
import styled from 'styled-components/native';
import { sendOtpCode, verifyOtpCode } from '~/features/auth/services/authService';
import { GlassCard } from '~/shared/components/GlassCard';
import { OtpRequestForm } from '../components/OtpRequestForm/OtpRequestForm';
import { OtpVerifyPanel } from '../components/OtpVerifyPanel/OtpVerifyPanel';
import { SocialAuthButtons } from '../components/SocialAuthButtons';

const KEYBOARD_BEHAVIOR = Platform.select<'padding' | undefined>({
  ios: 'padding',
  default: undefined,
});

// Screen — full-screen KeyboardAvoidingView. On iOS, shifts the layout up
// when the keyboard appears so the email input stays visible.
const Screen = styled(KeyboardAvoidingView)`
  flex: 1;
`;

// PhotoBackground — the mowing photo covers the entire screen. Both the hero
// area and the auth panel sit on top of this single image so the glass card
// has a real photo to blur and the two sections read as one unified background.
const PhotoBackground = styled(ImageBackground)`
  flex: 1;
`;

// TintOverlay — a semi-transparent dark layer over the photo that brings
// the overall luminance down so text and the glass card are legible against
// the greenery without losing the sense of depth from the photo.
const TintOverlay = styled.View`
  flex: 1;
  background-color: rgba(5, 12, 5, 0.58);
`;

// GlassHero — the upper quarter of the screen. The logo, wordmark, and
// tagline sit here, floating directly over the tinted photo.
const GlassHero = styled.View`
  flex: 1;
  align-items: center;
  justify-content: center;
  padding-top: ${({ theme }) => theme.spacing.xxl * 4}px;
  gap: ${({ theme }) => theme.spacing.xs}px;
`;

// LogoImage — the kura SVG mark rendered via expo-image for reliable SVG
// support across iOS and Android. Size scales up on tablets.
const LogoImage = styled(Image)<{ $isTablet: boolean }>`
  width: ${({ $isTablet }) => ($isTablet ? 150 : 120)}px;
  height: ${({ $isTablet }) => ($isTablet ? 150 : 120)}px;
  margin-bottom: ${({ theme }) => theme.spacing.xs}px;
`;

// Wordmark — the "kura" brand name in a heavy weight. On tablets the type
// scales up to stay proportional to the larger logo.
const Wordmark = styled.Text<{ $isTablet: boolean }>`
  color: ${({ theme }) => theme.colors.textOnDark};
  font-size: ${({ $isTablet, theme }) =>
    $isTablet ? theme.typography.size2xl : theme.typography.size2xl * 0.8}px;
  font-weight: ${({ theme }) => theme.typography.weightBlack};
  letter-spacing: ${({ theme }) => theme.typography.letterSpacingBrand}px;
`;

// Tagline — "Lawn care, simplified" in lime, uppercase and letter-spaced.
const Tagline = styled.Text<{ $isTablet: boolean }>`
  color: ${({ theme }) => theme.colors.lime};
  font-size: ${({ $isTablet, theme }) =>
    $isTablet ? theme.typography.sizeSm : theme.typography.sizeSm * 0.8}px;
  font-weight: ${({ theme }) => theme.typography.weightBold};
  text-transform: uppercase;
  letter-spacing: ${({ theme }) => theme.typography.letterSpacingWide}px;
`;

// PanelHost — the lower three-fifths that holds both sliding panels.
// overflow: hidden clips whichever panel is off-screen during the slide.
const PanelHost = styled.View`
  flex: 3;
  overflow: hidden;
`;

// GlassAuthContent — the container for the form panel. Its explicit width
// reserves exactly one screen-width slot in the horizontal row.
const GlassAuthContent = styled.View<{ $width: number }>`
  width: ${({ $width }) => $width}px;
  padding: ${({ theme }) => theme.spacing.md}px;
  justify-content: center;
`;

// PanelRow — the horizontal Animated row that holds both panels side-by-side.
// The Animated inline style carries two runtime values: total width (2× screen
// width) and the translateX transform driven by slideAnim.
const PanelRow = styled(Animated.View)`
  flex-direction: row;
  flex: 1;
`;

// Divider — the "or continue with" row between the OTP request form and
// the social buttons, inside the glass card.
const Divider = styled.View`
  flex-direction: row;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm}px;
`;

const DividerLine = styled.View`
  flex: 1;
  height: 1px;
  background-color: ${({ theme }) => theme.colors.borderOnDark};
`;

const DividerText = styled.Text`
  font-size: ${({ theme }) => theme.typography.sizeXs}px;
  color: ${({ theme }) => theme.colors.textMutedOnDark};
`;

// ErrorText — shown below the OTP request form when something goes wrong
// (submit failure). Uses errorOnDark so it reads on the glass card.
const ErrorText = styled.Text`
  font-size: ${({ theme }) => theme.typography.sizeSm}px;
  color: ${({ theme }) => theme.colors.errorOnDark};
  text-align: center;
  margin-top: ${({ theme }) => theme.spacing.xs}px;
`;

// isValidEmail — basic shape check before sending a network request.
// Supabase will reject malformed addresses anyway; this catches obvious typos.
const isValidEmail = (value: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

export const SignInScreen = () => {
  const [email, setEmail] = useState('');

  // isConfirming disables pointer events on the off-screen form so stray taps
  // can't reach hidden inputs — especially important on Android where
  // overflow: hidden alone doesn't block touches.
  const [isConfirming, setIsConfirming] = useState(false);

  // isSubmitting tracks whether a sendOtpCode request is in flight.
  const [isSubmitting, setIsSubmitting] = useState(false);

  // sendError is shown below the email form if the OTP send fails.
  const [sendError, setSendError] = useState<string | null>(null);

  // isVerifying tracks whether a verifyOtpCode request is in flight.
  const [isVerifying, setIsVerifying] = useState(false);

  // verifyError is shown inside OtpVerifyPanel if the code is wrong or expired.
  const [verifyError, setVerifyError] = useState<string | null>(null);

  // codeSentAt is the timestamp of the most recent successful OTP send.
  // OtpVerifyPanel uses this to reset its 60-second resend cooldown whenever
  // a new code goes out (initial send or resend).
  const [codeSentAt, setCodeSentAt] = useState(0);

  // error is the query param appended by the old magic link callback on failure.
  // Kept for backwards-compatibility if any old links are tapped.
  const { error: linkError } = useLocalSearchParams<{ error?: string }>();
  useEffect(() => {
    if (linkError === 'link-expired') {
      setSendError('Your link has expired. Please request a new code.');
    }
  }, [linkError]);

  const { width: screenWidth, height } = useWindowDimensions();
  const isTablet = Math.min(screenWidth, height) >= 600;

  // slideAnim is the horizontal offset applied to the panel row.
  // 0 = OTP request form visible. -screenWidth = OTP verify panel visible.
  const slideAnim = useRef(new Animated.Value(0)).current;

  const slide = (toValue: number, onDone?: () => void) =>
    Animated.timing(slideAnim, {
      toValue,
      duration: 320,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(onDone);

  // handleSubmit sends the OTP email then slides in the verify panel on success.
  // On failure, we show a generic message — never the raw Supabase error (MASVS-CODE-4).
  const handleSubmit = async () => {
    if (!isValidEmail(email)) {
      setSendError('Please enter a valid email address (e.g. name@example.com).');
      return;
    }
    setSendError(null);
    setIsSubmitting(true);
    try {
      await sendOtpCode(email);
      setCodeSentAt(Date.now());
      setIsConfirming(true);
      slide(-screenWidth);
    } catch (err) {
      if (__DEV__) console.log('[SignIn] sendOtpCode error:', err);
      setSendError(
        __DEV__ && err instanceof Error
          ? err.message
          : 'Something went wrong. Please try again.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // handleResend sends a fresh OTP code to the same email and resets
  // the verify panel's cooldown timer via the updated codeSentAt timestamp.
  const handleResend = async () => {
    try {
      await sendOtpCode(email);
      setCodeSentAt(Date.now());
      setVerifyError(null);
    } catch (err) {
      if (__DEV__) console.log('[SignIn] resend error:', err);
      setVerifyError('Could not resend the code. Please try again.');
    }
  };

  // handleVerify exchanges the 6-digit code for a session. On success, Supabase
  // fires onAuthStateChange — AuthProvider updates the Zustand store and the
  // routing guard in (auth)/_layout.tsx redirects to "/" automatically.
  const handleVerify = async (code: string) => {
    setIsVerifying(true);
    setVerifyError(null);
    try {
      await verifyOtpCode(email, code);
      // Navigation is automatic — AuthProvider's onAuthStateChange listener
      // fires, updates hasCompletedOnboarding, and the routing guard redirects.
    } catch (err) {
      if (__DEV__) console.log('[SignIn] verifyOtpCode error:', err);
      setVerifyError('That code is incorrect or has expired. Try again or request a new one.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleEmailChange = (text: string) => {
    setEmail(text);
    if (sendError) setSendError(null);
  };

  // handleReset slides the form back in, then clears email and verify state
  // only after the animation finishes — so the form is never visible mid-slide
  // with stale state.
  const handleReset = () =>
    slide(0, () => {
      setIsConfirming(false);
      setEmail('');
      setSendError(null);
      setVerifyError(null);
    });

  return (
    <Screen behavior={KEYBOARD_BEHAVIOR}>
      {/* PhotoBackground covers the full screen so the glass card blurs a real
          photo rather than a flat colour. resizeMode="cover" fills any screen
          aspect ratio without letterboxing. */}
      <PhotoBackground
        source={require('../../../../assets/images/mowing-photo.jpg')}
        resizeMode="cover"
      >
        <TintOverlay>
          <GlassHero>
            <LogoImage
              $isTablet={isTablet}
              accessibilityLabel="Kura logo"
              source={require('../../../../assets/images/kura-logo.svg')}
              contentFit="contain"
            />
            <Wordmark $isTablet={isTablet}>kura</Wordmark>
            <Tagline $isTablet={isTablet}>Lawn care, simplified</Tagline>
          </GlassHero>

          <PanelHost>
            {/* PanelRow holds both panels in a horizontal row.
                Total width is 2× screen width — one panel slot each.
                slideAnim shifts the entire row so the right panel comes
                into view. Both panels are always mounted so the slide
                is instant with no layout recalculation mid-animation. */}
            <PanelRow
              style={{
                width: screenWidth * 2,
                transform: [{ translateX: slideAnim }],
              }}
            >
              <GlassAuthContent
                $width={screenWidth}
                pointerEvents={isConfirming ? 'none' : 'auto'}
              >
                <GlassCard>
                  <OtpRequestForm
                    email={email}
                    onEmailChange={handleEmailChange}
                    onSubmit={handleSubmit}
                    isLoading={isSubmitting}
                  />
                  {sendError && <ErrorText>{sendError}</ErrorText>}
                  <Divider>
                    <DividerLine />
                    <DividerText>or continue with</DividerText>
                    <DividerLine />
                  </Divider>
                  <SocialAuthButtons
                    onGooglePress={() => {}}
                    onApplePress={() => {}}
                  />
                </GlassCard>
              </GlassAuthContent>

              <OtpVerifyPanel
                email={email}
                codeSentAt={codeSentAt}
                onReset={handleReset}
                onVerify={handleVerify}
                onResend={handleResend}
                isVerifying={isVerifying}
                errorMessage={verifyError}
              />
            </PanelRow>
          </PanelHost>
        </TintOverlay>
      </PhotoBackground>
    </Screen>
  );
};
```

- [ ] **Step 4b: Commit**

```bash
git add src/features/onboarding/screens/SignIn.tsx
git commit -m "feat: update SignInScreen to use OTP code flow (sendOtpCode + verifyOtpCode)"
```

---

## Task 5: Update SignInScreen tests

**Files:**
- Modify: `src/features/onboarding/screens/SignIn.test.tsx`

- [ ] **Step 5a: Write the updated test file**

Replace the entire content of `src/features/onboarding/screens/SignIn.test.tsx`:

```typescript
// Tests for SignInScreen — the two-panel OTP sign-in flow.
//
// Panel 1: Email form — user types address, presses "Send code"
// Panel 2: OTP verify panel — user types 6-digit code, presses "Sign in"
//
// Both panels are always in the React tree for the slide animation.
// Assertions target state changes (error messages, loading labels, button states).

jest.mock('expo-blur', () => ({ BlurView: 'BlurView' }));
jest.mock('expo-image', () => ({ Image: 'Image' }));
jest.mock('expo-linear-gradient', () => ({ LinearGradient: 'LinearGradient' }));
jest.mock('../../../assets/images/kura-logo.svg', () => 'kura-logo-svg', { virtual: true });
jest.mock('../../../assets/images/google-logo.svg', () => 'google-logo-svg', { virtual: true });
jest.mock('../../../assets/images/apple-logo.svg', () => 'apple-logo-svg', { virtual: true });
jest.mock('../../../../assets/images/mowing-photo.jpg', () => 1, { virtual: true });

jest.mock('~/features/auth/services/authService', () => ({
  sendOtpCode: jest.fn(),
  verifyOtpCode: jest.fn(),
}));

jest.mock('expo-router', () => ({
  useLocalSearchParams: jest.fn(() => ({})),
}));

import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { useLocalSearchParams } from 'expo-router';
import React from 'react';
import { ThemeProvider } from 'styled-components/native';
import { lightTheme } from '~/config/theme';
import { sendOtpCode, verifyOtpCode } from '~/features/auth/services/authService';
import { SignInScreen } from './SignIn';

const mockSendOtpCode = sendOtpCode as jest.Mock;
const mockVerifyOtpCode = verifyOtpCode as jest.Mock;
const mockUseLocalSearchParams = useLocalSearchParams as jest.Mock;

const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider theme={lightTheme}>{children}</ThemeProvider>
);

beforeEach(() => {
  jest.clearAllMocks();
  mockSendOtpCode.mockResolvedValue(undefined);
  mockVerifyOtpCode.mockResolvedValue(undefined);
  mockUseLocalSearchParams.mockReturnValue({});
});

describe('SignInScreen', () => {
  it('renders the email input by default', () => {
    const { getByPlaceholderText } = render(<SignInScreen />, { wrapper: Wrapper });
    expect(getByPlaceholderText('Enter Email Address')).toBeTruthy();
  });

  it('shows the OTP verify panel after successfully submitting an email', async () => {
    mockSendOtpCode.mockResolvedValue(undefined);

    const { getByPlaceholderText, getByText } = render(<SignInScreen />, { wrapper: Wrapper });
    fireEvent.changeText(getByPlaceholderText('Enter Email Address'), 'hello@kura.com');
    fireEvent.press(getByText('Send code'));

    await waitFor(() => {
      expect(getByText('hello@kura.com')).toBeTruthy();
    });

    expect(mockSendOtpCode).toHaveBeenCalledWith('hello@kura.com');
    // The hidden TextInput behind the six boxes is found by its a11y label.
    expect(getByLabelText('6-digit verification code')).toBeTruthy();
  });

  it('calls verifyOtpCode with the email and entered code when Sign in is pressed', async () => {
    mockSendOtpCode.mockResolvedValue(undefined);

    const { getByPlaceholderText, getByText, getByLabelText } = render(<SignInScreen />, { wrapper: Wrapper });

    fireEvent.changeText(getByPlaceholderText('Enter Email Address'), 'hello@kura.com');
    fireEvent.press(getByText('Send code'));
    // The hidden TextInput behind the six boxes is found by its a11y label.
    await waitFor(() => expect(getByLabelText('6-digit verification code')).toBeTruthy());

    // Type directly into the hidden TextInput — the box row is the visual layer.
    fireEvent.changeText(getByLabelText('6-digit verification code'), '123456');
    fireEvent.press(getByLabelText('Sign in'));

    await waitFor(() => {
      expect(mockVerifyOtpCode).toHaveBeenCalledWith('hello@kura.com', '123456');
    });
  });

  it('shows a verify error message when verifyOtpCode fails', async () => {
    mockSendOtpCode.mockResolvedValue(undefined);
    mockVerifyOtpCode.mockRejectedValue(new Error('Token has expired or is invalid'));

    const { getByPlaceholderText, getByText, getByLabelText } = render(<SignInScreen />, { wrapper: Wrapper });

    fireEvent.changeText(getByPlaceholderText('Enter Email Address'), 'hello@kura.com');
    fireEvent.press(getByText('Send code'));
    await waitFor(() => expect(getByLabelText('6-digit verification code')).toBeTruthy());

    fireEvent.changeText(getByLabelText('6-digit verification code'), '999999');
    fireEvent.press(getByLabelText('Sign in'));

    await waitFor(() => {
      expect(
        getByText('That code is incorrect or has expired. Try again or request a new one.'),
      ).toBeTruthy();
    });
  });

  it('returns to the email form when "Use a different email" is pressed', async () => {
    mockSendOtpCode.mockResolvedValue(undefined);

    const { getByPlaceholderText, getByText } = render(<SignInScreen />, { wrapper: Wrapper });
    fireEvent.changeText(getByPlaceholderText('Enter Email Address'), 'hello@kura.com');
    fireEvent.press(getByText('Send code'));

    await waitFor(() => expect(mockSendOtpCode).toHaveBeenCalled());
    fireEvent.press(getByText('Use a different email'));

    expect(getByPlaceholderText('Enter Email Address')).toBeTruthy();
  });

  it('shows an error message when the OTP send request fails', async () => {
    mockSendOtpCode.mockRejectedValue(new Error('rate limited'));

    const { getByPlaceholderText, getByText } = render(<SignInScreen />, { wrapper: Wrapper });
    fireEvent.changeText(getByPlaceholderText('Enter Email Address'), 'test@example.com');
    fireEvent.press(getByText('Send code'));

    await waitFor(() => {
      expect(getByText('Something went wrong. Please try again.')).toBeTruthy();
    });

    // Raw error must NOT be shown (MASVS-CODE-4).
    expect(() => getByText('rate limited')).toThrow();
  });

  it('clears the send error when the user starts typing again', async () => {
    mockSendOtpCode.mockRejectedValue(new Error('oops'));

    const { getByPlaceholderText, getByText, queryByText } = render(<SignInScreen />, { wrapper: Wrapper });
    fireEvent.changeText(getByPlaceholderText('Enter Email Address'), 'bad@example.com');
    fireEvent.press(getByText('Send code'));

    await waitFor(() => {
      expect(getByText('Something went wrong. Please try again.')).toBeTruthy();
    });

    fireEvent.changeText(getByPlaceholderText('Enter Email Address'), 'new@example.com');
    expect(queryByText('Something went wrong. Please try again.')).toBeNull();
  });

  it('replaces the button label with a loading indicator while send is in flight', async () => {
    let resolveRequest!: () => void;
    mockSendOtpCode.mockImplementation(
      () => new Promise<void>((resolve) => { resolveRequest = resolve; }),
    );

    const { getByPlaceholderText, getByText, getByLabelText } = render(<SignInScreen />, { wrapper: Wrapper });
    fireEvent.changeText(getByPlaceholderText('Enter Email Address'), 'test@example.com');
    fireEvent.press(getByText('Send code'));

    await waitFor(() => {
      expect(getByLabelText('Sending code')).toBeTruthy();
    });

    resolveRequest();
  });

  it('shows a link-expired message when the URL has error=link-expired', () => {
    mockUseLocalSearchParams.mockReturnValue({ error: 'link-expired' });

    const { getByText } = render(<SignInScreen />, { wrapper: Wrapper });
    expect(getByText('Your link has expired. Please request a new code.')).toBeTruthy();
  });
});
```

- [ ] **Step 5b: Run the tests**

```bash
npx jest src/features/onboarding/screens/SignIn.test.tsx --no-coverage
```

Expected: PASS (8 tests).

- [ ] **Step 5c: Commit**

```bash
git add src/features/onboarding/screens/SignIn.test.tsx
git commit -m "test: update SignInScreen tests for OTP code flow"
```

---

## Task 6: Remove obsolete files

- [ ] **Step 6a: Delete the deep link callback screen**

```bash
rm app/auth/callback.tsx
```

No Expo Router registration needed — file deletion is enough for Expo Router to stop serving the route.

- [ ] **Step 6b: Verify expo-auth-session and expo-web-browser are not used elsewhere**

```bash
grep -r "expo-auth-session\|expo-web-browser" src/ app/ --include="*.ts" --include="*.tsx"
```

Expected: no output (both are now unused). If any output appears, check those files before proceeding.

- [ ] **Step 6c: Delete the old MagicLinkForm and ConfirmationPanel component files**

```bash
rm -rf src/features/onboarding/components/MagicLinkForm/
rm -rf src/features/onboarding/components/ConfirmationPanel/
```

- [ ] **Step 6d: Run the full test suite to confirm nothing is broken**

```bash
npx jest --no-coverage
```

Expected: all tests pass.

- [ ] **Step 6e: Commit**

```bash
git add -u
git commit -m "chore: remove magic link deep link handler and obsolete components"
```

---

## Verification

### Unit tests
```bash
npx jest --no-coverage
```
All tests pass.

### Manual end-to-end on device / simulator
1. Launch the app (`expo start`)
2. Go to sign-in screen → email form shows "Send code" button
3. Enter a real email address → tap "Send code" → panel slides to OTP entry
4. Check email inbox → 6-digit code arrives from Supabase
5. Enter the code in the code input → tap "Sign in"
6. App navigates to onboarding (new user) or home tabs (returning user) automatically
7. Enter an incorrect code → error message "That code is incorrect or has expired" appears
8. Wait 60 seconds → "Resend code" becomes tappable → tap it → new code arrives in email
9. Tap "Use a different email" → slides back to email form
