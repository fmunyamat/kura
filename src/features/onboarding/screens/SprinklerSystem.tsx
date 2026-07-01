// SprinklerSystem — step 4 of 5 in onboarding. Asks whether the user has a
// built-in / automatic sprinkler system or waters by hand (hose-end sprinkler
// or nozzle). The answer changes the steps shown on the watering task card in
// the Today tab — sprinkler users see "move the head" steps; hose users see
// "move the hose-end sprinkler" steps. Plain "Yes / No" phrasing because the
// target audience may not know what "irrigation system" means.

import { router } from 'expo-router';
import { Fragment, useState } from 'react';
import { ScrollView } from 'react-native';
import { useTheme } from 'styled-components/native';
import styled from 'styled-components/native';
import { OnboardingScreenShell } from '~/features/onboarding/components/OnboardingScreenShell';
import { useLawnStore } from '~/features/home/stores/lawnStore';
import { CtaButton } from '~/shared/components/CtaButton';
import { GlassCard } from '~/shared/components/GlassCard';
import { GlassDivider } from '~/shared/components/GlassDivider';
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
const SPRINKLER_BG = require('../../../../assets/images/sprinkler.png');

// SPRINKLER_OPTIONS — two watering setup choices. value is the boolean that
// flows into user_profiles.has_sprinkler_system and lawnStore.
const SPRINKLER_OPTIONS = [
  {
    value: true,
    icon: '💧',
    name: 'Yes, I have sprinklers',
    description: 'Built-in heads that pop up automatically',
  },
  {
    value: false,
    icon: '🪣',
    name: 'No, I use a hose',
    description: 'Hand watering or a portable sprinkler head',
  },
] as const;

// OptionsGroup — single wrapper for all option rows. Negative margins cancel
// out Content's 16px padding so row highlight backgrounds extend edge-to-edge
// inside the card; overflow:hidden on GlassCard's Clip clips to rounded corners.
const OptionsGroup = styled.View`
  margin: -${({ theme }) => theme.spacing.md}px;
`;

export const SprinklerSystem = () => {
  const theme = useTheme();

  const [selected, setSelected] = useState<boolean | null>(null);
  const { setHasSprinklerSystem: saveToOnboarding } = useOnboardingStore();
  const { setHasSprinklerSystem: saveToLawn } = useLawnStore();

  const handleContinue = () => {
    if (selected === null) return;
    // Write to both stores: onboardingStore carries it to the Supabase upsert;
    // lawnStore keeps it available on the home screen after onboardingStore resets.
    saveToOnboarding(selected);
    saveToLawn(selected);
    router.push('/onboarding/photo-capture');
  };

  return (
    <OnboardingScreenShell currentStep={4} totalSteps={5}>
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
              Do you have{'\n'}sprinklers?
            </ScreenHeadline>
            <ScreenSubtext tone="muted">
              This changes the steps we show you on watering days.
            </ScreenSubtext>
            <GapSpacer />
            <GlassCard
              variant="clear"
              clearBackdropSource={SPRINKLER_BG}
              clearBackdropTint={theme.colors.onboardingPhotoTint}
            >
              <OptionsGroup>
                {SPRINKLER_OPTIONS.map((opt, index) => (
                  <Fragment key={String(opt.value)}>
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
