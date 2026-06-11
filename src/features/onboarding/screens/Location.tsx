import { router } from 'expo-router';
import { useState } from 'react';
import {
    KeyboardAvoidingView,
    Linking,
    Platform,
    Pressable,
    ScrollView,
    useWindowDimensions,
} from 'react-native';
import styled, { useTheme } from 'styled-components/native';
import { OnboardingScreenShell } from '~/features/onboarding/components/OnboardingScreenShell';
import { GlassCard } from '~/shared/components/GlassCard';
import { useOnboardingStore } from '../stores/onboardingStore';

// Same photo the OnboardingScreenShell renders as its background. Passed to
// GlassCard as clearBackdropSource so the Android faux-glass fill uses the
// same image that would be behind the card on a real backdrop blur.
const SPRINKLER_BG = require('../../../../assets/images/sprinkler-android.jpg');

// $isTablet — passed to every styled-component that needs to scale up on tablets.
interface TabletProps {
  $isTablet: boolean;
}

// ContentArea — constrains the card width. On tablets, horizontal padding is
// 10% of screen width each side so the FormCard matches the sign-in GlassCard's
// 80% column width. On phones the standard md padding applies.
const ContentArea = styled.View<TabletProps & { $width: number }>`
  flex: 1;
  padding: 0 ${({ $width, $isTablet, theme }) =>
    $isTablet ? $width * 0.1 : theme.spacing.md}px;
`;

// TopSpacer — pushes the headline group down from the NavBar.
// flex: 0.2 matches the welcome flow and the other onboarding screens.
const TopSpacer = styled.View`flex: 0.2;`;

// BottomSpacer — absorbs remaining space below the content group so the
// CTA stays outside the scroll area pinned to the bottom.
const BottomSpacer = styled.View`flex: 1;`;

const ContentGroup = styled.View``;

const Headline = styled.Text<TabletProps>`
  font-family: ${({ theme }) => theme.typography.fontHeaderHeavy};
  font-size: ${({ $isTablet }) => ($isTablet ? 64 : 42)}px;
  color: #ffffff;
  letter-spacing: ${({ theme }) => theme.typography.letterSpacingTight}px;
  text-align: center;
  line-height: ${({ $isTablet }) => ($isTablet ? 76 : 50)}px;
`;

const Subtext = styled.Text<TabletProps>`
  font-family: ${({ theme }) => theme.typography.fontBodyMedium};
  font-size: ${({ $isTablet }) => ($isTablet ? 17 : 11)}px;
  color: rgba(255, 255, 255, 0.48);
  text-align: center;
  line-height: ${({ $isTablet }) => ($isTablet ? 28 : 18)}px;
  padding: 0 ${({ theme }) => theme.spacing.sm}px;
  margin-top: ${({ theme, $isTablet }) =>
    $isTablet ? theme.spacing.md : theme.spacing.sm}px;
`;

const SpacerCard = styled.View<TabletProps>`
  height: ${({ $isTablet }) => ($isTablet ? 100 : 60)}px;
`;

// FieldGroup — wraps a label + input pair. GlassCard's Content gap handles
// the spacing between groups; no extra padding needed here.
const FieldGroup = styled.View``;

// FieldDivider — full-width rule between the two field groups. Same token
// as the sign-in card's DividerLine so both cards share the same visual weight.
const FieldDivider = styled.View`
  height: 1px;
  background-color: ${({ theme }) => theme.colors.glassClearDivider};
`;

// FieldLabel — small header above each input. Scales up on tablet to stay
// proportional to the taller input well below it. textMutedOnDark matches
// the label style used in the sign-in clear-glass card.
const FieldLabel = styled.Text<{ $isTablet: boolean }>`
  font-family: ${({ theme }) => theme.typography.fontHeaderBold};
  font-size: ${({ $isTablet, theme }) =>
    $isTablet ? theme.typography.sizeSm : 12}px;
  color: ${({ theme }) => theme.colors.textMutedOnDark};
  margin-bottom: ${({ $isTablet }) => ($isTablet ? 10 : 8)}px;
`;

// StyledInput — text field inside the clear-glass card. Matches the sign-in
// card's input style: faint white well with a hairline border, brighter on
// focus. textOnDark for typed text; textMutedOnDark for the placeholder.
const StyledInput = styled.TextInput<{ $focused: boolean; $hasUnit?: boolean; $isTablet: boolean }>`
  background-color: ${({ $focused, theme }) =>
    $focused ? theme.colors.glassClearInputFocused : theme.colors.glassClearInput};
  border-width: 1px;
  border-color: ${({ theme }) => theme.colors.glassClearInputBorder};
  border-radius: ${({ theme }) => theme.radii.md}px;
  padding: 10px ${({ $hasUnit }) => ($hasUnit ? 56 : 12)}px 10px 12px;
  font-family: ${({ theme }) => theme.typography.fontBody};
  font-size: 14px;
  color: ${({ theme }) => theme.colors.textOnDark};
  height: ${({ $isTablet }) => ($isTablet ? 54 : 44)}px;
`;

// InputWrapper — positions the "sq ft" badge over the right side of the input.
const InputWrapper = styled.View`position: relative;`;

// UnitBadge — absolutely positioned so it never affects the input's width.
const UnitBadge = styled.View`
  position: absolute;
  right: ${({ theme }) => theme.spacing.sm}px;
  top: 0;
  bottom: 0;
  justify-content: center;
`;

const UnitText = styled.Text`
  font-family: ${({ theme }) => theme.typography.fontBody};
  font-size: 11px;
  color: ${({ theme }) => theme.colors.textMutedOnDark};
`;

// HintRow — tappable hint below the lawn size input. Opens the measurement
// tool in the device browser — no user data in the URL.
const HintRow = styled(Pressable)`
  flex-direction: row;
  align-items: flex-start;
  gap: ${({ theme }) => theme.spacing.sm}px;
  margin-top: 10px;
`;

const HintIcon = styled.Text`font-size: 12px; margin-top: 1px;`;

const HintBody = styled.Text`
  font-family: ${({ theme }) => theme.typography.fontBody};
  font-size: 11px;
  color: ${({ theme }) => theme.colors.textMutedOnDark};
  flex: 1;
  line-height: 16px;
`;

const HintLink = styled.Text`
  font-family: ${({ theme }) => theme.typography.fontBodyBold};
  color: ${({ theme }) => theme.colors.textOnDark};
  text-decoration-line: underline;
`;

// CtaArea — wraps the CTA button outside the ScrollView so it stays pinned
// to the bottom of the screen even while the keyboard is open. Horizontal
// padding mirrors ContentArea so the button aligns with the FormCard edges.
const CtaArea = styled.View<TabletProps & { $width: number }>`
  padding: 0 ${({ $width, $isTablet, theme }) =>
    $isTablet ? $width * 0.1 : theme.spacing.md}px
    ${({ theme }) => theme.spacing.md}px;
`;

// CtaButton — dark pill button matching all welcome steps and the other
// onboarding screens. Opacity drops to 0.4 when the form is incomplete.
const CtaButton = styled(Pressable)<TabletProps & { $enabled: boolean }>`
  background-color: ${({ theme }) => theme.colors.primaryMid};
  border-radius: ${({ theme }) => theme.radii.md}px;
  padding: ${({ $isTablet }) => ($isTablet ? '22px 18px' : '14px 12px')};
  opacity: ${({ $enabled }) => ($enabled ? 1 : 0.4)};
`;

const CtaLabel = styled.Text<TabletProps>`
  font-family: ${({ theme }) => theme.typography.fontBodyBold};
  font-size: ${({ $isTablet }) => ($isTablet ? 22 : 14)}px;
  color: #D6EFD8;
  text-align: center;
`;

// Location — collects the user's ZIP code and total lawn size in sq ft.
// Both fields must be filled before Continue activates. ZIP drives season
// detection; lawn size drives fertilizer and seed quantity calculations.
export const Location = () => {
  const theme = useTheme();
  const { width, height } = useWindowDimensions();
  const isTablet = Math.min(width, height) >= 600;

  const [zipCode, setZipCode] = useState('');
  const [lawnSize, setLawnSize] = useState('');
  const [zipFocused, setZipFocused] = useState(false);
  const [lawnFocused, setLawnFocused] = useState(false);

  const { setZipCode: saveZipCode, setLawnSize: saveLawnSize } = useOnboardingStore();

  const isValid = zipCode.length === 5 && lawnSize.length > 0;

  const handleContinue = () => {
    if (!isValid) return;
    saveZipCode(zipCode);
    saveLawnSize(parseInt(lawnSize, 10));
    router.push('/onboarding/grass-type');
  };

  const handleMeasureLink = () => {
    // Opens the measurement tool in the device browser — no user data in the URL.
    Linking.openURL('https://www.organolawn.com/measure-your-lawn');
  };

  return (
    <OnboardingScreenShell currentStep={1} totalSteps={4}>
      {/* KeyboardAvoidingView shrinks the available height when the keyboard
          appears, keeping the CTA visible above the keyboard at all times. */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ flexGrow: 1 }}
          bounces={false}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <ContentArea $isTablet={isTablet} $width={width}>
            <TopSpacer />
            <ContentGroup>
              <Headline $isTablet={isTablet}>
                Tell us about{'\n'}your yard.
              </Headline>
              <Subtext $isTablet={isTablet}>
                We use this to figure out your season and how much product your lawn needs.
              </Subtext>
              <SpacerCard $isTablet={isTablet} />
              {/* GlassCard variant="clear" matches the sign-in screen's card exactly —
                  same faux-glass backdrop approach on Android, real BlurView on iOS. */}
              <GlassCard
                variant="clear"
                clearBackdropSource={SPRINKLER_BG}
                clearBackdropTint={theme.colors.photoTint}
                androidBlurRadius={15}
              >
                {/* ZIP code field */}
                <FieldGroup>
                  <FieldLabel $isTablet={isTablet}>ZIP code</FieldLabel>
                  <StyledInput
                    $focused={zipFocused}
                    $isTablet={isTablet}
                    value={zipCode}
                    onChangeText={setZipCode}
                    onFocus={() => setZipFocused(true)}
                    onBlur={() => setZipFocused(false)}
                    placeholder="e.g. 30301"
                    placeholderTextColor={theme.colors.textMutedOnDark}
                    keyboardType="numeric"
                    maxLength={5}
                    autoCorrect={false}
                    autoComplete="off"
                    textContentType="none"
                  />
                </FieldGroup>

                <FieldDivider />

                {/* Lawn size field */}
                <FieldGroup>
                  <FieldLabel $isTablet={isTablet}>Lawn size</FieldLabel>
                  <InputWrapper>
                    <StyledInput
                      $focused={lawnFocused}
                      $hasUnit
                      $isTablet={isTablet}
                      value={lawnSize}
                      onChangeText={setLawnSize}
                      onFocus={() => setLawnFocused(true)}
                      onBlur={() => setLawnFocused(false)}
                      placeholder="e.g. 1500"
                      placeholderTextColor={theme.colors.textMutedOnDark}
                      keyboardType="numeric"
                      autoCorrect={false}
                      autoComplete="off"
                      textContentType="none"
                    />
                    <UnitBadge>
                      <UnitText>sq ft</UnitText>
                    </UnitBadge>
                  </InputWrapper>
                  <HintRow onPress={handleMeasureLink} accessibilityRole="button">
                    <HintIcon>📐</HintIcon>
                    <HintBody>
                      Not sure? <HintLink>Measure your lawn →</HintLink>
                    </HintBody>
                  </HintRow>
                </FieldGroup>
              </GlassCard>
            </ContentGroup>
            <BottomSpacer />
          </ContentArea>
        </ScrollView>

        {/* CTA lives outside the ScrollView so it stays anchored to the
            bottom of the KeyboardAvoidingView frame, not the scroll content. */}
        <CtaArea $isTablet={isTablet} $width={width}>
          <CtaButton
            $isTablet={isTablet}
            $enabled={isValid}
            disabled={!isValid}
            onPress={handleContinue}
            accessibilityRole="button"
            accessibilityLabel="Continue to next step"
            accessibilityState={{ disabled: !isValid }}
          >
            <CtaLabel $isTablet={isTablet}>Continue →</CtaLabel>
          </CtaButton>
        </CtaArea>
      </KeyboardAvoidingView>
    </OnboardingScreenShell>
  );
};
