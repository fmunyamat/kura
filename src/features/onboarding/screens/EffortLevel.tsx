import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, useWindowDimensions } from 'react-native';
import styled from 'styled-components/native';
import { GrassTypeCard } from '~/features/onboarding/components/GrassTypeCard';
import { OnboardingScreenShell } from '~/features/onboarding/components/OnboardingScreenShell';
import { useOnboardingStore } from '../stores/onboardingStore';

// $isTablet — passed to every styled-component that needs to scale up on tablets.
interface TabletProps {
  $isTablet: boolean;
}

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

const ContentArea = styled.View<TabletProps>`
  flex: 1;
  padding: 0 ${({ theme, $isTablet }) =>
    $isTablet ? theme.spacing.xxl : theme.spacing.md}px;
`;

const TopSpacer = styled.View`flex: 0.2;`;
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

// OptionsCard — frosted white card wrapping all three effort options.
// Matches OptionsCard in GrassType and FormCard in Location.
const OptionsCard = styled.View`
  background-color: rgba(255, 255, 255, 0.44);
  border-radius: ${({ theme }) => theme.radii.lg}px;
  overflow: hidden;
`;

// HintText — reminder that the user can change their choice later in Settings.
// Sits below the card, low visual weight so it doesn't compete with the options.
const HintText = styled.Text`
  font-family: ${({ theme }) => theme.typography.fontBody};
  font-size: 11px;
  color: rgba(255, 255, 255, 0.30);
  text-align: center;
  line-height: 16px;
  margin-top: ${({ theme }) => theme.spacing.sm}px;
`;

const CtaArea = styled.View<TabletProps>`
  padding: 0 ${({ theme, $isTablet }) =>
    $isTablet ? theme.spacing.xxl : theme.spacing.md}px
    ${({ theme }) => theme.spacing.md}px;
`;

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

// EffortLevel — step 3 of 4 in onboarding. The user picks a goal-based effort
// tier that controls which lawn care tasks get recommended to them. The choice
// is stored in user_profiles.effort_level and can be changed later in Settings.
export const EffortLevel = () => {
  const { width, height } = useWindowDimensions();
  const isTablet = Math.min(width, height) >= 600;

  const [selected, setSelected] = useState<1 | 2 | 3 | null>(null);
  const { setEffortLevel } = useOnboardingStore();

  const handleContinue = () => {
    if (!selected) return;
    setEffortLevel(selected);
    router.push('/onboarding/photo-capture');
  };

  return (
    <OnboardingScreenShell currentStep={3} totalSteps={4}>
      <ContentArea $isTablet={isTablet}>
        <TopSpacer />
        <ContentGroup>
          <Headline $isTablet={isTablet}>
            How into your{'\n'}lawn are you?
          </Headline>
          <Subtext $isTablet={isTablet}>
            We'll match your recommendations to your goal. No wrong answer.
          </Subtext>
          <SpacerCard $isTablet={isTablet} />
          <OptionsCard>
            {EFFORT_OPTIONS.map((opt, index) => (
              <GrassTypeCard
                key={opt.value}
                icon={opt.icon}
                name={opt.name}
                description={opt.description}
                selected={selected === opt.value}
                isFirst={index === 0}
                onPress={() => setSelected(opt.value)}
              />
            ))}
          </OptionsCard>
          <HintText>You can change this anytime in Settings.</HintText>
        </ContentGroup>
        <BottomSpacer />
      </ContentArea>

      <CtaArea $isTablet={isTablet}>
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
