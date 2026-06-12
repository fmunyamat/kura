import { router } from 'expo-router';
import { useState } from 'react';
import {
    KeyboardAvoidingView,
    Linking,
    Platform,
    Pressable,
    ScrollView,
} from 'react-native';
import styled, { useTheme } from 'styled-components/native';
import { OnboardingScreenShell } from '~/features/onboarding/components/OnboardingScreenShell';
import { CtaButton } from '~/shared/components/CtaButton';
import { GlassCard } from '~/shared/components/GlassCard';
import { GlassDivider } from '~/shared/components/GlassDivider';
import {
    BottomSpacer,
    ContentArea,
    ContentGroup,
    CtaArea,
    GapSpacer,
    TopSpacer,
} from '~/shared/components/ScreenLayout';
import { ScreenHeadline, ScreenSubtext } from '~/shared/components/ScreenTypography';
import { useIsTablet } from '~/shared/hooks/use-is-tablet';
import { useOnboardingStore } from '../stores/onboardingStore';

// Same photo the OnboardingScreenShell renders as its background. Passed to
// GlassCard as clearBackdropSource so the Android faux-glass fill uses the
// same image that would be behind the card on a real backdrop blur.
const SPRINKLER_BG = require('../../../../assets/images/sprinkler-android.jpg');

// FieldGroup — wraps a label + input pair. GlassCard's Content gap handles
// the spacing between groups; no extra padding needed here.
const FieldGroup = styled.View``;

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

// Location — collects the user's ZIP code and total lawn size in sq ft.
// Both fields must be filled before Continue activates. ZIP drives season
// detection; lawn size drives fertilizer and seed quantity calculations.
// Layout, headline, subtext, and the CTA all come from the shared screen
// components; ContentArea/CtaArea run in column mode so the card matches
// the sign-in card's 80% tablet column. The CTA keeps its lighter primaryMid
// fill — the only screen that uses it.
export const Location = () => {
  const theme = useTheme();
  const isTablet = useIsTablet();

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
          <ContentArea column>
            <TopSpacer />
            <ContentGroup>
              <ScreenHeadline size="title">
                Tell us about{'\n'}your yard.
              </ScreenHeadline>
              <ScreenSubtext>
                We use this to figure out your season and how much product your lawn needs.
              </ScreenSubtext>
              <GapSpacer />
              {/* GlassCard variant="clear" matches the sign-in screen's card exactly —
                  same faux-glass backdrop approach on Android, real BlurView on iOS. */}
              <GlassCard
                variant="clear"
                clearBackdropSource={SPRINKLER_BG}
                clearBackdropTint={theme.colors.photoTint}
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

                <GlassDivider />

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
        <CtaArea column>
          <CtaButton
            label="Continue →"
            onPress={handleContinue}
            enabled={isValid}
            accessibilityLabel="Continue to next step"
          />
        </CtaArea>
      </KeyboardAvoidingView>
    </OnboardingScreenShell>
  );
};
