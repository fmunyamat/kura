import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import { Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import styled from 'styled-components/native';
import { signOut } from '~/features/auth/services/authService';
import { GrassTypeCard } from '~/features/onboarding/components/GrassTypeCard';

// EFFORT_OPTIONS — same three tiers shown during onboarding, reused here so
// the user can change their choice without going back through onboarding.
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

// Background — same four-stop green gradient used across the app so Settings
// feels like part of the same experience, not a separate utility screen.
const Background = styled(LinearGradient).attrs(({ theme }) => ({
  colors: [
    theme.colors.gradientDark,
    theme.colors.gradientMid,
    theme.colors.gradientMidLight,
    theme.colors.gradientLight,
  ] as const,
  start: { x: 0.1, y: 0 },
  end: { x: 0.2, y: 1 },
}))`
  flex: 1;
`;

// Safe — outermost container that accounts for device notch and home indicator.
const Safe = styled(SafeAreaView)`
  flex: 1;
`;

// ScreenHeading — large bold title at the top of the Settings screen.
const ScreenHeading = styled.Text`
  font-size: ${({ theme }) => theme.typography.sizeXl}px;
  font-weight: ${({ theme }) => theme.typography.weightBlack};
  color: rgba(255, 255, 255, 0.96);
  letter-spacing: ${({ theme }) => theme.typography.letterSpacingTight}px;
  padding: ${({ theme }) => theme.spacing.lg}px ${({ theme }) => theme.spacing.md}px
    ${({ theme }) => theme.spacing.md}px;
`;

// Section — groups a label and its card together with bottom margin between sections.
const Section = styled.View`
  margin-bottom: ${({ theme }) => theme.spacing.md}px;
  padding: 0 ${({ theme }) => theme.spacing.md}px;
`;

// SectionLabel — small all-caps label above each section card, like "YOUR LAWN".
const SectionLabel = styled.Text`
  font-size: ${({ theme }) => theme.typography.sizeXs}px;
  font-weight: ${({ theme }) => theme.typography.weightBold};
  letter-spacing: 2px;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.45);
  margin-bottom: ${({ theme }) => theme.spacing.sm}px;
  padding-left: ${({ theme }) => theme.spacing.xs}px;
`;

// Card — the frosted-glass container that groups related settings rows.
const Card = styled.View`
  background-color: rgba(255, 255, 255, 0.08);
  border-radius: ${({ theme }) => theme.radii.lg}px;
  overflow: hidden;
  border-width: 1px;
  border-color: rgba(255, 255, 255, 0.1);
`;

// SettingsRow — a tappable row inside a Card. Holds an icon, label + value,
// and an optional action button on the right.
const SettingsRow = styled(Pressable)`
  flex-direction: row;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm}px;
  padding: ${({ theme }) => theme.spacing.sm}px ${({ theme }) => theme.spacing.md}px;
`;

// RowIcon — small rounded square that holds the row's emoji icon.
const RowIcon = styled.View`
  width: 36px;
  height: 36px;
  border-radius: 9px;
  background-color: rgba(255, 255, 255, 0.07);
  align-items: center;
  justify-content: center;
  border-width: 1px;
  border-color: rgba(255, 255, 255, 0.09);
`;

const RowIconText = styled.Text`
  font-size: ${({ theme }) => theme.typography.sizeSm}px;
`;

// RowBody — the flex-1 column that holds the row's name and current value.
const RowBody = styled.View`
  flex: 1;
  gap: 2px;
`;

const RowName = styled.Text`
  font-size: ${({ theme }) => theme.typography.sizeSm}px;
  font-weight: ${({ theme }) => theme.typography.weightBold};
  color: rgba(255, 255, 255, 0.85);
`;

// RowValue — shows the currently saved value beneath the row name.
const RowValue = styled.Text`
  font-size: ${({ theme }) => theme.typography.sizeXs}px;
  color: rgba(255, 255, 255, 0.42);
`;

// RowActionBadge — the small "Change" / "Cancel" pill button on the right of a row.
const RowActionBadge = styled.View`
  background-color: rgba(255, 255, 255, 0.07);
  border-radius: ${({ theme }) => theme.radii.sm}px;
  border-width: 1px;
  border-color: rgba(255, 255, 255, 0.13);
  padding: 4px 10px;
`;

const RowActionText = styled.Text`
  font-size: ${({ theme }) => theme.typography.sizeXs}px;
  font-weight: ${({ theme }) => theme.typography.weightBold};
  color: rgba(255, 255, 255, 0.65);
`;

// Divider — thin horizontal line that separates rows inside a Card.
const Divider = styled.View`
  height: 1px;
  background-color: rgba(255, 255, 255, 0.06);
  margin: 0 ${({ theme }) => theme.spacing.md}px;
`;

// PickerArea — the inline container that holds the three effort level cards
// and the Save button. Only rendered when the picker is open.
const PickerArea = styled.View`
  padding: 0 ${({ theme }) => theme.spacing.sm}px ${({ theme }) => theme.spacing.sm}px;
  gap: ${({ theme }) => theme.spacing.xs}px;
`;

// SaveButton — confirms the selected effort level and collapses the picker.
const SaveButton = styled(Pressable)`
  background-color: ${({ theme }) => theme.colors.gradientMidLight};
  border-radius: ${({ theme }) => theme.radii.md}px;
  padding: ${({ theme }) => theme.spacing.sm}px;
  align-items: center;
  margin-top: ${({ theme }) => theme.spacing.xs}px;
`;

const SaveButtonText = styled.Text`
  font-size: ${({ theme }) => theme.typography.sizeSm}px;
  font-weight: ${({ theme }) => theme.typography.weightBold};
  color: ${({ theme }) => theme.colors.white};
`;

// LogOutButton — full-width red button at the bottom of the screen.
const LogOutButton = styled(Pressable)`
  background-color: rgba(239, 68, 68, 0.85);
  border-radius: ${({ theme }) => theme.radii.md}px;
  padding: ${({ theme }) => theme.spacing.md}px;
  align-items: center;
`;

const LogOutButtonText = styled.Text`
  font-size: ${({ theme }) => theme.typography.sizeSm}px;
  font-weight: ${({ theme }) => theme.typography.weightBold};
  color: ${({ theme }) => theme.colors.white};
`;

// DangerCard — the "I've moved" reset row, visually separated from the rest
// with a red tint to signal that this action is irreversible.
const DangerCard = styled(Pressable)`
  background-color: rgba(239, 68, 68, 0.06);
  border-radius: ${({ theme }) => theme.radii.lg}px;
  border-width: 1px;
  border-color: rgba(239, 68, 68, 0.14);
  flex-direction: row;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm}px;
  padding: ${({ theme }) => theme.spacing.sm}px ${({ theme }) => theme.spacing.md}px;
`;

// DangerIcon — red-tinted icon box for the "I've moved" row.
const DangerIcon = styled.View`
  width: 36px;
  height: 36px;
  border-radius: 9px;
  background-color: rgba(239, 68, 68, 0.1);
  align-items: center;
  justify-content: center;
`;

const DangerName = styled.Text`
  font-size: ${({ theme }) => theme.typography.sizeSm}px;
  font-weight: ${({ theme }) => theme.typography.weightBold};
  color: rgba(239, 100, 100, 0.9);
  margin-bottom: 2px;
`;

const DangerDesc = styled.Text`
  font-size: ${({ theme }) => theme.typography.sizeXs}px;
  color: rgba(239, 68, 68, 0.45);
  line-height: ${({ theme }) => theme.typography.lineHeightSm}px;
`;

// SettingsScreen — lets the user review and change their lawn profile.
// Currently manages effort_level locally — will be wired to TanStack Query
// (useEffortLevel + useUpdateEffortLevel hooks) when the service layer is added.
export const SettingsScreen = () => {
  // effortLevel — the user's active effort tier. Placeholder default of 2
  // until the profile query is connected.
  const [effortLevel, setEffortLevel] = useState<1 | 2 | 3>(2);
  // pendingLevel — tracks which card the user tapped while the picker is open,
  // before they confirm with Save. Keeps the committed value stable until saved.
  const [pendingLevel, setPendingLevel] = useState<1 | 2 | 3>(2);
  const [isPickerOpen, setIsPickerOpen] = useState(false);

  const currentOption = EFFORT_OPTIONS.find((o) => o.value === effortLevel)!;

  const handleOpenPicker = () => {
    // Pre-select the current level so the user sees their existing choice highlighted.
    setPendingLevel(effortLevel);
    setIsPickerOpen(true);
  };

  const handleSave = () => {
    setEffortLevel(pendingLevel);
    setIsPickerOpen(false);
  };

  const handleCancel = () => {
    setIsPickerOpen(false);
  };

  // handleSignOut — ends the Supabase session. AuthProvider's onAuthStateChange
  // fires automatically, clears the Zustand store, and (app)/_layout.tsx redirects
  // to sign-in — no manual navigation needed here.
  const handleSignOut = async () => {
    try {
      await signOut();
    } catch {
      // Sign-out failures are rare (network issues). Swallow silently — the user
      // can try again and the session will eventually expire. Never surface the
      // raw error to the UI (MASVS-CODE-4).
    }
  };

  return (
    <Background>
      <Safe>
        <ScrollView bounces={false} showsVerticalScrollIndicator={false}>
          <ScreenHeading>Settings</ScreenHeading>

          {/* ── Your lawn ──────────────────────────────────────────────── */}
          <Section>
            <SectionLabel>Your lawn</SectionLabel>
            <Card>
              {/* Grass type — displayed read-only for now. Full change flow
                  (re-running the GrassType onboarding screen + geocoding) will
                  be wired up when the service layer is added. */}
              <SettingsRow accessibilityRole="button" accessibilityLabel="Change grass type">
                <RowIcon>
                  <RowIconText>🌿</RowIconText>
                </RowIcon>
                <RowBody>
                  <RowName>Grass type</RowName>
                  <RowValue>Cool-season grass</RowValue>
                </RowBody>
                <RowActionBadge>
                  <RowActionText>Change</RowActionText>
                </RowActionBadge>
              </SettingsRow>

              <Divider />

              {/* Effort level row — tapping toggles the inline card picker. */}
              <SettingsRow
                onPress={isPickerOpen ? handleCancel : handleOpenPicker}
                accessibilityRole="button"
                accessibilityLabel={
                  isPickerOpen ? 'Cancel changing effort level' : 'Change effort level'
                }
              >
                <RowIcon>
                  <RowIconText>🎯</RowIconText>
                </RowIcon>
                <RowBody>
                  <RowName>Effort level</RowName>
                  <RowValue>
                    {currentOption.icon} {currentOption.name}
                  </RowValue>
                </RowBody>
                <RowActionBadge>
                  <RowActionText>{isPickerOpen ? 'Cancel' : 'Change'}</RowActionText>
                </RowActionBadge>
              </SettingsRow>

              {/* Inline picker — shown directly below the row when open.
                  Cards are pre-selected to the current level on open. Tapping
                  a card updates pendingLevel without committing; Save commits. */}
              {isPickerOpen && (
                <PickerArea>
                  {EFFORT_OPTIONS.map((opt) => (
                    <GrassTypeCard
                      key={opt.value}
                      icon={opt.icon}
                      name={opt.name}
                      description={opt.description}
                      selected={pendingLevel === opt.value}
                      onPress={() => setPendingLevel(opt.value)}
                    />
                  ))}
                  <SaveButton
                    onPress={handleSave}
                    accessibilityRole="button"
                    accessibilityLabel="Save effort level"
                  >
                    <SaveButtonText>Save</SaveButtonText>
                  </SaveButton>
                </PickerArea>
              )}
            </Card>
          </Section>

          {/* ── Data ───────────────────────────────────────────────────── */}
          <Section>
            <SectionLabel>Data</SectionLabel>
            <DangerCard
              accessibilityRole="button"
              accessibilityLabel="Reset all lawn data and restart onboarding"
            >
              <DangerIcon>
                <RowIconText>📦</RowIconText>
              </DangerIcon>
              <RowBody>
                <DangerName>I've moved</DangerName>
                <DangerDesc>Reset all lawn data and start fresh from onboarding</DangerDesc>
              </RowBody>
            </DangerCard>
          </Section>

          {/* ── Log out ────────────────────────────────────────────────── */}
          <Section>
            <LogOutButton
              onPress={handleSignOut}
              accessibilityRole="button"
              accessibilityLabel="Log out of your account"
            >
              <LogOutButtonText>Log Out</LogOutButtonText>
            </LogOutButton>
          </Section>
        </ScrollView>
      </Safe>
    </Background>
  );
};
