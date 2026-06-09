import { BlurView } from 'expo-blur';
import { ReactNode } from 'react';
import styled from 'styled-components/native';

interface GlassCardProps {
  children: ReactNode;
  // intensity is passed directly to expo-blur's BlurView (0–100).
  // 20 gives a soft frosted-glass look that reads clearly over a dark photo.
  intensity?: number;
}

// Clip — rounded container that applies overflow: hidden so the BlurView's
// blur effect and the card's children are both clipped to the border-radius.
// Without overflow: hidden the blur leaks past the rounded corners on iOS.
const Clip = styled.View`
  border-radius: ${({ theme }) => theme.radii.lg}px;
  overflow: hidden;
  border-width: 1px;
  border-color: ${({ theme }) => theme.colors.borderOnDark};
`;

// Content — inner padding and gap container that sits on top of the BlurView.
const Content = styled.View`
  padding: ${({ theme }) => theme.spacing.md}px;
  gap: ${({ theme }) => theme.spacing.md}px;
`;

// GlassCard — a frosted-glass card container for the sign-in screen.
// Uses expo-blur's BlurView to blur whatever is rendered behind the card
// (the full-bleed background photo), then adds a dark tint via the
// BlurView's tint prop to lift the card off the background.
export const GlassCard = ({ children, intensity = 20 }: GlassCardProps) => (
  <Clip>
    <BlurView intensity={intensity} tint="dark">
      <Content>{children}</Content>
    </BlurView>
  </Clip>
);

export default GlassCard;
