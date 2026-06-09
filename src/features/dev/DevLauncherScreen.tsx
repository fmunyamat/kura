import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import styled from 'styled-components/native';
import { type DevFlow, useDevStore } from './devStore';

// Flow options shown on the launcher.
const FLOWS: { id: DevFlow; icon: string; label: string; desc: string }[] = [
  { id: 'sign-in',    icon: '🔑', label: 'Sign In',    desc: 'Normal flow · auth guards active'   },
  { id: 'onboarding', icon: '📍', label: 'Onboarding', desc: 'Location → Grass → Effort → Photo'  },
  { id: 'welcome',    icon: '🌱', label: 'Welcome',    desc: '4-screen tutorial flow'              },
  { id: 'tabs',       icon: '🏠', label: 'Tabs',       desc: 'Jump straight to the main app'       },
];

// Route to navigate to after committing a flow selection.
const FLOW_ROUTES: Record<DevFlow, string> = {
  'sign-in':   '/sign-in',
  onboarding:  '/onboarding',
  welcome:     '/welcome',
  tabs:        '/',
};

// FLOW_LABELS — used to show the current default name in the subheading chip.
const FLOW_LABELS: Record<DevFlow, string> = {
  'sign-in':   'Sign In',
  onboarding:  'Onboarding',
  welcome:     'Welcome',
  tabs:        'Tabs',
};

// ── Styled components ──────────────────────────────────────────────

// Screen — dark near-black background that makes it unmistakably a dev tool,
// not a real app screen.
const Screen = styled(SafeAreaView)`
  flex: 1;
  background-color: #090e09;
`;

const Content = styled.View`
  flex: 1;
  padding: 8px ${({ theme }) => theme.spacing.md}px ${({ theme }) => theme.spacing.md}px;
`;

const BadgeRow = styled.View`
  flex-direction: row;
  align-items: center;
  gap: 7px;
  margin-bottom: ${({ theme }) => theme.spacing.md}px;
`;

const BadgeDot = styled.View`
  width: 6px;
  height: 6px;
  border-radius: 3px;
  background-color: #4ade80;
`;

const BadgeText = styled.Text`
  font-size: 9px;
  font-weight: ${({ theme }) => theme.typography.weightBold};
  letter-spacing: 2px;
  text-transform: uppercase;
  color: #4ade80;
`;

const Heading = styled.Text`
  font-size: 20px;
  font-weight: ${({ theme }) => theme.typography.weightBlack};
  color: rgba(255, 255, 255, 0.92);
  letter-spacing: -0.3px;
  margin-bottom: 2px;
`;

// SubheadingRow — holds the descriptive text and the optional default chip side by side.
const SubheadingRow = styled.View`
  flex-direction: row;
  align-items: center;
  gap: 7px;
  margin-bottom: ${({ theme }) => theme.spacing.lg}px;
`;

const SubheadingText = styled.Text`
  font-size: 11px;
  color: rgba(255, 255, 255, 0.28);
`;

// DefaultChip — small pill shown when a default flow is set, so the user can
// see the persisted default at a glance without scanning the list.
const DefaultChip = styled.Text`
  font-size: 9px;
  font-weight: ${({ theme }) => theme.typography.weightBold};
  color: #4ade80;
  background-color: rgba(74, 222, 128, 0.1);
  border-radius: 4px;
  padding: 2px 6px;
  overflow: hidden;
  letter-spacing: 0.3px;
`;

// FlowList — the stack of tappable flow buttons.
const FlowList = styled.View`
  flex: 1;
  gap: 8px;
`;

// FlowButton — one selectable flow row. Active state highlights with a green
// left border and tinted background so the selection is obvious at a glance.
const FlowButton = styled(Pressable)<{ $active: boolean }>`
  background-color: ${({ $active }) =>
    $active ? 'rgba(74, 222, 128, 0.08)' : 'rgba(255, 255, 255, 0.04)'};
  border-width: 1px;
  border-color: ${({ $active }) =>
    $active ? 'rgba(74, 222, 128, 0.22)' : 'rgba(255, 255, 255, 0.07)'};
  border-radius: 12px;
  padding: 12px 14px;
  flex-direction: row;
  align-items: center;
  gap: 12px;
  overflow: hidden;
`;

// ActiveBar — the 3px green left accent bar shown only on the selected row.
const ActiveBar = styled.View<{ $visible: boolean }>`
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 3px;
  background-color: #4ade80;
  border-radius: 2px;
  opacity: ${({ $visible }) => ($visible ? 1 : 0)};
`;

const FlowIcon = styled.Text`
  font-size: 18px;
  width: 28px;
  text-align: center;
`;

const FlowInfo = styled.View`flex: 1;`;

// FlowNameRow — holds the label text and the optional DEFAULT badge side by side.
const FlowNameRow = styled.View`
  flex-direction: row;
  align-items: center;
  gap: 6px;
`;

const FlowName = styled.Text<{ $active: boolean }>`
  font-size: 12px;
  font-weight: ${({ theme }) => theme.typography.weightBold};
  color: ${({ $active }) => ($active ? '#4ade80' : 'rgba(255, 255, 255, 0.88)')};
  letter-spacing: -0.1px;
`;

// DefaultBadge — tiny "DEFAULT" chip inline with the flow name on the pinned row.
// Makes the default visible even when a different row is the active selection.
const DefaultBadge = styled.Text`
  font-size: 7px;
  font-weight: ${({ theme }) => theme.typography.weightBold};
  letter-spacing: 1.5px;
  text-transform: uppercase;
  color: #4ade80;
  background-color: rgba(74, 222, 128, 0.14);
  border-radius: 3px;
  padding: 1px 4px;
  overflow: hidden;
`;

const FlowDesc = styled.Text`
  font-size: 9px;
  color: rgba(255, 255, 255, 0.28);
  margin-top: 2px;
`;

// FlowRight — the right-side cluster: checkmark + pin button.
const FlowRight = styled.View`
  flex-direction: row;
  align-items: center;
  gap: 8px;
`;

const FlowCheck = styled.Text<{ $visible: boolean }>`
  font-size: 12px;
  color: #4ade80;
  opacity: ${({ $visible }) => ($visible ? 1 : 0)};
`;

// PinButton — tap to pin this flow as the default launch screen.
// Glows green when this row is the active default; dim when it isn't.
const PinButton = styled(Pressable)<{ $isDefault: boolean }>`
  width: 24px;
  height: 24px;
  border-radius: 6px;
  align-items: center;
  justify-content: center;
  background-color: ${({ $isDefault }) =>
    $isDefault ? 'rgba(74, 222, 128, 0.14)' : 'transparent'};
`;

const PinIcon = styled.Text<{ $isDefault: boolean }>`
  font-size: 12px;
  opacity: ${({ $isDefault }) => ($isDefault ? 1 : 0.22)};
`;

// LaunchButton — the confirm CTA at the bottom. Solid green so it reads as
// the primary action, distinct from every real app CTA.
const LaunchButton = styled(Pressable)`
  background-color: #4ade80;
  border-radius: ${({ theme }) => theme.radii.md}px;
  padding: 14px 12px;
  margin-top: ${({ theme }) => theme.spacing.md}px;
  align-items: center;
`;

const LaunchLabel = styled.Text`
  font-size: ${({ theme }) => theme.typography.sizeSm}px;
  font-weight: ${({ theme }) => theme.typography.weightBold};
  color: #050f06;
  letter-spacing: 0.5px;
`;

// ── Component ──────────────────────────────────────────────────────

// DevLauncherScreen — the flow selector that appears when the dev pill is tapped.
// Selecting a flow saves it to the dev store, then navigates to that screen
// while the routing guard in app/(app)/_layout.tsx skips normal auth checks.
// Pinning a flow saves it to SecureStore so it auto-applies after a full reload.
const DevLauncherScreen = () => {
  const router = useRouter();
  const { selectedFlow, setSelectedFlow, defaultFlow, setDefaultFlow } = useDevStore();

  // pendingFlow — the highlighted selection before the user confirms with Launch.
  // Pre-seeded with the current stored selection so the UI always reflects reality.
  const [pendingFlow, setPendingFlow] = useState<DevFlow>(selectedFlow);

  const handleLaunch = () => {
    setSelectedFlow(pendingFlow);
    // replace() so the dev launcher doesn't sit in the back stack
    router.replace(FLOW_ROUTES[pendingFlow] as never);
  };

  // handleToggleDefault — pins the flow if it isn't the current default,
  // clears it if it already is (so the user can turn off auto-launch).
  const handleToggleDefault = (flow: DevFlow) => {
    setDefaultFlow(defaultFlow === flow ? null : flow);
  };

  return (
    <Screen edges={['top', 'bottom']}>
      <Content>
        <BadgeRow>
          <BadgeDot />
          <BadgeText>Dev Mode</BadgeText>
        </BadgeRow>
        <Heading>Launch Flow</Heading>

        {/* Subheading shows the active default so it's visible without scanning the list */}
        <SubheadingRow>
          <SubheadingText>Pick a screen to jump to</SubheadingText>
          {defaultFlow !== null && (
            <DefaultChip>📌 {FLOW_LABELS[defaultFlow]}</DefaultChip>
          )}
        </SubheadingRow>

        <FlowList>
          {FLOWS.map(({ id, icon, label, desc }) => {
            const isActive = pendingFlow === id;
            const isDefault = defaultFlow === id;
            return (
              <FlowButton
                key={id}
                $active={isActive}
                onPress={() => setPendingFlow(id)}
                accessibilityRole="radio"
                accessibilityState={{ checked: isActive }}
                accessibilityLabel={label}
              >
                <ActiveBar $visible={isActive} />
                <FlowIcon>{icon}</FlowIcon>
                <FlowInfo>
                  <FlowNameRow>
                    <FlowName $active={isActive}>{label}</FlowName>
                    {isDefault && <DefaultBadge>default</DefaultBadge>}
                  </FlowNameRow>
                  <FlowDesc>{desc}</FlowDesc>
                </FlowInfo>
                <FlowRight>
                  <FlowCheck $visible={isActive}>✓</FlowCheck>
                  {/* Pin button — tap to set this flow as the default launch screen.
                      Tapping the already-pinned row clears the default. */}
                  <PinButton
                    $isDefault={isDefault}
                    onPress={() => handleToggleDefault(id)}
                    accessibilityRole="button"
                    accessibilityLabel={isDefault ? `Remove ${label} as default` : `Set ${label} as default`}
                    // Stop the press from also selecting the row.
                    onStartShouldSetResponder={() => true}
                  >
                    <PinIcon $isDefault={isDefault}>📌</PinIcon>
                  </PinButton>
                </FlowRight>
              </FlowButton>
            );
          })}
        </FlowList>

        <LaunchButton
          onPress={handleLaunch}
          accessibilityRole="button"
          accessibilityLabel="Launch selected flow"
        >
          <LaunchLabel>→ Launch</LaunchLabel>
        </LaunchButton>
      </Content>
    </Screen>
  );
};

export default DevLauncherScreen;
