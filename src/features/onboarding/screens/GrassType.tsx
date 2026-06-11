import { router } from 'expo-router';
import { Fragment, useState } from 'react';
import { ScrollView } from 'react-native';
import styled, { useTheme } from 'styled-components/native';
import { OnboardingScreenShell } from '~/features/onboarding/components/OnboardingScreenShell';
import type { GrassTypeList } from '~/features/onboarding/types';
import { CtaButton } from '~/shared/components/CtaButton';
import { GlassDivider } from '~/shared/components/GlassDivider';
import { GlassCard } from '~/shared/components/GlassCard';
import { OptionCard } from '~/shared/components/OptionCard';
import {
  BottomSpacer,
  ContentArea,
  ContentGroup,
  CtaArea,
  GapSpacer,
  TopSpacer,
} from '~/shared/components/ScreenLayout';
import { ScreenHeadline, ScreenSubtext } from '~/shared/components/ScreenTypography';
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

// OptionsGroup — single wrapper for all option rows. Placed as one child
// inside GlassCard's Content. Negative margins cancel out Content's 16px
// padding so row highlight backgrounds extend edge-to-edge inside the card;
// overflow:hidden on GlassCard's Clip clips them to the rounded corners.
const OptionsGroup = styled.View`
  margin: -${({ theme }) => theme.spacing.md}px;
`;

// GrassType — lets the user identify their grass type.
// One option must be selected before Continue activates.
// "I'm not sure" maps to 'unknown' — the task engine infers grass type
// from ZIP code server-side rather than storing a wrong value.
// Layout, headline, subtext, and the CTA all come from the shared screen
// components; ContentArea/CtaArea run in column mode so the card matches
// the sign-in and Location screens' 80% tablet column.
export const GrassType = () => {
  const theme = useTheme();

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
        <ContentArea column>
          <TopSpacer />
          <ContentGroup>
            <ScreenHeadline size="title">
              What kind of{'\n'}grass is it?
            </ScreenHeadline>
            <ScreenSubtext tone="muted">
              This determines which tasks are right for your lawn.
            </ScreenSubtext>
            <GapSpacer />
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
                    {index > 0 && <GlassDivider />}
                    <OptionCard
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
      <CtaArea column>
        <CtaButton
          label="Continue →"
          onPress={handleContinue}
          enabled={selected !== null}
          accessibilityLabel="Continue to next step"
        />
      </CtaArea>
    </OnboardingScreenShell>
  );
};
