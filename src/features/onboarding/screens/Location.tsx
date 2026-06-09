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
import { useOnboardingStore } from '../stores/onboardingStore';

// $isTablet — passed to every styled-component that needs to scale up on tablets.
interface TabletProps {
  $isTablet: boolean;
}

const ContentArea = styled.View<TabletProps>`
  flex: 1;
  padding: 0 ${({ theme, $isTablet }) =>
    $isTablet ? theme.spacing.xxl : theme.spacing.md}px;
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

// FormCard — frosted white panel holding the input rows. Background,
// border-radius, and overflow match GlassCard/TaskCard in the welcome flow.
const FormCard = styled.View`
  background-color: rgba(255, 255, 255, 0.44);
  border-radius: ${({ theme }) => theme.radii.lg}px;
  overflow: hidden;
`;

// FormRow — one field row inside the card. First row has no top border;
// subsequent rows use a white-tinted divider matching TaskCard's row divider.
const FormRow = styled.View<{ $first: boolean }>`
  padding: 16px;
  ${({ $first }) =>
    !$first ? 'border-top-width: 1px; border-top-color: rgba(255, 255, 255, 0.18);' : ''}
`;

// FieldLabel — small header above each input. fontHeaderBold and white text
// match NavPillName (Step 3) and TaskName (Step 2) for consistent card typography.
const FieldLabel = styled.Text`
  font-family: ${({ theme }) => theme.typography.fontHeaderBold};
  font-size: 12px;
  color: rgba(255, 255, 255, 0.60);
  margin-bottom: 8px;
`;

// StyledInput — text field inside the card. Background darkens on focus to
// create depth contrast within the frosted card surface. $hasUnit adds right
// padding to leave room for the "sq ft" badge.
const StyledInput = styled.TextInput<{ $focused: boolean; $hasUnit?: boolean }>`
  background-color: ${({ $focused }) =>
    $focused ? 'rgba(0, 0, 0, 0.18)' : 'rgba(0, 0, 0, 0.10)'};
  border-radius: ${({ theme }) => theme.radii.md}px;
  padding: 10px ${({ $hasUnit }) => ($hasUnit ? 56 : 12)}px 10px 12px;
  font-family: ${({ theme }) => theme.typography.fontBody};
  font-size: 14px;
  color: #ffffff;
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
  color: rgba(255, 255, 255, 0.50);
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
  color: rgba(255, 255, 255, 0.40);
  flex: 1;
  line-height: 16px;
`;

const HintLink = styled.Text`
  font-family: ${({ theme }) => theme.typography.fontBodyBold};
  color: rgba(255, 255, 255, 0.70);
  text-decoration-line: underline;
`;

// CtaArea — wraps the CTA button outside the ScrollView so it stays pinned
// to the bottom of the screen even while the keyboard is open.
const CtaArea = styled.View<TabletProps>`
  padding: 0 ${({ theme, $isTablet }) =>
    $isTablet ? theme.spacing.xxl : theme.spacing.md}px
    ${({ theme }) => theme.spacing.md}px;
`;

// CtaButton — dark pill button matching all welcome steps and the other
// onboarding screens. Opacity drops to 0.4 when the form is incomplete.
const CtaButton = styled(Pressable)<TabletProps & { $enabled: boolean }>`
  background-color: rgba(8, 20, 8, 0.88);
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
          <ContentArea $isTablet={isTablet}>
            <TopSpacer />
            <ContentGroup>
              <Headline $isTablet={isTablet}>
                Tell us about{'\n'}your yard.
              </Headline>
              <Subtext $isTablet={isTablet}>
                We use this to figure out your season and how much product your lawn needs.
              </Subtext>
              <SpacerCard $isTablet={isTablet} />
              <FormCard>
                {/* ZIP code row */}
                <FormRow $first>
                  <FieldLabel>ZIP code</FieldLabel>
                  <StyledInput
                    $focused={zipFocused}
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
                </FormRow>

                {/* Lawn size row */}
                <FormRow $first={false}>
                  <FieldLabel>Lawn size</FieldLabel>
                  <InputWrapper>
                    <StyledInput
                      $focused={lawnFocused}
                      $hasUnit
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
                </FormRow>
              </FormCard>
            </ContentGroup>
            <BottomSpacer />
          </ContentArea>
        </ScrollView>

        {/* CTA lives outside the ScrollView so it stays anchored to the
            bottom of the KeyboardAvoidingView frame, not the scroll content. */}
        <CtaArea $isTablet={isTablet}>
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
