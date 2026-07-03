import { Pressable } from 'react-native';
import styled from 'styled-components/native';

// OptionCard — a single selectable option row: emoji icon, name, one-line
// description, and a check circle that fills in when selected. Used inside a
// GlassCard for the onboarding pickers (grass type, effort level) and on the
// Settings screen's effort-level picker. Promoted from
// features/onboarding/GrassTypeCard once Settings started using it too.

interface OptionCardProps {
  icon: string;
  name: string;
  description: string;
  selected: boolean;
  onPress: () => void;
}

// CardTouchable — one selectable row inside the GlassCard options list.
// Brightens to glassClearInputFocused when selected so the active choice
// reads clearly against the transparent card surface.
const CardTouchable = styled(Pressable)<{ $selected: boolean }>`
  background-color: ${({ $selected, theme }) =>
    $selected ? theme.colors.glassClearInputFocused : 'transparent'};
  padding: ${({ theme }) => theme.spacing.md}px;
  flex-direction: row;
  align-items: center;
  gap: 12px;
`;

// IconText — emoji icon on the left.
const IconText = styled.Text`font-size: 32px;`;

// TextGroup — holds the name and description, fills available space.
const TextGroup = styled.View`flex: 1;`;

// CardName — the option's label. textPhotoHeading is the same theme-aware
// token the home screen's task cards use for their title, so this text stays
// readable against the glass card in both light and dark mode instead of
// staying hardcoded white (which was unreadable on the light theme's pale
// glass).
const CardName = styled.Text`
  font-family: ${({ theme }) => theme.typography.fontHeaderBold};
  font-size: 14px;
  color: ${({ theme }) => theme.colors.textPhotoHeading};
`;

// CardDescription — one-line explanation below the name. textPhotoMuted
// matches the muted line under a task card's title, for the same reason as
// CardName above.
const CardDescription = styled.Text`
  font-family: ${({ theme }) => theme.typography.fontBody};
  font-size: 11px;
  color: ${({ theme }) => theme.colors.textPhotoMuted};
  margin-top: 2px;
  line-height: 17px;
`;

// CheckCircle — small circle on the right indicating selection state.
// Uses primary green when selected so it reads as a brand-coloured confirm.
const CheckCircle = styled.View<{ $selected: boolean }>`
  width: 20px;
  height: 20px;
  border-radius: 10px;
  background-color: ${({ $selected, theme }) =>
    $selected ? theme.colors.primary : theme.colors.glassClearInput};
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
`;

// CheckMark — white tick inside the selected circle.
const CheckMark = styled.Text`
  font-size: 10px;
  font-weight: ${({ theme }) => theme.typography.weightBlack};
  color: ${({ theme }) => theme.colors.white};
  line-height: 12px;
`;

// OptionCard — explicit divider components in the parent screen separate
// stacked rows instead of a border-top here.
export const OptionCard = ({
  icon,
  name,
  description,
  selected,
  onPress,
}: OptionCardProps) => (
  <CardTouchable
    $selected={selected}
    onPress={onPress}
    accessibilityRole="button"
    accessibilityState={{ selected }}
    accessibilityLabel={name}
  >
    <IconText>{icon}</IconText>
    <TextGroup>
      <CardName>{name}</CardName>
      <CardDescription>{description}</CardDescription>
    </TextGroup>
    <CheckCircle $selected={selected}>
      {selected && <CheckMark testID="checkmark">✓</CheckMark>}
    </CheckCircle>
  </CardTouchable>
);
