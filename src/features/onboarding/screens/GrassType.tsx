import { router } from 'expo-router';
import { Fragment, useState } from 'react';
import { Pressable, ScrollView, useWindowDimensions } from 'react-native';
import styled, { useTheme } from 'styled-components/native';
import { GrassTypeCard } from '~/features/onboarding/components/GrassTypeCard';
import { OnboardingScreenShell } from '~/features/onboarding/components/OnboardingScreenShell';
import type { GrassTypeList } from '~/features/onboarding/types';
import { GlassCard } from '~/shared/components/GlassCard';
import { useIsTablet, type TabletProps } from '~/shared/hooks/use-is-tablet';
import { useOnboardingStore } from '../stores/onboardingStore';

// Same photo the OnboardingScreenShell renders as its background — passed to
// GlassCard as clearBackdropSource for the Android faux-glass fill.
const SPRINKLER_BG = require('../../../../assets/images/sprinkler-android.jpg');

// GRASS_OPTIONS — the three choices shown on this screen.
const GRASS_OPTIONS: Array<{
  value: GrassTypeList;
  icon: string;
  name: string;
  description: string;
}> = [
  {
    value: 'cool-season',
    icon: '❄️',
    name: 'Cool-season grass',
    description: 'Grows best in spring and fall. Common in northern states.',
  },
  {
    value: 'warm-season',
    icon: '☀️',
    name: 'Warm-season grass',
    description: 'Thrives in summer heat. Common in southern states.',
  },
  {
    value: 'unknown',
    icon: '🤷',
    name: "I'm not sure",
    description: "We'll guess based on your ZIP code.",
  },
];

// ContentArea — constrains the card width. On tablets, horizontal padding is
// 10% of screen width each side so the GlassCard matches the sign-in and
// Location screens' 80% column width. On phones the standard md padding applies.
const ContentArea = styled.View<TabletProps & { $width: number }>`
  flex: 1;
  padding: 0 ${({ $width, $isTablet, theme }) =>
    $isTablet ? $width * 0.1 : theme.spacing.md}px;
`;

const TopSpacer = styled.View`flex: 0.2;`;
const BottomSpacer = styled.View`flex: 1;`;
const ContentGroup = styled.View``;

const Headline = styled.Text<TabletProps>`
  font-family: ${({ theme }) => theme.typography.fontHeaderHeavy};
  font-size: ${({ $isTablet }) => ($isTablet ? 64 : 42)}px;
  color: ${({ theme }) => theme.colors.white};
  letter-spacing: ${({ theme }) => theme.typography.letterSpacingTight}px;
  text-align: center;
  line-height: ${({ $isTablet }) => ($isTablet ? 76 : 50)}px;
`;

const Subtext = styled.Text<TabletProps>`
  font-family: ${({ theme }) => theme.typography.fontBodyMedium};
  font-size: ${({ $isTablet }) => ($isTablet ? 17 : 11)}px;
  color: ${({ theme }) => theme.colors.textMutedOnDark};
  text-align: center;
  line-height: ${({ $isTablet }) => ($isTablet ? 28 : 18)}px;
  padding: 0 ${({ theme }) => theme.spacing.sm}px;
  margin-top: ${({ theme, $isTablet }) =>
    $isTablet ? theme.spacing.md : theme.spacing.sm}px;
`;

const SpacerCard = styled.View<TabletProps>`
  height: ${({ $isTablet }) => ($isTablet ? 100 : 60)}px;
`;

// OptionsGroup — single wrapper for all option rows. Placed as one child
// inside GlassCard's Content. Negative margins cancel out Content's 16px
// padding so row highlight backgrounds extend edge-to-edge inside the card;
// overflow:hidden on GlassCard's Clip clips them to the rounded corners.
const OptionsGroup = styled.View`
  margin: -${({ theme }) => theme.spacing.md}px;
`;

// OptionDivider — rule between option rows. Uses the same glassClearDivider
// token as the Location screen's FieldDivider.
const OptionDivider = styled.View`
  height: 1px;
  background-color: ${({ theme }) => theme.colors.glassClearDivider};
`;

// CtaArea — wraps the CTA button outside the ScrollView so it stays pinned
// to the bottom of the screen. Horizontal padding mirrors ContentArea so
// the button aligns with the GlassCard edges.
const CtaArea = styled.View<TabletProps & { $width: number }>`
  padding: 0 ${({ $width, $isTablet, theme }) =>
    $isTablet ? $width * 0.1 : theme.spacing.md}px
    ${({ theme }) => theme.spacing.md}px;
`;

// CtaButton — dark pill button matching all welcome steps and other onboarding
// screens. Opacity drops to 0.4 when no option is selected.
const CtaButton = styled(Pressable)<TabletProps & { $enabled: boolean }>`
  background-color: ${({ theme }) => theme.colors.primary};
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

// GrassType — lets the user identify their grass type.
// One option must be selected before Continue activates.
// "I'm not sure" maps to 'unknown' — the task engine infers grass type
// from ZIP code server-side rather than storing a wrong value.
export const GrassType = () => {
  const theme = useTheme();
  // width still comes from the window — it drives the 10% tablet side padding.
  // isTablet itself comes from the shared device-type hook.
  const { width } = useWindowDimensions();
  const isTablet = useIsTablet();

  const [selected, setSelected] = useState<GrassTypeList | null>(null);
  const { setGrassType } = useOnboardingStore();

  const handleContinue = () => {
    if (!selected) return;
    setGrassType(selected);
    router.push('/onboarding/effort-level');
  };

  return (
    <OnboardingScreenShell currentStep={2} totalSteps={4}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ flexGrow: 1 }}
        bounces={false}
        showsVerticalScrollIndicator={false}
      >
        <ContentArea $isTablet={isTablet} $width={width}>
          <TopSpacer />
          <ContentGroup>
            <Headline $isTablet={isTablet}>
              What kind of{'\n'}grass is it?
            </Headline>
            <Subtext $isTablet={isTablet}>
              This determines which tasks are right for your lawn.
            </Subtext>
            <SpacerCard $isTablet={isTablet} />
            {/* GlassCard variant="clear" matches the Location screen's card —
                same faux-glass backdrop on Android, real BlurView on iOS. */}
            <GlassCard
              variant="clear"
              clearBackdropSource={SPRINKLER_BG}
              clearBackdropTint={theme.colors.onboardingPhotoTint}
            >
              <OptionsGroup>
                {GRASS_OPTIONS.map((opt, index) => (
                  <Fragment key={opt.value}>
                    {index > 0 && <OptionDivider />}
                    <GrassTypeCard
                      icon={opt.icon}
                      name={opt.name}
                      description={opt.description}
                      selected={selected === opt.value}
                      onPress={() => setSelected(opt.value)}
                    />
                  </Fragment>
                ))}
              </OptionsGroup>
            </GlassCard>
          </ContentGroup>
          <BottomSpacer />
        </ContentArea>
      </ScrollView>

      {/* CTA lives outside the ScrollView so it stays anchored to the
          bottom of the screen, not the scroll content. */}
      <CtaArea $isTablet={isTablet} $width={width}>
        <CtaButton
          $isTablet={isTablet}
          $enabled={selected !== null}
          disabled={selected === null}
          onPress={handleContinue}
          accessibilityRole="button"
          accessibilityLabel="Continue to next step"
          accessibilityState={{ disabled: selected === null }}
        >
          <CtaLabel $isTablet={isTablet}>Continue →</CtaLabel>
        </CtaButton>
      </CtaArea>
    </OnboardingScreenShell>
  );
};
