// SplitContextCard — the glass card under the greeting, split into two equal
// halves by a hairline: the user's streak on the left, today's weather on the
// right. When the streak ticks up (after clearing the deck) the new number
// springs in to draw the eye.

import Animated, { ZoomIn } from 'react-native-reanimated';
import styled from 'styled-components/native';

import type { WeatherInfo } from '../../types';

interface SplitContextCardProps {
  streakDays: number;
  weather: WeatherInfo;
}

// Card — translucent glass panel with the brighter top edge used everywhere.
const Card = styled.View`
  margin-top: 12px;
  flex-direction: row;
  background-color: ${({ theme }) => theme.colors.glassFill};
  border-radius: ${({ theme }) => theme.radii.lg}px;
  border-width: 1px;
  border-color: ${({ theme }) => theme.colors.glassEdgeSoft};
  border-top-color: ${({ theme }) => theme.colors.glassEdge};
  overflow: hidden;
`;

// Half — one of the two equal sides of the card (streak on the left, weather on
// the right); flex: 1 makes them share the width evenly.
const Half = styled.View`
  flex: 1;
  padding: 11px 14px;
`;

// Divider — the 1px rule separating the two halves.
const Divider = styled.View`
  width: 1px;
  background-color: ${({ theme }) => theme.colors.glassDivider};
`;

// Label — the tiny uppercase heading over each half ("STREAK" / "WEATHER").
const Label = styled.Text`
  font-family: ${({ theme }) => theme.typography.fontBody};
  font-size: 8px;
  letter-spacing: 2px;
  text-transform: uppercase;
  color: ${({ theme }) => theme.colors.textPhotoSubtle};
`;

// ValueRow — the icon and the big number/temperature sitting on one baseline.
const ValueRow = styled.View`
  flex-direction: row;
  align-items: baseline;
  gap: 5px;
  margin-top: 4px;
`;

// Value — the big bold number on each side (the streak count / the temperature).
const Value = styled.Text`
  font-family: ${({ theme }) => theme.typography.fontHeaderHeavy};
  font-size: 24px;
  letter-spacing: -1px;
  color: ${({ theme }) => theme.colors.textPhotoHeading};
`;

// Icon — the emoji beside each value (🔥 for the streak, the weather symbol).
const Icon = styled.Text`
  font-size: 20px;
`;

// Sub — the muted line beneath each value ("days in a row", the weather summary).
const Sub = styled.Text`
  margin-top: 4px;
  font-family: ${({ theme }) => theme.typography.fontBody};
  font-size: 9px;
  line-height: 13px;
  color: ${({ theme }) => theme.colors.textPhotoMuted};
`;

export const SplitContextCard = ({ streakDays, weather }: SplitContextCardProps) => (
  <Card>
    <Half>
      <Label>Streak</Label>
      <ValueRow>
        <Icon>🔥</Icon>
        {/* Keyed on the value so a change remounts and replays the spring. */}
        <Animated.View key={streakDays} entering={ZoomIn.springify()}>
          <Value>{streakDays}</Value>
        </Animated.View>
      </ValueRow>
      <Sub>days in a row</Sub>
    </Half>
    <Divider />
    <Half>
      <Label>Weather</Label>
      <ValueRow>
        <Value>{weather.temperature}</Value>
        <Icon>{weather.icon}</Icon>
      </ValueRow>
      <Sub>{weather.summary}</Sub>
    </Half>
  </Card>
);
