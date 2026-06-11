import { Image } from 'expo-image';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
    Animated,
    Easing,
    ImageBackground,
    Keyboard,
    KeyboardAvoidingView,
    Platform,
    useWindowDimensions,
} from 'react-native';
import styled, { useTheme } from 'styled-components/native';
import { sendOtpCode, verifyOtpCode } from '~/features/auth/services/authService';
import { GlassCard } from '~/shared/components/GlassCard';
import { useIsTablet } from '~/shared/hooks/use-is-tablet';
import { OtpRequestForm } from '../components/OtpRequestForm';
import { OtpVerifyPanel } from '../components/OtpVerifyPanel';
import { SocialAuthButtons } from '../components/SocialAuthButtons';

const KEYBOARD_BEHAVIOR = 'padding' as const;

// Screen — root container, fills the full screen. Does NOT wrap the photo/tint
// layers so they are never constrained by keyboard insets (which would leave a
// black gap at the bottom when the keyboard dismisses).
const Screen = styled.View`
  flex: 1;
`;

// PhotoBackground — absolutely fills the screen so it's independent of the
// KeyboardAvoidingView below. The photo always covers the full display regardless
// of keyboard state.
const PhotoBackground = styled(ImageBackground)`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
`;

// TintOverlay — same absolute fill as PhotoBackground. The dark tint always
// covers the full screen so there is no uncovered gap when the keyboard dismisses.
const TintOverlay = styled.View`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: ${({ theme }) => theme.colors.photoTint};
`;

// ContentKAV — the only layer that participates in keyboard avoidance. Sits on
// top of the absolute background layers and adds paddingBottom = keyboard height
// so the hero and panel slide above the keyboard without affecting the photo.
const ContentKAV = styled(KeyboardAvoidingView)`
  flex: 1;
`;

// GlassHero — the logo, wordmark, and tagline at the top of the sign-in screen.
// When the keyboard is up, padding-top shrinks and the logo downsizes so the
// panel below gains room without the hero disappearing. The resize is instant;
// the smooth slide upward is handled by KeyboardAvoidingView's padding animation.
// GlassHero — on phones, padding-top collapses when the keyboard is up so the
// hero slides toward the top and the glass card below gains room. Tablets keep
// the full padding regardless of keyboard state — the screen is tall enough that
// there is no need to compress the hero.
const GlassHero = styled.View<{ $keyboardVisible: boolean; $isTablet: boolean }>`
  flex: 1;
  align-items: center;
  justify-content: center;
  padding-top: ${({ $keyboardVisible, $isTablet, theme }) =>
    !$isTablet && $keyboardVisible ? theme.spacing.md : theme.spacing.xxl * 4}px;
  gap: ${({ theme }) => theme.spacing.xs}px;
`;

// LogoImage — the kura SVG mark. Shrinks when the keyboard is up to give the
// hero a more compact footprint while remaining visible.
const LogoImage = styled(Image)<{ $isTablet: boolean }>`
  width: ${({ $isTablet }) => ($isTablet ? 150 : 120)}px;
  height: ${({ $isTablet }) => ($isTablet ? 150 : 120)}px;
  margin-bottom: ${({ theme }) => theme.spacing.xs}px;
`;

// Wordmark — the "kura" brand name in a heavy weight. On tablets the type
// scales up to stay proportional to the larger logo.
const Wordmark = styled.Text<{ $isTablet: boolean }>`
  font-family: ${({ theme }) => theme.typography.fontHeaderHeavy};
  color: ${({ theme }) => theme.colors.textOnDark};
  font-size: ${({ $isTablet, theme }) =>
    $isTablet ? theme.typography.size2xl : theme.typography.size2xl * 0.8}px;
  letter-spacing: ${({ theme }) => theme.typography.letterSpacingBrand}px;
`;

// Tagline — "Lawn care, simplified" in lime, uppercase and letter-spaced for
// that sport-utility feel that contrasts nicely with the heavy wordmark above.
const Tagline = styled.Text<{ $isTablet: boolean }>`
  color: ${({ theme }) => theme.colors.lime};
  font-size: ${({ $isTablet, theme }) =>
    $isTablet ? theme.typography.sizeSm : theme.typography.sizeSm * 0.8}px;
  font-weight: ${({ theme }) => theme.typography.weightBold};
  font-family: ${({ theme }) => theme.typography.fontBodyBlack};
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
// On tablet, horizontal padding is widened to 10% of screen width each side so
// the card occupies 80% of the screen width — a more comfortable reading column
// on a large display. Vertical padding and alignment are handled separately.
const GlassAuthContent = styled.View<{ $width: number; $isTablet: boolean }>`
  width: ${({ $width }) => $width}px;
  padding-horizontal: ${({ $width, $isTablet }) =>
    $isTablet ? $width * 0.1 : 16}px;
  padding-vertical: ${({ theme }) => theme.spacing.md}px;
  justify-content: ${({ $isTablet }) => ($isTablet ? 'flex-start' : 'center')};
  padding-top: ${({ $isTablet, theme }) =>
    $isTablet ? theme.spacing.xxl * 2 : theme.spacing.md}px;
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
// White at 22% opacity reads cleanly on the clear glass pane over the dark
// photo without competing with the controls above and below.
const DividerLine = styled.View`
  flex: 1;
  height: 1px;
  background-color: ${({ theme }) => theme.colors.glassClearDivider};
`;

// DividerText — "or continue with" label in muted white so it recedes behind
// the primary actions while staying legible on the dark photo behind the glass.
const DividerText = styled.Text`
  font-family: ${({ theme }) => theme.typography.fontBody};
  font-size: ${({ theme }) => theme.typography.sizeXs}px;
  color: ${({ theme }) => theme.colors.textMutedOnDark};
`;

// ErrorText — the inline error that appears below the OTP request form when
// something goes wrong (send failure or expired deep link redirect).
// errorOnDark is the soft red designed for semi-transparent glass over a dark
// photo — the deep red errorOnLight would disappear here.
const ErrorText = styled.Text`
  font-size: ${({ theme }) => theme.typography.sizeSm}px;
  font-family: ${({ theme }) => theme.typography.fontBody};
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
  // theme gives the GlassCard the photo tint colour so its Android faux-glass
  // backdrop matches the real tinted photo around the card.
  const theme = useTheme();

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

  // keyboardVisible tracks whether the software keyboard is up. When true, the
  // GlassHero (logo/wordmark) is hidden so the full screen height above the
  // keyboard is available to the auth panel — the OTP card is tall and would
  // otherwise be clipped.
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    // keyboardWillShow/Hide fires before the animation on iOS — the hero
    // collapses in sync with the keyboard sliding up, so there's no visual jump.
    // On Android, keyboardDidShow/Hide fires after the keyboard appears.
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    // State-only updates — no LayoutAnimation here. KeyboardAvoidingView owns
    // its own paddingBottom animation; calling LayoutAnimation.configureNext
    // in the same frame intercepts that animation and leaves a black gap at the
    // bottom of the screen when the keyboard dismisses. The hero resize is
    // instant; the smooth slide is provided by KeyboardAvoidingView.
    const show = Keyboard.addListener(showEvent, () => setKeyboardVisible(true));
    const hide = Keyboard.addListener(hideEvent, () => setKeyboardVisible(false));

    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  // error is the query param that old magic link deep links append on failure.
  // Kept so any cached links still produce a friendly message if tapped.
  const { error: linkError } = useLocalSearchParams<{ error?: string }>();
  useEffect(() => {
    if (linkError === 'link-expired') {
      setSendError('Your link has expired. Please request a new code.');
    }
  }, [linkError]);

  // screenWidth drives the slide distance and each panel's explicit width.
  // useWindowDimensions re-runs on rotation so both stay correct after the
  // device turns. isTablet comes from the shared device-type hook and scales
  // up the hero content on large screens.
  const { width: screenWidth } = useWindowDimensions();
  const isTablet = useIsTablet();

  // slideAnim is the horizontal offset applied to the panel row.
  // 0 = OTP request form visible. -screenWidth = OTP verify panel visible.
  const slideAnim = useRef(new Animated.Value(0)).current;

  // slide animates the panel row to any target offset using an ease-out-cubic
  // curve so the motion feels physical rather than mechanical.
  // useNativeDriver: false is intentional — native-driver transforms update only
  // the GPU render position, not the JS layout. After translation, touch hit-test
  // areas stay at the original off-screen coordinates, so taps and scroll
  // gestures on the OTP verify panel would miss. JS-driven animation keeps
  // layout and hit-testing in sync with the visual position.
  const slide = (toValue: number, onDone?: () => void) =>
    Animated.timing(slideAnim, {
      toValue,
      duration: 320,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start(onDone);

  // handleSubmit sends the OTP code email then slides in the verify panel on
  // success. On failure, we show a generic message — never the raw Supabase
  // error — because exposing internal errors is a security concern (MASVS-CODE-4).
  const handleSubmit = async () => {
    if (!isValidEmail(email)) {
      setSendError('Please enter a valid email address (e.g. name@example.com)');
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
      // Log to console in dev so rate-limit and config errors are visible to
      // developers without ever exposing them in the UI (MASVS-CODE-4, MASWE-0087).
      if (__DEV__) console.log('[SignIn] sendOtpCode error:', err);
      setSendError('Something went wrong. Please try again.');
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
    <Screen>
      {/* Photo and tint are absolutely positioned so they always fill the full
          screen and are never affected by the keyboard insets below. */}
      <PhotoBackground
        source={require('../../../../assets/images/mowing-photo.jpg')}
        resizeMode="cover"
      />
      <TintOverlay />

      {/* ContentKAV is the only keyboard-aware layer. Its paddingBottom grows
          when the keyboard appears, sliding the hero and panel above it. */}
      <ContentKAV behavior={KEYBOARD_BEHAVIOR}>
          {/* GlassHero shrinks (logo + padding) when the keyboard is up so the
              auth panel has more room above the keyboard. KeyboardAvoidingView
              animates the upward slide; the hero resize happens instantly on
              the same frame without interfering with that animation. */}
          <GlassHero $keyboardVisible={keyboardVisible} $isTablet={isTablet}>
            <LogoImage
              $isTablet={isTablet}
              accessibilityLabel="Kura logo"
              source={require('../../../../assets/images/kura-logo.svg')}
              contentFit="contain"
            />
            <Wordmark $isTablet={isTablet}>KURA</Wordmark>
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
                $isTablet={isTablet}
                pointerEvents={isConfirming ? 'none' : 'auto'}
              >
                {/* On Android the card fakes its glass backdrop from the same
                    photo + tint the screen draws behind it (real backdrop blur
                    halos the controls there); iOS ignores these two props and
                    blurs the screen natively. */}
                <GlassCard
                  variant="clear"
                  clearBackdropSource={require('../../../../assets/images/grass.jpg')}
                  clearBackdropTint={theme.colors.photoTint}
                >
                  <OtpRequestForm
                    email={email}
                    onEmailChange={handleEmailChange}
                    onSubmit={handleSubmit}
                    isLoading={isSubmitting}
                    isTablet={isTablet}
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
                    isTablet={isTablet}
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
                keyboardVisible={keyboardVisible}
              />
            </PanelRow>
          </PanelHost>
      </ContentKAV>
    </Screen>
  );
};
