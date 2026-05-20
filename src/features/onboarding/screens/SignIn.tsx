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
  padding-top: ${({ theme }) => theme.spacing.xxl*4}px;
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

// Tagline — "Lawn care, simplified" in lime, uppercase and letter-spaced for
// that sport-utility feel that contrasts nicely with the heavy wordmark above.
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

// GlassAuthContent — the container for the email form panel. Its explicit width
// reserves exactly one screen-width slot in the horizontal row. The padding
// creates breathing room between the glass card and the screen edges.
const GlassAuthContent = styled.View<{ $width: number }>`
  width: ${({ $width }) => $width}px;
  padding: ${({ theme }) => theme.spacing.md}px;
  justify-content: center;
`;

// PanelRow — the horizontal Animated row that holds both panels side-by-side.
// flex-direction: row and flex: 1 are static layout values defined here so the
// Animated.View inline style only needs to carry the two runtime-computed values:
// the total width (2× screen width) and the translateX transform (slideAnim).
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

// DividerLine — one of the two thin horizontal rules flanking the label.
const DividerLine = styled.View`
  flex: 1;
  height: 1px;
  background-color: ${({ theme }) => theme.colors.borderOnDark};
`;

const DividerText = styled.Text`
  font-size: ${({ theme }) => theme.typography.sizeXs}px;
  color: ${({ theme }) => theme.colors.textMutedOnDark};
`;

// ErrorText — the inline error that appears below the OTP request form when
// something goes wrong (send failure or expired deep link redirect).
const ErrorText = styled.Text`
  font-size: ${({ theme }) => theme.typography.sizeSm}px;
  color: ${({ theme }) => theme.colors.errorOnDark};
  text-align: center;
  margin-top: ${({ theme }) => theme.spacing.xs}px;
`;

// isValidEmail — checks that the string has the basic shape of an email address.
// Supabase will reject malformed addresses anyway; this is a first-pass check to
// catch obvious typos before a network request goes out.
const isValidEmail = (value: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

export const SignInScreen = () => {
  const [email, setEmail] = useState('');

  // isConfirming disables pointer events on the off-screen form so stray taps
  // can't reach hidden inputs — especially important on Android where
  // overflow: hidden alone doesn't block touches.
  const [isConfirming, setIsConfirming] = useState(false);

  // isSubmitting tracks whether a sendOtpCode request is in flight. True while
  // the request runs so the button shows a spinner and stays disabled — prevents
  // double-submits.
  const [isSubmitting, setIsSubmitting] = useState(false);

  // sendError holds the text shown below the email form when the OTP send fails.
  // null means no error.
  const [sendError, setSendError] = useState<string | null>(null);

  // isVerifying tracks whether a verifyOtpCode request is in flight.
  const [isVerifying, setIsVerifying] = useState(false);

  // verifyError is shown inside OtpVerifyPanel when the code is wrong or expired.
  const [verifyError, setVerifyError] = useState<string | null>(null);

  // codeSentAt is the timestamp of the most recent successful OTP send.
  // OtpVerifyPanel uses this to reset its 60-second resend cooldown and clear
  // the code input whenever a new code goes out (initial send or resend).
  const [codeSentAt, setCodeSentAt] = useState(0);

  // error is the query param that auth/callback.tsx would append on a failed
  // deep link. Kept for backwards-compatibility in case old links are tapped,
  // but will no longer be generated once the callback screen is removed.
  const { error: linkError } = useLocalSearchParams<{ error?: string }>();
  useEffect(() => {
    if (linkError === 'link-expired') {
      setSendError('Your link has expired. Please request a new code.');
    }
  }, [linkError]);

  // screenWidth drives the slide distance and each panel's explicit width.
  // useWindowDimensions re-runs on rotation so both stay correct after the
  // device turns. isTablet scales up the hero content on large screens.
  const { width: screenWidth, height } = useWindowDimensions();
  const isTablet = Math.min(screenWidth, height) >= 600;

  // slideAnim is the horizontal offset applied to the panel row.
  // 0 = OTP request form visible. -screenWidth = OTP verify panel visible.
  const slideAnim = useRef(new Animated.Value(0)).current;

  // slide animates the panel row to any target offset using an ease-out-cubic
  // curve so the motion feels physical rather than mechanical.
  const slide = (toValue: number, onDone?: () => void) =>
    Animated.timing(slideAnim, {
      toValue,
      duration: 320,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(onDone);

  // handleSubmit sends the OTP code email then slides in the verify panel on
  // success. On failure, we show a generic message — never the raw Supabase
  // error — because exposing internal errors is a security concern (MASVS-CODE-4).
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
      // In dev, show the real error so rate-limit and config issues are visible.
      // In production, never expose internal error details to the UI (MASVS-CODE-4).
      setSendError(
        __DEV__ && err instanceof Error
          ? err.message
          : 'Something went wrong. Please try again.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // handleResend sends a fresh OTP code to the same email and resets the verify
  // panel's cooldown timer via the updated codeSentAt timestamp.
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
  // routing guard in (auth)/_layout.tsx redirects automatically.
  const handleVerify = async (code: string) => {
    setIsVerifying(true);
    setVerifyError(null);
    try {
      await verifyOtpCode(email, code);
      // Navigation is automatic — AuthProvider's onAuthStateChange listener
      // fires, updates the session, and the routing guard redirects.
    } catch (err) {
      if (__DEV__) console.log('[SignIn] verifyOtpCode error:', err);
      setVerifyError('That code is incorrect or has expired. Try again or request a new one.');
    } finally {
      setIsVerifying(false);
    }
  };

  // handleEmailChange keeps the email state in sync and clears any standing
  // error so the user isn't staring at a red message while they type.
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
                  {/* Show the send error below the form when the OTP email request
                      fails, or when the user arrives via an expired deep link. */}
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
