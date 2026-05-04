import styled from 'styled-components/native';

interface GrassTypeCardProps {
  icon: string;
  name: string;
  description: string;
  selected: boolean;
  onPress: () => void;
}

// CardTouchable — the tappable row for one grass type option.
// Background shifts to the selected token when chosen — no border used,
// depth comes from opacity contrast with the surrounding glass panel.
const CardTouchable = styled.TouchableOpacity<{ $selected: boolean }>`
  background-color: ${({ $selected, theme }) =>
    $selected
      ? theme.colors.glassOnboardingOptionSelected
      : theme.colors.glassOnboardingOption};
  border-radius: ${({ theme }) => theme.radii.md}px;
  padding: ${({ theme }) => theme.spacing.sm}px ${({ theme }) => theme.spacing.md}px;
  flex-direction: row;
  align-items: flex-start;
  gap: ${({ theme }) => theme.spacing.sm}px;
`;

// IconText — the emoji icon for the grass type.
const IconText = styled.Text`
  font-size: ${({ theme }) => theme.typography.sizeLg}px;
`;

// TextGroup — holds the name and description, fills available space.
const TextGroup = styled.View`
  flex: 1;
  gap: 2px;
`;

// CardName — the grass type label in dark green, bold.
const CardName = styled.Text`
  font-size: ${({ theme }) => theme.typography.sizeSm}px;
  font-weight: ${({ theme }) => theme.typography.weightBold};
  color: ${({ theme }) => theme.colors.textOnGlass};
`;

// CardDescription — one-line explanation in muted dark green.
const CardDescription = styled.Text`
  font-size: ${({ theme }) => theme.typography.sizeXs}px;
  color: ${({ theme }) => theme.colors.textMutedOnGlass};
  line-height: ${({ theme }) => theme.typography.lineHeightSm}px;
`;

// CheckCircle — filled dark green circle shown when the option is selected.
const CheckCircle = styled.View<{ $selected: boolean }>`
  width: 18px;
  height: 18px;
  border-radius: 9px;
  background-color: ${({ $selected, theme }) =>
    $selected ? theme.colors.primaryDeep : theme.colors.glassOnboardingInput};
  align-items: center;
  justify-content: center;
  margin-top: 2px;
  flex-shrink: 0;
`;

// CheckMark — the white tick inside the selected circle.
const CheckMark = styled.Text`
  font-size: 10px;
  font-weight: ${({ theme }) => theme.typography.weightBlack};
  color: ${({ theme }) => theme.colors.white};
  line-height: 12px;
`;

// GrassTypeCard — a single selectable option in the grass type picker.
// Tapping calls onPress; the parent screen manages which option is selected.
export const GrassTypeCard = ({
  icon,
  name,
  description,
  selected,
  onPress,
}: GrassTypeCardProps) => (
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
