import { router } from 'expo-router';
import styled from 'styled-components/native';
import { OnboardingLayout } from '~/features/onboarding/components/OnboardingLayout';

// PreviewTask — a single task shown before the user enters the main app.
interface PreviewTask {
  title: string;
  estimatedMinutes: number;
}

// PREVIEW_TASKS — static illustrative tasks shown on this screen.
// These are not fetched from Supabase — they give the user a feel for
// what the app will suggest once they're inside. Real tasks come from
// the task engine after onboarding completes.
const PREVIEW_TASKS: PreviewTask[] = [
  { title: 'Apply pre-emergent weed control', estimatedMinutes: 45 },
  { title: 'First fertilizer application', estimatedMinutes: 30 },
  { title: 'Check mowing height', estimatedMinutes: 10 },
];

// TaskRow — a single task preview item: dot + title + estimated time.
const TaskRow = styled.View`
  background-color: ${({ theme }) => theme.colors.glassOnboardingOption};
  border-radius: ${({ theme }) => theme.radii.md}px;
  padding: ${({ theme }) => theme.spacing.sm}px ${({ theme }) => theme.spacing.md}px;
  flex-direction: row;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm}px;
`;

// TaskDot — the small filled circle indicator to the left of each task.
const TaskDot = styled.View`
  width: 8px;
  height: 8px;
  border-radius: 4px;
  background-color: ${({ theme }) => theme.colors.primaryDeep};
  flex-shrink: 0;
`;

// TaskTitle — the task name, takes remaining row width.
const TaskTitle = styled.Text`
  flex: 1;
  font-size: ${({ theme }) => theme.typography.sizeSm}px;
  color: ${({ theme }) => theme.colors.textOnGlass};
`;

// TaskTime — the estimated time in minutes, right-aligned.
const TaskTime = styled.Text`
  font-size: ${({ theme }) => theme.typography.sizeXs}px;
  color: ${({ theme }) => theme.colors.textMutedOnGlass};
`;

// TaskList — vertical stack of task rows with small gaps between them.
const TaskList = styled.View`
  gap: ${({ theme }) => theme.spacing.xs}px;
`;

// PrimaryButton — the single CTA on this screen.
const PrimaryButton = styled.TouchableOpacity`
  background-color: ${({ theme }) => theme.colors.primaryDeep};
  border-radius: ${({ theme }) => theme.radii.md}px;
  padding: ${({ theme }) => theme.spacing.md}px;
  align-items: center;
`;

const ButtonText = styled.Text`
  font-size: ${({ theme }) => theme.typography.sizeMd}px;
  font-weight: ${({ theme }) => theme.typography.weightBold};
  color: ${({ theme }) => theme.colors.white};
`;

// formatMinutes — turns a minute count into a readable string for beginners.
const formatMinutes = (minutes: number): string => {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return remainder > 0 ? `${hours}h ${remainder}m` : `${hours}h`;
};

// PreviewScreen — shows 3 illustrative tasks before the user enters the app.
// No Supabase call — purely illustrative to show what the app will suggest.
export const PreviewScreen = () => {
  const handleContinue = () => {
    router.push('/onboarding/photo-capture');
  };

  return (
    <OnboardingLayout
      step={3}
      totalSteps={4}
      heroIcon="✅"
      stepLabel="Step 3 of 4"
      title="Here's your spring plan"
      subtitle="Based on your location and grass type, here's what we'll tackle first."
    >
      <TaskList>
        {PREVIEW_TASKS.map((task) => (
          <TaskRow key={task.title}>
            <TaskDot />
            <TaskTitle>{task.title}</TaskTitle>
            <TaskTime>{formatMinutes(task.estimatedMinutes)}</TaskTime>
          </TaskRow>
        ))}
      </TaskList>

      <PrimaryButton
        onPress={handleContinue}
        accessibilityRole="button"
        accessibilityLabel="Looks good, let's go"
      >
        <ButtonText>Looks good — let's go</ButtonText>
      </PrimaryButton>
    </OnboardingLayout>
  );
};
