import { router } from 'expo-router';
import { useState } from 'react';
import styled from 'styled-components/native';
import { GrassTypeCard } from '~/features/onboarding/components/GrassTypeCard';
import { OnboardingLayout } from '~/features/onboarding/components/OnboardingLayout';
import { useOnboardingStore } from '../stores/onboardingStore';

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

// OptionList — vertical stack of effort level cards with a small gap between them.
const OptionList = styled.View`
  gap: ${({ theme }) => theme.spacing.xs}px;
`;

// HintText — reminder that the user can change their choice later. Low visual
// weight so it doesn't distract from the primary selection.
const HintText = styled.Text`
  font-size: ${({ theme }) => theme.typography.sizeXs}px;
  color: ${({ theme }) => theme.colors.textMutedOnGlass};
  text-align: center;
  line-height: ${({ theme }) => theme.typography.lineHeightSm}px;
`;

// PrimaryButton — the Continue CTA. Disabled at 30% opacity until a card is selected.
const PrimaryButton = styled.TouchableOpacity<{ $enabled: boolean }>`
  background-color: ${({ theme }) => theme.colors.gradientMidLight};
  border-radius: ${({ theme }) => theme.radii.md}px;
  padding: ${({ theme }) => theme.spacing.md}px;
  align-items: center;
  opacity: ${({ $enabled }) => ($enabled ? 1 : 0.3)};
`;

const ButtonText = styled.Text`
  font-size: ${({ theme }) => theme.typography.sizeMd}px;
  font-weight: ${({ theme }) => theme.typography.weightBold};
  color: ${({ theme }) => theme.colors.white};
`;

// EffortLevel — step 3 of 4 in onboarding. The user picks a goal-based effort
// tier that controls which lawn care tasks get recommended to them. The choice
// is stored in user_profiles.effort_level and can be changed later in Settings.
export const EffortLevel = () => {
  const [selected, setSelected] = useState<1 | 2 | 3 | null>(null);
  const { setEffortLevel } = useOnboardingStore();

  const handleContinue = () => {
    if (!selected) return;
    setEffortLevel(selected);
    router.push('/onboarding/photo-capture');
  };

  return (
    <OnboardingLayout
      heroIcon="🎯"
      stepLabel="Step 3 of 4"
      title="How into your lawn are you?"
      subtitle="We'll match your recommendations to your goal. No wrong answer."
    >
      <OptionList>
        {EFFORT_OPTIONS.map((opt) => (
          <GrassTypeCard
            key={opt.value}
            icon={opt.icon}
            name={opt.name}
            description={opt.description}
            selected={selected === opt.value}
            onPress={() => setSelected(opt.value)}
          />
        ))}
      </OptionList>

      <HintText>You can change this anytime in Settings.</HintText>

      <PrimaryButton
        $enabled={selected !== null}
        disabled={selected === null}
        onPress={handleContinue}
        accessibilityRole="button"
        accessibilityLabel="Continue"
        accessibilityState={{ disabled: selected === null }}
      >
        <ButtonText>Continue</ButtonText>
      </PrimaryButton>
    </OnboardingLayout>
  );
};
