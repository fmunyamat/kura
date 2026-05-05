import { router } from 'expo-router';
import { useState } from 'react';
import styled from 'styled-components/native';
import { GrassTypeCard } from '~/features/onboarding/components/GrassTypeCard';
import { OnboardingLayout } from '~/features/onboarding/components/OnboardingLayout';
import type { GrassType } from '~/features/onboarding/types';

// GRASS_OPTIONS — the three choices shown on this screen.
const GRASS_OPTIONS: Array<{
  value: GrassType;
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

// OptionList — vertical stack of GrassTypeCard components with a small gap.
const OptionList = styled.View`
  gap: ${({ theme }) => theme.spacing.xs}px;
`;

// PrimaryButton — the Continue CTA.
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

// GrassTypeScreen — lets the user identify their grass type.
// One option must be selected before Continue activates.
// "I'm not sure" maps to 'unknown' — the task engine infers grass type
// from ZIP code server-side rather than storing a wrong value.
export const GrassTypeScreen = () => {
  const [selected, setSelected] = useState<GrassType | null>(null);

  const handleContinue = () => {
    if (!selected) return;
    router.push('/onboarding/preview');
  };

  return (
    <OnboardingLayout
      step={2}
      totalSteps={4}
      heroIcon="🌿"
      stepLabel="Step 2 of 4"
      title="What kind of grass do you have?"
      subtitle="This determines which tasks are right for your lawn."
    >
      <OptionList>
        {GRASS_OPTIONS.map((opt) => (
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
