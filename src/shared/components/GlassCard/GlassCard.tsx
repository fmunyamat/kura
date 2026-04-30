import { BlurView } from 'expo-blur';
import { ReactNode } from 'react';
import styled from 'styled-components/native';

interface GlassCardProps {
  children: ReactNode;
  // intensity controls how strong the blur effect is. 0 = no blur, 100 = very
  // heavy blur. 18 is a subtle frosted-glass look that lets the background
  // photo show through without being distracting.
  intensity?: number;
}

// Clip — a rounded View that clips the BlurView and its children to the card
// boundary, and draws the 1px border on top. overflow: hidden is what makes
// the border-radius actually cut off the blur surface's corners.
const Clip = styled.View`
  border-radius: ${({ theme }) => theme.radii.lg}px;
  overflow: hidden;
  border-width: 1px;
  border-color: ${({ theme }) => theme.colors.borderOnDark};
`;

// Blur — the expo-blur BlurView that applies a frosted-glass effect over
// whatever is rendered behind this card in the view hierarchy. styled-components
// cannot apply intensity or tint as CSS, so they are set as React props directly
// on the <Blur> element inside GlassCard's render. intensity is configurable via
// GlassCard's intensity prop. tint is fixed at "dark" because this card is
// designed specifically for dark photo backgrounds — a light tint would look
// washed-out over the full-bleed background image used on the sign-in screen.
const Blur = styled(BlurView)``;

// Content — sits on top of the blur and adds a faint white tint so the card
// reads as a distinct surface. Also supplies the inner padding and gap that
// space out whatever children are placed inside.
const Content = styled.View`
  background-color: rgba(255, 255, 255, 0.04);
  padding: ${({ theme }) => theme.spacing.md}px;
  gap: ${({ theme }) => theme.spacing.md}px;
`;

// GlassCard — a frosted-glass card container used on the sign-in screen.
// It wraps any children in a rounded, blurred surface that sits over the
// full-bleed background photo, giving the glassmorphism aesthetic.
// intensity defaults to 18, a gentle blur that remains readable on any photo.
export const GlassCard = ({ children, intensity = 18 }: GlassCardProps) => (
  <Clip>
    <Blur intensity={intensity} tint="dark">
      <Content>{children}</Content>
    </Blur>
  </Clip>
);
