// CompletionTrack — the "Task 1 of 3" label and the thin progress bar beside
// it. The bar's lime gradient fill grows smoothly each time a task is finished.
// We animate an actual pixel width (measured once with onLayout) rather than a
// percentage string, because Reanimated tweens numbers far more smoothly.

import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from 'react';
import type { LayoutChangeEvent } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import styled, { useTheme } from 'styled-components/native';

interface CompletionTrackProps {
  label: string;
  // progress — 0 to 1, how much of today's work is done.
  progress: number;
}

const Row = styled.View`
  margin-top: 12px;
  flex-direction: row;
  align-items: center;
  gap: 9px;
`;

const Label = styled.Text`
  font-family: ${({ theme }) => theme.typography.fontBody};
  font-size: 9px;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  color: ${({ theme }) => theme.colors.textPhotoSubtle};
`;

// Track — the empty rail. overflow hidden clips the growing fill to the rail's
// rounded ends.
const Track = styled.View`
  flex: 1;
  height: 4px;
  border-radius: ${({ theme }) => theme.radii.full}px;
  background-color: ${({ theme }) => theme.colors.glassInput};
  overflow: hidden;
`;

// Fill — the animated coloured portion holding the gradient.
const Fill = styled(Animated.View)`
  height: 100%;
  border-radius: ${({ theme }) => theme.radii.full}px;
  overflow: hidden;
`;

const Gradient = styled(LinearGradient)`
  flex: 1;
`;

export const CompletionTrack = ({ label, progress }: CompletionTrackProps) => {
  const { colors } = useTheme();
  // The rail's measured width in pixels; the fill animates between 0 and this.
  const [trackWidth, setTrackWidth] = useState(0);
  const fillWidth = useSharedValue(0);

  const handleTrackLayout = (event: LayoutChangeEvent) => {
    setTrackWidth(event.nativeEvent.layout.width);
  };

  // Re-run the grow whenever the progress or the measured width changes.
  useEffect(() => {
    fillWidth.value = withTiming(trackWidth * progress, {
      duration: 600,
      easing: Easing.bezier(0.2, 0.7, 0.2, 1),
    });
  }, [progress, trackWidth, fillWidth]);

  const fillStyle = useAnimatedStyle(() => ({ width: fillWidth.value }));

  return (
    <Row>
      <Label>{label}</Label>
      <Track onLayout={handleTrackLayout}>
        <Fill style={fillStyle}>
          <Gradient
            colors={[colors.trackFrom, colors.trackTo]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          />
        </Fill>
      </Track>
    </Row>
  );
};
