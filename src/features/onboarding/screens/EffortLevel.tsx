import { router } from 'expo-router';
import { Fragment, useState } from 'react';
import { ScrollView } from 'react-native';
import styled, { useTheme } from 'styled-components/native';
import { OnboardingScreenShell } from '~/features/onboarding/components/OnboardingScreenShell';
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
const SPRINKLER_BG = require('../../../../assets/images/sprinkler.png');

// EFFORT_OPTIONS — the three goal-based effort tiers the user picks from.
// value maps to the smallint stored in user_profiles.effort_level (1 / 2 / 3).
const EFFORT_OPTIONS: Array<{
  value: 1 | 2 | 3;
  icon: string;
  name: string;
  description: string;
}> = [
  {
    value: 1,
    icon: '🌱',
    name: 'Just keeping it alive',
    description: 'Only the tasks that truly matter',
  },
  {
    value: 2,
    icon: '🌿',
    name: 'Nice-looking lawn',
    description: 'Regular upkeep, nothing too demanding',
  },
  {
    value: 3,
    icon: '🏆',
    name: 'Best on the block',
    description: 'The full seasonal routine, start to finish',
  },
];

// OptionsGroup — single wrapper for all option rows. Negative margins cancel
// out Content's 16px padding so row highlight backgrounds extend edge-to-edge
// inside the card; overflow:hidden on GlassCard's Clip clips to rounded corners.
const OptionsGroup = styled.View`
  margin: -${({ theme }) => theme.spacing.md}px;
`;

// HintText — reminder that the user can change their choice later in Settings.
// Sits below the card, low visual weight so it doesn't compete with the options.
const HintText = styled.Text`
  font-family: ${({ theme }) => theme.typography.fontBody};
  font-size: 11px;
  color: ${({ theme }) => theme.colors.textMutedOnDark};
  text-align: center;
  line-height: 16px;
  margin-top: ${({ theme }) => theme.spacing.sm}px;
`;

// EffortLevel — step 3 of 4 in onboarding. The user picks a goal-based effort
// tier that controls which lawn care tasks get recommended to them. The choice
// is stored in user_profiles.effort_level and can be changed later in Settings.
// Layout, headline, subtext, and the CTA all come from the shared screen
// components; ContentArea/CtaArea run in column mode so the card matches
// the sign-in and Location screens' 80% tablet column.
export const EffortLevel = () => {
  const theme = useTheme();

  const [selected, setSelected] = useState<1 | 2 | 3 | null>(null);
  const { setEffortLevel } = useOnboardingStore();

  const handleContinue = () => {
    if (!selected) return;
    setEffortLevel(selected);
    router.push('/onboarding/photo-capture');
  };

  return (
    <OnboardingScreenShell currentStep={3} totalSteps={4}>
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
              How into your{'\n'}lawn are you?
            </ScreenHeadline>
            <ScreenSubtext tone="muted">
              We'll match your recommendations to your goal. No wrong answer.
            </ScreenSubtext>
            <GapSpacer />
            <GlassCard
              variant="clear"
              clearBackdropSource={SPRINKLER_BG}
              clearBackdropTint={theme.colors.onboardingPhotoTint}
            >
              <OptionsGroup>
                {EFFORT_OPTIONS.map((opt, index) => (
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
            <HintText>You can change this anytime in Settings.</HintText>
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
