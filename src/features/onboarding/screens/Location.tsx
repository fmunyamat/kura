import { router } from 'expo-router';
import { useState } from 'react';
import { Linking, useWindowDimensions } from 'react-native';
import styled, { useTheme } from 'styled-components/native';
import { OnboardingLayout } from '~/features/onboarding/components/OnboardingLayout';
import { useOnboardingStore } from '../stores/onboardingStore';

// FieldGroup — wraps a label + input pair with a small gap.
const FieldGroup = styled.View`
  gap: ${({ theme }) => theme.spacing.sm}px;
`;

// FieldLabel — small uppercase label above each input. Steps up one size on
// tablets so it remains readable at arm's length.
const FieldLabel = styled.Text<{ $isTablet: boolean }>`
  font-size: ${({ theme, $isTablet }) =>
    $isTablet ? theme.typography.sizeSm : theme.typography.sizeXs}px;
  font-weight: ${({ theme }) => theme.typography.weightBold};
  letter-spacing: 1px;
  text-transform: uppercase;
  color: ${({ theme }) => theme.colors.textMutedOnGlass};
`;

// StyledInput — text field with no border. Background shifts to a more opaque
// white when focused, creating depth contrast within the glass panel.
// On tablets, padding and font size increase so the field feels intentional
// rather than cramped inside the wider panel.
const StyledInput = styled.TextInput<{ $focused: boolean; $isTablet: boolean }>`
  background-color: ${({ $focused, theme }) =>
    $focused
      ? theme.colors.glassOnboardingInputFocused
      : theme.colors.glassOnboardingInput};
  border-radius: ${({ theme }) => theme.radii.md}px;
  padding: ${({ theme, $isTablet }) =>
    $isTablet ? theme.spacing.md : theme.spacing.sm}px
    ${({ theme }) => theme.spacing.md}px;
  font-size: ${({ theme, $isTablet }) =>
    $isTablet ? theme.typography.sizeLg : theme.typography.sizeMd}px;
  color: ${({ theme }) => theme.colors.textOnGlass};
`;

// InputWrapper — positions the sq ft badge inside the lawn size input.
const InputWrapper = styled.View`
  position: relative;
`;

// UnitBadge — the "sq ft" pill inside the right side of the lawn size field.
const UnitBadge = styled.View`
  position: absolute;
  right: ${({ theme }) => theme.spacing.sm}px;
  top: 0;
  bottom: 0;
  justify-content: center;
`;

// UnitText — the label inside the unit badge. Scales with the input on tablets.
const UnitText = styled.Text<{ $isTablet: boolean }>`
  font-size: ${({ theme, $isTablet }) =>
    $isTablet ? theme.typography.sizeSm : theme.typography.sizeXs}px;
  font-weight: ${({ theme }) => theme.typography.weightMedium};
  color: ${({ theme }) => theme.colors.textMutedOnGlass};
  background-color: ${({ theme }) => theme.colors.glassOnboardingInput};
  border-radius: 6px;
  padding: 2px 8px;
  overflow: hidden;
`;

// HintCard — tappable card that opens the lawn measurement tool in the browser.
const HintCard = styled.TouchableOpacity`
  background-color: ${({ theme }) => theme.colors.glassOnboardingHint};
  border-radius: ${({ theme }) => theme.radii.md}px;
  padding: ${({ theme }) => theme.spacing.sm}px ${({ theme }) => theme.spacing.md}px;
  flex-direction: row;
  align-items: flex-start;
  gap: ${({ theme }) => theme.spacing.sm}px;
`;

const HintIcon = styled.Text`
  font-size: ${({ theme }) => theme.typography.sizeSm}px;
  margin-top: 1px;
`;

const HintBody = styled.Text`
  font-size: ${({ theme }) => theme.typography.sizeXs}px;
  color: ${({ theme }) => theme.colors.textMutedOnGlass};
  flex: 1;
  line-height: ${({ theme }) => theme.typography.lineHeightSm}px;
`;

// HintLink — the tappable "Measure your lawn" label. Uses textAccentOnGlass so
// it reads as dark green on the light panel and lime on the dark panel.
const HintLink = styled.Text`
  font-weight: ${({ theme }) => theme.typography.weightBold};
  color: ${({ theme }) => theme.colors.textAccentOnGlass};
  text-decoration-line: underline;
`;

// PrimaryButton — the Continue CTA wrapper. Opacity drops when inputs are
// empty to show it is not yet tappable. overflow: hidden clips the LinearGradient
// to the button's rounded corners on both iOS and Android.
const PrimaryButton = styled.TouchableOpacity<{ $enabled: boolean }>`
  border-radius: ${({ theme }) => theme.radii.md}px;
  overflow: hidden;
  opacity: ${({ $enabled }) => ($enabled ? 1 : 0.3)};
`;

// PrimaryButtonFill — solid lime fill inside PrimaryButton. Padding grows on
// tablets so the tap target has comfortable height.
const PrimaryButtonFill = styled.View<{ $isTablet: boolean }>`
  background-color: ${({ theme }) => theme.colors.gradientMidLight};
  padding: ${({ theme, $isTablet }) =>
    $isTablet ? theme.spacing.lg : theme.spacing.md}px;
  align-items: center;
`;

// ButtonText — deep forest green so it remains legible on the lime gradient.
// Steps up to sizeLg on tablets to match the taller button.
const ButtonText = styled.Text<{ $isTablet: boolean }>`
  font-size: ${({ theme, $isTablet }) =>
    $isTablet ? theme.typography.sizeLg : theme.typography.sizeMd}px;
  font-weight: ${({ theme }) => theme.typography.weightBold};
  color: ${({ theme }) => theme.colors.white};
  letter-spacing: 0.2px;
`;

// Location — collects the user's ZIP code and total lawn size in sq ft.
// Both fields must be filled before Continue activates. ZIP drives season
// detection; lawn size drives fertilizer and seed quantity calculations.
export const Location = () => {
  const theme = useTheme();
  const { width, height } = useWindowDimensions();
  // isTablet — true when the shortest screen dimension is at least 600pt,
  // matching the threshold used across the app (e.g. SignInScreen, OnboardingLayout).
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
    <OnboardingLayout
      heroIcon="📍"
      stepLabel="Step 1 of 4"
      title="Tell us about your yard"
      subtitle="We use this to figure out your season and how much product your lawn needs."
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
          placeholderTextColor={theme.colors.placeholderOnGlass}
          keyboardType="numeric"
          maxLength={5}
          autoCorrect={false}
          autoComplete="off"
          textContentType="none"
        />
      </FieldGroup>

      {/* Lawn size field */}
      <FieldGroup>
        <FieldLabel $isTablet={isTablet}>Lawn size</FieldLabel>
        <InputWrapper>
          <StyledInput
            $focused={lawnFocused}
            $isTablet={isTablet}
            value={lawnSize}
            onChangeText={setLawnSize}
            onFocus={() => setLawnFocused(true)}
            onBlur={() => setLawnFocused(false)}
            placeholder="e.g. 1500"
            placeholderTextColor={theme.colors.placeholderOnGlass}
            keyboardType="numeric"
            autoCorrect={false}
            autoComplete="off"
            textContentType="none"
            style={{ paddingRight: 56 }}
          />
          <UnitBadge>
            <UnitText $isTablet={isTablet}>sq ft</UnitText>
          </UnitBadge>
        </InputWrapper>

        <HintCard onPress={handleMeasureLink} accessibilityRole="button">
          <HintIcon>📐</HintIcon>
          <HintBody>
            Not sure? <HintLink>Measure your lawn →</HintLink>
          </HintBody>
        </HintCard>
      </FieldGroup>

      <PrimaryButton
        $enabled={isValid}
        disabled={!isValid}
        onPress={handleContinue}
        accessibilityRole="button"
        accessibilityLabel="Continue"
        accessibilityState={{ disabled: !isValid }}
      >
        <PrimaryButtonFill $isTablet={isTablet}>
          <ButtonText $isTablet={isTablet}>Continue</ButtonText>
        </PrimaryButtonFill>
      </PrimaryButton>
    </OnboardingLayout>
  );
};
