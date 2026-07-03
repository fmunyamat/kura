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
import type { GrassTypeList } from '~/features/onboarding/types';
import { ResetLawnDataCard } from '~/features/settings/components/ResetLawnDataCard';
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

// GRASS_OPTIONS — same three choices shown during onboarding's GrassType screen.
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

// ActivePicker — which tile's option list (if any) is open below the row.
// Only one can be open at a time, so opening one closes the other.
type ActivePicker = 'grassType' | 'effort' | null;

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
// does this). The idle border uses the same two-tone glass rim as the home
// screen's open task card — glassEdgeSoft all around with a brighter
// glassEdge along the top — so it reads as the same glass surface.
const Tile = styled(Pressable)<{ $isActive?: boolean }>`
  flex: 1;
  gap: 6px;
  padding: 12px;
  border-radius: ${({ theme }) => theme.radii.lg}px;
  border-width: 1px;
  background-color: ${({ theme }) => theme.colors.glassFill};
  border-color: ${({ theme, $isActive }) =>
    $isActive ? theme.colors.accentPrimary : theme.colors.glassEdgeSoft};
  border-top-color: ${({ theme, $isActive }) =>
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
// a square button. Same two-tone rim as the home screen's open task card.
const RowCard = styled.View`
  background-color: ${({ theme }) => theme.colors.glassFill};
  border-radius: ${({ theme }) => theme.radii.lg}px;
  border-width: 1px;
  border-color: ${({ theme }) => theme.colors.glassEdgeSoft};
  border-top-color: ${({ theme }) => theme.colors.glassEdge};
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

// PickerCard — the inline option picker that appears below the tile row
// when the grass type or effort tile is tapped. Same two-tone glass rim as
// the other Settings cards.
const PickerCard = styled.View`
  background-color: ${({ theme }) => theme.colors.glassFill};
  border-radius: ${({ theme }) => theme.radii.lg}px;
  border-width: 1px;
  border-color: ${({ theme }) => theme.colors.glassEdgeSoft};
  border-top-color: ${({ theme }) => theme.colors.glassEdge};
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
  const [grassType, setGrassType] = useState<GrassTypeList>('cool-season');
  const [pendingGrassType, setPendingGrassType] = useState<GrassTypeList>('cool-season');

  const [effortLevel, setEffortLevel] = useState<1 | 2 | 3>(2);
  const [pendingLevel, setPendingLevel] = useState<1 | 2 | 3>(2);

  // Only one tile's option list is open at a time — opening one closes the other.
  const [activePicker, setActivePicker] = useState<ActivePicker>(null);

  const currentGrassOption = GRASS_OPTIONS.find((o) => o.value === grassType)!;
  const currentOption = EFFORT_OPTIONS.find((o) => o.value === effortLevel)!;

  const handleOpenGrassPicker = () => {
    setPendingGrassType(grassType);
    setActivePicker('grassType');
  };

  const handleSaveGrassType = () => {
    setGrassType(pendingGrassType);
    setActivePicker(null);
  };

  const handleOpenEffortPicker = () => {
    setPendingLevel(effortLevel);
    setActivePicker('effort');
  };

  const handleSaveEffort = () => {
    setEffortLevel(pendingLevel);
    setActivePicker(null);
  };

  const handleCancel = () => {
    setActivePicker(null);
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch {
      // Sign-out failures are rare. Swallow silently; session will eventually
      // expire. Never surface the raw error to the UI (MASVS-CODE-4).
    }
  };

  // handleResetData — fires once the user completes the 2-second hold on
  // "I've moved". TODO: wire this to the real reset flow (delete the
  // user_profiles row via Supabase, then redirect into onboarding) once that
  // service exists. The hold gesture itself is the confirmation step, so no
  // extra alert is needed on top of it.
  const handleResetData = () => {};

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
              {/* Grass type tile — tapping toggles the picker below, same as
                  the effort tile. The accent border on $isActive tells the
                  user this is the open tile. */}
              <Tile
                $isActive={activePicker === 'grassType'}
                onPress={activePicker === 'grassType' ? handleCancel : handleOpenGrassPicker}
                accessibilityRole="button"
                accessibilityLabel={
                  activePicker === 'grassType'
                    ? 'Cancel changing grass type'
                    : 'Change grass type'
                }
              >
                <TileCategory>Grass type</TileCategory>
                <TileEmoji>{currentGrassOption.icon}</TileEmoji>
                <TileValue>{currentGrassOption.name}</TileValue>
                <TileCaption>{activePicker === 'grassType' ? 'Cancel' : 'Tap to change'}</TileCaption>
              </Tile>

              {/* Effort tile — tapping toggles the picker below. The accent
                  border on $isActive tells the user this is the open tile. */}
              <Tile
                $isActive={activePicker === 'effort'}
                onPress={activePicker === 'effort' ? handleCancel : handleOpenEffortPicker}
                accessibilityRole="button"
                accessibilityLabel={
                  activePicker === 'effort' ? 'Cancel changing effort level' : 'Change effort level'
                }
              >
                <TileCategory>Effort</TileCategory>
                <TileEmoji>{currentOption.icon}</TileEmoji>
                <TileValue>{currentOption.name}</TileValue>
                <TileCaption>{activePicker === 'effort' ? 'Cancel' : 'Tap to change'}</TileCaption>
              </Tile>
            </TileRow>

            {/* Picker card — expands below the tile row when the grass type
                tile is open. */}
            {activePicker === 'grassType' && (
              <PickerCard>
                <PickerInner>
                  {GRASS_OPTIONS.map((opt) => (
                    <OptionCard
                      key={opt.value}
                      icon={opt.icon}
                      name={opt.name}
                      description={opt.description}
                      selected={pendingGrassType === opt.value}
                      onPress={() => setPendingGrassType(opt.value)}
                    />
                  ))}
                  <SaveButton
                    onPress={handleSaveGrassType}
                    accessibilityRole="button"
                    accessibilityLabel="Save grass type"
                  >
                    <SaveButtonText>Save</SaveButtonText>
                  </SaveButton>
                </PickerInner>
              </PickerCard>
            )}

            {/* Picker card — expands below the tile row when the effort
                tile is open. */}
            {activePicker === 'effort' && (
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
                    onPress={handleSaveEffort}
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

          {/* ── Data — the "I've moved" reset: a warning banner explaining
              what it does, plus a 2-second hold-to-confirm button instead of
              a single tap ──── */}
          <Section>
            <SectionLabel>Data</SectionLabel>
            <ResetLawnDataCard onReset={handleResetData} />
          </Section>
        </ScrollView>
      </Safe>
      <BottomScrim />
    </Screen>
  );
};
