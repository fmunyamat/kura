import { useRouter } from 'expo-router';
import { Pressable } from 'react-native';
import styled from 'styled-components/native';
import { useDevStore } from './devStore';

const FLOW_LABELS: Record<string, string> = {
  'sign-in':   'Normal',
  onboarding:  'Onboarding',
  welcome:     'Welcome',
  tabs:        'Tabs',
};

// Pill — absolutely positioned in the bottom-right corner, always on top.
// zIndex 9999 ensures it floats above every screen including modals.
const Pill = styled(Pressable)`
  position: absolute;
  bottom: 24px;
  right: 14px;
  flex-direction: row;
  align-items: center;
  gap: 5px;
  background-color: rgba(10, 15, 10, 0.92);
  border-width: 1px;
  border-color: rgba(74, 222, 128, 0.30);
  border-radius: 999px;
  padding: 5px 10px 5px 8px;
  z-index: 9999;
`;

const Dot = styled.View`
  width: 5px;
  height: 5px;
  border-radius: 3px;
  background-color: #4ade80;
`;

const Label = styled.Text`
  font-size: 9px;
  font-weight: ${({ theme }) => theme.typography.weightBold};
  color: rgba(74, 222, 128, 0.90);
  letter-spacing: 1px;
  text-transform: uppercase;
`;

// DevPill — a persistent floating badge that shows which flow is active and
// lets the developer tap back to the launcher to switch at any time.
// Only rendered when __DEV__ is true; Hermes eliminates it in production.
const DevPill = () => {
  const router = useRouter();
  const selectedFlow = useDevStore((s) => s.selectedFlow);

  const handlePress = () => {
    router.push('/dev-launcher');
  };

  return (
    <Pill
      onPress={handlePress}
      accessibilityLabel={`Dev mode: ${FLOW_LABELS[selectedFlow]}. Tap to switch flow.`}
    >
      <Dot />
      <Label>DEV · {FLOW_LABELS[selectedFlow]}</Label>
    </Pill>
  );
};

export default DevPill;
