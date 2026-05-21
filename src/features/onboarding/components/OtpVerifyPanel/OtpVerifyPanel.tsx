import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, TextInput, useWindowDimensions } from 'react-native';
import styled, { DefaultTheme, useTheme } from 'styled-components/native';
import { GlassCard } from '~/shared/components/GlassCard';

// OtpVerifyPanel — the right-side slide panel shown after the user submits their
// email. It shows six digit boxes and a hidden TextInput that captures keyboard
// input. When the user types, the code fills into the visual boxes one digit at
// a time. The verify button enables once all 6 digits are entered.
//
// codeSentAt is a Date.now() timestamp that resets whenever a new code is sent —
// the panel uses it to restart the 60-second resend cooldown and clear the input.
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
const CODE_LENGTH = 6;

// Panel — outer container that occupies one screen-width slot in the horizontal
// PanelRow in SignInScreen. justify-content: center vertically centres the card.
const Panel = styled.View<{ $width: number; $isTablet: boolean }>`
  width: ${({ $width }) => $width}px;
  flex: 1;
  padding: ${({ $isTablet, theme }) =>
    $isTablet ? theme.spacing.xl : theme.spacing.md}px;
  justify-content: center;
`;

// GlassContent — centres all panel elements in a column with consistent spacing.
const GlassContent = styled.View<{ $isTablet: boolean }>`
  align-items: center;
  gap: ${({ $isTablet, theme }) =>
    $isTablet ? theme.spacing.xl : theme.spacing.lg}px;
`;

// IconCircle — circular badge behind the lock emoji icon.
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
`;

const EmailPillWrapper = styled.View`
  background-color: ${({ theme }: { theme: DefaultTheme }) => theme.colors.inputBackgroundDark};
  border-width: 1px;
  border-color: ${({ theme }: { theme: DefaultTheme }) => theme.colors.inputBorderDark};
  border-radius: ${({ theme }: { theme: DefaultTheme }) => theme.radii.md}px;
  padding: ${({ theme }: { theme: DefaultTheme }) => theme.spacing.xs}px
    ${({ theme }: { theme: DefaultTheme }) => theme.spacing.sm}px;
`;

const EmailPillText = styled.Text`
  color: ${({ theme }: { theme: DefaultTheme }) => theme.colors.lime};
  font-weight: ${({ theme }: { theme: DefaultTheme }) => theme.typography.weightBold};
  font-size: ${({ theme }: { theme: DefaultTheme }) => theme.typography.sizeSm}px;
`;

// CodeInputContainer — wraps the CodeBoxRow and HiddenInput in a relative
// container so the hidden input can be positioned absolutely behind the boxes.
const CodeInputContainer = styled.View`
  position: relative;
  width: 100%;
`;

// CodeBoxRow — a Pressable row containing all 6 digit boxes. Tapping anywhere
// on the row focuses the hidden input and brings up the keyboard.
const CodeBoxRow = styled(Pressable)`
  flex-direction: row;
  gap: ${({ theme }: { theme: DefaultTheme }) => theme.spacing.sm}px;
  width: 100%;
`;

// SingleBox — one digit slot. $isActive turns on the lime border and faint
// lime background tint to signal which box the cursor is currently in.
// aspect-ratio: 1 keeps boxes square regardless of screen width.
const SingleBox = styled.View<{ $isActive: boolean }>`
  flex: 1;
  aspect-ratio: 1;
  background-color: ${({ $isActive, theme }) =>
    $isActive ? 'rgba(184,229,106,0.06)' : theme.colors.inputBackgroundDark};
  border-width: 1.5px;
  border-color: ${({ $isActive, theme }) =>
    $isActive ? theme.colors.lime : theme.colors.inputBorderDark};
  border-radius: ${({ theme }: { theme: DefaultTheme }) => theme.radii.md}px;
  align-items: center;
  justify-content: center;
`;

// BoxDigit — the digit character shown inside a filled box. Lime colour matches
// the OTP panel preview design.
const BoxDigit = styled.Text`
  color: ${({ theme }: { theme: DefaultTheme }) => theme.colors.lime};
  font-size: ${({ theme }: { theme: DefaultTheme }) => theme.typography.sizeXl}px;
  font-weight: ${({ theme }: { theme: DefaultTheme }) => theme.typography.weightBold};
`;

// BoxCursor — a blinking 2px vertical bar shown in the active empty box.
// cursorVisible toggles via a setInterval so it blinks at 500ms.
const BoxCursor = styled.View<{ $visible: boolean }>`
  width: 2px;
  height: ${({ theme }: { theme: DefaultTheme }) => theme.typography.sizeLg}px;
  background-color: ${({ theme }: { theme: DefaultTheme }) => theme.colors.lime};
  opacity: ${({ $visible }) => ($visible ? 1 : 0)};
`;

// HiddenInput — a 1×1px TextInput positioned absolutely behind the digit boxes.
// It captures all keyboard input but is invisible to the user. The visual boxes
// are rendered from the `code` state it drives. caretHidden suppresses the OS
// cursor so only our custom BoxCursor is visible.
const HiddenInput = styled(TextInput)`
  position: absolute;
  width: 1px;
  height: 1px;
  opacity: 0;
`;

// VerifyButton — the Sign in button. $isDisabled dims it with reduced opacity
// when the code is less than 6 digits or a verification is already in flight.
const VerifyButton = styled(Pressable)<{ $isDisabled: boolean }>`
  width: 100%;
  border-radius: ${({ theme }: { theme: DefaultTheme }) => theme.radii.md}px;
  overflow: hidden;
  opacity: ${({ $isDisabled }) => ($isDisabled ? 0.45 : 1)};
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

// ErrorText — shown below the verify button when the code is wrong or expired.
const ErrorText = styled.Text`
  font-size: ${({ theme }: { theme: DefaultTheme }) => theme.typography.sizeSm}px;
  color: ${({ theme }: { theme: DefaultTheme }) => theme.colors.errorOnDark};
  text-align: center;
`;

// ResendText — the resend link below the error area. $canResend switches it
// from muted grey to lime+underline once the 60-second cooldown expires.
const ResendText = styled.Text<{ $canResend: boolean }>`
  font-size: ${({ theme }: { theme: DefaultTheme }) => theme.typography.sizeSm}px;
  color: ${({ $canResend, theme }) =>
    $canResend ? theme.colors.lime : theme.colors.textMutedOnDark};
  text-decoration-line: ${({ $canResend }) => ($canResend ? 'underline' : 'none')};
`;

const ResetLink = styled.Text`
  font-size: ${({ theme }: { theme: DefaultTheme }) => theme.typography.sizeSm}px;
  color: ${({ theme }: { theme: DefaultTheme }) => theme.colors.textMutedOnDark};
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

  // code — the digits the user has typed so far (max 6).
  const [code, setCode] = useState('');

  // isFocused — true while the hidden input is focused (keyboard is up).
  // Drives the cursor visibility and active box highlighting.
  const [isFocused, setIsFocused] = useState(false);

  // cursorVisible — toggled by a 500ms interval to produce the blinking cursor.
  const [cursorVisible, setCursorVisible] = useState(true);

  // secondsLeft — counts down from 60 after each OTP send. Reaching 0 enables
  // the Resend link.
  const [secondsLeft, setSecondsLeft] = useState(RESEND_COOLDOWN_SECONDS);

  const inputRef = useRef<TextInput>(null);
  const cooldownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const cursorIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Reset code, restart cooldown, and auto-focus whenever a new OTP code is sent.
  // codeSentAt changes on the initial send and on every resend.
  useEffect(() => {
    if (!codeSentAt) return;

    setCode('');
    setSecondsLeft(RESEND_COOLDOWN_SECONDS);

    if (cooldownIntervalRef.current) clearInterval(cooldownIntervalRef.current);

    cooldownIntervalRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          if (cooldownIntervalRef.current) clearInterval(cooldownIntervalRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Small delay so the slide animation completes before the keyboard appears.
    setTimeout(() => inputRef.current?.focus(), 350);

    return () => {
      if (cooldownIntervalRef.current) clearInterval(cooldownIntervalRef.current);
    };
  }, [codeSentAt]);

  // Start the cursor blink interval when focused; stop it when unfocused.
  useEffect(() => {
    if (isFocused) {
      setCursorVisible(true);
      cursorIntervalRef.current = setInterval(() => {
        setCursorVisible((v) => !v);
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
  const isVerifyDisabled = isVerifying || code.length < CODE_LENGTH;

  // activeBoxIndex — the index of the box that should show the cursor.
  // It's the next empty slot, clamped to the last box once all 6 are filled.
  const activeBoxIndex = Math.min(code.length, CODE_LENGTH - 1);

  const handleResend = () => {
    if (!canResend) return;
    onResend();
  };

  return (
    <Panel $width={width} $isTablet={isTablet}>
      {/* ScrollView allows the content to scroll when the panel is height-constrained
          by the compact hero + keyboard. keyboardShouldPersistTaps="handled" ensures
          taps on the CodeBoxRow still reach it even when the keyboard is up. */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ flexGrow: 1 }}
      >
      <GlassCard>
        <GlassContent $isTablet={isTablet}>
          <IconCircle $isTablet={isTablet}>
            <IconText $isTablet={isTablet}>🔐</IconText>
          </IconCircle>

          <Heading $isTablet={isTablet}>Check your email</Heading>

          <BodyText $isTablet={isTablet}>We sent a 6-digit code to</BodyText>

          <EmailPillWrapper>
            <EmailPillText>{email}</EmailPillText>
          </EmailPillWrapper>

          <CodeInputContainer>
            {/* CodeBoxRow shows the 6 visual digit boxes. Pressing anywhere on the row
                focuses the hidden input below, bringing up the number-pad keyboard. */}
            <CodeBoxRow
              onPress={() => inputRef.current?.focus()}
              accessibilityRole="none"
            >
              {Array.from({ length: CODE_LENGTH }).map((_, i) => {
                const digit = code[i];
                const isActive = isFocused && i === activeBoxIndex && code.length < CODE_LENGTH;
                const isLastFilled = isFocused && code.length === CODE_LENGTH && i === CODE_LENGTH - 1;

                return (
                  <SingleBox key={i} $isActive={isActive || isLastFilled}>
                    {digit ? (
                      <BoxDigit>{digit}</BoxDigit>
                    ) : (
                      <BoxCursor $visible={(isActive || isLastFilled) && cursorVisible} />
                    )}
                  </SingleBox>
                );
              })}
            </CodeBoxRow>

            {/* HiddenInput — captures keyboard input and drives the code state.
                It is invisible but receives focus when the CodeBoxRow is pressed.
                caretHidden stops iOS/Android showing their own cursor on this input. */}
            <HiddenInput
              ref={inputRef}
              value={code}
              onChangeText={setCode}
              keyboardType="number-pad"
              maxLength={CODE_LENGTH}
              caretHidden
              accessibilityLabel="6-digit verification code"
              testID="otp-code-input"
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
            />
          </CodeInputContainer>

          <VerifyButton
            $isDisabled={isVerifyDisabled}
            onPress={() => onVerify(code)}
            disabled={isVerifyDisabled}
            testID="otp-verify-button"
            accessibilityLabel={isVerifying ? 'Verifying code' : 'Sign in'}
            accessibilityRole="button"
            accessibilityState={{ busy: isVerifying, disabled: isVerifyDisabled }}
          >
            <GradientBackground
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
            onPress={onReset}
            accessibilityRole="button"
            accessibilityLabel="Use a different email"
          >
            Use a different email
          </ResetLink>
        </GlassContent>
      </GlassCard>
      </ScrollView>
    </Panel>
  );
};
