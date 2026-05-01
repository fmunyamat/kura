import { Image } from 'expo-image';
import { useRef, useState } from 'react';
import {
    Animated,
    Easing,
    ImageBackground,
    KeyboardAvoidingView,
    Platform,
    useWindowDimensions,
} from 'react-native';
import styled from 'styled-components/native';
import { GlassCard } from '~/shared/components/GlassCard';
import { ConfirmationPanel } from '../components/ConfirmationPanel';
import { MagicLinkForm } from '../components/MagicLinkForm';
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

// GlassAuthContent — the container for the form panel. Its explicit width
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
// the total width (2× screen width, from useWindowDimensions) and the translateX
// transform (driven by the Animated.Value slideAnim).
const PanelRow = styled(Animated.View)`
  flex-direction: row;
  flex: 1;
`;

// Divider — the "or continue with" row between the magic link form and
// the social buttons, inside the glass card.
const Divider = styled.View`
  flex-direction: row;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm}px;
`;

// DividerLine — one of the two thin horizontal rules flanking the label.
// flex: 1 makes each line take equal space, so the label is always centred.
const DividerLine = styled.View`
  flex: 1;
  height: 1px;
  background-color: ${({ theme }) => theme.colors.borderOnDark};
`;

// DividerText — the small "or continue with" label between the two rules.
const DividerText = styled.Text`
  font-size: ${({ theme }) => theme.typography.sizeXs}px;
  color: ${({ theme }) => theme.colors.textMutedOnDark};
`;

export const SignInScreen = () => {
  const [email, setEmail] = useState('');

  // isConfirming disables pointer events on the off-screen form so stray taps
  // can't reach hidden inputs — especially important on Android where
  // overflow: hidden alone doesn't block touches.
  const [isConfirming, setIsConfirming] = useState(false);

  // screenWidth drives the slide distance and each panel's explicit width.
  // useWindowDimensions re-runs on rotation so both stay correct after the
  // device turns. isTablet scales up the hero content on large screens.
  const { width: screenWidth, height } = useWindowDimensions();
  const isTablet = Math.min(screenWidth, height) >= 600;

  // slideAnim is the horizontal offset applied to the panel row.
  // 0 = auth form visible. -screenWidth = confirmation panel visible.
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

  // handleSubmit immediately disables the form (keyboard dismisses, stray taps
  // blocked) then slides the confirmation panel in from the right.
  const handleSubmit = () => {
    setIsConfirming(true);
    slide(-screenWidth);
  };

  // handleReset slides the form back in, then clears the email and re-enables
  // the form only after the animation finishes — so the form is never visible
  // mid-slide with stale state.
  const handleReset = () =>
    slide(0, () => {
      setIsConfirming(false);
      setEmail('');
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
                  <MagicLinkForm
                    email={email}
                    onEmailChange={setEmail}
                    onSubmit={handleSubmit}
                  />
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

              <ConfirmationPanel email={email} onReset={handleReset} />
            </PanelRow>
          </PanelHost>
        </TintOverlay>
      </PhotoBackground>
    </Screen>
  );
};
