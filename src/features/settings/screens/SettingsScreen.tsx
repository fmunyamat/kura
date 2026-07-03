// SettingsScreen — the lawn profile settings (grass type, effort) are drawn
// as a row of tiles, matching the "tap to change" mockup. Account and Data
// stay as plain list rows below the grid — only the lawn profile settings
// are tile-shaped, so a beginner reads the tiles as "things about my lawn"
// and the rows below as "things about my account", not one big undifferentiated
// grid of buttons.

import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import { ImageBackground, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import styled from 'styled-components/native';

import { signOut } from '~/features/auth/services/authService';
import { BottomScrim } from '~/shared/components/BottomScrim';
import { FLOATING_TAB_BAR_CLEARANCE } from '~/shared/components/FloatingTabBar';
import { OptionCard } from '~/shared/components/OptionCard';

// EFFORT_OPTIONS — same three tiers shown during onboarding.
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

// The same blurred lawn photo used on the Today screen.
const SETTINGS_BACKGROUND = require('../../../../assets/images/sprinkler.png');
const SETTINGS_BACKGROUND_BLUR_RADIUS = 7;

const Screen = styled.View`
  flex: 1;
`;

const PhotoBackground = styled(ImageBackground)`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
`;

// PhotoWash — theme-aware tint over the photo, identical to the Today screen.
const PhotoWash = styled(LinearGradient).attrs(({ theme }) => ({
  colors: [theme.colors.photoWashTop, theme.colors.photoWashBottom] as const,
}))`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
`;

const Safe = styled(SafeAreaView)`
  flex: 1;
`;

// HeadingArea — eyebrow + big title at the top of the scroll view.
const HeadingArea = styled.View`
  padding: ${({ theme }) => theme.spacing.lg}px ${({ theme }) => theme.spacing.md}px
    ${({ theme }) => theme.spacing.md}px;
`;

// Eyebrow — tiny uppercase monospace label, same as Today's "On Deck · Tuesday".
const Eyebrow = styled.Text`
  font-family: ${({ theme }) => theme.typography.fontBody};
  font-size: 9.5px;
  letter-spacing: 2.5px;
  text-transform: uppercase;
  color: ${({ theme }) => theme.colors.textPhotoSubtle};
`;

// ScreenHeading — ZalandoSans-Black, same face and size as the Today greeting.
const ScreenHeading = styled.Text`
  margin-top: 10px;
  font-family: ${({ theme }) => theme.typography.fontHeaderHeavy};
  font-size: 26px;
  color: ${({ theme }) => theme.colors.textPhotoHeading};
  letter-spacing: ${({ theme }) => theme.typography.letterSpacingTight}px;
`;

// Section — consistent horizontal padding + bottom gap, wraps each group
// (the tile row, the account row, the data row) so they all share the same
// left/right margins.
const Section = styled.View`
  margin-bottom: ${({ theme }) => theme.spacing.md}px;
  padding: 0 ${({ theme }) => theme.spacing.md}px;
`;

// SectionLabel — tiny uppercase heading above a group ("Lawn profile",
// "Account", "Data"), so the rows below it read as belonging together.
const SectionLabel = styled.Text`
  font-family: ${({ theme }) => theme.typography.fontBody};
  font-size: 9.5px;
  letter-spacing: 2.5px;
  text-transform: uppercase;
  color: ${({ theme }) => theme.colors.textPhotoSubtle};
  margin-bottom: ${({ theme }) => theme.spacing.xs}px;
  padding-left: 4px;
`;

// TileRow — holds the lawn profile tiles (grass type, effort) side by side.
const TileRow = styled.View`
  flex-direction: row;
  gap: ${({ theme }) => theme.spacing.sm}px;
`;

// Tile — one compact button in the lawn profile row. Height is set by its
// own content (label + emoji + value + caption), not by an aspect-ratio tied
// to the row's width — that's what keeps it a small tap target instead of a
// tall block with dead space in the middle on wider phones. $isActive draws
// the accent border while that tile's picker is open (only the effort tile
// does this).
const Tile = styled(Pressable)<{ $isActive?: boolean }>`
  flex: 1;
  gap: 6px;
  padding: 12px;
  border-radius: ${({ theme }) => theme.radii.lg}px;
  border-width: 1px;
  background-color: ${({ theme }) => theme.colors.glassFill};
  border-color: ${({ theme, $isActive }) =>
    $isActive ? theme.colors.accentPrimary : theme.colors.glassEdge};
`;

// TileCategory — tiny uppercase label at the top of a tile ("GRASS TYPE",
// "EFFORT").
const TileCategory = styled.Text`
  font-family: ${({ theme }) => theme.typography.fontBody};
  font-size: 8.5px;
  letter-spacing: 2px;
  text-transform: uppercase;
  color: ${({ theme }) => theme.colors.textPhotoSubtle};
`;

const TileEmoji = styled.Text`
  font-size: 22px;
`;

// TileValue — the bold headline inside a tile (the grass type name, the
// current effort tier). Wraps to two lines if long.
const TileValue = styled.Text`
  font-family: ${({ theme }) => theme.typography.fontHeaderBold};
  font-size: 12px;
  line-height: 15px;
  color: ${({ theme }) => theme.colors.textPhotoHeading};
`;

// TileCaption — the small helper line under the value ("Tap to change").
const TileCaption = styled.Text`
  font-family: ${({ theme }) => theme.typography.fontBody};
  font-size: 9px;
  line-height: 12px;
  color: ${({ theme }) => theme.colors.textPhotoMuted};
`;

// RowCard — the frosted-glass container that groups the account row(s).
// Same glass treatment as a Tile, but shaped as a horizontal list instead of
// a square button.
const RowCard = styled.View`
  background-color: ${({ theme }) => theme.colors.glassFill};
  border-radius: ${({ theme }) => theme.radii.lg}px;
  border-width: 1px;
  border-color: ${({ theme }) => theme.colors.glassEdge};
  overflow: hidden;
`;

// Row — one tappable line inside a RowCard (e.g. "Log out"). Icon on the
// left, name filling the middle.
const Row = styled(Pressable)`
  flex-direction: row;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm}px;
  padding: 12px 14px;
`;

// RowIcon — small rounded square holding the row's emoji, set slightly apart
// from the card background so the icon reads as its own element.
const RowIcon = styled.View`
  width: 34px;
  height: 34px;
  border-radius: ${({ theme }) => theme.radii.sm}px;
  background-color: ${({ theme }) => theme.colors.glassEdgeSoft};
  align-items: center;
  justify-content: center;
`;

const RowIconText = styled.Text`
  font-size: 15px;
`;

const RowName = styled.Text`
  flex: 1;
  font-family: ${({ theme }) => theme.typography.fontBodyBold};
  font-size: 12px;
  color: ${({ theme }) => theme.colors.textPhotoHeading};
`;

// DangerRow — the "I've moved" reset row. Same shape as RowCard/Row but its
// own red-tinted card, since it's the one row that isn't inside an account
// list — it's its own single-row "Data" group.
const DangerRow = styled(Pressable)`
  flex-direction: row;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm}px;
  padding: 12px 14px;
  border-radius: ${({ theme }) => theme.radii.lg}px;
  border-width: 1px;
  background-color: rgba(239, 68, 68, 0.08);
  border-color: rgba(239, 68, 68, 0.18);
`;

const DangerIcon = styled.View`
  width: 34px;
  height: 34px;
  border-radius: ${({ theme }) => theme.radii.sm}px;
  background-color: rgba(239, 68, 68, 0.12);
  align-items: center;
  justify-content: center;
`;

const DangerIconText = styled.Text`
  font-size: 15px;
`;

const DangerBody = styled.View`
  flex: 1;
`;

const DangerName = styled.Text`
  font-family: ${({ theme }) => theme.typography.fontBodyBold};
  font-size: 12px;
  color: rgba(239, 68, 68, 0.9);
`;

const DangerDesc = styled.Text`
  margin-top: 2px;
  font-family: ${({ theme }) => theme.typography.fontBody};
  font-size: 9.5px;
  line-height: 13px;
  color: rgba(239, 68, 68, 0.55);
`;

// PickerCard — the inline effort picker that appears below the tile grid
// when the effort tile is tapped.
const PickerCard = styled.View`
  background-color: ${({ theme }) => theme.colors.glassFill};
  border-radius: ${({ theme }) => theme.radii.lg}px;
  border-width: 1px;
  border-color: ${({ theme }) => theme.colors.glassEdge};
  margin-top: 12px;
  overflow: hidden;
`;

// PickerInner — padding inside the picker card, around the OptionCards
// and the Save button.
const PickerInner = styled.View`
  padding: ${({ theme }) => theme.spacing.sm}px;
  gap: ${({ theme }) => theme.spacing.xs}px;
`;

// SaveButton — confirms the selected effort level. accentPrimary = lime in
// dark mode, forest-green in light mode, matching the Done pill on Today.
const SaveButton = styled(Pressable)`
  background-color: ${({ theme }) => theme.colors.accentPrimary};
  border-radius: ${({ theme }) => theme.radii.md}px;
  padding: ${({ theme }) => theme.spacing.sm}px;
  align-items: center;
`;

const SaveButtonText = styled.Text`
  font-family: ${({ theme }) => theme.typography.fontBodyBold};
  font-size: ${({ theme }) => theme.typography.sizeSm}px;
  color: ${({ theme }) => theme.colors.accentPrimaryInk};
`;

export const SettingsScreen = () => {
  const [effortLevel, setEffortLevel] = useState<1 | 2 | 3>(2);
  const [pendingLevel, setPendingLevel] = useState<1 | 2 | 3>(2);
  const [isPickerOpen, setIsPickerOpen] = useState(false);

  const currentOption = EFFORT_OPTIONS.find((o) => o.value === effortLevel)!;

  const handleOpenPicker = () => {
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

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch {
      // Sign-out failures are rare. Swallow silently; session will eventually
      // expire. Never surface the raw error to the UI (MASVS-CODE-4).
    }
  };

  return (
    <Screen>
      <PhotoBackground
        source={SETTINGS_BACKGROUND}
        resizeMode="cover"
        blurRadius={SETTINGS_BACKGROUND_BLUR_RADIUS}
      />
      <PhotoWash />
      <Safe edges={['top']}>
        <ScrollView
          bounces={false}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: FLOATING_TAB_BAR_CLEARANCE }}
        >
          <HeadingArea>
            <Eyebrow>Kura · Your lawn</Eyebrow>
            <ScreenHeading>Settings</ScreenHeading>
          </HeadingArea>

          {/* ── Lawn profile — the two tiles the user actually taps ──── */}
          <Section>
            <SectionLabel>Lawn profile</SectionLabel>
            <TileRow>
              {/* Grass type tile — read-only placeholder until the change
                  flow (re-running GrassType onboarding + geocoding) is wired. */}
              <Tile accessibilityRole="button" accessibilityLabel="Change grass type">
                <TileCategory>Grass type</TileCategory>
                <TileEmoji>🌿</TileEmoji>
                <TileValue>Cool-season grass</TileValue>
                <TileCaption>Tap to change</TileCaption>
              </Tile>

              {/* Effort tile — tapping toggles the picker below. The accent
                  border on $isActive tells the user this is the open tile. */}
              <Tile
                $isActive={isPickerOpen}
                onPress={isPickerOpen ? handleCancel : handleOpenPicker}
                accessibilityRole="button"
                accessibilityLabel={
                  isPickerOpen ? 'Cancel changing effort level' : 'Change effort level'
                }
              >
                <TileCategory>Effort</TileCategory>
                <TileEmoji>{currentOption.icon}</TileEmoji>
                <TileValue>{currentOption.name}</TileValue>
                <TileCaption>{isPickerOpen ? 'Cancel' : 'Tap to change'}</TileCaption>
              </Tile>
            </TileRow>

            {/* Picker card — expands below the tile row when the effort
                tile is open. */}
            {isPickerOpen && (
              <PickerCard>
                <PickerInner>
                  {EFFORT_OPTIONS.map((opt) => (
                    <OptionCard
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
                </PickerInner>
              </PickerCard>
            )}
          </Section>

          {/* ── Account — plain list row, not a tile ──── */}
          <Section>
            <SectionLabel>Account</SectionLabel>
            <RowCard>
              <Row
                onPress={handleSignOut}
                accessibilityRole="button"
                accessibilityLabel="Log out of your account"
              >
                <RowIcon>
                  <RowIconText>🚪</RowIconText>
                </RowIcon>
                <RowName>Log out</RowName>
              </Row>
            </RowCard>
          </Section>

          {/* ── Data — the "I've moved" reset, its own red list row ──── */}
          <Section>
            <SectionLabel>Data</SectionLabel>
            <DangerRow
              accessibilityRole="button"
              accessibilityLabel="Reset all lawn data and restart onboarding"
            >
              <DangerIcon>
                <DangerIconText>📦</DangerIconText>
              </DangerIcon>
              <DangerBody>
                <DangerName>I've moved</DangerName>
                <DangerDesc>Reset all lawn data and start fresh</DangerDesc>
              </DangerBody>
            </DangerRow>
          </Section>
        </ScrollView>
      </Safe>
      <BottomScrim />
    </Screen>
  );
};
