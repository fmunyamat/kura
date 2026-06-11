import { Pressable } from 'react-native';
import styled from 'styled-components/native';

interface GrassTypeCardProps {
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

// CardName — grass type label. textOnDark matches the clear-glass input text
// colour used on the sign-in and Location screens.
const CardName = styled.Text`
  font-family: ${({ theme }) => theme.typography.fontHeaderBold};
  font-size: 14px;
  color: ${({ theme }) => theme.colors.textOnDark};
`;

// CardDescription — one-line explanation below the name. textMutedOnDark sits
// at 60% white opacity, consistent with FieldLabel and placeholder text on the
// other clear-glass screens.
const CardDescription = styled.Text`
  font-family: ${({ theme }) => theme.typography.fontBody};
  font-size: 11px;
  color: ${({ theme }) => theme.colors.textMutedOnDark};
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

// GrassTypeCard — a single selectable option row in the grass type picker.
// Lives inside a GlassCard; explicit OptionDivider components in the parent
// screen separate the rows instead of border-top here.
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
