// A tiny green badge that floats in the bottom-right corner during development
// only. It shows which "flow" we're currently forcing the app into (normal
// sign-in, onboarding, welcome, or straight to the tabs) and, when tapped, opens
// the dev launcher so we can switch. It's a build-time convenience for us, never
// for real users — it's only rendered in development and is stripped entirely
// from production builds, so this whole file is invisible in the shipped app.

import { useRouter } from 'expo-router';
import { Pressable } from 'react-native';
import styled from 'styled-components/native';
import { useDevStore } from './devStore';

// FLOW_LABELS — maps each internal flow name to the short word shown on the
// pill, so "sign-in" reads as the friendlier "Normal".
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

// Dot — the small green status dot on the pill, a quick visual "dev mode is on".
const Dot = styled.View`
  width: 5px;
  height: 5px;
  border-radius: 3px;
  background-color: #4ade80;
`;

// Label — the tiny uppercase green text on the pill (e.g. "DEV · TABS") naming
// the active flow.
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
