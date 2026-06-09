import { Pressable } from 'react-native';
import styled from 'styled-components/native';

interface GrassTypeCardProps {
  icon: string;
  name: string;
  description: string;
  selected: boolean;
  isFirst: boolean;
  onPress: () => void;
}

// CardTouchable — one selectable row inside the OptionsCard. Transparent
// when unselected so the frosted card background shows through. Gets a
// subtle white highlight when selected to distinguish the chosen option.
// First row has no top border; subsequent rows use a white-tinted divider
// matching the TaskCard and FormCard row divider pattern.
const CardTouchable = styled(Pressable)<{ $selected: boolean; $isFirst: boolean }>`
  background-color: ${({ $selected }) =>
    $selected ? 'rgba(255, 255, 255, 0.14)' : 'transparent'};
  padding: 16px;
  flex-direction: row;
  align-items: center;
  gap: 12px;
  ${({ $isFirst }) =>
    !$isFirst ? 'border-top-width: 1px; border-top-color: rgba(255, 255, 255, 0.18);' : ''}
`;

// IconText — emoji icon on the left. Matches NavPillIcon and TaskIcon size.
const IconText = styled.Text`font-size: 32px;`;

// TextGroup — holds the name and description, fills available space.
const TextGroup = styled.View`flex: 1;`;

// CardName — grass type label. fontHeaderBold and white text match NavPillName
// (Step 3) and TaskName (Step 2) for consistent card typography.
const CardName = styled.Text`
  font-family: ${({ theme }) => theme.typography.fontHeaderBold};
  font-size: 14px;
  color: #ffffff;
`;

// CardDescription — one-line explanation below the name. fontBody and muted
// white match NavPillDesc (Step 3) and TaskMeta (Step 2).
const CardDescription = styled.Text`
  font-family: ${({ theme }) => theme.typography.fontBody};
  font-size: 11px;
  color: rgba(255, 255, 255, 0.72);
  margin-top: 2px;
  line-height: 17px;
`;

// CheckCircle — small circle on the right indicating selection state.
// Dark green fill when selected gives clear contrast against the frosted card.
const CheckCircle = styled.View<{ $selected: boolean }>`
  width: 20px;
  height: 20px;
  border-radius: 10px;
  background-color: ${({ $selected }) =>
    $selected ? 'rgba(26, 83, 25, 0.80)' : 'rgba(0, 0, 0, 0.14)'};
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
`;

// CheckMark — white tick inside the selected circle.
const CheckMark = styled.Text`
  font-size: 10px;
  font-weight: ${({ theme }) => theme.typography.weightBlack};
  color: #ffffff;
  line-height: 12px;
`;

// GrassTypeCard — a single selectable option row in the grass type picker.
// Designed to live inside an OptionsCard (the frosted white card container).
// Tapping calls onPress; the parent screen manages which option is selected.
export const GrassTypeCard = ({
  icon,
  name,
  description,
  selected,
  isFirst,
  onPress,
}: GrassTypeCardProps) => (
  <CardTouchable
    $selected={selected}
    $isFirst={isFirst}
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
