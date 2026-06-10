import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, useWindowDimensions } from 'react-native';
import styled from 'styled-components/native';
import { GrassTypeCard } from '~/features/onboarding/components/GrassTypeCard';
import { OnboardingScreenShell } from '~/features/onboarding/components/OnboardingScreenShell';
import type { GrassTypeList } from '~/features/onboarding/types';
import { useOnboardingStore } from '../stores/onboardingStore';

// $isTablet — passed to every styled-component that needs to scale up on tablets.
interface TabletProps {
  $isTablet: boolean;
}

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

// OptionsCard — frosted white card wrapping all three grass type options.
// Matches FormCard in Location and GlassCard/TaskCard in the welcome flow.
const OptionsCard = styled.View`
  background-color: rgba(255, 255, 255, 0.44);
  border-radius: ${({ theme }) => theme.radii.lg}px;
  overflow: hidden;
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

// GrassType — lets the user identify their grass type.
// One option must be selected before Continue activates.
// "I'm not sure" maps to 'unknown' — the task engine infers grass type
// from ZIP code server-side rather than storing a wrong value.
export const GrassType = () => {
  const { width, height } = useWindowDimensions();
  const isTablet = Math.min(width, height) >= 600;

  const [selected, setSelected] = useState<GrassTypeList | null>(null);
  const { setGrassType } = useOnboardingStore();

  const handleContinue = () => {
    if (!selected) return;
    setGrassType(selected);
    router.push('/onboarding/effort-level');
  };

  return (
    <OnboardingScreenShell currentStep={2} totalSteps={4}>
      <ContentArea $isTablet={isTablet}>
        <TopSpacer />
        <ContentGroup>
          <Headline $isTablet={isTablet}>
            What kind of{'\n'}grass is it?
          </Headline>
          <Subtext $isTablet={isTablet}>
            This determines which tasks are right for your lawn.
          </Subtext>
          <SpacerCard $isTablet={isTablet} />
          <OptionsCard>
            {GRASS_OPTIONS.map((opt, index) => (
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
